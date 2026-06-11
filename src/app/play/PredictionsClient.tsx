'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

type Match = {
  id: number
  team1: { name: string; code: string; flag_url: string } | null
  team2: { name: string; code: string; flag_url: string } | null
  phase: string
  match_date: string
  team1_score: number | null
  team2_score: number | null
  status: string
}

type Prediction = { match_id: number; team1_score: number; team2_score: number }
type Score = { match_id: number; points: number; is_pleno: boolean }
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const flagEmojis: Record<string, string> = {
  MEX: '🇲🇽', CAN: '🇨🇦', USA: '🇺🇸', ARG: '🇦🇷', BRA: '🇧🇷', CHI: '🇨🇱',
  COL: '🇨🇴', ECU: '🇪🇨', PER: '🇵🇪', URY: '🇺🇾', VEN: '🇻🇪', PAR: '🇵🇾',
  BOL: '🇧🇴', ESP: '🇪🇸', POR: '🇵🇹', FRA: '🇫🇷', GER: '🇩🇪', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  ITA: '🇮🇹', NED: '🇳🇱', BEL: '🇧🇪', CRO: '🇭🇷', SRB: '🇷🇸', SUI: '🇨🇭',
  DEN: '🇩🇰', AUT: '🇦🇹', POL: '🇵🇱', UKR: '🇺🇦', WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', CZE: '🇨🇿',
  SWE: '🇸🇪', NOR: '🇳🇴', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', IRL: '🇮🇪', JPN: '🇯🇵', KOR: '🇰🇷',
  AUS: '🇦🇺', KSA: '🇸🇦', IRN: '🇮🇷', QAT: '🇶🇦', SEN: '🇸🇳', MAR: '🇲🇦',
  NGA: '🇳🇬', CMR: '🇨🇲', GHA: '🇬🇭', CIV: '🇨🇮', EGY: '🇪🇬', TUN: '🇹🇳',
}

