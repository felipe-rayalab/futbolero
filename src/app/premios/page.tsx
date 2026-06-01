import Header from '@/components/Header'
import Link from 'next/link'

export default function PremiosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-block mb-4 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
            <span className="text-yellow-400 text-sm font-medium">🏆 Premios</span>
          </div>
          <h1 className="text-4xl font-bold text-white">Premios</h1>
        </div>

        <div className="space-y-6">

          {/* Auspiciador */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">😔 Una noticia</h2>
            <p className="text-slate-400 leading-relaxed">
              Lamentablemente perdimos nuestro principal auspiciador <span className="text-white font-semibold">Hotel Valdivia</span>, pero si quieres aportar con un premio, mándame un mensaje.
            </p>
          </div>

          {/* Pozo */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-white/5 border border-yellow-500/20 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">💰 El Pozo</h2>
            <p className="text-slate-400 leading-relaxed">
              Pondremos una cuota de <span className="text-yellow-400 font-semibold">$25.000</span> para jugar y el pozo se repartirá completo entre los primeros lugares.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center pt-2">
            <Link
              href="/rules"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
            >
              ← Ver reglamento
            </Link>
          </div>

        </div>
      </main>
    </div>
  )
}
