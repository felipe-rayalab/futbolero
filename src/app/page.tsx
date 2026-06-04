import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Header from '@/components/Header'

export const dynamic = 'force-dynamic'

const phaseLabel: Record<string, string> = {
  groups: 'Grupos', round32: '32avos', round16: '16avos',
  quarters: 'Cuartos', semis: 'Semis', third: '3er lugar', final: 'Final',
}

type Match = {
  id: number
  phase: string
  match_date: string
  team1_score: number | null
  team2_score: number | null
  status: string
  team1: { name: string; code: string } | null
  team2: { name: string; code: string } | null
}

type Score = { points: number; is_pleno: boolean }
type Prediction = { team1_score: number; team2_score: number }

const flagEmojis: Record<string, string> = {
  MEX: '🇲🇽', CAN: '🇨🇦', USA: '🇺🇸', ARG: '🇦🇷', BRA: '🇧🇷', CHI: '🇨🇱',
  COL: '🇨🇴', ECU: '🇪🇨', PER: '🇵🇪', URU: '🇺🇾', VEN: '🇻🇪', PAR: '🇵🇾',
  BOL: '🇧🇴', ESP: '🇪🇸', POR: '🇵🇹', FRA: '🇫🇷', GER: '🇩🇪', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  ITA: '🇮🇹', NED: '🇳🇱', BEL: '🇧🇪', CRO: '🇭🇷', SRB: '🇷🇸', SUI: '🇨🇭',
  DEN: '🇩🇰', AUT: '🇦🇹', POL: '🇵🇱', UKR: '🇺🇦', WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', CZE: '🇨🇿',
  SWE: '🇸🇪', NOR: '🇳🇴', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', IRL: '🇮🇪', JPN: '🇯🇵', KOR: '🇰🇷',
  AUS: '🇦🇺', KSA: '🇸🇦', IRN: '🇮🇷', QAT: '🇶🇦', SEN: '🇸🇳', MAR: '🇲🇦',
  NGA: '🇳🇬', CMR: '🇨🇲', GHA: '🇬🇭', CIV: '🇨🇮', EGY: '🇪🇬', TUN: '🇹🇳',
  ARS: '🏴', ATL: '🏴', FCB: '🏴', BAY: '🏴', CHE: '🏴', MCI: '🏴',
}
function getFlag(code?: string) { return flagEmojis[code ?? ''] || '🏳️' }

