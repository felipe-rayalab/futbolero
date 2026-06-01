import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Avatar from '@/components/Avatar'
import AdminUsersPanel from './AdminUsersPanel'
import AdminTabs from './AdminTabs'

const ADMIN_EMAIL = 'felipe@rayalab.cl'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) redirect('/')

  const admin = createAdminClient()

  // All profiles with auth emails
  const { data: authUsers } = await admin.auth.admin.listUsers()
  const emailMap = Object.fromEntries((authUsers?.users ?? []).map(u => [u.id, u.email ?? null]))

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, display_name, username, avatar_url, has_paid, notes')
    .order('display_name', { ascending: true })

  const enrichedProfiles = (profiles ?? []).map(p => ({ ...p, email: emailMap[p.id] ?? null }))

  // All matches with teams
  const { data: matches } = await admin
    .from('matches')
    .select('id, phase, match_date, team1_score, team2_score, status, team1:teams!matches_team1_id_fkey(name, code), team2:teams!matches_team2_id_fkey(name, code)')
    .order('match_date', { ascending: true })

  // All predictions with user profiles
  const { data: predictions } = await admin
    .from('predictions')
    .select('match_id, team1_score, team2_score, updated_at, profiles(id, display_name, username, avatar_url)')
    .order('updated_at', { ascending: false })

  // Group predictions by match
  const byMatch: Record<number, any[]> = {}
  for (const p of predictions || []) {
    if (!byMatch[p.match_id]) byMatch[p.match_id] = []
    byMatch[p.match_id].push(p)
  }

  // Stats
  const totalPredictions = predictions?.length ?? 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-block mb-4 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
            <span className="text-red-400 text-sm font-medium">🔒 Admin</span>
          </div>
          <h1 className="text-4xl font-bold text-white">Panel Admin</h1>
          <p className="text-slate-500 text-sm mt-2">{enrichedProfiles.length} usuarios · {totalPredictions} predicciones</p>
        </div>

        <AdminTabs
          jugadores={<AdminUsersPanel profiles={enrichedProfiles} />}
          predicciones={
            <div className="space-y-6">
            {(matches || []).map(match => {
            const t1 = match.team1 as any
            const t2 = match.team2 as any
            const preds = byMatch[match.id] || []
            const matchLabel = `${t1?.name ?? '?'} vs ${t2?.name ?? '?'}`
            const date = new Date(match.match_date).toLocaleString('es-CL', {
              timeZone: 'America/Santiago',
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
            })

            return (
              <div key={match.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {/* Match header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                  <div>
                    <p className="text-white font-semibold">{matchLabel}</p>
                    <p className="text-slate-500 text-sm">{date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {match.status !== 'scheduled' && (
                      <span className="text-white font-bold text-lg">
                        {match.team1_score} – {match.team2_score}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      match.status === 'live'     ? 'bg-green-500/20 text-green-400' :
                      match.status === 'finished' ? 'bg-slate-500/20 text-slate-400' :
                                                    'bg-blue-500/20 text-blue-400'
                    }`}>
                      {match.status === 'live' ? '🔴 En vivo' : match.status === 'finished' ? 'Finalizado' : 'Programado'}
                    </span>
                    <span className="text-slate-500 text-sm">{preds.length} pronósticos</span>
                  </div>
                </div>

                {/* Predictions list */}
                {preds.length === 0 ? (
                  <p className="text-slate-600 text-sm px-6 py-4">Sin pronósticos aún</p>
                ) : (
                  <div className="divide-y divide-white/5">
                    {preds.map((pred: any, i: number) => {
                      const profile = pred.profiles
                      const name = profile?.display_name ?? profile?.username ?? 'Anónimo'
                      return (
                        <div key={i} className="flex items-center justify-between px-6 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar url={profile?.avatar_url} name={name} size={32} />
                            <span className="text-slate-300 text-sm">{name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-white text-lg">
                              {pred.team1_score} – {pred.team2_score}
                            </span>
                            {match.status === 'finished' && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                pred.team1_score === match.team1_score && pred.team2_score === match.team2_score
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : (pred.team1_score > pred.team2_score) === (match.team1_score > match.team2_score) ||
                                    (pred.team1_score === pred.team2_score) === (match.team1_score === match.team2_score)
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/20 text-red-400'
                              }`}>
                                {pred.team1_score === match.team1_score && pred.team2_score === match.team2_score
                                  ? '🎯 Pleno'
                                  : (pred.team1_score > pred.team2_score) === (match.team1_score > match.team2_score) ||
                                    (pred.team1_score === pred.team2_score) === (match.team1_score === match.team2_score)
                                    ? '✓ Ganador'
                                    : '✗ Error'}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
            </div>
          }
        />
      </main>
    </div>
  )
}
