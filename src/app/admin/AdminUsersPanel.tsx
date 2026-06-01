'use client'

import { useState, useTransition } from 'react'
import Avatar from '@/components/Avatar'
import { togglePaid, updateNotes } from './actions'

type Profile = {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
  has_paid: boolean
  notes: string | null
  email: string | null
}

export default function AdminUsersPanel({ profiles }: { profiles: Profile[] }) {
  const [data, setData] = useState(profiles)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleTogglePaid(userId: string, current: boolean) {
    setData(prev => prev.map(p => p.id === userId ? { ...p, has_paid: !current } : p))
    startTransition(() => togglePaid(userId, !current))
  }

  function startEditNotes(p: Profile) {
    setEditingNotes(p.id)
    setNotesDraft(p.notes ?? '')
  }

  function handleSaveNotes(userId: string) {
    setData(prev => prev.map(p => p.id === userId ? { ...p, notes: notesDraft || null } : p))
    setEditingNotes(null)
    startTransition(() => updateNotes(userId, notesDraft))
  }

  const paid = data.filter(p => p.has_paid).length

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <p className="text-white font-semibold">Jugadores</p>
        <span className="text-slate-400 text-sm">
          <span className="text-emerald-400 font-semibold">{paid}</span> / {data.length} pagaron
        </span>
      </div>

      <div className="divide-y divide-white/5">
        {data.map(profile => {
          const name = profile.display_name ?? profile.username ?? 'Anónimo'
          const isEditingThis = editingNotes === profile.id

          return (
            <div key={profile.id} className="flex items-center gap-4 px-6 py-3">
              {/* Avatar + name */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Avatar url={profile.avatar_url} name={name} size={36} />
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{name}</p>
                  {profile.email && (
                    <p className="text-slate-500 text-xs truncate">{profile.email}</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="flex-1 min-w-0">
                {isEditingThis ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={notesDraft}
                      onChange={e => setNotesDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveNotes(profile.id); if (e.key === 'Escape') setEditingNotes(null) }}
                      placeholder="Notas..."
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/40"
                    />
                    <button onClick={() => handleSaveNotes(profile.id)} className="text-emerald-400 text-xs hover:text-emerald-300 shrink-0">Guardar</button>
                    <button onClick={() => setEditingNotes(null)} className="text-slate-500 text-xs hover:text-slate-400 shrink-0">✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditNotes(profile)}
                    className="text-left text-sm text-slate-400 hover:text-white transition-colors truncate max-w-full"
                  >
                    {profile.notes ?? <span className="text-slate-600 italic">sin notas</span>}
                  </button>
                )}
              </div>

              {/* Paid toggle */}
              <button
                onClick={() => handleTogglePaid(profile.id, profile.has_paid)}
                disabled={isPending}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  profile.has_paid
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                    : 'bg-white/10 text-slate-500 hover:bg-white/15 hover:text-slate-300'
                }`}
              >
                {profile.has_paid ? '✓ Pagó' : 'Sin pagar'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
