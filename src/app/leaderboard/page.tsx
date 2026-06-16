import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Header from '@/components/Header'
import Avatar from '@/components/Avatar'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const flagEmojis: Record<string, string> = {
  MEX: '🇲🇽', CAN: '🇨🇦', USA: '🇺🇸', ARG: '🇦🇷', BRA: '🇧🇷', URY: '🇺🇾',
  COL: '🇨🇴', ECU: '🇪🇨', PAR: '🇵🇾', ESP: '🇪🇸', POR: '🇵🇹', FRA: '🇫🇷',
  GER: '🇩🇪', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', NED: '🇳🇱', BEL: '🇧🇪', CRO: '🇭🇷', SUI: '🇨🇭',
  AUT: '🇦🇹', CZE: '🇨🇿', SWE: '🇸🇪', NOR: '🇳🇴', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', JPN: '🇯🇵',
  KOR: '🇰🇷', AUS: '🇦🇺', KSA: '🇸🇦', IRN: '🇮🇷', QAT: '🇶🇦', TUR: '🇹🇷',
  IRQ: '🇮🇶', UZB: '🇺🇿', JOR: '🇯🇴', SEN: '🇸🇳', MAR: '🇲🇦', GHA: '🇬🇭',
  CIV: '🇨🇮', EGY: '🇪🇬', TUN: '🇹🇳', RSA: '🇿🇦', HAI: '🇭🇹', CPV: '🇨🇻',
  COD: '🇨🇩', BIH: '🇧🇦', ALG: '🇩🇿', CUW: '🇨🇼', PAN: '🇵🇦', CMR: '🇨🇲',
}

function flag(code?: string | null) {
  return code ? (flagEmojis[code] ?? '🏳️') : '🏳️'
}

