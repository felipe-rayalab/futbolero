'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Avatar from '@/components/Avatar'

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

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type LeagueMate = {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

type ChallengeModal = {
  matchId: number
  matchLabel: string
}

type ChallengeStatus = 'idle' | 'sending' | 'sent' | 'error' | 'duplicate'

// Flag emoji mapping
const flagEmojis: Record<string, string> = {
  MEX: '🇲🇽', CAN: '🇨🇦', USA: '🇺🇸', ARG: '🇦🇷', BRA: '🇧🇷', URU: '🇺🇾',
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
  const [saveStatus, setSaveStatus] = useState<Record<number, SaveStatus>>({})
  const [loading, setLoading] = useState(true)
  const [activePhase, setActivePhase] = useState<string>('')
  const [userId, setUserId] = useState<string | null>(null)
  const [leagueMates, setLeagueMates] = useState<LeagueMate[]>([])
  const [challengeModal, setChallengeModal] = useState<ChallengeModal | null>(null)
  const [challengeStatus, setChallengeStatus] = useState<ChallengeStatus>('idle')
  const supabase = createClient()
  const debounceTimers = useRef<Record<number, NodeJS.Timeout>>({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
    await Promise.all([loadMatches(), loadPredictions(), user ? loadLeagueMates(user.id) : Promise.resolve()])
    setLoading(false)
  }

  async function loadLeagueMates(uid: string) {
    const { data: myLeagues } = await supabase
      .from('league_members')
      .select('league_id')
      .eq('user_id', uid)

    if (!myLeagues?.length) return

    const leagueIds = myLeagues.map(l => l.league_id)
    const { data: members } = await supabase
      .from('league_members')
      .select('user_id, profiles!inner(id, display_name, username, avatar_url)')
      .in('league_id', leagueIds)
      .neq('user_id', uid)

    if (!members) return

    const seen = new Set<string>()
    const mates: LeagueMate[] = []
    for (const m of members) {
      const p = m.profiles as any
      if (!seen.has(m.user_id)) {
        seen.add(m.user_id)
        mates.push({ id: m.user_id, display_name: p.display_name, username: p.username, avatar_url: p.avatar_url })
      }
    }
    setLeagueMates(mates)
  }

  async function loadMatches() {
    const { data } = await supabase
      .from('matches')
      .select(`
        id, phase, match_date, team1_score, team2_score, status,
        team1:teams!matches_team1_id_fkey(name, code, flag_url),
        team2:teams!matches_team2_id_fkey(name, code, flag_url)
      `)
      .neq('phase', 'groups')
      .order('match_date', { ascending: true })

    if (data) {
      setMatches(data as unknown as Match[])
      if (data.length > 0 && !activePhase) {
        setActivePhase(data[0].phase)
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

  async function sendChallenge(challengedId: string) {
    if (!userId || !challengeModal) return
    setChallengeStatus('sending')
    const { error } = await supabase
      .from('challenges')
      .insert({ match_id: challengeModal.matchId, challenger_id: userId, challenged_id: challengedId })
    if (error) {
      setChallengeStatus(error.code === '23505' ? 'duplicate' : 'error')
    } else {
      setChallengeStatus('sent')
    }
  }

  function openChallengeModal(match: Match) {
    const label = `${getFlag(match.team1?.code)} ${match.team1?.name ?? 'TBD'} vs ${match.team2?.name ?? 'TBD'} ${getFlag(match.team2?.code)}`
    setChallengeModal({ matchId: match.id, matchLabel: label })
    setChallengeStatus('idle')
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

        {/* Phase tabs — only shown when there are multiple phases */}
        {phases.length > 1 && (
          <div className="relative mb-6" role="tablist" aria-label="Fases del torneo">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {phases.map(phase => (
                <button
                  key={phase}
                  role="tab"
                  aria-selected={activePhase === phase}
                  onClick={() => setActivePhase(phase)}
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchesByPhase[activePhase]?.map(match => {
              const editable = canPredict(match.match_date)
              const local = localPredictions[match.id] || { team1: '', team2: '' }
              const hasPrediction = local.team1 !== '' && local.team2 !== ''
              const status = saveStatus[match.id]

              return (
                <div
                  key={match.id}
                  className={`relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-5 transition-all border ${
                    !editable
                      ? 'opacity-60 border-white/5'
                      : hasPrediction
                      ? 'border-emerald-500/30 hover:border-emerald-500/50'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Link to detail — covers the header area */}
                  <Link
                    href={`/play/${match.id}`}
                    className="absolute top-0 right-0 text-xs text-slate-600 hover:text-slate-400 transition-colors p-3"
                    aria-label="Ver detalle del partido"
                  >
                    →
                  </Link>
                  {/* Header */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs text-slate-500">{formatDate(match.match_date)}</span>
                    {!editable && (
                      <span className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-full">Cerrado</span>
                    )}
                    {editable && status === 'saving' && (
                      <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full animate-pulse" role="status">Guardando…</span>
                    )}
                    {editable && status === 'saved' && (
                      <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full" role="status">✓ Guardado</span>
                    )}
                    {editable && status === 'error' && (
                      <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-full" role="alert">Error al guardar</span>
                    )}
                    {editable && hasPrediction && (!status || status === 'idle') && (
                      <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">✓ Listo</span>
                    )}
                    {editable && !hasPrediction && (!status || status === 'idle') && (
                      <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full">Sin predicción</span>
                    )}
                  </div>

                  {/* Team 1 */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl" aria-hidden="true">{getFlag(match.team1?.code)}</span>
                      <span className="text-white font-medium truncate">
                        {match.team1?.name || 'TBD'}
                      </span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={local.team1}
                      onChange={(e) => updateLocalPrediction(match.id, 'team1', e.target.value)}
                      disabled={!editable}
                      aria-label={`Goles ${match.team1?.name || 'Equipo 1'}`}
                      className="w-14 h-14 text-center text-2xl font-bold bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
                      placeholder="–"
                    />
                  </div>

                  {/* Team 2 */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl" aria-hidden="true">{getFlag(match.team2?.code)}</span>
                      <span className="text-white font-medium truncate">
                        {match.team2?.name || 'TBD'}
                      </span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={local.team2}
                      onChange={(e) => updateLocalPrediction(match.id, 'team2', e.target.value)}
                      disabled={!editable}
                      aria-label={`Goles ${match.team2?.name || 'Equipo 2'}`}
                      className="w-14 h-14 text-center text-2xl font-bold bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
                      placeholder="–"
                    />
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center text-xs pt-3 border-t border-white/5">
                    <span className="text-slate-500">Máx <span className="text-emerald-400 font-semibold">{getMaxPoints(match.phase)} pts</span></span>
                    {editable && userId && (
                      <button
                        onClick={() => openChallengeModal(match)}
                        aria-label={`Desafiar a alguien en ${match.team1?.name} vs ${match.team2?.name}`}
                        className="flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors font-medium focus-visible:outline-none focus-visible:underline"
                      >
                        ⚔️ Desafiar
                      </button>
                    )}
                  </div>

                  {/* Result if finished */}
                  {match.status === 'finished' && (
                    <div className="mt-3 text-center text-emerald-400 font-bold bg-emerald-400/10 rounded-lg py-2">
                      Resultado: {match.team1_score} - {match.team2_score}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Challenge modal */}
      {challengeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-white font-bold text-lg">⚔️ Desafiar</h3>
                <p className="text-slate-400 text-sm mt-0.5 leading-tight">{challengeModal.matchLabel}</p>
              </div>
              <button
                onClick={() => setChallengeModal(null)}
                aria-label="Cerrar modal"
                className="text-slate-500 hover:text-white transition-colors text-xl leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded"
              >
                ×
              </button>
            </div>

            {challengeStatus === 'sent' ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">🎯</div>
                <p className="text-white font-semibold">¡Desafío enviado!</p>
                <p className="text-slate-400 text-sm mt-1">Tu rival debe aceptarlo antes del partido</p>
                <button
                  onClick={() => setChallengeModal(null)}
                  className="mt-4 w-full bg-white/10 text-white py-2.5 rounded-xl hover:bg-white/20 transition-all"
                >
                  Cerrar
                </button>
              </div>
            ) : leagueMates.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-3">👥</div>
                <p className="text-white font-semibold mb-1">Sin rivales disponibles</p>
                <p className="text-slate-400 text-sm mb-4">
                  Invita amigos a tu liga para poder desafiarlos.
                </p>
                <Link
                  href="/leagues"
                  onClick={() => setChallengeModal(null)}
                  className="inline-block bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:shadow-lg transition-all"
                >
                  Ir a Ligas
                </Link>
              </div>
            ) : (
              <>
                <p className="text-slate-400 text-sm mb-4">Elige a quién desafiar:</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {leagueMates.map(mate => (
                    <button
                      key={mate.id}
                      onClick={() => sendChallenge(mate.id)}
                      disabled={challengeStatus === 'sending'}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-orange-500/30 transition-all disabled:opacity-50 text-left"
                    >
                      <Avatar url={mate.avatar_url} name={mate.display_name ?? mate.username} size={36} />
                      <span className="text-white font-medium">
                        {mate.display_name ?? mate.username ?? 'Anónimo'}
                      </span>
                    </button>
                  ))}
                </div>
                {(challengeStatus === 'error' || challengeStatus === 'duplicate') && (
                  <p className="text-red-400 text-sm mt-3 text-center">
                    {challengeStatus === 'duplicate' ? 'Ya existe un desafío para este partido con ese jugador' : 'Error al enviar el desafío'}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
