'use client'
import { useState } from 'react'

export default function CareerPage() {
  const [form, setForm] = useState({ interests: '', strengths: '', class: '12', stream: 'Science' })
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/career/guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setResult(data.guidance ?? '')
    setLoading(false)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">🎓 AI Career Guidance</h1>

      <form onSubmit={generate} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Class / Grade</label>
            <select className="input" value={form.class} onChange={e => setForm(p => ({ ...p, class: e.target.value }))}>
              {['8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Stream</label>
            <select className="input" value={form.stream} onChange={e => setForm(p => ({ ...p, stream: e.target.value }))}>
              {['Science','Commerce','Arts','PCM','PCB'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Your Interests</label>
          <input className="input" value={form.interests} onChange={e => setForm(p => ({ ...p, interests: e.target.value }))} required placeholder="e.g. coding, drawing, biology, sports" />
        </div>
        <div>
          <label className="label">Your Strengths</label>
          <input className="input" value={form.strengths} onChange={e => setForm(p => ({ ...p, strengths: e.target.value }))} required placeholder="e.g. problem solving, communication, maths" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
          {loading ? 'Analyzing…' : '🚀 Get Career Guidance'}
        </button>
      </form>

      {result && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Your Personalized Career Roadmap</h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{result}</pre>
        </div>
      )}
    </div>
  )
}
