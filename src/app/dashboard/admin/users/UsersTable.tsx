'use client'
import { useState, useMemo } from 'react'
import { Search, Eye, Loader2 } from 'lucide-react'

interface U {
  id: string; full_name: string; email: string; role: string
  enrollment_no: string | null; teacher_id: string | null; class_name: string | null
  xp_points: number; streak_days: number
}

const ROLES = ['all', 'student', 'teacher', 'parent', 'admin']
const roleStyle: Record<string, string> = {
  student: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  teacher: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  parent: 'bg-amber-50 text-amber-700 border-amber-200',
  admin: 'bg-rose-50 text-rose-700 border-rose-200',
}

export default function UsersTable({ users }: { users: U[] }) {
  const [q, setQ] = useState('')
  const [role, setRole] = useState('all')
  const [previewing, setPreviewing] = useState<string | null>(null)

  const filtered = useMemo(() => users.filter(u => {
    if (role !== 'all' && u.role !== role) return false
    if (!q) return true
    const s = q.toLowerCase()
    return u.full_name.toLowerCase().includes(s) || (u.email ?? '').toLowerCase().includes(s) ||
      (u.enrollment_no ?? '').toLowerCase().includes(s) || (u.teacher_id ?? '').toLowerCase().includes(s)
  }), [users, q, role])

  async function preview(u: U) {
    if (u.role === 'admin') return
    setPreviewing(u.id)
    await fetch('/api/admin/preview-as', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: u.id }),
    })
    const dest = u.role === 'teacher' ? '/dashboard/teacher' : u.role === 'parent' ? '/dashboard/parent' : '/dashboard'
    // Hard navigation so the shared dashboard layout re-renders (sidebar + banner).
    window.location.assign(dest)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, email, enrollment or teacher ID…"
            className="input pl-9 w-full" />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {ROLES.map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${role === r ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-400 font-semibold text-xs uppercase tracking-wide">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Class</th>
              <th className="py-3 px-4">XP</th>
              <th className="py-3 px-4 text-right">Preview</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50/70 transition-colors">
                <td className="py-2.5 px-4">
                  <div className="font-bold text-gray-900">{u.full_name}</div>
                  <div className="text-[11px] text-gray-400">{u.email}</div>
                </td>
                <td className="py-2.5 px-4"><span className={`badge border text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${roleStyle[u.role] ?? ''}`}>{u.role}</span></td>
                <td className="py-2.5 px-4 text-gray-500 font-mono text-xs">{u.enrollment_no || u.teacher_id || '—'}</td>
                <td className="py-2.5 px-4 text-gray-500 text-xs">{u.class_name?.replace(' - Science', ' Sci') ?? '—'}</td>
                <td className="py-2.5 px-4 text-gray-600 font-semibold">{u.xp_points}</td>
                <td className="py-2.5 px-4 text-right">
                  {u.role === 'admin' ? <span className="text-xs text-gray-300">—</span> : (
                    <button onClick={() => preview(u)} disabled={previewing === u.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand/10 text-brand font-bold rounded-lg text-xs hover:bg-brand/20 transition-colors">
                      {previewing === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                      View as
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-sm italic">No users match your filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
