'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'

type Match = {
  id: number
  team1: { name: string; code: string; flag_url: string } | null
  team2: { name: string; code: string; flag_url: string } | null
  phase: string
  match_date: string
  team1_score: number | null
  team2_score: number | null
  status: string
}

type Prediction = {
  match_id: number
  team1_score: number
  team2_score: number
}

type Score = { match_id: number; points: number; is_pleno: boolean }
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'


// Flag emoji mapping
const flagEmojis: Record<string, string> = {
  MEX: '🇲🇽', CAN: '🇨🇦', USA: '🇺🇸', ARG: '🇦🇷', BRA: '🇧🇷', URY: '🇺🇾',
  COL: '🇨🇴', ECU: '🇪🇨', PAR: '🇵🇾', ESP: '🇪🇸', POR: '🇵🇹', FRA: '🇫🇷',
  GER: '🇩🇪', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', NED: '🇳🇱', BEL: '🇧🇪', CRO: '🇭🇷', SUI: '🇨🇭',
  AUT: '🇦🇹', CZE: '🇨🇿', SWE: '🇸🇪', NOR: '🇳🇴', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', JPN: '🇯🇵',
  KOR: '🇰🇷', AUS: '🇦🇺', KSA: '🇸🇦', IRN: '🇮🇷', QAT: '🇶🇦', TUR: '🇹🇷',
  IRQ: '🇮🇶', UZB: '🇺🇿', JOR: '🇯🇴', SEN: '🇸🇳', MAR: '🇲🇦', GHA: '🇬🇭',
  CIV: '🇨🇮', EGY: '🇪🇬', TUN: '🇹🇳', RSA: '🇿🇦', CMR: '🇨🇲', HAI: '🇭🇹',
  CPV: '🇨🇻', COD: '🇨🇩', BIH: '🇧🇦', ALG: '🇩🇿', CUW: '🇨🇼', PAN: '🇵🇦',
}

