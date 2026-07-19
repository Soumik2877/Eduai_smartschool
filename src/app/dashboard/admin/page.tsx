import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/viewer'
import { Users, GraduationCap, UserCog, School, TrendingUp, AlertTriangle, Trophy, ArrowUpRight, Sparkles } from 'lucide-react'

export const metadata = { title: 'Admin Overview - EduAI' }

export default async function AdminOverview() {
  const admin = await requireAdmin()
  if (!admin) redirect('/dashboard')
  const svc = admin.svc as any

  const [{ data: profiles }, { data: classes }, { data: perf }, { data: logs }] = await Promise.all([
    svc.from('profiles').select('id, full_name, role, xp_points, streak_days, class_id, enrollment_no'),
    svc.from('classes').select('id, name'),
    svc.from('performance_records').select('user_id, score, max_score, subjects(name)'),
    svc.from('student_logs').select('log_type, content, created_at, student:student_id(full_name), teacher:teacher_id(full_name)').order('created_at', { ascending: false }).limit(6),
  ])

  const all = profiles ?? []
  const students = all.filter((p: any) => p.role === 'student')
  const teachers = all.filter((p: any) => p.role === 'teacher')
  const parents = all.filter((p: any) => p.role === 'parent')
  const classMap: Record<string, string> = Object.fromEntries((classes ?? []).map((c: any) => [c.id, c.name]))

  // school-wide + per-student performance
  const perfByStudent: Record<string, { t: number; m: number }> = {}
  const subjAgg: Record<string, { t: number; m: number }> = {}
  let totT = 0, totM = 0
  for (const r of perf ?? []) {
    totT += Number(r.score); totM += Number(r.max_score)
    perfByStudent[r.user_id] ??= { t: 0, m: 0 }
    perfByStudent[r.user_id].t += Number(r.score); perfByStudent[r.user_id].m += Number(r.max_score)
    const n = r.subjects?.name
    if (n) { subjAgg[n] ??= { t: 0, m: 0 }; subjAgg[n].t += Number(r.score); subjAgg[n].m += Number(r.max_score) }
  }
  const schoolAvg = totM ? Math.round((totT / totM) * 100) : 0
  const pct = (id: string) => { const v = perfByStudent[id]; return v && v.m ? Math.round((v.t / v.m) * 100) : null }

  // enrollment by class
  const enrollByClass = (classes ?? []).map((c: any) => ({
    label: c.name.replace('Class ', '').replace(' - Science', ' Sci'),
    value: students.filter((s: any) => s.class_id === c.id).length,
  }))

  const subjectAverages = Object.entries(subjAgg)
    .map(([name, v]) => ({ label: name.length > 10 ? name.slice(0, 8) + '…' : name, value: Math.round((v.t / v.m) * 100) }))
    .sort((a, b) => b.value - a.value)

  const withPct = students.map((s: any) => ({ ...s, pct: pct(s.id) })).filter((s: any) => s.pct !== null)
  const topPerformers = [...withPct].sort((a, b) => b.pct - a.pct).slice(0, 5)
  const atRisk = [...withPct].filter((s: any) => s.pct < 50).sort((a, b) => a.pct - b.pct).slice(0, 6)

  const kpis = [
    { label: 'Students', value: students.length, icon: <Users className="w-5 h-5" />, tone: 'from-indigo-500/10 border-indigo-200 text-indigo-800', ic: 'bg-indigo-100 text-indigo-600' },
    { label: 'Teachers', value: teachers.length, icon: <GraduationCap className="w-5 h-5" />, tone: 'from-emerald-500/10 border-emerald-200 text-emerald-800', ic: 'bg-emerald-100 text-emerald-600' },
    { label: 'Parents', value: parents.length, icon: <UserCog className="w-5 h-5" />, tone: 'from-amber-500/10 border-amber-200 text-amber-800', ic: 'bg-amber-100 text-amber-600' },
    { label: 'Classes', value: (classes ?? []).length, icon: <School className="w-5 h-5" />, tone: 'from-purple-500/10 border-purple-200 text-purple-800', ic: 'bg-purple-100 text-purple-600' },
    { label: 'School Avg', value: `${schoolAvg}%`, icon: <TrendingUp className="w-5 h-5" />, tone: 'from-rose-500/10 border-rose-200 text-rose-800', ic: 'bg-rose-100 text-rose-600' },
  ]

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8 rounded-3xl border border-indigo-800/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3" />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/15 mb-2">🛡️ Administrator Console</span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Air Force School Kalaikunda</h1>
          <p className="text-indigo-200/75 text-sm font-medium mt-1">Session 2026–27 · School-wide overview of every role, class, and subject.</p>
          <Link href="/dashboard/admin/preview" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-white text-indigo-900 rounded-xl text-xs font-extrabold hover:bg-indigo-50 transition-colors">
            🪟 Open Role Preview <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map(k => (
          <div key={k.label} className={`card p-5 bg-gradient-to-br border flex items-center gap-3 ${k.tone}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${k.ic}`}>{k.icon}</div>
            <div>
              <div className="text-2xl font-black">{k.value}</div>
              <div className="text-[10px] font-extrabold uppercase tracking-wide opacity-70">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-extrabold text-gray-900 text-base mb-4">Enrollment by Class</h2>
          <BarRow data={enrollByClass} suffix="" color="#4F46E5" />
        </div>
        <div className="card p-6">
          <h2 className="font-extrabold text-gray-900 text-base mb-4">Average Score by Subject (%)</h2>
          <BarRow data={subjectAverages} suffix="%" color="#10B981" />
        </div>
      </div>

      {/* TOP + AT RISK */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6 space-y-3">
          <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Top Performers</h2>
          {topPerformers.map((s: any, i: number) => (
            <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/50 border border-slate-100">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-amber-400 text-amber-950' : 'bg-slate-200 text-slate-700'}`}>{i + 1}</span>
              <span className="font-bold text-gray-800 text-sm flex-1">{s.full_name}</span>
              <span className="text-xs text-gray-400">{classMap[s.class_id]?.replace(' - Science', '') ?? '—'}</span>
              <span className="badge bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-xs px-2 py-0.5 rounded-md">{s.pct}%</span>
            </div>
          ))}
          {!topPerformers.length && <Empty />}
        </div>

        <div className="card p-6 space-y-3 bg-rose-50/30 border-rose-100">
          <h2 className="font-extrabold text-rose-950 text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-500" /> Students Needing Support (&lt;50%)</h2>
          {atRisk.map((s: any) => (
            <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-rose-100">
              <span className="font-bold text-gray-800 text-sm flex-1">{s.full_name}</span>
              <span className="text-xs text-gray-400">{s.enrollment_no}</span>
              <span className="badge bg-rose-100 border border-rose-200 text-rose-700 font-extrabold text-xs px-2 py-0.5 rounded-md">{s.pct}%</span>
            </div>
          ))}
          {!atRisk.length && <p className="text-sm text-gray-500">No students below the benchmark. 🎉</p>}
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="card p-6 space-y-3">
        <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand" /> Recent Teacher Activity</h2>
        {(logs ?? []).map((l: any, i: number) => (
          <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0 border-slate-100 text-sm">
            <span className="text-[9px] uppercase font-black text-white bg-brand/80 rounded px-1.5 py-0.5 mt-0.5">{l.log_type}</span>
            <p className="text-gray-600 flex-1"><strong className="text-gray-800">{l.teacher?.full_name ?? 'Teacher'}</strong> on <strong className="text-gray-800">{l.student?.full_name ?? 'a student'}</strong>: {l.content}</p>
          </div>
        ))}
        {!(logs ?? []).length && <Empty />}
      </div>
    </div>
  )
}

function BarRow({ data, suffix, color }: { data: { label: string; value: number }[]; suffix: string; color: string }) {
  if (!data.length) return <Empty />
  const max = Math.max(1, ...data.map(d => d.value))
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-16 text-xs font-bold text-gray-500 text-right shrink-0">{d.label}</span>
          <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
            <div className="h-full rounded-full flex items-center justify-end px-2" style={{ width: `${Math.max((d.value / max) * 100, 8)}%`, backgroundColor: color }}>
              <span className="text-[10px] font-black text-white">{d.value}{suffix}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
function Empty() { return <div className="text-xs text-gray-400 italic py-6 text-center">No data yet — run the seed script.</div> }
