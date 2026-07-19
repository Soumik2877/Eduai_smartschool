'use client'
import { useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'

export default function PreviewLauncher({ userId, dest }: { userId: string; dest: string }) {
  const [loading, setLoading] = useState(false)

  async function launch() {
    setLoading(true)
    await fetch('/api/admin/preview-as', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    // Hard navigation so the shared dashboard layout re-renders (sidebar + banner).
    window.location.assign(dest)
  }

  return (
    <button onClick={launch} disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-extrabold transition-colors backdrop-blur-sm">
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
      Open full dashboard
    </button>
  )
}
