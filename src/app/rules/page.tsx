import Header from '@/components/Header'

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-block mb-4 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <span className="text-emerald-400 text-sm font-medium">📋 Reglamento</span>
          </div>
          <h1 className="text-4xl font-bold text-white">¿Cómo se juega?</h1>
        </div>

        <div className="space-y-6">

          {/* Deadline */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2">⏱ Deadline</h2>
            <p className="text-slate-400">Podés ingresar o modificar tu pronóstico hasta <span className="text-white font-medium">5 minutos antes del pitazo inicial</span>. Después de eso, queda bloqueado.</p>
          </div>

          {/* Winner points */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">🏆 Puntos por acertar Ganador o Empate</h2>
            <div className="space-y-2">
              {[
                { fase: 'Grupos',                   pts: 2,  color: 'text-slate-300' },
                { fase: '32avos y 16avos',          pts: 3,  color: 'text-blue-400'  },
                { fase: '8vos y 4tos',              pts: 5,  color: 'text-purple-400'},
                { fase: 'Semis, 3er lugar y Final', pts: 7,  color: 'text-yellow-400'},
              ].map(({ fase, pts, color }) => (
                <div key={fase} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-slate-400">{fase}</span>
                  <span className={`font-bold text-lg ${color}`}>{pts} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Goal points */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-1">⚽ Puntos por acertar Goles</h2>
            <p className="text-slate-500 text-sm mb-4">Se aplica por separado a cada equipo. Solo cuentan los 90 minutos.</p>
            <div className="space-y-2">
              {[
                { goles: '0 ó 1 goles', pts: 1 },
                { goles: '2 goles',     pts: 2 },
                { goles: '3 goles',     pts: 3 },
                { goles: '4 goles',     pts: 4 },
                { goles: '5 o más',     pts: 5 },
              ].map(({ goles, pts }) => (
                <div key={goles} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-slate-400">{goles}</span>
                  <span className="font-bold text-lg text-emerald-400">{pts} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Max points */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">🎯 Puntaje máximo por partido (pleno)</h2>
            <div className="space-y-2">
              {[
                { fase: 'Grupos',       formula: '2 + 5 + 5', pts: 12 },
                { fase: '32avos/16avos',formula: '3 + 5 + 5', pts: 13 },
                { fase: '8vos/4tos',    formula: '5 + 5 + 5', pts: 15 },
                { fase: 'Semis/Final',  formula: '7 + 5 + 5', pts: 17 },
              ].map(({ fase, formula, pts }) => (
                <div key={fase} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <div>
                    <span className="text-slate-400">{fase}</span>
                    <span className="text-slate-600 text-sm ml-2">({formula})</span>
                  </div>
                  <span className="font-bold text-lg text-white">{pts} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tiebreakers */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">⚖️ Desempate</h2>
            <ol className="space-y-2">
              {[
                'Puntaje total',
                'Cantidad de plenos (resultados exactos)',
                'Mayor puntaje en un solo partido',
                '2º mayor puntaje en un partido',
                'Random',
              ].map((rule, i) => (
                <li key={i} className="flex gap-3 text-slate-400">
                  <span className="text-slate-600 font-mono">{i + 1}.</span>
                  {rule}
                </li>
              ))}
            </ol>
          </div>

        </div>
      </main>
    </div>
  )
}
