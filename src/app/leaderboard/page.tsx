import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  
  const { data: leaderboard } = await supabase
    .from('v_leaderboard_general')
    .select('*')
    .limit(50)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <span className="text-3xl">⚽</span>
          <span className="text-xl font-bold text-white tracking-tight">El Futbolero</span>
        </Link>
        <nav className="flex gap-6 text-sm">
          <Link href="/play" className="text-slate-400 hover:text-white transition-colors">Jugar</Link>
          <Link href="/leagues" className="text-slate-400 hover:text-white transition-colors">Ligas</Link>
        </nav>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-block mb-4 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <span className="text-blue-400 text-sm font-medium">🏆 Clasificación</span>
          </div>
          <h1 className="text-4xl font-bold text-white">Ranking General</h1>
        </div>

        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 p-4 border-b border-white/10 text-slate-400 text-sm font-medium">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">Jugador</div>
            <div className="col-span-2 text-center">Pts</div>
            <div className="col-span-2 text-center">Plenos</div>
            <div className="col-span-2 text-center">Partidos</div>
          </div>

          {/* Rows */}
          {leaderboard && leaderboard.length > 0 ? (
            leaderboard.map((player, index) => (
              <div 
                key={player.id} 
                className={`grid grid-cols-12 gap-2 p-4 items-center hover:bg-white/5 transition-colors ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' : ''
                } ${index === 1 ? 'bg-gradient-to-r from-slate-400/10 to-transparent' : ''
                } ${index === 2 ? 'bg-gradient-to-r from-orange-500/10 to-transparent' : ''
                } ${index !== leaderboard.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                <div className="col-span-1 text-center">
                  {index === 0 && <span className="text-2xl">🥇</span>}
                  {index === 1 && <span className="text-2xl">🥈</span>}
                  {index === 2 && <span className="text-2xl">🥉</span>}
                  {index > 2 && <span className="text-slate-500 font-medium">{index + 1}</span>}
                </div>
                <div className="col-span-5 flex items-center gap-3">
                  {player.avatar_url ? (
                    <img 
                      src={player.avatar_url} 
                      alt="" 
                      className="w-9 h-9 rounded-full ring-2 ring-white/10"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                      {(player.display_name || player.username || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-white font-medium truncate">
                    {player.display_name || player.username || 'Anónimo'}
                  </span>
                </div>
                <div className="col-span-2 text-center text-white font-bold text-lg">
                  {player.total_points}
                </div>
                <div className="col-span-2 text-center text-slate-400">
                  {player.plenos}
                </div>
                <div className="col-span-2 text-center text-slate-400">
                  {player.matches_played}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏆</span>
              </div>
              <p className="text-lg text-white mb-2">No hay jugadores aún</p>
              <p className="text-sm text-slate-500 mb-6">
                ¡Sé el primero en ingresar tus pronósticos!
              </p>
              <Link 
                href="/play" 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-6 py-3 rounded-full hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all"
              >
                Jugar Ahora
              </Link>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 text-center text-slate-500 text-sm">
          <p>Pts = Puntos totales | Plenos = Resultados exactos</p>
        </div>
      </main>
    </div>
  )
}
