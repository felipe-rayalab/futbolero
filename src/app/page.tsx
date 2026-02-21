import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">⚽ El Futbolero</h1>
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-green-200">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="text-white/70 hover:text-white">Salir</button>
            </form>
          </div>
        ) : (
          <Link 
            href="/login"
            className="bg-white text-green-800 px-4 py-2 rounded-lg font-semibold hover:bg-green-100"
          >
            Ingresar
          </Link>
        )}
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">Mundial 2026</h2>
          <p className="text-xl text-green-200 mb-8">
            Predice los resultados y compite con tus amigos
          </p>
          
          {user ? (
            <Link 
              href="/play"
              className="inline-block bg-yellow-500 text-black font-bold px-8 py-4 rounded-xl text-xl hover:bg-yellow-400 transition-colors"
            >
              🎮 Jugar Ahora
            </Link>
          ) : (
            <Link 
              href="/login"
              className="inline-block bg-yellow-500 text-black font-bold px-8 py-4 rounded-xl text-xl hover:bg-yellow-400 transition-colors"
            >
              🚀 Comenzar
            </Link>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-white mb-2">Predice</h3>
            <p className="text-green-200">Ingresa tus pronósticos antes de cada partido</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-white mb-2">Compite</h3>
            <p className="text-green-200">Sube en el ranking y gana premios</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-white mb-2">Ligas</h3>
            <p className="text-green-200">Crea grupos privados con tus amigos</p>
          </div>
        </div>

        {/* Leaderboard Preview */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-6">🏅 Top Jugadores</h3>
          <div className="bg-white/10 backdrop-blur rounded-xl overflow-hidden">
            <div className="p-4 text-center text-green-200">
              El torneo aún no comienza. ¡Prepárate!
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-green-200/50 text-sm">
        El Futbolero © 2026 — Hecho con ❤️ para el Mundial
      </footer>
    </div>
  )
}
