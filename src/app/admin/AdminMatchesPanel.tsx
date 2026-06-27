'use client'

import { useState, useEffect, useTransition } from 'react'
import { updateMatchScore, recalculateMatchScores, correctMatchScore } from './actions'

type Team = { name: string; code: string }
type Match = {
  id: number
  phase: string
  match_date: string
  team1_score: number | null
  team2_score: number | null
  status: string
  team1: Team | null
  team2: Team | null
}

function getRelevantMatches(matches: Match[]) {
  const now = new Date()
  return matches
    .filter(m => {
      if (m.status === 'live') return true
      if (m.status === 'finished') return true
      const date = new Date(m.match_date)
      const hoursUntil = (date.getTime() - now.getTime()) / 3600000
      if (hoursUntil < 48) return true
      return false
    })
    .sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1
      if (b.status === 'live' && a.status !== 'live') return 1
      // upcoming before finished
      if (a.status !== 'finished' && b.status === 'finished') return -1
      if (a.status === 'finished' && b.status !== 'finished') return 1
      // within same group: upcoming asc, finished desc (newest first)
      if (a.status === 'finished') {
        return new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
      }
      return new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
    })
}

export default function AdminMatchesPanel({ matches }: { matches: Match[] }) {
  const [scores, setScores] = useState<Record<number, { t1: string; t2: string }>>({})
  const [lastUpdated, setLastUpdated] = useState<Record<number, string>>({})
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setScores(prev => {
      const next: Record<number, { t1: string; t2: string }> = {}
      for (const m of matches) {
        next[m.id] = prev[m.id] ?? {
          t1: m.team1_score?.toString() ?? '0',
          t2: m.team2_score?.toString() ?? '0',
        }
      }
      return next
    })
  }, [matches])

  function handle(matchId: number, status: 'live' | 'finished') {
    const s = scores[matchId]
    if (!s) return
    startTransition(async () => {
      await updateMatchScore({
        match_id: matchId,
        status,
        team1_score: parseInt(s.t1) || 0,
        team2_score: parseInt(s.t2) || 0,
      })
      setLastUpdated(prev => ({
        ...prev,
        [matchId]: new Date().toLocaleTimeString('es-CL', {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        }),
      }))
    })
  }

  const relevant = getRelevantMatches(matches)

  if (relevant.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-4xl mb-3">📅</p>
        <p>No hay partidos relevantes en las próximas 48 horas.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {relevant.map(match => {
        const s = scores[match.id] ?? { t1: '0', t2: '0' }
        const isLive = match.status === 'live'
        const isFinished = match.status === 'finished'
        const t1 = match.team1
        const t2 = match.team2
        const date = new Date(match.match_date).toLocaleString('es-CL', {
          timeZone: 'America/Santiago',
          weekday: 'short', day: '2-digit', month: 'short',
          hour: '2-digit', minute: '2-digit',
        })

        return (
          <div
            key={match.id}
            className={`rounded-2xl border p-5 ${
              isLive
                ? 'bg-emerald-950/30 border-emerald-500/30'
                : isFinished
                  ? 'bg-white/3 border-white/10 opacity-70'
                  : 'bg-white/5 border-white/10'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-semibold">{t1?.name} vs {t2?.name}</p>
                <p className="text-slate-500 text-xs mt-0.5">{date} · {match.phase}</p>
              </div>
              <div className="flex items-center gap-2">
                {lastUpdated[match.id] && (
                  <span className="text-emerald-500 text-xs">✓ {lastUpdated[match.id]}</span>
                )}
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                  isLive
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : isFinished
                      ? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}>
                  {isLive ? '🔴 En vivo' : isFinished ? 'Finalizado' : 'Programado'}
                </span>
              </div>
            </div>

            {/* Score inputs */}
            <div className="flex items-center gap-3 mb-4">
              <span className="flex-1 text-right text-slate-300 text-sm font-medium truncate">{t1?.name}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={s.t1}
                  onChange={e => setScores(prev => ({ ...prev, [match.id]: { ...s, t1: e.target.value } }))}
                  className="w-14 h-12 text-center text-2xl font-bold bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-emerald-400/50 focus:bg-white/15"
                />
                <span className="text-slate-500 font-bold text-xl">–</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={s.t2}
                  onChange={e => setScores(prev => ({ ...prev, [match.id]: { ...s, t2: e.target.value } }))}
                  className="w-14 h-12 text-center text-2xl font-bold bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-emerald-400/50 focus:bg-white/15"
                />
              </div>
              <span className="flex-1 text-left text-slate-300 text-sm font-medium truncate">{t2?.name}</span>
            </div>

            {/* Action buttons */}
            {!isFinished && (
              <div className="flex gap-2">
                <button
                  onClick={() => handle(match.id, 'live')}
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                >
                  {isLive ? '🔄 Actualizar score' : '▶ Iniciar en vivo'}
                </button>
                <button
                  onClick={() => handle(match.id, 'finished')}
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-600/20 text-slate-300 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  ✓ Finalizar
                </button>
              </div>
            )}

            {isFinished && (
              <div className="flex items-center justify-between gap-3">
                <p className="text-slate-500 text-sm shrink-0">
                  Guardado: {match.team1_score} – {match.team2_score}
                </p>
                <button
                  onClick={() => {
                    startTransition(async () => {
                      await correctMatchScore({
                        match_id: match.id,
                        team1_score: parseInt(s.t1) || 0,
                        team2_score: parseInt(s.t2) || 0,
                      })
                      setLastUpdated(prev => ({
                        ...prev,
                        [match.id]: new Date().toLocaleTimeString('es-CL', {
                          hour: '2-digit', minute: '2-digit', second: '2-digit',
                        }),
                      }))
                    })
                  }}
                  disabled={isPending}
                  className="text-xs px-3 py-1.5 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/20 hover:bg-orange-500/25 transition-colors disabled:opacity-50"
                >
                  🔁 Corregir y recalcular
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
