'use client'

import { useState } from 'react'

type User = {
  id: string
  display_name: string
  total_points: number
  plenos: number
  matches_played: number
  max_match_points: number
}

type LeagueMember = {
  user: { id: string; display_name: string }
}

type League = {
  id: number
  name: string
  code: string
  members: LeagueMember[]
}

type LeagueScore = {
  league_id: number
  id: string
  display_name: string
  total_points: number
  plenos: number
  matches_played: number
}

type Prediction = {
  id: number
  team1_score: number
  team2_score: number
  updated_at: string
  user: { display_name: string }
  match: {
    id: number
    phase: string
    match_date: string
    team1_score: number | null
    team2_score: number | null
    status: string
    team1: { name: string }
    team2: { name: string }
  }
}

export default function AdminTabs({
  users, leagues, leagueScores, predictions,
}: {
  users: User[]
  leagues: League[]
  leagueScores: LeagueScore[]
  predictions: Prediction[]
}) {
  const [tab, setTab] = useState<'usuarios' | 'ligas' | 'predicciones'>('usuarios')
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null)
  const [userFilter, setUserFilter] = useState('')

  const tabs = [
    { id: 'usuarios', label: `Usuarios (${users.length})` },
    { id: 'ligas', label: `Ligas (${leagues.length})` },
    { id: 'predicciones', label: `Predicciones (${predictions.length})` },
  ] as const

  const filteredUsers = users.filter(u =>
    u.display_name?.toLowerCase().includes(userFilter.toLowerCase())
  )

  const activeLeague = leagues.find(l => l.id === selectedLeague)
  const activeLeagueScores = leagueScores.filter(s => s.league_id === selectedLeague)

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-emerald-500 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Usuarios tab */}
      {tab === 'usuarios' && (
        <div>
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            className="mb-4 w-full max-w-xs bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Jugador</th>
                  <th className="text-center px-4 py-3">Pts</th>
                  <th className="text-center px-4 py-3">Plenos</th>
                  <th className="text-center px-4 py-3">Partidos</th>
                  <th className="text-center px-4 py-3">Máx partido</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3 text-white font-medium">{u.display_name || '—'}</td>
                    <td className="px-4 py-3 text-center text-emerald-400 font-bold">{u.total_points}</td>
                    <td className="px-4 py-3 text-center text-yellow-400">{u.plenos}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{u.matches_played}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{u.max_match_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ligas tab */}
      {tab === 'ligas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* League list */}
          <div className="space-y-2">
            {leagues.map(league => (
              <button
                key={league.id}
                onClick={() => setSelectedLeague(league.id === selectedLeague ? null : league.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  selectedLeague === league.id
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="font-medium">{league.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Código: {league.code} · {league.members.length} miembros
                </div>
              </button>
            ))}
          </div>

          {/* League detail */}
          <div className="lg:col-span-2">
            {activeLeague ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10">
                  <h2 className="text-white font-semibold">{activeLeague.name}</h2>
                  <p className="text-xs text-slate-500">Código de invitación: {activeLeague.code}</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="text-left px-4 py-3">#</th>
                      <th className="text-left px-4 py-3">Jugador</th>
                      <th className="text-center px-4 py-3">Pts</th>
                      <th className="text-center px-4 py-3">Plenos</th>
                      <th className="text-center px-4 py-3">Partidos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeLeagueScores.length > 0 ? activeLeagueScores.map((s, i) => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                        <td className="px-4 py-3 text-white font-medium">{s.display_name || '—'}</td>
                        <td className="px-4 py-3 text-center text-emerald-400 font-bold">{s.total_points}</td>
                        <td className="px-4 py-3 text-center text-yellow-400">{s.plenos}</td>
                        <td className="px-4 py-3 text-center text-slate-400">{s.matches_played}</td>
                      </tr>
                    )) : activeLeague.members.map((m, i) => (
                      <tr key={m.user.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                        <td className="px-4 py-3 text-white font-medium">{m.user.display_name || '—'}</td>
                        <td className="px-4 py-3 text-center text-slate-500">—</td>
                        <td className="px-4 py-3 text-center text-slate-500">—</td>
                        <td className="px-4 py-3 text-center text-slate-500">—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-slate-500">
                Selecciona una liga para ver el detalle
              </div>
            )}
          </div>
        </div>
      )}

      {/* Predicciones tab */}
      {tab === 'predicciones' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="text-left px-4 py-3">Jugador</th>
                <th className="text-left px-4 py-3">Partido</th>
                <th className="text-center px-4 py-3">Predicción</th>
                <th className="text-center px-4 py-3">Resultado</th>
                <th className="text-center px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white">{p.user?.display_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">
                    <div>{p.match?.team1?.name} vs {p.match?.team2?.name}</div>
                    <div className="text-xs text-slate-500">{p.match?.phase}</div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-white">
                    {p.team1_score} — {p.team2_score}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-400">
                    {p.match?.team1_score !== null
                      ? `${p.match.team1_score} — ${p.match.team2_score}`
                      : '—'
                    }
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.match?.status === 'live' && (
                      <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">EN VIVO</span>
                    )}
                    {p.match?.status === 'finished' && (
                      <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">Finalizado</span>
                    )}
                    {p.match?.status === 'scheduled' && (
                      <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Pendiente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
