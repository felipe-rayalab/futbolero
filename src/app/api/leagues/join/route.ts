import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/leagues/join
// Busca la liga por código usando admin client (bypasea RLS) y une al usuario autenticado.
export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: 'Código requerido' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = createAdminClient()

  const { data: league } = await admin
    .from('leagues')
    .select('id')
    .eq('code', code.trim().toUpperCase())
    .single()

  if (!league) return NextResponse.json({ error: 'Liga no encontrada' }, { status: 404 })

  const { error } = await admin
    .from('league_members')
    .insert({ league_id: league.id, user_id: user.id })

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Ya eres miembro' }, { status: 409 })
    return NextResponse.json({ error: 'Error al unirse' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, league_id: league.id })
}
