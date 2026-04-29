const FD_BASE = 'https://api.football-data.org/v4'

export type FDStatus =
  | 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED'
  | 'FINISHED' | 'SUSPENDED' | 'POSTPONED' | 'CANCELLED'

export type FDMatch = {
  id: number
  utcDate: string
  status: FDStatus
  homeTeam: { id: number; name: string; shortName: string; tla: string }
  awayTeam: { id: number; name: string; shortName: string; tla: string }
  score: {
    winner: string | null
    fullTime: { home: number | null; away: number | null }
    halfTime: { home: number | null; away: number | null }
  }
}

async function fetchFD(path: string): Promise<any> {
  const res = await fetch(`${FD_BASE}${path}`, {
    headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`football-data.org ${res.status}: ${path}`)
  return res.json()
}

export async function getWCMatchesByDate(dateFrom: string, dateTo: string): Promise<FDMatch[]> {
  const data = await fetchFD(`/competitions/WC/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`)
  return data.matches ?? []
}

export async function getWCLiveMatches(): Promise<FDMatch[]> {
  const data = await fetchFD('/competitions/WC/matches?status=IN_PLAY')
  return data.matches ?? []
}

// Algunos códigos difieren entre FIFA y football-data.org
const FD_TLA_OVERRIDES: Record<string, string> = {
  // nuestro código → TLA de football-data.org
  KSA: 'KSA',
  CUW: 'CUW',
  CPV: 'CPV',
  COD: 'COD',
  BIH: 'BIH',
  ALG: 'ALG',
}

export function ourCodeToTLA(code: string): string {
  return FD_TLA_OVERRIDES[code] ?? code
}

export function isLiveStatus(status: FDStatus): boolean {
  return ['IN_PLAY', 'PAUSED'].includes(status)
}

export function isFinishedStatus(status: FDStatus): boolean {
  return status === 'FINISHED'
}
