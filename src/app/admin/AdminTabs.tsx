'use client'

import { useState } from 'react'

export default function AdminTabs({ jugadores, predicciones }: {
  jugadores: React.ReactNode
  predicciones: React.ReactNode
}) {
  const [tab, setTab] = useState<'jugadores' | 'predicciones'>('jugadores')

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {([
          { id: 'jugadores',    label: 'Jugadores',    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
          { id: 'predicciones', label: 'Predicciones', active: 'bg-blue-500/20 text-blue-400 border-blue-500/30'         },
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

      {tab === 'jugadores'    && jugadores}
      {tab === 'predicciones' && predicciones}
    </div>
  )
}
