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

  // Buscar partidos de ayer, hoy y mañana que no están terminados.
  // Ventana amplia para cubrir partidos que empiezan tarde en UTC y
  // siguen en vivo después de medianoche (drift de zona horaria).
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dateFrom = yesterday.toISOString().split('T')[0]
  const dateTo = tomorrow.toISOString().split('T')[0]

  const { data: ourMatches, error } = await supabase
    .from('matches')
    .select(`
      id, external_id, status, match_date, phase,
      team1_score, team2_score,
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

    // Encontrar el partido equivalente en football-data.org por TLA de equipos.
    // Algunos partidos en la DB tienen home/away invertidos respecto a la API,
    // por eso probamos ambas orientaciones y ajustamos los scores según corresponda.
    let fdMatch = fdMatches.find(fd =>
      fd.homeTeam.tla === ourCodeToTLA(t1) &&
      fd.awayTeam.tla === ourCodeToTLA(t2)
    )
    let reversed = false

    if (!fdMatch) {
      fdMatch = fdMatches.find(fd =>
        fd.homeTeam.tla === ourCodeToTLA(t2) &&
        fd.awayTeam.tla === ourCodeToTLA(t1)
      )
      if (fdMatch) reversed = true
    }

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

    // Mapear home/away de la API a team1/team2 de la DB según orientación
    const scoreTeam1 = reversed ? scoreAway : scoreHome
    const scoreTeam2 = reversed ? scoreHome : scoreAway

    // Si el admin actualizó manualmente por adelantado, no revertir con un score menor de la API
    const dbScore1 = (match as any).team1_score ?? 0
    const dbScore2 = (match as any).team2_score ?? 0
    if (scoreTeam1 < dbScore1 || scoreTeam2 < dbScore2) continue

    const newStatus = finished ? 'finished' : 'live'

    // Actualizar resultado actual del partido
    await supabase.from('matches').update({
      status: newStatus,
      team1_score: scoreTeam1,
      team2_score: scoreTeam2,
    }).eq('id', match.id)

    // Recalcular puntos para todos los que predijeron este partido
    // Esto actualiza el ranking en tiempo real con cada gol
    const { data: scoreCount } = await supabase
      .rpc('calculate_and_save_scores', { p_match_id: match.id })

    results.push({
      match_id: match.id,
      teams: `${t1} vs ${t2}`,
      reversed,
      status: newStatus,
      score: `${scoreTeam1}–${scoreTeam2}`,
      predictions_updated: scoreCount,
    })
  }

  return NextResponse.json({ ok: true, timestamp: now.toISOString(), updated: results })
}
