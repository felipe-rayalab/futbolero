import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ id: string }>
}

export default async function LeaguePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  
  // Get league info
  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', id)
    .single()

  if (!league) {
    notFound()
  }

  // Get league members with their scores
  const { data: members } = await supabase
    .from('league_members')
    .select(`
      user_id,
      profiles (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('league_id', id)

  // Get scores for each member
  const memberScores = await Promise.all(
    (members || []).map(async (member) => {
      const { data: scores } = await supabase
        .from('scores')
        .select('points, is_pleno')
        .eq('user_id', member.user_id)

      const totalPoints = scores?.reduce((sum, s) => sum + s.points, 0) || 0
      const plenos = scores?.filter(s => s.is_pleno).length || 0
      const profile = member.profiles as any

      return {
        id: member.user_id,
        display_name: profile?.display_name || profile?.username || 'Anónimo',
        avatar_url: profile?.avatar_url,
        total_points: totalPoints,
        plenos,
        matches_played: scores?.length || 0
      }
    })
  )

  // Sort by points
  memberScores.sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points
    return b.plenos - a.plenos
  })

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
        {/* League Header */}
        <div className="text-center mb-8">
          <Link href="/leagues" className="text-green-300 hover:text-white text-sm">
            ← Volver a Mis Ligas
          </Link>
          <h1 className="text-3xl font-bold text-white mt-4">{league.name}</h1>
          <div className="mt-2">
            <span className="text-green-300">Código de invitación: </span>
            <span className="font-mono bg-white/20 px-3 py-1 rounded text-white">{league.code}</span>
          </div>
          <p className="text-green-200/70 text-sm mt-2">
            Comparte este código con tus amigos para que se unan
          </p>
        </div>

        {/* Leaderboard */}
        <div className="bg-white/10 backdrop-blur rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">🏆 Ranking de la Liga</h2>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 p-4 border-b border-white/10 text-green-300 text-sm font-semibold">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">Jugador</div>
            <div className="col-span-2 text-center">Pts</div>
            <div className="col-span-2 text-center">Plenos</div>
            <div className="col-span-2 text-center">Partidos</div>
          </div>

          {/* Rows */}
          {memberScores.length > 0 ? (
            memberScores.map((player, index) => (
              <div 
                key={player.id} 
                className={`grid grid-cols-12 gap-2 p-4 items-center ${
                  index < 3 ? 'bg-yellow-500/10' : ''
                } ${index !== memberScores.length - 1 ? 'border-b border-white/5' : ''}`}
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
                      {player.display_name[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-white font-medium truncate">
                    {player.display_name}
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
              <p>No hay miembros aún</p>
            </div>
          )}
        </div>

        {/* Member Count */}
        <div className="mt-4 text-center text-green-200/70 text-sm">
          {memberScores.length} {memberScores.length === 1 ? 'miembro' : 'miembros'} en esta liga
        </div>
      </main>
    </div>
  )
}
