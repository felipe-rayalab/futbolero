'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type League = {
  id: number
  name: string
  code: string
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [newLeagueName, setNewLeagueName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadLeagues()
  }, [])

  async function loadLeagues() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Simple direct query
      const { data, error } = await supabase
        .from('leagues')
        .select('id, name, code')
      
      if (error) {
        console.error('Error loading leagues:', error)
      }
      
      if (data) {
        setLeagues(data)
      }
    } catch (e) {
      console.error('Exception:', e)
    }
    setLoading(false)
  }

  async function createLeague() {
    if (!newLeagueName.trim()) {
      setError('Ingresa un nombre para la liga')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const code = Math.random().toString(36).substring(2, 8).toUpperCase()

      const { data: league, error: createError } = await supabase
        .from('leagues')
        .insert({
          name: newLeagueName.trim(),
          code,
          owner_id: user.id
        })
        .select('id')
        .single()

      if (createError) {
        console.error('Create error:', createError)
        setError('Error al crear: ' + createError.message)
        return
      }

      if (league) {
        await supabase
          .from('league_members')
          .insert({
            league_id: league.id,
            user_id: user.id
          })
      }

      setShowCreate(false)
      setNewLeagueName('')
      setError('')
      loadLeagues()
    } catch (e) {
      console.error('Exception creating:', e)
      setError('Error inesperado')
    }
  }

  async function joinLeague() {
    if (!joinCode.trim()) {
      setError('Ingresa el código de la liga')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: league } = await supabase
        .from('leagues')
        .select('id')
        .eq('code', joinCode.trim().toUpperCase())
        .single()

      if (!league) {
        setError('Liga no encontrada')
        return
      }

      const { error: joinError } = await supabase
        .from('league_members')
        .insert({
          league_id: league.id,
          user_id: user.id
        })

      if (joinError) {
        if (joinError.code === '23505') {
          setError('Ya eres miembro de esta liga')
        } else {
          setError('Error al unirse')
        }
        return
      }

      setShowJoin(false)
      setJoinCode('')
      setError('')
      loadLeagues()
    } catch (e) {
      console.error('Exception joining:', e)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
      <header className="p-4 flex justify-between items-center border-b border-white/10">
        <Link href="/" className="text-2xl font-bold text-white">⚽ El Futbolero</Link>
        <nav className="flex gap-4">
          <Link href="/play" className="text-green-200 hover:text-white">Jugar</Link>
          <Link href="/leaderboard" className="text-green-200 hover:text-white">Ranking</Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">👥 Mis Ligas</h1>

        <div className="flex gap-4 mb-8 justify-center">
          <button
            onClick={() => { setShowCreate(true); setShowJoin(false); setError(''); }}
            className="bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg hover:bg-yellow-400"
          >
            + Crear Liga
          </button>
          <button
            onClick={() => { setShowJoin(true); setShowCreate(false); setError(''); }}
            className="bg-white/20 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/30"
          >
            Unirse
          </button>
        </div>

        {showCreate && (
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Crear Nueva Liga</h2>
            <input
              type="text"
              placeholder="Nombre de la liga"
              value={newLeagueName}
              onChange={(e) => setNewLeagueName(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/50 mb-4"
            />
            {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
            <div className="flex gap-4">
              <button onClick={createLeague} className="bg-green-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-green-400">
                Crear
              </button>
              <button onClick={() => setShowCreate(false)} className="text-white/70 hover:text-white">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {showJoin && (
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Unirse a Liga</h2>
            <input
              type="text"
              placeholder="Código (ej: ABC123)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/50 mb-4 uppercase"
              maxLength={6}
            />
            {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
            <div className="flex gap-4">
              <button onClick={joinLeague} className="bg-green-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-green-400">
                Unirse
              </button>
              <button onClick={() => setShowJoin(false)} className="text-white/70 hover:text-white">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {leagues.length === 0 ? (
          <div className="bg-white/10 backdrop-blur rounded-xl p-8 text-center">
            <p className="text-green-200 text-lg">No hay ligas aún</p>
            <p className="text-green-200/70 mt-2">Crea una e invita a tus amigos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leagues.map(league => (
              <Link
                key={league.id}
                href={`/leagues/${league.id}`}
                className="block bg-white/10 backdrop-blur rounded-xl p-6 hover:bg-white/20 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{league.name}</h3>
                    <p className="text-green-300 text-sm mt-1">
                      Código: <span className="font-mono bg-white/20 px-2 py-1 rounded">{league.code}</span>
                    </p>
                  </div>
                  <div className="text-green-200 text-2xl">→</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
