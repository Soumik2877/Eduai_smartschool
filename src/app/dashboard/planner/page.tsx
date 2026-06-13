'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { StudySession, Subject } from '@/types/database.types'
import { formatDate } from '@/lib/utils'

export default function PlannerPage() {
  const supabase = createClient()
  const [sessions, setSessions] = useState<(StudySession & { subjects: Subject | null })[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ subject_id: '', date: selectedDate, start_time: '09:00', end_time: '10:00', session_type: 'study' })
  const [aiPrompt, setAiPrompt] = useState({ study_hours: '4', exam_date: '', weak_subjects: '' })
  const [aiPlan, setAiPlan] = useState('')

  useEffect(() => { load() }, [selectedDate])

  async function load() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const [{ data: s }, { data: subj }] = await Promise.all([
      (supabase.from('study_sessions') as any).select('*, subjects(*)').eq('user_id', session.user.id).eq('date', selectedDate).order('start_time'),
      supabase.from('subjects').select('*').eq('user_id', session.user.id),
    ])
    setSessions((s ?? []) as any)
    setSubjects(subj ?? [])
    setLoading(false)
  }

  async function addSession(e: React.FormEvent) {
    e.preventDefault()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const start = new Date(`2000-01-01T${form.start_time}`)
    const end = new Date(`2000-01-01T${form.end_time}`)
    const duration = (end.getTime() - start.getTime()) / 60000
    await (supabase.from('study_sessions') as any).insert({
      user_id: session.user.id,
      subject_id: form.subject_id || null,
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time,
      duration_minutes: duration,
      session_type: form.session_type as any,
    })
    setShowForm(false)
    load()
  }

  async function toggleComplete(id: string, completed: boolean) {
    await (supabase.from('study_sessions') as any).update({ completed: !completed }).eq('id', id)
    load()
  }

  async function generateAIPlan() {
    setAiLoading(true)
    const subjectNames = subjects.map(s => s.name).join(', ')
    const res = await fetch('/api/planner/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...aiPrompt, subjects: subjectNames }),
    })
    const data = await res.json()
    setAiPlan(data.plan ?? '')
    setAiLoading(false)
  }

  const sessionTypes = { study: 'bg-blue-100 text-blue-700', revision: 'bg-purple-100 text-purple-700', practice: 'bg-green-100 text-green-700', break: 'bg-gray-100 text-gray-600' }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Study Planner</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Add Session</button>
      </div>

      <div className="flex items-center gap-4">
        <input type="date" className="input w-auto" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
        <span className="text-sm text-gray-500">{formatDate(selectedDate)}</span>
      </div>

      {showForm && (
        <form onSubmit={addSession} className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">New Session</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Subject</label>
              <select className="input" value={form.subject_id} onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))}>
                <option value="">General</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.session_type} onChange={e => setForm(p => ({ ...p, session_type: e.target.value }))}>
                <option value="study">Study</option>
                <option value="revision">Revision</option>
                <option value="practice">Practice</option>
                <option value="break">Break</option>
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="label">Start</label>
                <input type="time" className="input" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} />
              </div>
              <div className="flex-1">
                <label className="label">End</label>
                <input type="time" className="input" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {/* Sessions list */}
      <div className="card divide-y divide-gray-50">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No sessions for this day</div>
        ) : sessions.map(s => (
          <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
            <button onClick={() => toggleComplete(s.id, s.completed)} className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${s.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'}`} />
            <div className="w-0.5 h-10 rounded-full" style={{ backgroundColor: (s as any).subjects?.color ?? '#4F46E5' }} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${s.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{(s as any).subjects?.name ?? 'General'}</p>
              <p className="text-xs text-gray-500">{s.start_time} – {s.end_time} · {s.duration_minutes}min</p>
            </div>
            <span className={`badge ${(sessionTypes as any)[s.session_type] ?? 'bg-gray-100 text-gray-600'}`}>{s.session_type}</span>
          </div>
        ))}
      </div>

      {/* AI Plan Generator */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">🤖 AI Study Plan Generator</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label">Daily Hours</label>
            <input type="number" className="input" min="1" max="16" value={aiPrompt.study_hours} onChange={e => setAiPrompt(p => ({ ...p, study_hours: e.target.value }))} />
          </div>
          <div>
            <label className="label">Exam Date</label>
            <input type="date" className="input" value={aiPrompt.exam_date} onChange={e => setAiPrompt(p => ({ ...p, exam_date: e.target.value }))} />
          </div>
          <div>
            <label className="label">Weak Topics</label>
            <input className="input" placeholder="e.g. Integration, Organic" value={aiPrompt.weak_subjects} onChange={e => setAiPrompt(p => ({ ...p, weak_subjects: e.target.value }))} />
          </div>
        </div>
        <button onClick={generateAIPlan} disabled={aiLoading} className="btn-primary">
          {aiLoading ? 'Generating…' : 'Generate Plan'}
        </button>
        {aiPlan && (
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">{aiPlan}</div>
        )}
      </div>
    </div>
  )
}
