'use client'

import { useState } from 'react'

export default function AdminTabs({ jugadores, predicciones, partidos, bracket }: {
  jugadores: React.ReactNode
  predicciones: React.ReactNode
  partidos: React.ReactNode
  bracket: React.ReactNode
}) {
  const [tab, setTab] = useState<'partidos' | 'bracket' | 'jugadores' | 'predicciones'>('partidos')

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { id: 'partidos',     label: 'Partidos',     active: 'bg-red-500/20 text-red-400 border-red-500/30'             },
          { id: 'bracket',      label: 'Bracket',      active: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'    },
          { id: 'jugadores',    label: 'Jugadores',    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
          { id: 'predicciones', label: 'Predicciones', active: 'bg-blue-500/20 text-blue-400 border-blue-500/30'          },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${
              tab === t.id
                ? t.active
                : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'partidos'     && partidos}
      {tab === 'bracket'      && bracket}
      {tab === 'jugadores'    && jugadores}
      {tab === 'predicciones' && predicciones}
    </div>
  )
}
