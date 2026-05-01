import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import LeagueCodeCopy from '@/components/LeagueCodeCopy'
import Avatar from '@/components/Avatar'

type Props = {
  params: Promise<{ id: string }>
}

export default async function LeaguePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', id)
    .single()

  if (!league) notFound()

  // Single query: members + profiles + aggregated scores
  const { data: members } = await supabase
    .from('league_members')
    .select(`
      user_id,
      profiles (id, username, display_name, avatar_url),
      scores:scores!scores_user_id_fkey (points, is_pleno)
    `)
    .eq('league_id', id)

  const memberScores = (members || []).map((member) => {
    const profile = member.profiles as any
    const scores = (member.scores as any[]) ?? []
    return {
      id: member.user_id,
      display_name: profile?.display_name ?? profile?.username ?? 'Anónimo',
      avatar_url: profile?.avatar_url ?? null,
      total_points: scores.reduce((sum: number, s: any) => sum + (s.points ?? 0), 0),
      plenos: scores.filter((s: any) => s.is_pleno).length,
      matches_played: scores.length,
    }
  }).sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points
    return b.plenos - a.plenos
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        {/* League header */}
        <div className="text-center mb-8">
          <Link href="/leagues" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Volver a Mis Ligas
          </Link>
          <h1 className="text-4xl font-bold text-white mt-4">{league.name}</h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-slate-400 text-sm">Código de invitación:</span>
            <LeagueCodeCopy code={league.code} />
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 p-4 border-b border-white/10 text-slate-400 text-sm font-medium">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">Jugador</div>
            <div className="col-span-2 text-center">Pts</div>
            <div className="col-span-2 text-center">Plenos</div>
            <div className="col-span-2 text-center">Partidos</div>
          </div>

          {memberScores.length > 0 ? (
            memberScores.map((player, index) => (
              <div
                key={player.id}
                className={`grid grid-cols-12 gap-2 p-4 items-center hover:bg-white/5 transition-colors
                  ${index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' : ''}
                  ${index === 1 ? 'bg-gradient-to-r from-slate-400/10 to-transparent' : ''}
                  ${index === 2 ? 'bg-gradient-to-r from-orange-500/10 to-transparent' : ''}
                  ${index !== memberScores.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                <div className="col-span-1 text-center">
                  {index === 0 && <span className="text-2xl">🥇</span>}
                  {index === 1 && <span className="text-2xl">🥈</span>}
                  {index === 2 && <span className="text-2xl">🥉</span>}
                  {index > 2 && <span className="text-slate-500 font-medium">{index + 1}</span>}
                </div>
                <div className="col-span-5 flex items-center gap-3">
                  <Avatar url={player.avatar_url} name={player.display_name} size={36} />
                  <span className="text-white font-medium truncate">{player.display_name}</span>
                </div>
                <div className="col-span-2 text-center text-white font-bold text-lg">{player.total_points}</div>
                <div className="col-span-2 text-center text-slate-400">{player.plenos}</div>
                <div className="col-span-2 text-center text-slate-400">{player.matches_played}</div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <p className="text-lg text-white mb-1">No hay miembros aún</p>
              <p className="text-slate-500 text-sm">Comparte el código para invitar amigos</p>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-slate-500 text-sm">
          {memberScores.length} {memberScores.length === 1 ? 'miembro' : 'miembros'} en esta liga
        </p>
      </main>
    </div>
  )
}
