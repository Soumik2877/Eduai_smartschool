'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Subject } from '@/types/database.types'

type TimerMode = 'study' | 'break'

export default function FocusPage() {
  const supabase = createClient()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [studyMins, setStudyMins] = useState(25)
  const [breakMins, setBreakMins] = useState(5)
  const [mode, setMode] = useState<TimerMode>('study')
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [totalFocusToday, setTotalFocusToday] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const today = new Date().toISOString().split('T')[0]
    const [{ data: s }, { data: f }] = await Promise.all([
      supabase.from('subjects').select('*').eq('user_id', session.user.id),
      (supabase.from('focus_sessions') as any).select('duration_minutes').eq('user_id', session.user.id).eq('completed', true).gte('created_at', `${today}T00:00:00`),
    ])
    setSubjects(s ?? [])
    setTotalFocusToday(((f ?? []) as any[]).reduce((s: number, item: any) => s + item.duration_minutes, 0))
  }

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!)
            handleTimerEnd()
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current!)
    }
    return () => clearInterval(intervalRef.current!)
  }, [running, mode])

  async function handleTimerEnd() {
    setRunning(false)
    if (mode === 'study') {
      setSessions(s => s + 1)
      setTotalFocusToday(t => t + studyMins)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await (supabase.from('focus_sessions') as any).insert({
          user_id: session.user.id,
          subject_id: subjectId || null,
          duration_minutes: studyMins,
          break_minutes: breakMins,
          completed: true,
        }).select().single()
        if (data) sessionIdRef.current = data.id
        await supabase.rpc('increment_xp', { uid: session.user.id, amount: 10 } as any)
      }
      new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA==').play().catch(() => {})
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Study session complete! 🎉', { body: 'Time for a break.' })
      }
      setMode('break')
      setSeconds(breakMins * 60)
    } else {
      setMode('study')
      setSeconds(studyMins * 60)
    }
  }

  function toggle() {
    if (!running) {
      Notification.requestPermission()
      if (seconds === 0) setSeconds((mode === 'study' ? studyMins : breakMins) * 60)
    }
    setRunning(r => !r)
  }

  function reset() {
    setRunning(false)
    setMode('study')
    setSeconds(studyMins * 60)
  }

  const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')
  const total = mode === 'study' ? studyMins * 60 : breakMins * 60
  const progress = ((total - seconds) / total) * 100
  const circumference = 2 * Math.PI * 90

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Focus Timer</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-brand">{sessions}</p>
          <p className="text-xs text-gray-500">Sessions today</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{totalFocusToday}m</p>
          <p className="text-xs text-gray-500">Focus today</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-orange-500">{sessions * 10}</p>
          <p className="text-xs text-gray-500">XP earned</p>
        </div>
      </div>

      <div className="card p-8 text-center">
        <div className="flex items-center justify-center gap-4 mb-6">
          {(['study', 'break'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setRunning(false); setSeconds((m === 'study' ? studyMins : breakMins) * 60) }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${mode === m ? (m === 'study' ? 'bg-brand text-white' : 'bg-green-500 text-white') : 'bg-gray-100 text-gray-600'}`}>
              {m === 'study' ? '📚 Study' : '☕ Break'}
            </button>
          ))}
        </div>

        <div className="relative inline-flex items-center justify-center mb-6">
          <svg className="w-52 h-52 -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#f3f4f6" strokeWidth="8" />
            <circle cx="100" cy="100" r="90" fill="none" stroke={mode === 'study' ? '#4F46E5' : '#22c55e'} strokeWidth="8"
              strokeDasharray={circumference} strokeDashoffset={circumference - (circumference * progress / 100)}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="absolute text-center">
            <div className="text-4xl font-bold text-gray-900 font-mono">{mins}:{secs}</div>
            <div className="text-sm text-gray-500 capitalize">{mode}</div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          <button onClick={toggle} className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-colors ${running ? 'bg-red-100 hover:bg-red-200' : 'bg-brand hover:bg-brand-dark'}`}>
            {running ? '⏸' : '▶'}
          </button>
          <button onClick={reset} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl transition-colors">↺</button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label text-xs">Study (min)</label>
            <input type="number" className="input text-center" min="1" max="90" value={studyMins} onChange={e => { setStudyMins(+e.target.value); if (!running && mode === 'study') setSeconds(+e.target.value * 60) }} />
          </div>
          <div>
            <label className="label text-xs">Break (min)</label>
            <input type="number" className="input text-center" min="1" max="30" value={breakMins} onChange={e => { setBreakMins(+e.target.value); if (!running && mode === 'break') setSeconds(+e.target.value * 60) }} />
          </div>
          <div>
            <label className="label text-xs">Subject</label>
            <select className="input text-xs" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
              <option value="">None</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Quick Modes</h2>
        <div className="grid grid-cols-2 gap-3">
          {[{ label: '🎯 Deep Work', study: 50, brk: 10 }, { label: '⚡ Power Session', study: 25, brk: 5 }, { label: '📖 Exam Prep', study: 45, brk: 15 }, { label: '💨 Quick Review', study: 15, brk: 3 }].map(m => (
            <button key={m.label} onClick={() => { setStudyMins(m.study); setBreakMins(m.brk); setMode('study'); setSeconds(m.study * 60); setRunning(false) }}
              className="p-3 border border-gray-200 rounded-lg hover:border-brand hover:bg-brand/5 text-sm text-left transition-colors">
              <p className="font-medium text-gray-900">{m.label}</p>
              <p className="text-xs text-gray-500">{m.study}min + {m.brk}min break</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
