import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚽</span>
          <span className="text-xl font-bold text-white tracking-tight">El Futbolero</span>
        </div>
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm hidden sm:block">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="text-slate-400 hover:text-white text-sm transition-colors">
                Salir
              </button>
            </form>
          </div>
        ) : (
          <Link 
            href="/login"
            className="bg-white/10 backdrop-blur-sm border border-white/10 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-white/20 transition-all"
          >
            Ingresar
          </Link>
        )}
      </header>

      {/* Hero */}
      <main className="relative z-10 container mx-auto px-4 py-8 sm:py-16">
        <div className="text-center mb-16">
          <div className="inline-block mb-6 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <span className="text-emerald-400 text-sm font-medium">🏆 Temporada 2026</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 tracking-tight">
            Mundial
            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 text-transparent bg-clip-text"> 2026</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-md mx-auto">
            Predice resultados, compite con amigos y demuestra que sabes de fútbol
          </p>
          
          {user ? (
            <Link 
              href="/play"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-8 py-4 rounded-full text-lg hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all"
            >
              <span>Jugar Ahora</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          ) : (
            <Link 
              href="/login"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-8 py-4 rounded-full text-lg hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all"
            >
              <span>Comenzar</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          )}
        </div>

        {/* Feature Cards - Clickable */}
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mb-16">
          <Link 
            href="/play"
            className="group relative bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
            <div className="relative">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Predice</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Ingresa tus pronósticos antes de cada partido del mundial
              </p>
              <div className="mt-4 text-emerald-400 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Hacer predicciones</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
          
          <Link 
            href="/leaderboard"
            className="group relative bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
            <div className="relative">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Compite</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Sube en el ranking global y gana premios increíbles
              </p>
              <div className="mt-4 text-blue-400 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Ver ranking</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
          
          <Link 
            href="/leagues"
            className="group relative bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
            <div className="relative">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Ligas</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Crea grupos privados y compite solo con tus amigos
              </p>
              <div className="mt-4 text-purple-400 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Ver ligas</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats preview */}
        <div className="flex justify-center gap-8 sm:gap-16 mb-16">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white mb-1">48</div>
            <div className="text-slate-500 text-sm">Equipos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white mb-1">104</div>
            <div className="text-slate-500 text-sm">Partidos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white mb-1">∞</div>
            <div className="text-slate-500 text-sm">Diversión</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center">
        <p className="text-slate-600 text-sm">
          El Futbolero © 2026 — Hecho con ❤️ para el Mundial
        </p>
      </footer>
    </div>
  )
}
