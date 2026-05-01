'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Avatar from '@/components/Avatar'

type Team = { name: string; code: string }

type Match = {
  id: number
  phase: string
  match_date: string
  status: string
  team1_score: number | null
  team2_score: number | null
  team1: Team | null
  team2: Team | null
}

type Prediction = {
  user_id: string
  team1_score: number
  team2_score: number
  profile: { display_name: string | null; username: string | null; avatar_url: string | null } | null
  score: { points: number; winner_points: number; team1_goal_points: number; team2_goal_points: number; is_pleno: boolean } | null
}

const flagEmojis: Record<string, string> = {
  MEX: '🇲🇽', CAN: '🇨🇦', USA: '🇺🇸', ARG: '🇦🇷', BRA: '🇧🇷', URU: '🇺🇾',
  COL: '🇨🇴', ECU: '🇪🇨', PAR: '🇵🇾', ESP: '🇪🇸', POR: '🇵🇹', FRA: '🇫🇷',
  GER: '🇩🇪', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', NED: '🇳🇱', BEL: '🇧🇪', CRO: '🇭🇷', SUI: '🇨🇭',
  AUT: '🇦🇹', CZE: '🇨🇿', SWE: '🇸🇪', NOR: '🇳🇴', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', JPN: '🇯🇵',
  KOR: '🇰🇷', AUS: '🇦🇺', KSA: '🇸🇦', IRN: '🇮🇷', QAT: '🇶🇦', TUR: '🇹🇷',
  IRQ: '🇮🇶', UZB: '🇺🇿', JOR: '🇯🇴', SEN: '🇸🇳', MAR: '🇲🇦', GHA: '🇬🇭',
  CIV: '🇨🇮', EGY: '🇪🇬', TUN: '🇹🇳', RSA: '🇿🇦', HAI: '🇭🇹', CPV: '🇨🇻',
  COD: '🇨🇩', BIH: '🇧🇦', ALG: '🇩🇿', CUW: '🇨🇼', PAN: '🇵🇦', CMR: '🇨🇲',
}

function flag(code?: string | null) {
  return code ? (flagEmojis[code] ?? '🏳️') : '🏳️'
}

function profileName(p: Prediction['profile']) {
  return p?.display_name ?? p?.username ?? 'Anónimo'
}

