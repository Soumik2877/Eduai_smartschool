'use client'
import { useState } from 'react'
import { Eye, LogOut, Loader2 } from 'lucide-react'

export default function PreviewBanner({ name, role }: { name: string; role: string }) {
  const [loading, setLoading] = useState(false)

  async function exit() {
    setLoading(true)
    await fetch('/api/admin/preview-as', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clear: true }),
    })
    // Hard navigation so the shared dashboard layout re-renders back to admin.
    window.location.assign('/dashboard/admin')
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-500 text-amber-950 px-5 py-2.5 text-sm font-bold shadow-sm">
      <span className="flex items-center gap-2">
        <Eye className="w-4 h-4" />
        Read-only preview — viewing <span className="underline underline-offset-2">{name}</span>
        <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-950/15 text-[10px] uppercase tracking-wider">{role}</span>
      </span>
      <button
        onClick={exit}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950 text-amber-50 text-xs font-extrabold hover:bg-amber-900 transition-colors"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
        Exit preview
      </button>
    </div>
  )
}