export default function PlayPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({})
  const [localPredictions, setLocalPredictions] = useState<Record<number, { team1: string; team2: string }>>({})
  const [scores, setScores] = useState<Record<number, Score>>({})
  const [saveStatus, setSaveStatus] = useState<Record<number, SaveStatus>>({})
  const [loading, setLoading] = useState(true)
  const [activePhase, setActivePhase] = useState<string>('')
  const [showPast, setShowPast] = useState(false)
  const [showHistory, setShowHistory] = useState<Record<number, boolean>>({})
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()
  const debounceTimers = useRef<Record<number, NodeJS.Timeout>>({})

  useEffect(() => {
    loadData()
  }, [])

  // Re-evaluate canPredict every 30s so inputs auto-lock when deadline passes
  useEffect(() => {
    const interval = setInterval(() => {
      setMatches(prev => [...prev])
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
    await Promise.all([loadMatches(), loadPredictions(), loadScores()])
    setLoading(false)
  }

  async function loadMatches() {
    const { data } = await supabase
      .from('matches')
      .select(`
        id, phase, match_date, team1_score, team2_score, status,
        team1:teams!matches_team1_id_fkey(name, code, flag_url),
        team2:teams!matches_team2_id_fkey(name, code, flag_url)
      `)
      .neq('week_number', 99)
      .order('match_date', { ascending: true })

    if (data) {
      setMatches(data as unknown as Match[])
      if (data.length > 0 && !activePhase) {
        // Jump to the first phase that still has non-finished matches
        const firstPending = (data as unknown as Match[]).find(m => m.status !== 'finished')
        setActivePhase(firstPending?.phase ?? data[0].phase)
      }
    }
  }

  async function loadPredictions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('predictions')
      .select('match_id, team1_score, team2_score')
      .eq('user_id', user.id)

    if (data) {
      const predMap: Record<number, Prediction> = {}
      const localMap: Record<number, { team1: string; team2: string }> = {}
      data.forEach(p => {
        predMap[p.match_id] = p
        localMap[p.match_id] = { 
          team1: p.team1_score.toString(), 
          team2: p.team2_score.toString() 
        }
      })
      setPredictions(predMap)
      setLocalPredictions(localMap)
    }
  }

  async function loadScores() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('scores')
      .select('match_id, points, is_pleno')
      .eq('user_id', user.id)
    if (data) {
      const map: Record<number, Score> = {}
      data.forEach(s => { map[s.match_id] = s })
      setScores(map)
    }
  }

  const savePrediction = useCallback(async (matchId: number, team1Score: string, team2Score: string) => {
    const match = matches.find(m => m.id === matchId)
    if (!match || !canPredict(match.match_date)) return
    if (team1Score === '' || team2Score === '') return

    setSaveStatus(prev => ({ ...prev, [matchId]: 'saving' }))
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaveStatus(prev => ({ ...prev, [matchId]: 'error' }))
      return
    }

    const { error } = await supabase
      .from('predictions')
      .upsert({
        user_id: user.id,
        match_id: matchId,
        team1_score: parseInt(team1Score),
        team2_score: parseInt(team2Score),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,match_id' })

    if (error) {
      setSaveStatus(prev => ({ ...prev, [matchId]: 'error' }))
    } else {
      setSaveStatus(prev => ({ ...prev, [matchId]: 'saved' }))
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [matchId]: 'idle' }))
      }, 2000)
    }
  }, [matches, supabase])

  function updateLocalPrediction(matchId: number, team: 'team1' | 'team2', value: string) {
    if (value !== '' && !/^\d$/.test(value)) return
    
    const newLocal = {
      ...localPredictions[matchId],
      [team]: value
    }
    
    setLocalPredictions(prev => ({
      ...prev,
      [matchId]: newLocal
    }))

    if (debounceTimers.current[matchId]) {
      clearTimeout(debounceTimers.current[matchId])
    }

    const team1Val = team === 'team1' ? value : newLocal.team1
    const team2Val = team === 'team2' ? value : newLocal.team2
    
    if (team1Val !== '' && team2Val !== '') {
      debounceTimers.current[matchId] = setTimeout(() => {
        savePrediction(matchId, team1Val, team2Val)
      }, 500)
    }
  }

  function canPredict(matchDate: string) {
    const matchTime = new Date(matchDate).getTime()
    const now = Date.now()
    return matchTime - now > 5 * 60 * 1000
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CL', { 
      weekday: 'short', 
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function getPhaseLabel(phase: string) {
    const labels: Record<string, string> = {
      groups: 'Grupos',
      round32: '32avos',
      round16: '16avos',
      quarters: 'Cuartos',
      semis: 'Semis',
      third: '3°',
      final: 'Final'
    }
    return labels[phase] || phase
  }

  function getMaxPoints(phase: string) {
    const points: Record<string, number> = {
      groups: 12, round32: 13, round16: 13,
      quarters: 15, semis: 17, third: 17, final: 17
    }
    return points[phase] || 12
  }

  function getFlag(code: string | undefined) {
    if (!code) return '🏳️'
    return flagEmojis[code] || '🏳️'
  }

  function getTeamPreviousMatches(teamCode: string | undefined, excludeMatchId: number) {
    if (!teamCode) return []
    return matches
      .filter(m =>
        m.status === 'finished' &&
        m.id !== excludeMatchId &&
        (m.team1?.code === teamCode || m.team2?.code === teamCode)
      )
      .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())
  }

  function getTeamMatchResult(m: Match, teamCode: string) {
    if (m.team1_score === null || m.team2_score === null) return null
    const isTeam1 = m.team1?.code === teamCode
    const teamGoals = isTeam1 ? m.team1_score : m.team2_score
    const oppGoals = isTeam1 ? m.team2_score : m.team1_score
    const opp = isTeam1 ? m.team2 : m.team1
    return {
      opponentName: opp?.name ?? '?',
      opponentCode: opp?.code ?? '',
      teamGoals,
      oppGoals,
      result: teamGoals > oppGoals ? 'G' : teamGoals === oppGoals ? 'E' : 'P' as 'G' | 'E' | 'P',
    }
  }

  const matchesByPhase = matches.reduce((acc, match) => {
    if (!acc[match.phase]) acc[match.phase] = []
    acc[match.phase].push(match)
    return acc
  }, {} as Record<string, Match[]>)

  const phases = Object.keys(matchesByPhase)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Cargando partidos...</div>
      </div>
    )
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

      <main className="relative z-10 container mx-auto px-4 py-6 max-w-6xl">
        {/* Title & auto-save notice */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Predicciones</h1>
          <span className="text-emerald-400/70 text-sm">💾 Guardado automático</span>
        </div>

        {/* Phase tabs */}
        {phases.length > 1 && (
          <div className="relative mb-6" role="tablist" aria-label="Fases del torneo">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {phases.map(phase => (
                <button
                  key={phase}
                  role="tab"
                  aria-selected={activePhase === phase}
                  onClick={() => { setActivePhase(phase); setShowPast(false) }}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                    activePhase === phase
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {getPhaseLabel(phase)}
                </button>
              ))}
            </div>
            <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none" aria-hidden="true" />
          </div>
        )}

        {matches.length === 0 ? (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center max-w-md mx-auto">
            <div className="text-6xl mb-4" aria-hidden="true">⚽</div>
            <h2 className="text-white text-xl font-semibold mb-2">El torneo está por comenzar</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Los partidos de la fase de grupos del Mundial 2026 arrancan el <span className="text-white font-medium">12 de junio de 2026</span>.
            </p>
            <p className="text-slate-500 text-sm">Vuelve aquí cuando empiece para hacer tus predicciones.</p>
          </div>
        ) : (() => {
          const phaseMatches = matchesByPhase[activePhase] ?? []
          const upcoming = phaseMatches.filter(m => m.status !== 'finished')
          const past = phaseMatches.filter(m => m.status === 'finished')
          // If no upcoming in this phase, show past automatically
          const effectiveShowPast = showPast || upcoming.length === 0

          function renderCard(match: Match) {
            const editable = canPredict(match.match_date)
            const local = localPredictions[match.id] || { team1: '', team2: '' }
            const hasPrediction = local.team1 !== '' && local.team2 !== ''
            const status = saveStatus[match.id]
            const isLive = match.status === 'live'
            const isFinished = match.status === 'finished'
            const matchScore = scores[match.id]

            return (
              <div
                key={match.id}
                className={`relative backdrop-blur-sm rounded-2xl p-5 transition-all border ${
                  isLive
                    ? 'bg-gradient-to-br from-emerald-950/60 to-slate-900/80 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : isFinished
                    ? 'bg-gradient-to-br from-white/5 to-white/5 border-white/5 opacity-70'
                    : hasPrediction
                    ? 'bg-gradient-to-br from-white/10 to-white/5 border-emerald-500/30 hover:border-emerald-500/50'
                    : 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                {isLive && <div className="absolute inset-0 rounded-2xl ring-1 ring-emerald-500/30 animate-pulse pointer-events-none" />}
                <Link href={`/play/${match.id}`} className="absolute top-0 right-0 text-xs text-slate-600 hover:text-slate-400 transition-colors p-3" aria-label="Ver detalle">→</Link>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-slate-500">{formatDate(match.match_date)}</span>
                  <div className="flex items-center gap-2">
                    {isLive && (
                      <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-full font-medium">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />EN VIVO
                      </span>
                    )}
                    {!editable && !isLive && !isFinished && <span className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-full">Cerrado</span>}
                    {editable && status === 'saving' && <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full animate-pulse" role="status">Guardando…</span>}
                    {editable && status === 'saved' && <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full" role="status">✓ Guardado</span>}
                    {editable && status === 'error' && <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-full" role="alert">Error</span>}
                    {editable && hasPrediction && (!status || status === 'idle') && <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">✓ Listo</span>}
                    {editable && !hasPrediction && (!status || status === 'idle') && <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full">Sin predicción</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl" aria-hidden="true">{getFlag(match.team1?.code)}</span>
                    <span className="text-white font-medium truncate">{match.team1?.name || 'TBD'}</span>
                  </div>
                  <input
                    type="text" inputMode="numeric" maxLength={1}
                    value={local.team1}
                    onChange={e => updateLocalPrediction(match.id, 'team1', e.target.value)}
                    disabled={!editable}
                    aria-label={`Goles ${match.team1?.name || 'Equipo 1'}`}
                    className="w-14 h-14 text-center text-2xl font-bold bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
                    placeholder="–"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl" aria-hidden="true">{getFlag(match.team2?.code)}</span>
                    <span className="text-white font-medium truncate">{match.team2?.name || 'TBD'}</span>
                  </div>
                  <input
                    type="text" inputMode="numeric" maxLength={1}
                    value={local.team2}
                    onChange={e => updateLocalPrediction(match.id, 'team2', e.target.value)}
                    disabled={!editable}
                    aria-label={`Goles ${match.team2?.name || 'Equipo 2'}`}
                    className="w-14 h-14 text-center text-2xl font-bold bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
                    placeholder="–"
                  />
                </div>

                {(isLive || isFinished) && match.team1_score !== null && match.team2_score !== null && (
                  <div className={`flex items-center justify-between rounded-xl px-3 py-2 mb-3 ${
                    isLive ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5 border border-white/10'
                  }`}>
                    <span className="text-xs text-slate-400">{isLive ? 'Marcador' : 'Resultado'}</span>
                    <span className={`text-sm font-bold tracking-widest ${isLive ? 'text-emerald-400' : 'text-white'}`}>
                      {match.team1_score} — {match.team2_score}
                    </span>
                    {matchScore ? (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        matchScore.is_pleno ? 'text-yellow-300 bg-yellow-400/20'
                        : matchScore.points > 0 ? 'text-emerald-400 bg-emerald-400/10'
                        : 'text-slate-500 bg-white/5'
                      }`}>
                        {matchScore.is_pleno ? '⭐ ' : ''}{matchScore.points} pts
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">— pts</span>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center text-xs pt-3 border-t border-white/5">
                  <span className="text-slate-500">Máx <span className="text-emerald-400 font-semibold">{getMaxPoints(match.phase)} pts</span></span>
                  {isFinished && <span className="text-xs text-slate-500">Finalizado</span>}
                </div>

                {/* Team history section */}
                {(() => {
                  const h1 = getTeamPreviousMatches(match.team1?.code, match.id)
                  const h2 = getTeamPreviousMatches(match.team2?.code, match.id)
                  if (h1.length === 0 && h2.length === 0) return null
                  const isOpen = showHistory[match.id]
                  return (
                    <div className="mt-2 border-t border-white/5 pt-2">
                      <button
                        onClick={() => setShowHistory(prev => ({ ...prev, [match.id]: !prev[match.id] }))}
                        className="w-full text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1.5 py-1 transition-colors"
                      >
                        <span>Historial del torneo</span>
                        <span className={`transition-transform duration-200 inline-block ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                      </button>
                      {isOpen && (
                        <div className="mt-2 space-y-3">
                          {[
                            { code: match.team1?.code, history: h1 },
                            { code: match.team2?.code, history: h2 },
                          ].map(team => (
                            <div key={team.code}>
                              <p className="text-[11px] text-slate-500 font-medium mb-1 flex items-center gap-1">
                                <span>{getFlag(team.code)}</span>
                                <span>{team.code}</span>
                              </p>
                              {team.history.length === 0 ? (
                                <p className="text-xs text-slate-600 italic">Sin partidos previos</p>
                              ) : team.history.map((hm, i) => {
                                const r = getTeamMatchResult(hm, team.code ?? '')
                                if (!r) return null
                                return (
                                  <div key={i} className="flex items-center gap-1 text-xs mb-0.5">
                                    <span className="text-base leading-none">{getFlag(team.code)}</span>
                                    <span className="text-slate-400 font-medium w-7">{team.code}</span>
                                    <span className="font-mono text-slate-200 font-semibold">{r.teamGoals}</span>
                                    <span className="text-slate-500">–</span>
                                    <span className="font-mono text-slate-200 font-semibold">{r.oppGoals}</span>
                                    <span className="text-slate-400 font-medium w-7 text-right">{r.opponentCode}</span>
                                    <span className="text-base leading-none">{getFlag(r.opponentCode)}</span>
                                  </div>
                                )
                              })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )
          }

          return (
            <>
              {/* Upcoming + live matches */}
              {upcoming.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcoming.map(renderCard)}
                </div>
              )}

              {/* Past matches — collapsible */}
              {past.length > 0 && (
                <div className={upcoming.length > 0 ? 'mt-8' : ''}>
                  {upcoming.length > 0 && (
                    <button
                      onClick={() => setShowPast(p => !p)}
                      className="w-full flex items-center justify-between px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 font-semibold transition-colors mb-4"
                    >
                      <span className="flex items-center gap-3">
                        <span>Jugados</span>
                        <span className="text-sm text-slate-500 bg-white/5 px-2 py-0.5 rounded-full font-normal">{past.length}</span>
                      </span>
                      <span className={`text-slate-500 text-sm transition-transform duration-200 ${effectiveShowPast ? 'rotate-90' : ''}`}>▶</span>
                    </button>
                  )}
                  {effectiveShowPast && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {past.map(renderCard)}
                    </div>
                  )}
                </div>
              )}
            </>
          )
        })()}
      </main>

    </div>
  )
}
