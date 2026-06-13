'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SUBJECT_COLORS } from '@/lib/utils'
import type { Subject } from '@/types/database.types'

export default function SubjectsPage() {
  const supabase = createClient()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [form, setForm] = useState({ name: '', color: SUBJECT_COLORS[0], difficulty: '3' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await (supabase.from('subjects') as any).select('*').eq('user_id', session.user.id).order('name')
    setSubjects(data ?? [])
  }

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await (supabase.from('subjects') as any).insert({ user_id: session.user.id, name: form.name, color: form.color, difficulty: +form.difficulty })
    setForm({ name: '', color: SUBJECT_COLORS[0], difficulty: '3' })
    load()
    setLoading(false)
  }

  async function remove(id: string) {
    await (supabase.from('subjects') as any).delete().eq('id', id)
    load()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Subjects</h1>

      <form onSubmit={add} className="card p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Add Subject</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Subject Name</label>
            <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Mathematics" />
          </div>
          <div>
            <label className="label">Difficulty (1–5)</label>
            <input type="number" className="input" min="1" max="5" value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="label">Color</label>
          <div className="flex gap-2 flex-wrap">
            {SUBJECT_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">Add Subject</button>
      </form>

      <div className="card divide-y divide-gray-50">
        {subjects.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No subjects yet. Add your first subject above.</div>
        ) : subjects.map(s => (
          <div key={s.id} className="flex items-center gap-4 p-4">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{s.name}</p>
              <p className="text-xs text-gray-400">Difficulty: {'★'.repeat(s.difficulty)}{'☆'.repeat(5 - s.difficulty)}</p>
            </div>
            <button onClick={() => remove(s.id)} className="text-gray-300 hover:text-red-400 transition-colors text-lg">×</button>
          </div>
        ))}
      </div>
    </div>
  )
}
