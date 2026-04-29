'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'

type Profile = {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

type Match = {
  id: number
  phase: string
  match_date: string
  team1: { name: string; code: string } | null
  team2: { name: string; code: string } | null
}

type Challenge = {
  id: number
  status: 'pending' | 'accepted' | 'declined' | 'resolved'
  winner_id: string | null
  created_at: string
  match: Match | null
  challenger: Profile | null
  challenged: Profile | null
}

const flagEmojis: Record<string, string> = {
  MEX: '🇲🇽', CAN: '🇨🇦', USA: '🇺🇸', ARG: '🇦🇷', BRA: '🇧🇷', URU: '🇺🇾',
  COL: '🇨🇴', ECU: '🇪🇨', PAR: '🇵🇾', ESP: '🇪🇸', POR: '🇵🇹', FRA: '🇫🇷',
  GER: '🇩🇪', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', NED: '🇳🇱', BEL: '🇧🇪', CRO: '🇭🇷', SUI: '🇨🇭',
  AUT: '🇦🇹', CZE: '🇨🇿', SWE: '🇸🇪', NOR: '🇳🇴', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', JPN: '🇯🇵',
  KOR: '🇰🇷', AUS: '🇦🇺', KSA: '🇸🇦', IRN: '🇮🇷', QAT: '🇶🇦', TUR: '🇹🇷',
  IRQ: '🇮🇶', UZB: '🇺🇿', JOR: '🇯🇴', SEN: '🇸🇳', MAR: '🇲🇦', GHA: '🇬🇭',
  CIV: '🇨🇮', EGY: '🇪🇬', TUN: '🇹🇳', RSA: '🇿🇦', CMR: '🇨🇲', HAI: '🇭🇹',
  CPV: '🇨🇻', COD: '🇨🇩', BIH: '🇧🇦', ALG: '🇩🇿', CUW: '🇨🇼', PAN: '🇵🇦',
}

function getFlag(code?: string | null) {
  return code ? (flagEmojis[code] ?? '🏳️') : '🏳️'
}

function matchLabel(match: Match | null) {
  if (!match) return 'Partido desconocido'
  return `${getFlag(match.team1?.code)} ${match.team1?.name ?? 'TBD'} vs ${match.team2?.name ?? 'TBD'} ${getFlag(match.team2?.code)}`
}

function profileName(p: Profile | null) {
  return p?.display_name ?? p?.username ?? 'Anónimo'
}

function Avatar({ profile, size = 8 }: { profile: Profile | null; size?: number }) {
  const name = profileName(profile)
  return profile?.avatar_url ? (
    <img src={profile.avatar_url} alt="" className={`w-${size} h-${size} rounded-full ring-2 ring-white/10`} />
  ) : (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm`}>
      {name[0].toUpperCase()}
    </div>
  )
}

export default function ChallengesPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [received, setReceived] = useState<Challenge[]>([])
  const [sent, setSent] = useState<Challenge[]>([])
  const [history, setHistory] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    await loadChallenges(user.id)
    setLoading(false)
  }

  async function loadChallenges(uid: string) {
    const { data } = await supabase
      .from('challenges')
      .select(`
        id, status, winner_id, created_at,
        match:matches!challenges_match_id_fkey(
          id, phase, match_date,
          team1:teams!matches_team1_id_fkey(name, code),
          team2:teams!matches_team2_id_fkey(name, code)
        ),
        challenger:profiles!challenges_challenger_id_fkey(id, display_name, username, avatar_url),
        challenged:profiles!challenges_challenged_id_fkey(id, display_name, username, avatar_url)
      `)
      .or(`challenger_id.eq.${uid},challenged_id.eq.${uid}`)
      .order('created_at', { ascending: false })

    if (!data) return

    const challenges = data as unknown as Challenge[]
    setReceived(challenges.filter(c => c.challenged?.id === uid && c.status === 'pending'))
    setSent(challenges.filter(c => c.challenger?.id === uid && c.status === 'pending'))
    setHistory(challenges.filter(c => c.status === 'accepted' || c.status === 'declined' || c.status === 'resolved'))
    // Note: 'accepted' = en juego, 'declined'/'resolved' = historial resuelto
  }

  async function respond(challengeId: number, action: 'accepted' | 'declined') {
    setResponding(challengeId)
    await supabase
      .from('challenges')
      .update({ status: action })
      .eq('id', challengeId)
    if (userId) await loadChallenges(userId)
    setResponding(null)
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  function resultLabel(c: Challenge, uid: string) {
    if (c.status === 'declined') return { text: 'Rechazado', color: 'text-red-400' }
    if (c.status === 'accepted') return { text: 'Esperando resultado', color: 'text-yellow-400' }
    if (c.status === 'resolved') {
      if (!c.winner_id) return { text: 'Empate', color: 'text-slate-400' }
      return c.winner_id === uid
        ? { text: '¡Ganaste!', color: 'text-emerald-400' }
        : { text: 'Perdiste', color: 'text-red-400' }
    }
    return { text: c.status, color: 'text-slate-400' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Cargando desafíos...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4 px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
            <span className="text-orange-400 text-sm font-medium" aria-hidden="true">⚔️</span>
            <span className="text-orange-400 text-sm font-medium"> Duelos 1v1</span>
          </div>
          <h1 className="text-4xl font-bold text-white">Desafíos</h1>
        </div>

        {/* Received — pending */}
        {received.length > 0 && (
          <section className="mb-8" aria-label="Desafíos recibidos">
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" aria-hidden="true" />
              Recibidos
              <span className="ml-1 text-xs font-normal bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">{received.length}</span>
            </h2>
            <div className="space-y-3">
              {received.map(c => (
                <div key={c.id} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar profile={c.challenger} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold">{profileName(c.challenger)}</p>
                      <p className="text-slate-400 text-sm truncate">{matchLabel(c.match)}</p>
                    </div>
                    <span className="text-slate-500 text-xs shrink-0">{formatDate(c.created_at)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respond(c.id, 'accepted')}
                      disabled={responding === c.id}
                      aria-label={`Aceptar desafío de ${profileName(c.challenger)}`}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-2.5 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      {responding === c.id ? 'Enviando…' : 'Aceptar'}
                    </button>
                    <button
                      onClick={() => respond(c.id, 'declined')}
                      disabled={responding === c.id}
                      aria-label={`Rechazar desafío de ${profileName(c.challenger)}`}
                      className="flex-1 bg-white/5 border border-white/10 text-slate-300 font-semibold py-2.5 rounded-xl hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sent — pending */}
        {sent.length > 0 && (
          <section className="mb-8" aria-label="Desafíos enviados pendientes">
            <h2 className="text-base font-semibold text-white mb-3">Enviados</h2>
            <div className="space-y-3">
              {sent.map(c => (
                <div key={c.id} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <Avatar profile={c.challenged} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold">{profileName(c.challenged)}</p>
                      <p className="text-slate-400 text-sm truncate">{matchLabel(c.match)}</p>
                    </div>
                    <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full shrink-0">Pendiente</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* En juego — accepted, waiting for match result */}
        {(() => {
          const enJuego = history.filter(c => c.status === 'accepted')
          if (!enJuego.length) return null
          return (
            <section className="mb-8" aria-label="Desafíos en juego">
              <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" aria-hidden="true" />
                En juego
              </h2>
              <div className="space-y-3">
                {enJuego.map(c => {
                  const opponent = c.challenger?.id === userId ? c.challenged : c.challenger
                  return (
                    <div key={c.id} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <Avatar profile={opponent} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold">{profileName(opponent)}</p>
                          <p className="text-slate-400 text-sm truncate">{matchLabel(c.match)}</p>
                        </div>
                        <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full shrink-0">Esperando resultado</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })()}

        {/* Historial — declined + resolved */}
        {(() => {
          const resueltos = history.filter(c => c.status === 'declined' || c.status === 'resolved')
          if (!resueltos.length) return null
          return (
            <section className="mb-8" aria-label="Historial de desafíos">
              <h2 className="text-base font-semibold text-white mb-3">Historial</h2>
              <div className="space-y-3">
                {resueltos.map(c => {
                  const isChallenger = c.challenger?.id === userId
                  const opponent = isChallenger ? c.challenged : c.challenger
                  const result = resultLabel(c, userId!)
                  return (
                    <div key={c.id} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <Avatar profile={opponent} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold">{profileName(opponent)}</p>
                          <p className="text-slate-400 text-sm truncate">{matchLabel(c.match)}</p>
                        </div>
                        <span className={`text-sm font-semibold shrink-0 ${result.color}`}>{result.text}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })()}

        {/* Empty state */}
        {received.length === 0 && sent.length === 0 && history.length === 0 && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
              <span className="text-3xl">⚔️</span>
            </div>
            <p className="text-lg text-white mb-2">Sin desafíos aún</p>
            <p className="text-slate-400 mb-6">Desafía a un amigo desde la pantalla de predicciones</p>
            <Link
              href="/play"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-semibold px-6 py-3 rounded-full hover:shadow-lg hover:shadow-orange-500/25 hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              Ir a Predicciones
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
