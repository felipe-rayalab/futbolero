'use client'

import { useState, useTransition } from 'react'
import { publishKnockoutMatch } from './actions'

type Team = { id: number; name: string; code: string }
type Match = {
  id: number
  phase: string
  match_date: string
  team1: Team | null
  team2: Team | null
}

const phaseLabel: Record<string, string> = {
  round32: '32avos', round16: '16avos', quarters: 'Cuartos',
  semis: 'Semis', third: '3er lugar', final: 'Final',
}

const phaseColor: Record<string, string> = {
  round32: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  round16: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  quarters: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  semis:    'bg-red-500/20 text-red-400 border-red-500/30',
  third:    'bg-slate-500/20 text-slate-400 border-slate-500/30',
  final:    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
}

export default function AdminBracketPanel({
  pendingMatches,
  allTeams,
}: {
  pendingMatches: Match[]
  allTeams: Team[]
}) {
  const [selections, setSelections] = useState<Record<number, { t1: string; t2: string }>>(
    Object.fromEntries(pendingMatches.map(m => [m.id, { t1: '', t2: '' }]))
  )
  const [lastPublished, setLastPublished] = useState<Record<number, string>>({})
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [isPending, startTransition] = useTransition()

  function set(matchId: number, field: 't1' | 't2', value: string) {
    setSelections(prev => ({ ...prev, [matchId]: { ...prev[matchId], [field]: value } }))
    setErrors(prev => ({ ...prev, [matchId]: '' }))
  }

  function publish(match: Match) {
    const s = selections[match.id]
    if (!s?.t1 || !s?.t2) {
      setErrors(prev => ({ ...prev, [match.id]: 'Selecciona ambos equipos' }))
      return
    }
    if (s.t1 === s.t2) {
      setErrors(prev => ({ ...prev, [match.id]: 'Los equipos deben ser distintos' }))
      return
    }
    startTransition(async () => {
      try {
        await publishKnockoutMatch({ match_id: match.id, team1_code: s.t1, team2_code: s.t2 })
        setLastPublished(prev => ({
          ...prev,
          [match.id]: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        }))
      } catch (e: any) {
        setErrors(prev => ({ ...prev, [match.id]: e.message ?? 'Error' }))
      }
    })
  }

  const byPhase = pendingMatches.reduce((acc, m) => {
    if (!acc[m.phase]) acc[m.phase] = []
    acc[m.phase].push(m)
    return acc
  }, {} as Record<string, Match[]>)

  if (pendingMatches.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-4xl mb-3">✅</p>
        <p>Todos los cruces están publicados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        {pendingMatches.length} cruce{pendingMatches.length !== 1 ? 's' : ''} pendientes de definir.
        Al publicar aparecen en <span className="text-white">/play</span> para que la gente pronostique.
      </p>

      {Object.entries(byPhase).map(([phase, matches]) => (
        <div key={phase}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${phaseColor[phase] ?? 'bg-white/10 text-slate-400 border-white/10'}`}>
              {phaseLabel[phase] ?? phase}
            </span>
            <span className="text-slate-600 text-xs">{matches.length} partido{matches.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="space-y-3">
            {matches.map(match => {
              const s = selections[match.id] ?? { t1: '', t2: '' }
              const date = new Date(match.match_date).toLocaleString('es-CL', {
                timeZone: 'America/Santiago',
                weekday: 'short', day: '2-digit', month: 'short',
                hour: '2-digit', minute: '2-digit',
              })
              const published = lastPublished[match.id]
              const err = errors[match.id]

              return (
                <div key={match.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-slate-500 text-xs mb-3">{date}</p>

                  <div className="flex items-center gap-2">
                    {/* Team 1 */}
                    <select
                      value={s.t1}
                      onChange={e => set(match.id, 't1', e.target.value)}
                      disabled={isPending || !!published}
                      className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400/50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <option value="">— Equipo 1 —</option>
                      {allTeams.map(t => (
                        <option key={t.id} value={t.code}>{t.name} ({t.code})</option>
                      ))}
                    </select>

                    <span className="text-slate-600 font-bold shrink-0">vs</span>

                    {/* Team 2 */}
                    <select
                      value={s.t2}
                      onChange={e => set(match.id, 't2', e.target.value)}
                      disabled={isPending || !!published}
                      className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400/50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <option value="">— Equipo 2 —</option>
                      {allTeams.map(t => (
                        <option key={t.id} value={t.code}>{t.name} ({t.code})</option>
                      ))}
                    </select>

                    {/* Publish button */}
                    {published ? (
                      <span className="shrink-0 text-emerald-400 text-xs font-medium">✓ {published}</span>
                    ) : (
                      <button
                        onClick={() => publish(match)}
                        disabled={isPending || !s.t1 || !s.t2}
                        className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Publicar
                      </button>
                    )}
                  </div>

                  {err && <p className="text-red-400 text-xs mt-2">{err}</p>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
