import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const phaseLabel: Record<string, string> = {
  groups: 'Grupos', round32: '32avos', round16: '16avos',
  quarters: 'Cuartos', semis: 'Semis', third: '3er lugar', final: 'Final',
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const [{ data: profile }, { data: scores }, { data: leagues }] = await Promise.all([
    admin.from('profiles').select('id, display_name, avatar_url').eq('id', id).single(),
    admin.from('scores').select(`
      points, winner_points, team1_goal_points, team2_goal_points, is_pleno, is_final,
      match:matches(
        id, phase, match_date, team1_score, team2_score, status,
        team1:teams!matches_team1_id_fkey(name, code),
        team2:teams!matches_team2_id_fkey(name, code)
      )
    `).eq('user_id', id).order('match_id', { ascending: false }),
    admin.from('league_members').select('league:leagues(id, name)').eq('user_id', id),
  ])

  if (!profile) notFound()

  const predictions = await admin
    .from('predictions')
    .select('match_id, team1_score, team2_score')
    .eq('user_id', id)

  const predMap: Record<number, { team1_score: number; team2_score: number }> = {}
  predictions.data?.forEach(p => { predMap[p.match_id] = p })

  const totalPoints = scores?.reduce((sum, s) => sum + s.points, 0) ?? 0
  const totalPlenos = scores?.filter(s => s.is_pleno).length ?? 0
  const maxPoints = scores?.reduce((max, s) => Math.max(max, s.points), 0) ?? 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-2xl">⚽</span>
            <span className="text-lg font-bold text-white tracking-tight hidden sm:block">El Futbolero</span>
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/leaderboard" className="text-slate-400 hover:text-white transition-colors">Ranking</Link>
            <Link href="/leagues" className="text-slate-400 hover:text-white transition-colors">Ligas</Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Profile header */}
        <div className="flex items-center gap-5 mb-8">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full ring-2 ring-white/10" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl">
              {(profile.display_name || '?')[0].toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{profile.display_name || 'Anónimo'}</h1>
            {leagues && leagues.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {leagues.map((l: any) => (
                  <Link
                    key={l.league.id}
                    href={`/leagues/${l.league.id}`}
                    className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full hover:bg-emerald-400/20 transition-colors"
                  >
                    {l.league.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Puntos totales', value: totalPoints, color: 'text-emerald-400' },
            { label: 'Plenos', value: totalPlenos, color: 'text-yellow-400' },
            { label: 'Máx en un partido', value: maxPoints, color: 'text-blue-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Match-by-match results */}
        <h2 className="text-lg font-semibold text-white mb-4">Historial de partidos</h2>

        {!scores || scores.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-slate-500">
            No hay partidos finalizados aún
          </div>
        ) : (
          <div className="space-y-3">
            {scores.map((s: any, i) => {
              const match = s.match
              const pred = predMap[match?.id]
              const isPleno = s.is_pleno

              return (
                <div
                  key={i}
                  className={`bg-white/5 border rounded-2xl px-5 py-4 flex items-center gap-4 ${
                    isPleno ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/10'
                  }`}
                >
                  {/* Phase + date */}
                  <div className="w-24 shrink-0 text-center">
                    <div className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full inline-block">
                      {phaseLabel[match?.phase] ?? match?.phase}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {new Date(match?.match_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>

                  {/* Teams + result */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white font-medium truncate">{match?.team1?.name}</span>
                      <span className="text-slate-400 font-bold shrink-0">
                        {match?.team1_score} — {match?.team2_score}
                      </span>
                      <span className="text-white font-medium truncate">{match?.team2?.name}</span>
                    </div>
                    {pred && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        Tu predicción: {pred.team1_score} — {pred.team2_score}
                      </div>
                    )}
                  </div>

                  {/* Points */}
                  <div className="shrink-0 text-right">
                    <div className={`text-xl font-bold ${
                      isPleno ? 'text-yellow-400' : s.points > 0 ? 'text-emerald-400' : 'text-slate-600'
                    }`}>
                      {isPleno && <span className="text-sm mr-1">⭐</span>}
                      {s.points} pts
                    </div>
                    <div className="text-xs text-slate-600">
                      {[
                        s.winner_points > 0 && `${s.winner_points} ganador`,
                        s.team1_goal_points > 0 && `${s.team1_goal_points} gol`,
                        s.team2_goal_points > 0 && `${s.team2_goal_points} gol`,
                      ].filter(Boolean).join(' · ')}
                    </div>
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