const phaseLabels: Record<string, string> = {
  groups: 'Fase de Grupos', round32: '32avos de Final', round16: '16avos de Final',
  quarters: 'Cuartos de Final', semis: 'Semifinal', third: 'Tercer Puesto', final: 'Final',
}

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [match, setMatch] = useState<Match | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [myPred, setMyPred] = useState<{ t1: string; t2: string }>({ t1: '', t2: '' })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<'saved' | 'error' | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { init() }, [id])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    const { data: m } = await supabase
      .from('matches')
      .select(`
        id, phase, match_date, status, team1_score, team2_score,
        team1:teams!matches_team1_id_fkey(name, code),
        team2:teams!matches_team2_id_fkey(name, code)
      `)
      .eq('id', id)
      .single()

    if (m) setMatch(m as unknown as Match)

    if (user) {
      const { data: ownPred } = await supabase
        .from('predictions')
        .select('team1_score, team2_score')
        .eq('match_id', id)
        .eq('user_id', user.id)
        .single()

      if (ownPred) setMyPred({ t1: String(ownPred.team1_score), t2: String(ownPred.team2_score) })
    }

    // Load all predictions if match has started
    const matchStarted = m && new Date(m.match_date).getTime() <= Date.now()
    if (matchStarted) await loadAllPredictions()

    setLoading(false)
  }

  async function loadAllPredictions() {
    const { data } = await supabase
      .from('predictions')
      .select(`
        user_id, team1_score, team2_score,
        profile:profiles!predictions_user_id_fkey(display_name, username, avatar_url),
        score:scores!inner(points, winner_points, team1_goal_points, team2_goal_points, is_pleno)
      `)
      .eq('match_id', id)
      .order('team1_score', { ascending: false })

    if (data) setPredictions(data as unknown as Prediction[])
  }

  async function savePrediction() {
    if (!userId || !match || myPred.t1 === '' || myPred.t2 === '') return
    if (new Date(match.match_date).getTime() - Date.now() < 5 * 60 * 1000) return

    setSaving(true)
    const { error } = await supabase.from('predictions').upsert({
      user_id: userId, match_id: match.id,
      team1_score: parseInt(myPred.t1),
      team2_score: parseInt(myPred.t2),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,match_id' })

    setSaveMsg(error ? 'error' : 'saved')
    setTimeout(() => setSaveMsg(null), 2500)
    setSaving(false)
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('es-CL', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white animate-pulse">Cargando partido…</div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Partido no encontrado</p>
          <Link href="/play" className="text-emerald-400 hover:text-emerald-300">← Volver</Link>
        </div>
      </div>
    )
  }

  const started = new Date(match.match_date).getTime() <= Date.now()
  const editable = !started
  const finished = match.status === 'finished'
  const sortedPreds = [...predictions].sort((a, b) => (b.score?.points ?? 0) - (a.score?.points ?? 0))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="relative z-10 container mx-auto px-4 py-6 max-w-2xl">
        <Link href="/play" className="text-slate-400 hover:text-white text-sm transition-colors mb-6 inline-block">
          ← Volver a predicciones
        </Link>

        {/* Match card */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-full">
              {phaseLabels[match.phase] ?? match.phase}
            </span>
            {match.status === 'live' && (
              <span className="text-xs text-red-400 bg-red-400/10 px-3 py-1 rounded-full animate-pulse font-semibold">
                EN VIVO
              </span>
            )}
            {finished && (
              <span className="text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-full">Finalizado</span>
            )}
          </div>

          {/* Scoreboard */}
          <div className="flex items-center justify-between gap-4 my-4">
            <div className="flex-1 text-center">
              <div className="text-4xl mb-2">{flag(match.team1?.code)}</div>
              <div className="text-white font-semibold">{match.team1?.name ?? 'TBD'}</div>
            </div>

            <div className="text-center shrink-0">
              {finished ? (
                <div className="text-4xl font-bold text-white">
                  {match.team1_score} – {match.team2_score}
                </div>
              ) : (
                <div className="text-slate-500 text-2xl font-bold">vs</div>
              )}
              <div className="text-slate-500 text-xs mt-1 capitalize">{formatDate(match.match_date)}</div>
            </div>

            <div className="flex-1 text-center">
              <div className="text-4xl mb-2">{flag(match.team2?.code)}</div>
              <div className="text-white font-semibold">{match.team2?.name ?? 'TBD'}</div>
            </div>
          </div>
        </div>

        {/* My prediction — editable if not started */}
        {userId && (
          <div className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border rounded-2xl p-5 mb-6 ${
            editable ? 'border-emerald-500/20' : 'border-white/10'
          }`}>
            <h2 className="text-white font-semibold mb-4">
              {editable ? 'Tu predicción' : 'Tu predicción'}
              {!editable && myPred.t1 !== '' && (
                <span className="ml-2 text-slate-400 font-normal text-sm">
                  {myPred.t1} – {myPred.t2}
                </span>
              )}
            </h2>

            {editable ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{flag(match.team1?.code)}</span>
                  <input
                    type="text" inputMode="numeric" maxLength={1}
                    value={myPred.t1}
                    onChange={e => { if (/^\d?$/.test(e.target.value)) setMyPred(p => ({ ...p, t1: e.target.value })) }}
                    aria-label={`Goles ${match.team1?.name}`}
                    className="w-14 h-14 text-center text-2xl font-bold bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    placeholder="–"
                  />
                </div>
                <span className="text-slate-500 font-bold">–</span>
                <div className="flex items-center gap-3 flex-1 flex-row-reverse">
                  <span className="text-2xl">{flag(match.team2?.code)}</span>
                  <input
                    type="text" inputMode="numeric" maxLength={1}
                    value={myPred.t2}
                    onChange={e => { if (/^\d?$/.test(e.target.value)) setMyPred(p => ({ ...p, t2: e.target.value })) }}
                    aria-label={`Goles ${match.team2?.name}`}
                    className="w-14 h-14 text-center text-2xl font-bold bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    placeholder="–"
                  />
                </div>
              </div>
            ) : myPred.t1 === '' ? (
              <p className="text-slate-500 text-sm">No hiciste una predicción para este partido.</p>
            ) : null}

            {editable && (
              <button
                onClick={savePrediction}
                disabled={saving || myPred.t1 === '' || myPred.t2 === ''}
                className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {saving ? 'Guardando…' : saveMsg === 'saved' ? '✓ Guardado' : saveMsg === 'error' ? 'Error' : 'Guardar predicción'}
              </button>
            )}
          </div>
        )}

        {/* Predictions from others — visible after match starts */}
        {started && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-white font-semibold">
                {finished ? 'Puntuaciones' : 'Predicciones'}
              </h2>
              <span className="text-slate-500 text-sm">{predictions.length} jugadores</span>
            </div>

            {sortedPreds.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Nadie predijo este partido aún.
              </div>
            ) : (
              sortedPreds.map((pred, i) => {
                const isMe = pred.user_id === userId
                const pts = pred.score?.points ?? null
                return (
                  <div
                    key={pred.user_id}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      isMe ? 'bg-emerald-500/5 border-l-2 border-emerald-500' : ''
                    } ${i !== sortedPreds.length - 1 ? 'border-b border-white/5' : ''}`}
                  >
                    {/* Rank */}
                    <span className="text-slate-500 text-sm w-5 text-center shrink-0">
                      {finished ? (i + 1) : '–'}
                    </span>

                    {/* Avatar */}
                    <Avatar url={pred.profile?.avatar_url} name={profileName(pred.profile)} size={32} />

                    {/* Name */}
                    <span className={`flex-1 text-sm font-medium truncate ${isMe ? 'text-emerald-400' : 'text-white'}`}>
                      {profileName(pred.profile)}{isMe && ' (tú)'}
                    </span>

                    {/* Prediction */}
                    <span className="text-white font-mono text-sm shrink-0">
                      {pred.team1_score} – {pred.team2_score}
                    </span>

                    {/* Points */}
                    {finished && pts !== null && (
                      <div className="text-right shrink-0 ml-2">
                        <span className={`font-bold text-sm ${pts > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {pts} pts
                        </span>
                        {pred.score?.is_pleno && (
                          <span className="ml-1 text-yellow-400 text-xs">★</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {!started && !userId && (
          <div className="text-center py-6">
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 text-sm">
              Inicia sesión para predecir →
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
