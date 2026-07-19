import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/viewer'
import AdminCharts from './AdminCharts'

export const metadata = { title: 'School Analytics - EduAI Admin' }

export default async function AdminAnalytics() {
  const admin = await requireAdmin()
  if (!admin) redirect('/dashboard')
  const svc = admin.svc as any

  const [{ data: profiles }, { data: classes }, { data: perf }, { data: quizzes }, { data: focus }] = await Promise.all([
    svc.from('profiles').select('id, class_id, role'),
    svc.from('classes').select('id, name'),
    svc.from('performance_records').select('user_id, score, max_score, subjects(name)'),
    svc.from('quiz_sessions').select('score, total_questions, created_at').eq('completed', true),
    svc.from('focus_sessions').select('duration_minutes, user_id, created_at').eq('completed', true).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
  ])

  const studentClass: Record<string, string> = {}
  for (const p of profiles ?? []) if (p.role === 'student' && p.class_id) studentClass[p.id] = p.class_id
  const classMap: Record<string, string> = Object.fromEntries((classes ?? []).map((c: any) => [c.id, c.name]))

  // per-class performance
  const classAgg: Record<string, { t: number; m: number }> = {}
  const subjAgg: Record<string, { t: number; m: number }> = {}
  const studentAgg: Record<string, { t: number; m: number }> = {}
  for (const r of perf ?? []) {
    const cid = studentClass[r.user_id]
    if (cid) { classAgg[cid] ??= { t: 0, m: 0 }; classAgg[cid].t += Number(r.score); classAgg[cid].m += Number(r.max_score) }
    studentAgg[r.user_id] ??= { t: 0, m: 0 }; studentAgg[r.user_id].t += Number(r.score); studentAgg[r.user_id].m += Number(r.max_score)
    const n = r.subjects?.name
    if (n) { subjAgg[n] ??= { t: 0, m: 0 }; subjAgg[n].t += Number(r.score); subjAgg[n].m += Number(r.max_score) }
  }

  const classComparison = Object.entries(classAgg).map(([id, v]) => ({
    name: (classMap[id] ?? 'Class').replace('Class ', '').replace(' - Science', ' Sci'), avg: Math.round((v.t / v.m) * 100),
  }))
  const subjectAverages = Object.entries(subjAgg).map(([name, v]) => ({ name, avg: Math.round((v.t / v.m) * 100) })).sort((a, b) => b.avg - a.avg)

  // distribution
  const buckets = [{ name: '<40', min: 0, max: 40 }, { name: '40-55', min: 40, max: 55 }, { name: '55-70', min: 55, max: 70 }, { name: '70-85', min: 70, max: 85 }, { name: '85-100', min: 85, max: 101 }]
  const distribution = buckets.map(b => ({ name: b.name, count: 0 }))
  for (const v of Object.values(studentAgg)) {
    if (!v.m) continue
    const p = (v.t / v.m) * 100
    const idx = buckets.findIndex(b => p >= b.min && p < b.max)
    if (idx >= 0) distribution[idx].count++
  }

  // quiz trend (school avg per day)
  const dateMap: Record<string, { t: number; c: number }> = {}
  for (const q of quizzes ?? []) {
    const d = new Date(q.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    dateMap[d] ??= { t: 0, c: 0 }
    dateMap[d].t += ((q.score ?? 0) / q.total_questions) * 100; dateMap[d].c++
  }
  const quizTrend = Object.entries(dateMap).map(([label, v]) => ({ label, avg: Math.round(v.t / v.c) })).slice(-14)

  // focus by class (avg mins/student over 30d)
  const focusByClassAgg: Record<string, number> = {}
  for (const f of focus ?? []) { const cid = studentClass[f.user_id]; if (cid) focusByClassAgg[cid] = (focusByClassAgg[cid] ?? 0) + f.duration_minutes }
  const studentsPerClass: Record<string, number> = {}
  for (const p of profiles ?? []) if (p.role === 'student' && p.class_id) studentsPerClass[p.class_id] = (studentsPerClass[p.class_id] ?? 0) + 1
  const focusByClass = Object.entries(focusByClassAgg).map(([id, mins]) => ({
    name: (classMap[id] ?? 'Class').replace('Class ', '').replace(' - Science', ' Sci'),
    mins: Math.round(mins / 60 / (studentsPerClass[id] || 1)),
  }))

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">School Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Class and subject performance, grade distribution, and engagement trends across the whole school.</p>
      </div>
      <AdminCharts
        classComparison={classComparison}
        subjectAverages={subjectAverages}
        distribution={distribution}
        quizTrend={quizTrend}
        focusByClass={focusByClass}
      />
    </div>
  )
}