function PositionChange({ current, previous }: { current: number; previous: number | undefined }) {
  if (previous === undefined || previous === 0) {
    return <span className="text-slate-600 text-sm">—</span>
  }
  const diff = previous - current // positive = moved up
  if (diff === 0) {
    return (
      <div className="flex flex-col items-center leading-tight">
        <span className="text-slate-500 text-sm">—</span>
        <span className="text-slate-600 text-xs">{previous}°</span>
      </div>
    )
  }
  if (diff > 0) {
    return (
      <div className="flex flex-col items-center leading-tight">
        <span className="text-emerald-400 text-sm font-bold">↑</span>
        <span className="text-slate-500 text-xs">{previous}°</span>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center leading-tight">
      <span className="text-red-400 text-sm font-bold">↓</span>
      <span className="text-slate-500 text-xs">{previous}°</span>
    </div>
  )
}

type Props = {
  searchParams: Promise<{ tab?: string }>
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const { tab } = await searchParams
  const isLiveTab = tab === 'live'

  const supabase = await createClient()
  const admin = createAdminClient()

  // General leaderboard + live match — always needed
  const [{ data: generalData }, { data: liveMatches }] = await Promise.all([
    supabase.from('v_leaderboard_general').select('*').limit(100),
    admin
      .from('matches')
      .select(`
        id, team1_score, team2_score,
        team1:teams!matches_team1_id_fkey(name, code),
        team2:teams!matches_team2_id_fkey(name, code)
      `)
      .eq('status', 'live'),
  ])

  const leaderboard = generalData ?? []
  const liveMatch = liveMatches?.[0] ?? null
  const hasLive = !!liveMatch

  // --- General tab: position change vs last finished match ---
  let prevPositionMap: Record<string, number> = {}
  {
    const { data: lastFinished } = await admin
      .from('matches')
      .select('id')
      .eq('status', 'finished')
      .order('match_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastFinished) {
      const { data: lastScores } = await admin
        .from('scores')
        .select('user_id, points')
        .eq('match_id', lastFinished.id)

      const lastPtsMap = Object.fromEntries(
        (lastScores ?? []).map(s => [s.user_id, s.points as number])
      )
      const prevRanking = leaderboard
        .map(p => ({
          id: p.id as string,
          pts: (p.total_points as number) - (lastPtsMap[p.id] ?? 0),
          plenos: p.plenos as number,
        }))
        .sort((a, b) => b.pts - a.pts || b.plenos - a.plenos)
      prevRanking.forEach((p, i) => { prevPositionMap[p.id] = i + 1 })
    }
  }

  // --- Live tab: predictions + scores for live match ---
  type LivePlayer = {
    user_id: string
    display_name: string | null
    username: string | null
    avatar_url: string | null
    total_points: number
    pred_team1: number
    pred_team2: number
    match_points: number | null
    is_pleno: boolean
    prev_position: number | undefined
  }
  let liveRanking: LivePlayer[] = []

  if (isLiveTab && liveMatch) {
    const [{ data: preds }, { data: matchScores }] = await Promise.all([
      admin
        .from('predictions')
        .select(`
          user_id, team1_score, team2_score,
          profile:profiles!predictions_user_id_fkey(display_name, username, avatar_url)
        `)
        .eq('match_id', liveMatch.id),
      admin
        .from('scores')
        .select('user_id, points, is_pleno')
        .eq('match_id', liveMatch.id),
    ])

    const totalPtsMap = Object.fromEntries(leaderboard.map(p => [p.id as string, p.total_points as number]))
    const matchPtsMap = Object.fromEntries((matchScores ?? []).map(s => [s.user_id, s.points as number]))
    const matchPlenoMap = Object.fromEntries((matchScores ?? []).map(s => [s.user_id, s.is_pleno as boolean]))

    liveRanking = ((preds ?? []) as any[])
      .map(p => ({
        user_id: p.user_id,
        display_name: p.profile?.display_name ?? null,
        username: p.profile?.username ?? null,
        avatar_url: p.profile?.avatar_url ?? null,
        total_points: totalPtsMap[p.user_id] ?? 0,
        pred_team1: p.team1_score as number,
        pred_team2: p.team2_score as number,
        match_points: matchPtsMap[p.user_id] ?? null,
        is_pleno: matchPlenoMap[p.user_id] ?? false,
        prev_position: undefined as number | undefined,
      }))
      .sort((a, b) => b.total_points - a.total_points)

    // Compute previous positions among predictors (before live match)
    const livePrevRanking = [...liveRanking]
      .map(p => ({ user_id: p.user_id, pts: p.total_points - (matchPtsMap[p.user_id] ?? 0) }))
      .sort((a, b) => b.pts - a.pts)
    const livePrevPosMap = Object.fromEntries(livePrevRanking.map((p, i) => [p.user_id, i + 1]))

    liveRanking = liveRanking.map(p => ({ ...p, prev_position: livePrevPosMap[p.user_id] }))
  }

  const team1 = liveMatch ? (liveMatch.team1 as any) : null
  const team2 = liveMatch ? (liveMatch.team2 as any) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-block mb-4 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <span className="text-blue-400 text-sm font-medium">🏆 Clasificación</span>
          </div>
          <h1 className="text-4xl font-bold text-white">Ranking</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 justify-center">
          <Link
            href="/leaderboard"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !isLiveTab
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            General
          </Link>
          <Link
            href="/leaderboard?tab=live"
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isLiveTab
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {hasLive && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
            Partido en Juego
          </Link>
        </div>

        {isLiveTab ? (
          hasLive ? (
            <>
              {/* Live score card */}
              <div className="bg-gradient-to-br from-red-500/10 to-white/5 backdrop-blur-sm border border-red-500/20 rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span className="text-red-400 text-xs font-semibold tracking-widest uppercase">En Vivo</span>
                </div>
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center flex-1">
                    <div className="text-4xl mb-1">{flag(team1?.code)}</div>
                    <div className="text-white font-semibold text-sm">{team1?.name ?? 'TBD'}</div>
                  </div>
                  <div className="text-center shrink-0">
                    <div className="text-5xl font-bold text-white tabular-nums">
                      {liveMatch.team1_score ?? 0} – {liveMatch.team2_score ?? 0}
                    </div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-4xl mb-1">{flag(team2?.code)}</div>
                    <div className="text-white font-semibold text-sm">{team2?.name ?? 'TBD'}</div>
                  </div>
                </div>
              </div>

              {/* Live ranking */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-4 border-b border-white/10 text-slate-400 text-xs font-medium">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-3">Jugador</div>
                  <div className="col-span-2 text-center">Pts</div>
                  <div className="col-span-2 text-center">Pronóstico</div>
                  <div className="col-span-2 text-center">+Pts</div>
                  <div className="col-span-2 text-center">↕</div>
                </div>

                {liveRanking.length > 0 ? (
                  liveRanking.map((player, index) => (
                    <div
                      key={player.user_id}
                      className={`grid grid-cols-12 gap-2 p-3 items-center transition-colors
                        ${player.is_pleno ? 'bg-gradient-to-r from-yellow-400/10 to-transparent border-l-2 border-yellow-400/60 hover:from-yellow-400/15' : 'hover:bg-white/5'}
                        ${!player.is_pleno && index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' : ''}
                        ${!player.is_pleno && index === 1 ? 'bg-gradient-to-r from-slate-400/10 to-transparent' : ''}
                        ${!player.is_pleno && index === 2 ? 'bg-gradient-to-r from-orange-500/10 to-transparent' : ''}
                        ${index !== liveRanking.length - 1 ? 'border-b border-white/5' : ''}`}
                    >
                      <div className="col-span-1 text-center">
                        {index === 0 && <span className="text-xl">🥇</span>}
                        {index === 1 && <span className="text-xl">🥈</span>}
                        {index === 2 && <span className="text-xl">🥉</span>}
                        {index > 2 && <span className="text-slate-500 font-medium text-sm">{index + 1}</span>}
                      </div>
                      <div className="col-span-3 flex items-center gap-2 min-w-0">
                        <Avatar url={player.avatar_url} name={player.display_name || player.username} size={28} />
                        <div className="flex items-center gap-1 min-w-0">
                          <span className={`font-medium truncate text-xs ${player.is_pleno ? 'text-yellow-300' : 'text-white'}`}>
                            {player.display_name || player.username || 'Anónimo'}
                          </span>
                          {player.is_pleno && <span className="text-sm shrink-0">⭐</span>}
                        </div>
                      </div>
                      <div className="col-span-2 text-center text-white font-bold">{player.total_points}</div>
                      <div className="col-span-2 text-center font-mono text-xs text-slate-300">
                        {player.pred_team1} – {player.pred_team2}
                      </div>
                      <div className="col-span-2 text-center">
                        {player.match_points !== null ? (
                          player.is_pleno ? (
                            <span className="font-bold text-sm text-yellow-300">⭐ +{player.match_points}</span>
                          ) : (
                            <span className={`font-bold text-sm ${player.match_points > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                              +{player.match_points}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-600 text-sm">—</span>
                        )}
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <PositionChange current={index + 1} previous={player.prev_position} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-slate-500 text-sm">
                    Nadie predijo este partido.
                  </div>
                )}
              </div>

              <p className="mt-6 text-center text-slate-500 text-sm">
                Pts incluye el partido en juego · ↕ vs antes del partido
              </p>
            </>
          ) : (
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">⚽</div>
              <p className="text-lg text-white font-semibold mb-2">No hay partido en juego</p>
              <p className="text-sm text-slate-400">Este tab se activa cuando hay un partido en vivo.</p>
            </div>
          )
        ) : (
          <>
            {/* General leaderboard */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 gap-2 p-4 border-b border-white/10 text-slate-400 text-xs font-medium">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5">Jugador</div>
                <div className="col-span-2 text-center">Pts</div>
                <div className="col-span-2 text-center">Plenos</div>
                <div className="col-span-2 text-center">↕</div>
              </div>

              {leaderboard.length > 0 ? (
                leaderboard.map((player, index) => (
                  <div
                    key={`${player.id}-${index}`}
                    className={`grid grid-cols-12 gap-2 p-4 items-center hover:bg-white/5 transition-colors
                      ${index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' : ''}
                      ${index === 1 ? 'bg-gradient-to-r from-slate-400/10 to-transparent' : ''}
                      ${index === 2 ? 'bg-gradient-to-r from-orange-500/10 to-transparent' : ''}
                      ${index !== leaderboard.length - 1 ? 'border-b border-white/5' : ''}`}
                  >
                    <div className="col-span-1 text-center">
                      {index === 0 && <span className="text-2xl">🥇</span>}
                      {index === 1 && <span className="text-2xl">🥈</span>}
                      {index === 2 && <span className="text-2xl">🥉</span>}
                      {index > 2 && <span className="text-slate-500 font-medium">{index + 1}</span>}
                    </div>
                    <div className="col-span-5 flex items-center gap-3">
                      <Link href={`/profile/${player.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0">
                        <Avatar url={player.avatar_url} name={player.display_name || player.username} size={36} />
                        <span className="text-white font-medium truncate">
                          {player.display_name || player.username || 'Anónimo'}
                        </span>
                      </Link>
                    </div>
                    <div className="col-span-2 text-center text-white font-bold text-lg">{player.total_points}</div>
                    <div className="col-span-2 text-center text-slate-400">{player.plenos}</div>
                    <div className="col-span-2 flex justify-center">
                      <PositionChange current={index + 1} previous={prevPositionMap[player.id]} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="text-5xl mb-4" aria-hidden="true">🏆</div>
                  <p className="text-lg text-white font-semibold mb-2">
                    El ranking empieza el 12 de junio
                  </p>
                  <p className="text-sm text-slate-400 mb-6">
                    Los puntos se calculan cuando terminan los partidos.
                  </p>
                  <Link
                    href="/play"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-6 py-3 rounded-full hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all"
                  >
                    Hacer predicciones
                  </Link>
                </div>
              )}
            </div>

            <p className="mt-6 text-center text-slate-500 text-sm">
              Pts = Puntos totales · Plenos = Resultados exactos · ↕ vs último partido
            </p>
          </>
        )}
      </main>
    </div>
  )
}
