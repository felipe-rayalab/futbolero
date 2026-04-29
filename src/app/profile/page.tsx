'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

type Profile = {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

type ScoreSummary = {
  total_points: number
  plenos: number
  matches_played: number
  max_match_points: number
}

type RecentScore = {
  points: number
  is_pleno: boolean
  match: {
    phase: string
    match_date: string
    team1_score: number | null
    team2_score: number | null
    team1: { name: string; code: string } | null
    team2: { name: string; code: string } | null
  } | null
  prediction: { team1_score: number; team2_score: number } | null
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

function getFlag(code?: string | null) {
  return code ? (flagEmojis[code] ?? '🏳️') : '🏳️'
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [summary, setSummary] = useState<ScoreSummary | null>(null)
  const [recent, setRecent] = useState<RecentScore[]>([])
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const [{ data: prof }, { data: scores }, { data: recentScores }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('scores').select('points, is_pleno').eq('user_id', user.id),
      supabase.from('scores').select(`
        points, is_pleno,
        match:matches!scores_match_id_fkey(
          phase, match_date, team1_score, team2_score,
          team1:teams!matches_team1_id_fkey(name, code),
          team2:teams!matches_team2_id_fkey(name, code)
        ),
        prediction:predictions!inner(team1_score, team2_score)
      `)
      .eq('user_id', user.id)
      .order('calculated_at', { ascending: false })
      .limit(10),
    ])

    if (prof) {
      setProfile(prof)
      setDisplayName(prof.display_name ?? '')
    }

    if (scores) {
      setSummary({
        total_points: scores.reduce((s, r) => s + r.points, 0),
        plenos: scores.filter(r => r.is_pleno).length,
        matches_played: scores.length,
        max_match_points: scores.reduce((m, r) => Math.max(m, r.points), 0),
      })
    }

    if (recentScores) setRecent(recentScores as unknown as RecentScore[])
    setLoading(false)
  }

  async function saveProfile() {
    if (!profile) return
    setSaving(true)
    setError('')
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
    if (error) {
      setError('Error al guardar')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Cargando perfil...</div>
      </div>
    )
  }

  const initials = (displayName || profile?.username || '?')[0].toUpperCase()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-white mb-8">Mi Perfil</h1>

        {/* Avatar + edit form */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-5 mb-6">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full ring-4 ring-white/10" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-3xl">
                {initials}
              </div>
            )}
            <div>
              <p className="text-white font-semibold text-lg">{displayName || profile?.username || 'Sin nombre'}</p>
              <p className="text-slate-400 text-sm">{profile?.username ? `@${profile.username}` : 'Sin usuario'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="display-name" className="block text-slate-400 text-sm mb-1.5">
                Nombre visible
              </label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={40}
                placeholder="Tu nombre"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* Stats */}
        {summary && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Puntos', value: summary.total_points, color: 'text-emerald-400' },
              { label: 'Plenos', value: summary.plenos, color: 'text-yellow-400' },
              { label: 'Partidos', value: summary.matches_played, color: 'text-blue-400' },
              { label: 'Récord', value: summary.max_match_points, color: 'text-purple-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-slate-500 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Recent matches */}
        {recent.length > 0 && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-white font-semibold">Últimas predicciones</h2>
            </div>
            {recent.map((r, i) => {
              const m = r.match
              const p = r.prediction
              if (!m) return null
              return (
                <div key={i} className={`p-4 flex items-center gap-3 ${i !== recent.length - 1 ? 'border-b border-white/5' : ''}`}>
                  {/* Teams */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {getFlag(m.team1?.code)} {m.team1?.name ?? 'TBD'} vs {m.team2?.name ?? 'TBD'} {getFlag(m.team2?.code)}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {formatDate(m.match_date)}
                      {m.team1_score != null && ` · Resultado: ${m.team1_score}–${m.team2_score}`}
                      {p && ` · Tu pred: ${p.team1_score}–${p.team2_score}`}
                    </p>
                  </div>
                  {/* Points badge */}
                  <div className="shrink-0 text-right">
                    <span className={`text-lg font-bold ${r.points > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {r.points} pts
                    </span>
                    {r.is_pleno && (
                      <span className="ml-2 text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full">Pleno</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!summary && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-10 text-center">
            <p className="text-slate-400">Aún no has participado en ningún partido.</p>
            <a href="/play" className="inline-block mt-4 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors">
              Hacer predicciones →
            </a>
          </div>
        )}
      </main>
    </div>
  )
}
