'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-block mb-4 px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full">
            <span className="text-purple-400 text-sm font-medium">👥 Competencia Privada</span>
          </div>
          <h1 className="text-4xl font-bold text-white">Mis Ligas</h1>
        </div>

        <div className="flex gap-4 mb-8 justify-center">
          <button
            onClick={() => { setShowCreate(true); setShowJoin(false); setError(''); }}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-6 py-3 rounded-full hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all"
          >
            + Crear Liga
          </button>
          <button
            onClick={() => { setShowJoin(true); setShowCreate(false); setError(''); }}
            className="bg-white/10 border border-white/10 text-white font-semibold px-6 py-3 rounded-full hover:bg-white/20 transition-all"
          >
            Unirse
          </button>
        </div>

        {showCreate && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Crear Nueva Liga</h2>
            <input
              type="text"
              placeholder="Nombre de la liga"
              value={newLeagueName}
              onChange={(e) => setNewLeagueName(e.target.value)}
              className="w-full p-4 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
            <div className="flex gap-4">
              <button onClick={createLeague} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-6 py-3 rounded-full hover:shadow-lg transition-all">
                Crear
              </button>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {showJoin && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Unirse a Liga</h2>
            <input
              type="text"
              placeholder="Código (ej: ABC123)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full p-4 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 mb-4 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              maxLength={6}
            />
            {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
            <div className="flex gap-4">
              <button onClick={joinLeague} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-6 py-3 rounded-full hover:shadow-lg transition-all">
                Unirse
              </button>
              <button onClick={() => setShowJoin(false)} className="text-slate-400 hover:text-white transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {leagues.length === 0 ? (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👥</span>
            </div>
            <p className="text-lg text-white mb-2">No tienes ligas aún</p>
            <p className="text-slate-500">Crea una e invita a tus amigos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leagues.map(league => (
              <Link
                key={league.id}
                href={`/leagues/${league.id}`}
                className="group block bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all hover:-translate-y-0.5"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{league.name}</h3>
                    <p className="text-slate-400 text-sm">
                      Código: <span className="font-mono bg-white/10 px-2 py-1 rounded-lg text-purple-400">{league.code}</span>
                    </p>
                  </div>
                  <div className="text-slate-500 group-hover:text-purple-400 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
