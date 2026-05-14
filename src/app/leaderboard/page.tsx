import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Header from '@/components/Header'
import Avatar from '@/components/Avatar'
import Link from 'next/link'

const WEEKS = [1, 2, 3, 4]

type Props = {
  searchParams: Promise<{ semana?: string }>
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const { semana } = await searchParams
  const activeWeek = WEEKS.includes(Number(semana)) ? Number(semana) : null
  const admin = createAdminClient()

  let leaderboard: any[] = []

  if (activeWeek) {
    const { data } = await admin
      .from('v_leaderboard_weekly')
      .select('*')
      .eq('week_number', activeWeek)
      .order('total_points', { ascending: false })
      .limit(50)
    leaderboard = data ?? []
  } else {
    const supabase = await createClient()
    const { data } = await supabase
      .from('v_leaderboard_general')
      .select('*')
      .limit(50)
    leaderboard = data ?? []
  }

  const tabs = [
    { label: 'General', href: '/leaderboard' },
    ...WEEKS.map(w => ({ label: `Semana ${w}`, href: `/leaderboard?semana=${w}` })),
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-block mb-4 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <span className="text-blue-400 text-sm font-medium">🏆 Clasificación</span>
          </div>
          <h1 className="text-4xl font-bold text-white">Ranking</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-6 justify-center">
          {tabs.map(tab => {
            const isActive = tab.label === 'General' ? !activeWeek : tab.href === `/leaderboard?semana=${activeWeek}`
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>

        {/* Table */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 p-4 border-b border-white/10 text-slate-400 text-sm font-medium">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">Jugador</div>
            <div className="col-span-2 text-center">Pts</div>
            <div className="col-span-2 text-center">Plenos</div>
            <div className="col-span-2 text-center">Partidos</div>
          </div>

          {leaderboard.length > 0 ? (
            leaderboard.map((player, index) => (
              <div
                key={`${player.id}-${index}`}
                className={`grid grid-cols-12 gap-2 p-4 items-center hover:bg-white/5 transition-colors
                  ${index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' : ''}
                  ${index === 1 ? 'bg-gradient-to-r from-slate-400/10 to-transparent' : ''}
                  ${index === 2 ? 'bg-gradient-to-r from-orange-500/10 to-transparent' : ''}
                  ${index !== leaderboard.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                <div className="col-span-1 text-center">
                  {index === 0 && <span className="text-2xl">🥇</span>}
                  {index === 1 && <span className="text-2xl">🥈</span>}
                  {index === 2 && <span className="text-2xl">🥉</span>}
                  {index > 2 && <span className="text-slate-500 font-medium">{index + 1}</span>}
                </div>
                <div className="col-span-5 flex items-center gap-3">
                  <Link href={`/profile/${player.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0">
                    <Avatar url={player.avatar_url} name={player.display_name || player.username} size={36} />
                    <span className="text-white font-medium truncate">
                      {player.display_name || player.username || 'Anónimo'}
                    </span>
                  </Link>
                </div>
                <div className="col-span-2 text-center text-white font-bold text-lg">{player.total_points}</div>
                <div className="col-span-2 text-center text-slate-400">{player.plenos}</div>
                <div className="col-span-2 text-center text-slate-400">{player.matches_played ?? 0}</div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4" aria-hidden="true">🏆</div>
              <p className="text-lg text-white font-semibold mb-2">
                {activeWeek ? `Sin puntos en Semana ${activeWeek} aún` : 'El ranking empieza el 12 de junio'}
              </p>
              <p className="text-sm text-slate-400 mb-6">
                Los puntos se calculan cuando terminan los partidos.
              </p>
              <Link
                href="/play"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-6 py-3 rounded-full hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all"
              >
                Hacer predicciones
              </Link>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-slate-500 text-sm">
          Pts = Puntos totales | Plenos = Resultados exactos
        </p>
      </main>
    </div>
  )
}