function MatchCard({ match, label, score, prediction }: { match: Match; label: string; score?: Score; prediction?: Prediction }) {
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'

  return (
    <div className={`relative rounded-2xl p-5 border transition-all ${
      isLive
        ? 'bg-gradient-to-br from-emerald-950/60 to-slate-900/80 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
        : 'bg-white/5 border-white/10'
    }`}>
      {isLive && (
        <div className="absolute inset-0 rounded-2xl ring-1 ring-emerald-500/20 animate-pulse pointer-events-none" />
      )}

      {/* Top: label + date | phase */}
      <div className="flex justify-between items-start mb-4 gap-2">
        <div>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</span>
          <span className="text-xs text-slate-600 mt-0.5 block">
            {new Date(match.match_date).toLocaleDateString('es-CL', {
              weekday: 'short', day: 'numeric', month: 'short',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>
        <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full shrink-0">
          {phaseLabel[match.phase] ?? match.phase}
        </span>
      </div>

      {/* Team 1 */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl">{getFlag(match.team1?.code)}</span>
          <span className="text-white font-medium truncate">{match.team1?.name ?? 'TBD'}</span>
        </div>
        {prediction && (
          <div className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl shrink-0">
            <span className="text-white font-bold">{prediction.team1_score}</span>
          </div>
        )}
      </div>

      {/* Team 2 */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl">{getFlag(match.team2?.code)}</span>
          <span className="text-white font-medium truncate">{match.team2?.name ?? 'TBD'}</span>
        </div>
        {prediction && (
          <div className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl shrink-0">
            <span className="text-white font-bold">{prediction.team2_score}</span>
          </div>
        )}
      </div>

      {/* Result row */}
      {(isLive || isFinished) && match.team1_score !== null && match.team2_score !== null && (
        <div className={`flex items-center justify-between rounded-xl px-3 py-2 mb-3 ${
          isLive ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5 border border-white/10'
        }`}>
          <span className="text-xs text-slate-400">{isLive ? 'Marcador' : 'Resultado'}</span>
          <span className={`text-sm font-bold tracking-widest ${isLive ? 'text-emerald-400' : 'text-white'}`}>
            {match.team1_score} — {match.team2_score}
          </span>
          {score ? (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              score.is_pleno ? 'text-yellow-300 bg-yellow-400/20'
              : score.points > 0 ? 'text-emerald-400 bg-emerald-400/10'
              : 'text-slate-500 bg-white/5'
            }`}>
              {score.is_pleno ? '⭐ ' : ''}{score.points} pts
            </span>
          ) : (
            <span className="text-xs text-slate-600">— pts</span>
          )}
        </div>
      )}

      {/* Status badge */}
      <div className="flex justify-end pt-2 border-t border-white/5">
        {isLive && (
          <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
            EN VIVO
          </span>
        )}
        {isFinished && (
          <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">Finalizado</span>
        )}
        {!isLive && !isFinished && (
          <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Próximo</span>
        )}
      </div>
    </div>
  )
}

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const matchSelect = `id, phase, match_date, team1_score, team2_score, status,
    team1:teams!matches_team1_id_fkey(name, code),
    team2:teams!matches_team2_id_fkey(name, code)`

  const [{ data: liveMatches }, { data: finishedMatches }, { data: upcomingMatches }] = await Promise.all([
    supabase.from('matches').select(matchSelect).eq('status', 'live').neq('week_number', 99).order('match_date'),
    supabase.from('matches').select(matchSelect).eq('status', 'finished').neq('week_number', 99).order('match_date', { ascending: false }).limit(2),
    supabase.from('matches').select(matchSelect).eq('status', 'scheduled').neq('week_number', 99).order('match_date').limit(1),
  ])

  // Build the 3 cards: [last played / live / next]
  type Card = { match: Match; label: string }
  const cards: Card[] = []

  const live = (liveMatches ?? []) as unknown as Match[]
  const finished = (finishedMatches ?? []) as unknown as Match[]
  const upcoming = (upcomingMatches ?? []) as unknown as Match[]

  if (live.length > 0) {
    if (finished.length > 0) cards.push({ match: finished[0], label: 'Último jugado' })
    cards.push({ match: live[0], label: 'En juego' })
    if (upcoming.length > 0) cards.push({ match: upcoming[0], label: 'Próximo partido' })
  } else {
    if (finished.length >= 2) cards.push({ match: finished[1], label: 'Último jugado' })
    if (finished.length >= 1) cards.push({ match: finished[0], label: 'Último jugado' })
    if (upcoming.length > 0) cards.push({ match: upcoming[0], label: 'Próximo partido' })
  }

  // Fetch user scores and predictions for the matches shown
  const scoreMap: Record<number, Score> = {}
  const predMap: Record<number, Prediction> = {}
  if (user && cards.length > 0) {
    const matchIds = cards.map(c => c.match.id)
    const [{ data: userScores }, { data: userPreds }] = await Promise.all([
      supabase.from('scores').select('match_id, points, is_pleno').eq('user_id', user.id).in('match_id', matchIds),
      supabase.from('predictions').select('match_id, team1_score, team2_score').eq('user_id', user.id).in('match_id', matchIds),
    ])
    userScores?.forEach(s => { scoreMap[s.match_id] = s })
    userPreds?.forEach(p => { predMap[p.match_id] = p })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <Header />

      {/* Hero */}
      <main className="relative z-10 container mx-auto px-4 py-8 sm:py-16">
        <div className="text-center mb-16">
          <div className="inline-block mb-6 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <span className="text-emerald-400 text-sm font-medium">🏆 Mundial USA / Canada / Mexico</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 tracking-tight">
            Mundial
            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 text-transparent bg-clip-text"> 2026</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-md mx-auto">
            Predice resultados, compite con amigos y demuestra que sabes de fútbol
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link
                href="/play"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-8 py-4 rounded-full text-lg hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all"
              >
                <span>Jugar Ahora</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-8 py-4 rounded-full text-lg hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all"
              >
                <span>Comenzar</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            )}
            <Link
              href="/rules"
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-slate-300 font-medium px-8 py-4 rounded-full text-lg hover:bg-white/10 hover:text-white hover:-translate-y-0.5 transition-all"
            >
              <span>📋 ¿Cómo se juega?</span>
            </Link>
          </div>
        </div>

        {/* Match cards */}
        {cards.length > 0 && (
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4 text-center">Partidos</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {cards.map((c, i) => (
                <MatchCard key={i} match={c.match} label={c.label} score={scoreMap[c.match.id]} prediction={predMap[c.match.id]} />
              ))}
            </div>
          </div>
        )}

        {/* Calendar CTA */}
        <div className="max-w-4xl mx-auto mb-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-slate-400 text-sm">
              📅 No te quedes sin tus predicciones — agrega los partidos del Mundial a tu calendario
            </p>
            <a
              href="https://www.fotmob.com/leagues/77/synccalendar/fifa-world-cup"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-sm font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
            >
              Sincronizar calendario →
            </a>
          </div>
        </div>

        {/* Feature Cards - Clickable */}
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mb-16">
          <Link 
            href="/play"
            className="group relative bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
            <div className="relative">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Predice</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Ingresa tus pronósticos antes de cada partido
              </p>
              <div className="mt-4 text-emerald-400 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Hacer predicciones</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
          
          <Link 
            href="/leaderboard"
            className="group relative bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
            <div className="relative">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Compite</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Sube en el ranking global y gana premios increíbles
              </p>
              <div className="mt-4 text-blue-400 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Ver ranking</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
          
          <Link 
            href="/leagues"
            className="group relative bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
            <div className="relative">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Ligas</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Crea grupos privados y compite solo con tus amigos
              </p>
              <div className="mt-4 text-purple-400 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Ver ligas</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats preview */}
        <div className="flex justify-center gap-8 sm:gap-16 mb-16">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white mb-1">4</div>
            <div className="text-slate-500 text-sm">Equipos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white mb-1">3</div>
            <div className="text-slate-500 text-sm">Partidos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white mb-1">∞</div>
            <div className="text-slate-500 text-sm">Diversión</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center">
        <p className="text-slate-600 text-sm">
          El Futbolero © 2026 — Hecho con ❤️ para Nerds por ANAM
        </p>
      </footer>
    </div>
  )
}
