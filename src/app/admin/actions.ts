'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAIL = 'felipe@rayalab.cl'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) throw new Error('Unauthorized')
}

export async function togglePaid(userId: string, hasPaid: boolean) {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('profiles').update({ has_paid: hasPaid }).eq('id', userId)
  revalidatePath('/admin')
}

export async function updateNotes(userId: string, notes: string) {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('profiles').update({ notes: notes || null }).eq('id', userId)
  revalidatePath('/admin')
}

export async function updateMatchScore({
  match_id, status, team1_score, team2_score,
}: {
  match_id: number
  status: 'live' | 'finished'
  team1_score: number
  team2_score: number
}) {
  await assertAdmin()
  const admin = createAdminClient()
  const { error } = await admin
    .from('matches')
    .update({ status, team1_score, team2_score })
    .eq('id', match_id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/leaderboard')
  revalidatePath('/play')
}

export async function publishKnockoutMatch({
  match_id,
  team1_code,
  team2_code,
}: {
  match_id: number
  team1_code: string
  team2_code: string
}) {
  await assertAdmin()
  const admin = createAdminClient()

  const { data: teams } = await admin
    .from('teams')
    .select('id, code')
    .in('code', [team1_code, team2_code])

  const team1 = teams?.find(t => t.code === team1_code)
  const team2 = teams?.find(t => t.code === team2_code)
  if (!team1 || !team2) throw new Error(`Equipo no encontrado: ${!team1 ? team1_code : team2_code}`)

  const { data: match } = await admin.from('matches').select('phase').eq('id', match_id).single()
  const weekByPhase: Record<string, number> = {
    round32: 6, round16: 7, quarters: 8, semis: 9, third: 10, final: 11,
  }

  const { error } = await admin.from('matches').update({
    team1_id: team1.id,
    team2_id: team2.id,
    week_number: weekByPhase[match?.phase ?? ''] ?? 6,
  }).eq('id', match_id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/play')
  revalidatePath('/leaderboard')
}

export async function recalculateMatchScores(match_id: number) {
  await assertAdmin()
  const admin = createAdminClient()
  const { error } = await admin.rpc('calculate_and_save_scores', { p_match_id: match_id })
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/leaderboard')
  revalidatePath('/play')
}