export default function PredictionsClient({
  initialMatches,
  initialPredictions,
  initialScores,
}: {
  initialMatches: Match[]
  initialPredictions: Prediction[]
  initialScores: Score[]
}) {
  const supabase = createClient()

  const initLocal = () => {
    const map: Record<number, { team1: string; team2: string }> = {}
    initialPredictions.forEach(p => {
      map[p.match_id] = { team1: p.team1_score.toString(), team2: p.team2_score.toString() }
    })
    return map
  }

  const initScores = () => {
    const map: Record<number, Score> = {}
    initialScores.forEach(s => { map[s.match_id] = s })
    return map
  }

  const [localPredictions, setLocalPredictions] = useState(initLocal)
  const [scores] = useState(initScores)
  const [saveStatus, setSaveStatus] = useState<Record<number, SaveStatus>>({})
  const [activePhase, setActivePhase] = useState<string>(initialMatches[0]?.phase ?? '')
  const debounceTimers = useRef<Record<number, NodeJS.Timeout>>({})

  const savePrediction = useCallback(async (matchId: number, team1Score: string, team2Score: string) => {
    const match = initialMatches.find(m => m.id === matchId)
    if (!match || !canPredict(match.match_date)) return
    if (team1Score === '' || team2Score === '') return

    setSaveStatus(prev => ({ ...prev, [matchId]: 'saving' }))

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaveStatus(prev => ({ ...prev, [matchId]: 'error' })); return }

    const { error } = await supabase.from('predictions').upsert({
      user_id: user.id,
      match_id: matchId,
      team1_score: parseInt(team1Score),
      team2_score: parseInt(team2Score),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,match_id' })

    setSaveStatus(prev => ({ ...prev, [matchId]: error ? 'error' : 'saved' }))
    if (!error) setTimeout(() => setSaveStatus(prev => ({ ...prev, [matchId]: 'idle' })), 2000)
  }, [initialMatches, supabase])

  function updateLocalPrediction(matchId: number, team: 'team1' | 'team2', value: string) {
    if (value !== '' && !/^\d$/.test(value)) return
    const newLocal = { ...localPredictions[matchId], [team]: value }
    setLocalPredictions(prev => ({ ...prev, [matchId]: newLocal }))
    if (debounceTimers.current[matchId]) clearTimeout(debounceTimers.current[matchId])
    const t1 = team === 'team1' ? value : newLocal.team1
    const t2 = team === 'team2' ? value : newLocal.team2
    if (t1 !== '' && t2 !== '') {
      debounceTimers.current[matchId] = setTimeout(() => savePrediction(matchId, t1, t2), 500)
    }
  }

  function canPredict(matchDate: string) {
    return new Date(matchDate).getTime() - Date.now() > 5 * 60 * 1000
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  }

  function getPhaseLabel(phase: string) {
    const labels: Record<string, string> = {
      groups: 'Grupos', round32: '32avos', round16: '16avos',
      quarters: 'Cuartos', semis: 'Semis', third: '3°', final: 'Final',
    }
    return labels[phase] || phase
  }

  function getMaxPoints(phase: string) {
    return ({ groups: 12, round32: 13, round16: 13, quarters: 15, semis: 17, third: 17, final: 17 } as Record<string, number>)[phase] ?? 12
  }

  function getFlag(code?: string) {
    return flagEmojis[code ?? ''] || '🏳️'
  }

  const matchesByPhase = initialMatches.reduce((acc, m) => {
    if (!acc[m.phase]) acc[m.phase] = []
    acc[m.phase].push(m)
    return acc
  }, {} as Record<string, Match[]>)

  const phases = Object.keys(matchesByPhase)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-2xl">⚽</span>
            <span className="text-lg font-bold text-white tracking-tight hidden sm:block">El Futbolero</span>
          </Link>
          <nav className="flex gap-4 sm:gap-6 text-sm">
            <Link href="/leaderboard" className="text-slate-400 hover:text-white transition-colors">Ranking</Link>
            <Link href="/leagues" className="text-slate-400 hover:text-white transition-colors">Ligas</Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-6 max-w-6xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Predicciones</h1>
          <span className="text-emerald-400/70 text-sm">💾 Guardado automático</span>
        </div>

        {phases.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {phases.map(phase => (
              <button
                key={phase}
                onClick={() => setActivePhase(phase)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activePhase === phase
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {getPhaseLabel(phase)}
              </button>
            ))}
          </div>
        )}

        {initialMatches.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-lg">No hay partidos programados aún</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchesByPhase[activePhase]?.map(match => {
              const editable = canPredict(match.match_date)
              const local = localPredictions[match.id] || { team1: '', team2: '' }
              const hasPrediction = local.team1 !== '' && local.team2 !== ''
              const status = saveStatus[match.id]
              const isLive = match.status === 'live'
              const isFinished = match.status === 'finished'
              const matchScore = scores[match.id]

              return (
                <div
                  key={match.id}
                  className={`relative backdrop-blur-sm rounded-2xl p-5 transition-all ${
                    isLive
                      ? 'bg-gradient-to-br from-emerald-950/60 to-slate-900/80 border border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                      : !editable
                      ? 'bg-gradient-to-br from-white/5 to-white/5 border border-white/10 opacity-60'
                      : 'bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {isLive && (
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-emerald-500/30 animate-pulse pointer-events-none" />
                  )}

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs text-slate-500">{formatDate(match.match_date)}</span>
                    <div className="flex items-center gap-2">
                      {isLive && (
                        <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-full font-medium">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                          EN VIVO
                        </span>
                      )}
                      {!editable && !isLive && !isFinished && (
                        <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full">Cerrado</span>
                      )}
                      {editable && status === 'saving' && (
                        <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full animate-pulse">Guardando...</span>
                      )}
                      {editable && status === 'saved' && (
                        <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">✓ Guardado</span>
                      )}
                      {editable && status === 'error' && (
                        <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-full">Error</span>
                      )}
                      {editable && hasPrediction && (!status || status === 'idle') && (
                        <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">✓</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl">{getFlag(match.team1?.code)}</span>
                      <span className="text-white font-medium truncate">{match.team1?.name || 'TBD'}</span>
                    </div>
                    {isLive || isFinished ? (
                      <div className="w-14 h-14 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-slate-600 text-xl">
                        {local.team1 !== '' ? <span className="text-slate-400 font-bold">{local.team1}</span> : '🔒'}
                      </div>
                    ) : (
                      <input
                        type="text" inputMode="numeric" maxLength={1}
                        value={local.team1}
                        onChange={e => updateLocalPrediction(match.id, 'team1', e.target.value)}
                        disabled={!editable}
                        className="w-14 h-14 text-center text-2xl font-bold bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
                        placeholder="-"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl">{getFlag(match.team2?.code)}</span>
                      <span className="text-white font-medium truncate">{match.team2?.name || 'TBD'}</span>
                    </div>
                    {isLive || isFinished ? (
                      <div className="w-14 h-14 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-slate-600 text-xl">
                        {local.team2 !== '' ? <span className="text-slate-400 font-bold">{local.team2}</span> : '🔒'}
                      </div>
                    ) : (
                      <input
                        type="text" inputMode="numeric" maxLength={1}
                        value={local.team2}
                        onChange={e => updateLocalPrediction(match.id, 'team2', e.target.value)}
                        disabled={!editable}
                        className="w-14 h-14 text-center text-2xl font-bold bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
                        placeholder="-"
                      />
                    )}
                  </div>

                  {(isLive || isFinished) && match.team1_score !== null && match.team2_score !== null && (
                    <div className={`flex items-center justify-between rounded-xl px-3 py-2 mb-3 ${
                      isLive ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5 border border-white/10'
                    }`}>
                      <span className="text-xs text-slate-400">{isLive ? 'Marcador' : 'Resultado'}</span>
                      <span className={`text-sm font-bold tracking-widest ${isLive ? 'text-emerald-400' : 'text-white'}`}>
                        {match.team1_score} — {match.team2_score}
                      </span>
                      {matchScore ? (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          matchScore.is_pleno ? 'text-yellow-300 bg-yellow-400/20'
                          : matchScore.points > 0 ? 'text-emerald-400 bg-emerald-400/10'
                          : 'text-slate-500 bg-white/5'
                        }`}>
                          {matchScore.is_pleno ? '⭐ ' : ''}{matchScore.points} pts
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">— pts</span>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between text-xs pt-3 border-t border-white/5">
                    <span className="text-slate-500">Puntaje máx</span>
                    <span className="text-emerald-400 font-semibold">{getMaxPoints(match.phase)} pts</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
