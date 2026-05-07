import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdminToken } from '@/lib/auth-admin'
import { getMatchesByDate, ourCodeToTLA, isLiveStatus, isFinishedStatus, type FDMatch } from '@/lib/football-api'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/cron/update-scores
// Llamado por el cron job cada minuto durante el torneo.
// Busca partidos activos en football-data.org y actualiza scores + puntos en tiempo real.
export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Buscar partidos de hoy y mañana que no están terminados
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dateFrom = now.toISOString().split('T')[0]
  const dateTo = tomorrow.toISOString().split('T')[0]

  const { data: ourMatches, error } = await supabase
    .from('matches')
    .select(`
      id, external_id, status, match_date, phase,
      team1:teams!matches_team1_id_fkey(code),
      team2:teams!matches_team2_id_fkey(code)
    `)
    .neq('status', 'finished')
    .lte('match_date', tomorrow.toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!ourMatches?.length) return NextResponse.json({ ok: true, message: 'Sin partidos activos' })

  // Obtener partidos del día desde football-data.org
  let fdMatches: FDMatch[] = []
  try {
    fdMatches = await getMatchesByDate('WC', dateFrom, dateTo)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }

  const results = []

  for (const match of ourMatches) {
    const t1 = (match.team1 as any)?.code as string
    const t2 = (match.team2 as any)?.code as string

    // Encontrar el partido equivalente en football-data.org por TLA de equipos
    const fdMatch = fdMatches.find(fd =>
      fd.homeTeam.tla === ourCodeToTLA(t1) &&
      fd.awayTeam.tla === ourCodeToTLA(t2)
    )

    if (!fdMatch) continue

    // Guardar external_id la primera vez que lo encontramos
    if (!match.external_id) {
      await supabase.from('matches').update({ external_id: fdMatch.id }).eq('id', match.id)
    }

    const live = isLiveStatus(fdMatch.status)
    const finished = isFinishedStatus(fdMatch.status)

    if (!live && !finished) continue

    const home = fdMatch.score.fullTime.home
    const away = fdMatch.score.fullTime.away

    // Durante el partido, fullTime puede ser null — usar halfTime si es todo lo que hay
    const scoreHome = home ?? fdMatch.score.halfTime.home
    const scoreAway = away ?? fdMatch.score.halfTime.away

    if (scoreHome === null || scoreAway === null) continue

    const newStatus = finished ? 'finished' : 'live'

    // Actualizar resultado actual del partido
    await supabase.from('matches').update({
      status: newStatus,
      team1_score: scoreHome,
      team2_score: scoreAway,
    }).eq('id', match.id)

    // Recalcular puntos para todos los que predijeron este partido
    // Esto actualiza el ranking en tiempo real con cada gol
    const { data: scoreCount } = await supabase
      .rpc('calculate_and_save_scores', { p_match_id: match.id })

    results.push({
      match_id: match.id,
      teams: `${t1} vs ${t2}`,
      status: newStatus,
      score: `${scoreHome}–${scoreAway}`,
      predictions_updated: scoreCount,
    })
  }

  return NextResponse.json({ ok: true, timestamp: now.toISOString(), updated: results })
}
