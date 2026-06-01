'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Avatar from '@/components/Avatar'

type UserInfo = {
  display_name: string | null
  avatar_url: string | null
  email: string | null
}

const navItems = [
  { href: '/play',        label: 'Jugar',     color: 'text-emerald-400 bg-emerald-500/10' },
  { href: '/leaderboard', label: 'Ranking',   color: 'text-blue-400    bg-blue-500/10'    },
  { href: '/leagues',     label: 'Ligas',     color: 'text-purple-400  bg-purple-500/10'  },
  { href: '/rules',       label: 'Reglas',    color: 'text-emerald-400 bg-emerald-500/10' },
  { href: '/premios',     label: 'Premios',   color: 'text-yellow-400  bg-yellow-500/10'  },
  { href: '/profile',     label: 'Perfil',    color: 'text-slate-200   bg-white/10'        },
]

export default function Header() {
  const pathname = usePathname()
  const [user, setUser] = useState<UserInfo | null | undefined>(undefined) // undefined = loading
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) { setUser(null); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', authUser.id)
        .single()
      setUser({
        display_name: profile?.display_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        email: authUser.email ?? null,
      })
    })
  }, [])

  const initials = (user?.display_name ?? user?.email ?? '?')[0].toUpperCase()

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-2" aria-label="El Futbolero — inicio">
          <span className="text-xl" aria-hidden="true">⚽</span>
          <span className="text-base font-bold text-white tracking-tight hidden sm:block">El Futbolero</span>
        </Link>

        {/* Nav — scrollable on mobile with right fade hint */}
        <nav className="relative flex-1 min-w-0" aria-label="Navegación principal">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map(({ href, label, color }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                    active
                      ? `${color}`
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>
          {/* Right fade to hint overflow */}
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-slate-950/90 to-transparent pointer-events-none" aria-hidden="true" />
        </nav>

        {/* User */}
        <div className="shrink-0 flex items-center gap-2">
          {user === undefined ? (
            <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
          ) : user ? (
            <>
              <Avatar url={user.avatar_url} name={user.display_name ?? user.email} size={32} />
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block focus-visible:outline-none focus-visible:underline"
                >
                  Salir
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-white/10 border border-white/10 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Ingresar
            </Link>
          )}
        </div>

      </div>
    </header>
  )
}
