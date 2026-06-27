import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdminToken } from '@/lib/auth-admin'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/match
// Body: { match_id: number, status: 'live' | 'finished', team1_score?: number, team2_score?: number }
// Header: Authorization: Bearer <ADMIN_SECRET>
export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body.match_id !== 'number' || !body.status) {
    return NextResponse.json({ error: 'match_id y status son requeridos' }, { status: 400 })
  }

  const { match_id, status, team1_score, team2_score } = body

  if (!['live', 'finished'].includes(status)) {
    return NextResponse.json({ error: 'status debe ser live o finished' }, { status: 400 })
  }

  if (status === 'finished' && (team1_score == null || team2_score == null)) {
    return NextResponse.json({ error: 'team1_score y team2_score son requeridos para finished' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Build update — always include scores if provided so the DB trigger
  // recalculates points for live score changes too
  const update: Record<string, unknown> = { status }
  if (team1_score != null) update.team1_score = team1_score
  if (team2_score != null) update.team2_score = team2_score

  const { error: matchError } = await supabase
    .from('matches')
    .update(update)
    .eq('id', match_id)

  if (matchError) {
    return NextResponse.json({ error: matchError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, status, team1_score: team1_score ?? null, team2_score: team2_score ?? null })
}

// GET /api/admin/match?id=X — ver estado actual de un partido
export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id, phase, match_date, status, team1_score, team2_score,
      team1:teams!matches_team1_id_fkey(name, code),
      team2:teams!matches_team2_id_fkey(name, code),
      predictions(count)
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}
