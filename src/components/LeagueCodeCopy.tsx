'use client'

import { useState } from 'react'

export default function LeagueCodeCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg px-3 py-1.5 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      aria-label={copied ? 'Código copiado' : `Copiar código ${code}`}
    >
      <span className="font-mono text-purple-400 text-sm tracking-widest">{code}</span>
      <span className="text-slate-400 group-hover:text-white transition-colors" aria-hidden="true">
        {copied ? '✓' : '⎘'}
      </span>
    </button>
  )
}
