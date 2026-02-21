'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

// Flag emoji mapping
const flagEmojis: Record<string, string> = {
  MEX: '🇲🇽', CAN: '🇨🇦', USA: '🇺🇸', ARG: '🇦🇷', BRA: '🇧🇷', CHI: '🇨🇱',
  COL: '🇨🇴', ECU: '🇪🇨', PER: '🇵🇪', URU: '🇺🇾', VEN: '🇻🇪', PAR: '🇵🇾',
  BOL: '🇧🇴', ESP: '🇪🇸', POR: '🇵🇹', FRA: '🇫🇷', GER: '🇩🇪', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  ITA: '🇮🇹', NED: '🇳🇱', BEL: '🇧🇪', CRO: '🇭🇷', SRB: '🇷🇸', SUI: '🇨🇭',
  DEN: '🇩🇰', AUT: '🇦🇹', POL: '🇵🇱', UKR: '🇺🇦', WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', CZE: '🇨🇿',
  SWE: '🇸🇪', NOR: '🇳🇴', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', IRL: '🇮🇪', JPN: '🇯🇵', KOR: '🇰🇷',
  AUS: '🇦🇺', KSA: '🇸🇦', IRN: '🇮🇷', QAT: '🇶🇦', SEN: '🇸🇳', MAR: '🇲🇦',
  NGA: '🇳🇬', CMR: '🇨🇲', GHA: '🇬🇭', CIV: '🇨🇮', EGY: '🇪🇬', TUN: '🇹🇳',
}

export default function PlayPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({})
  const [localPredictions, setLocalPredictions] = useState<Record<number, { team1: string; team2: string }>>({})
  const [saveStatus, setSaveStatus] = useState<Record<number, SaveStatus>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const debounceTimers = useRef<Record<number, NodeJS.Timeout>>({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    await Promise.all([loadMatches(), loadPredictions()])
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
      .order('match_date', { ascending: true })

    if (data) setMatches(data as unknown as Match[])
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
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [matchId]: 'idle' }))
      }, 2000)
    }
  }, [matches, supabase])

  function updateLocalPrediction(matchId: number, team: 'team1' | 'team2', value: string) {
    // Only allow numbers 0-9
    if (value !== '' && !/^\d$/.test(value)) return
    
    const newLocal = {
      ...localPredictions[matchId],
      [team]: value
    }
    
    setLocalPredictions(prev => ({
      ...prev,
      [matchId]: newLocal
    }))

    // Clear existing timer for this match
    if (debounceTimers.current[matchId]) {
      clearTimeout(debounceTimers.current[matchId])
    }

    // Auto-save with debounce when both fields have values
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
    return matchTime - now > 5 * 60 * 1000 // 5 minutes before
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
      groups: 'Fase de Grupos',
      round32: '32avos',
      round16: '16avos',
      quarters: 'Cuartos',
      semis: 'Semifinales',
      third: '3er Lugar',
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

  // Group matches by phase
  const matchesByPhase = matches.reduce((acc, match) => {
    if (!acc[match.phase]) acc[match.phase] = []
    acc[match.phase].push(match)
    return acc
  }, {} as Record<string, Match[]>)

  const phases = Object.keys(matchesByPhase)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Cargando partidos...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-green-900/95 backdrop-blur border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-white">⚽ El Futbolero</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/leaderboard" className="text-green-200 hover:text-white">Ranking</Link>
            <Link href="/leagues" className="text-green-200 hover:text-white">Ligas</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Auto-save notice */}
        <div className="text-center mb-4">
          <span className="text-green-300/70 text-sm">💾 Los resultados se guardan automáticamente</span>
        </div>

        {matches.length === 0 ? (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-8 text-center">
              <p className="text-green-200 text-lg">No hay partidos programados aún</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={phases[0]} className="w-full">
            <TabsList className="w-full justify-start mb-6 bg-white/10 overflow-x-auto">
              {phases.map(phase => (
                <TabsTrigger 
                  key={phase} 
                  value={phase}
                  className="text-white data-[state=active]:bg-white/20"
                >
                  {getPhaseLabel(phase)}
                </TabsTrigger>
              ))}
            </TabsList>

            {phases.map(phase => (
              <TabsContent key={phase} value={phase}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matchesByPhase[phase].map(match => {
                    const editable = canPredict(match.match_date)
                    const local = localPredictions[match.id] || { team1: '', team2: '' }
                    const hasPrediction = local.team1 !== '' && local.team2 !== ''
                    
                    return (
                      <Card 
                        key={match.id} 
                        className={`bg-white/10 border-white/20 ${!editable ? 'opacity-60' : ''}`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-sm text-green-300">
                              {getPhaseLabel(match.phase)}
                            </CardTitle>
                            {!editable && (
                              <Badge variant="outline" className="text-red-400 border-red-400">
                                Cerrado
                              </Badge>
                            )}
                            {editable && saveStatus[match.id] === 'saving' && (
                              <Badge variant="outline" className="text-yellow-400 border-yellow-400 animate-pulse">
                                Guardando...
                              </Badge>
                            )}
                            {editable && saveStatus[match.id] === 'saved' && (
                              <Badge variant="outline" className="text-green-400 border-green-400">
                                ✓ Guardado
                              </Badge>
                            )}
                            {editable && saveStatus[match.id] === 'error' && (
                              <Badge variant="outline" className="text-red-400 border-red-400">
                                Error
                              </Badge>
                            )}
                            {editable && hasPrediction && (!saveStatus[match.id] || saveStatus[match.id] === 'idle') && (
                              <Badge variant="outline" className="text-green-400 border-green-400">
                                ✓
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-white/50">{formatDate(match.match_date)}</p>
                        </CardHeader>
                        
                        <CardContent className="space-y-3">
                          {/* Team 1 */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-2xl">{getFlag(match.team1?.code)}</span>
                              <span className="text-white font-medium truncate">
                                {match.team1?.name || 'TBD'}
                              </span>
                            </div>
                            <Input
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={local.team1}
                              onChange={(e) => updateLocalPrediction(match.id, 'team1', e.target.value)}
                              disabled={!editable}
                              className="w-12 h-12 text-center text-xl font-bold bg-white/20 border-white/30 text-white"
                              placeholder="-"
                            />
                          </div>

                          {/* Team 2 */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-2xl">{getFlag(match.team2?.code)}</span>
                              <span className="text-white font-medium truncate">
                                {match.team2?.name || 'TBD'}
                              </span>
                            </div>
                            <Input
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={local.team2}
                              onChange={(e) => updateLocalPrediction(match.id, 'team2', e.target.value)}
                              disabled={!editable}
                              className="w-12 h-12 text-center text-xl font-bold bg-white/20 border-white/30 text-white"
                              placeholder="-"
                            />
                          </div>

                          {/* Points Info */}
                          <div className="flex justify-between text-xs pt-2 border-t border-white/10">
                            <span className="text-white/50">Resultado final</span>
                            <span className="text-white/50">
                              Puntaje máx: <span className="text-green-400 font-bold">{getMaxPoints(match.phase)}</span>
                            </span>
                          </div>

                          {/* Show actual result if finished */}
                          {match.status === 'finished' && (
                            <div className="text-center text-green-400 font-bold">
                              Resultado: {match.team1_score} - {match.team2_score}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>
    </div>
  )
}
