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
