'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Match = {
  id: number
  team1: { name: string; code: string; flag_url: string }
  team2: { name: string; code: string; flag_url: string }
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

export default function PlayPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadMatches()
    loadPredictions()
  }, [])

  async function loadMatches() {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        id,
        phase,
        match_date,
        team1_score,
        team2_score,
        status,
        team1:teams!matches_team1_id_fkey(name, code, flag_url),
        team2:teams!matches_team2_id_fkey(name, code, flag_url)
      `)
      .order('match_date', { ascending: true })

    if (data) {
      setMatches(data as unknown as Match[])
    }
    setLoading(false)
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
      data.forEach(p => {
        predMap[p.match_id] = p
      })
      setPredictions(predMap)
    }
  }

  async function savePrediction(matchId: number, team1Score: number, team2Score: number) {
    setSaving(matchId)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('predictions')
      .upsert({
        user_id: user.id,
        match_id: matchId,
        team1_score: team1Score,
        team2_score: team2Score,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,match_id'
      })

    if (!error) {
      setPredictions(prev => ({
        ...prev,
        [matchId]: { match_id: matchId, team1_score: team1Score, team2_score: team2Score }
      }))
    }
    setSaving(null)
  }

  function canPredict(matchDate: string) {
    const matchTime = new Date(matchDate).getTime()
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000
    return matchTime - now > fiveMinutes
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CL', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function getPhaseLabel(phase: string) {
    const labels: Record<string, string> = {
      groups: 'Fase de Grupos',
      round32: '32avos de Final',
      round16: '16avos de Final',
      quarters: 'Cuartos de Final',
      semis: 'Semifinales',
      third: 'Tercer Lugar',
      final: 'Final'
    }
    return labels[phase] || phase
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando partidos...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-white/10">
        <Link href="/" className="text-2xl font-bold text-white">⚽ El Futbolero</Link>
        <nav className="flex gap-4">
          <Link href="/leaderboard" className="text-green-200 hover:text-white">Ranking</Link>
          <Link href="/leagues" className="text-green-200 hover:text-white">Ligas</Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">🎮 Ingresa tus Pronósticos</h1>

        {matches.length === 0 ? (
          <div className="bg-white/10 backdrop-blur rounded-xl p-8 text-center">
            <p className="text-green-200 text-lg">No hay partidos programados aún.</p>
            <p className="text-green-200/70 mt-2">Los partidos del Mundial 2026 se cargarán pronto.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map(match => {
              const prediction = predictions[match.id]
              const editable = canPredict(match.match_date)
              
              return (
                <div 
                  key={match.id} 
                  className={`bg-white/10 backdrop-blur rounded-xl p-4 ${!editable ? 'opacity-60' : ''}`}
                >
                  <div className="text-xs text-green-300 mb-2 flex justify-between">
                    <span>{getPhaseLabel(match.phase)}</span>
                    <span>{formatDate(match.match_date)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    {/* Team 1 */}
                    <div className="flex-1 text-right">
                      <span className="text-white font-semibold">{match.team1?.name || 'TBD'}</span>
                      <span className="text-green-300 text-sm ml-2">{match.team1?.code || '???'}</span>
                    </div>
                    
                    {/* Score Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={prediction?.team1_score ?? ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0
                          if (editable && prediction) {
                            savePrediction(match.id, val, prediction.team2_score)
                          } else if (editable) {
                            savePrediction(match.id, val, 0)
                          }
                        }}
                        disabled={!editable}
                        className="w-12 h-12 text-center text-xl font-bold bg-white/20 border border-white/30 rounded-lg text-white disabled:opacity-50"
                        placeholder="-"
                      />
                      <span className="text-white text-xl">-</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={prediction?.team2_score ?? ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0
                          if (editable && prediction) {
                            savePrediction(match.id, prediction.team1_score, val)
                          } else if (editable) {
                            savePrediction(match.id, 0, val)
                          }
                        }}
                        disabled={!editable}
                        className="w-12 h-12 text-center text-xl font-bold bg-white/20 border border-white/30 rounded-lg text-white disabled:opacity-50"
                        placeholder="-"
                      />
                    </div>
                    
                    {/* Team 2 */}
                    <div className="flex-1 text-left">
                      <span className="text-green-300 text-sm mr-2">{match.team2?.code || '???'}</span>
                      <span className="text-white font-semibold">{match.team2?.name || 'TBD'}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mt-2 text-center">
                    {saving === match.id && (
                      <span className="text-yellow-400 text-xs">Guardando...</span>
                    )}
                    {!editable && match.status === 'finished' && (
                      <span className="text-green-400 text-xs">
                        Resultado: {match.team1_score} - {match.team2_score}
                      </span>
                    )}
                    {!editable && match.status !== 'finished' && (
                      <span className="text-red-400 text-xs">Cerrado</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
