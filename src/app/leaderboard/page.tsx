import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  
  const { data: leaderboard } = await supabase
    .from('v_leaderboard_general')
    .select('*')
    .limit(50)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-white/10">
        <Link href="/" className="text-2xl font-bold text-white">⚽ El Futbolero</Link>
        <nav className="flex gap-4">
          <Link href="/play" className="text-green-200 hover:text-white">Jugar</Link>
          <Link href="/leagues" className="text-green-200 hover:text-white">Ligas</Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">🏆 Ranking General</h1>

        <div className="bg-white/10 backdrop-blur rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 p-4 border-b border-white/10 text-green-300 text-sm font-semibold">
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
                className={`grid grid-cols-12 gap-2 p-4 items-center ${
                  index < 3 ? 'bg-yellow-500/10' : ''
                } ${index !== leaderboard.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                <div className="col-span-1 text-center">
                  {index === 0 && <span className="text-2xl">🥇</span>}
                  {index === 1 && <span className="text-2xl">🥈</span>}
                  {index === 2 && <span className="text-2xl">🥉</span>}
                  {index > 2 && <span className="text-white/70">{index + 1}</span>}
                </div>
                <div className="col-span-5 flex items-center gap-2">
                  {player.avatar_url ? (
                    <img 
                      src={player.avatar_url} 
                      alt="" 
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
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
                <div className="col-span-2 text-center text-green-300">
                  {player.plenos}
                </div>
                <div className="col-span-2 text-center text-green-300">
                  {player.matches_played}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-green-200">
              <p className="text-lg">No hay jugadores aún</p>
              <p className="text-sm mt-2 text-green-200/70">
                ¡Sé el primero en ingresar tus pronósticos!
              </p>
              <Link 
                href="/play" 
                className="inline-block mt-4 bg-yellow-500 text-black font-semibold px-6 py-2 rounded-lg hover:bg-yellow-400"
              >
                Jugar Ahora
              </Link>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 text-center text-green-200/70 text-sm">
          <p>Pts = Puntos totales | Plenos = Resultados exactos</p>
        </div>
      </main>
    </div>
  )
}
