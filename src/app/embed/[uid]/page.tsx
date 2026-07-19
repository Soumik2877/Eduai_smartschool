import { resolveViewer } from '@/lib/viewer'
import { Zap, Flame, Clock, FileText, Users, BookMarked, ClipboardList, GraduationCap } from 'lucide-react'

export const metadata = { title: 'Dashboard Preview - EduAI' }

// Read-only, chrome-free snapshot of any user's dashboard. Admin-only.
// Used inside iframes on the admin "Role Preview" page so judges see all
// role dashboards side-by-side on one screen.
export default async function EmbedPreview({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params
  const viewer = await resolveViewer(uid)

  if (!viewer || !viewer.isAdmin) {
    return <div className="p-6 text-sm text-rose-600 font-semibold">Forbidden — admin preview only.</div>
  }
  if (!viewer.isPreview) {
    return <div className="p-6 text-sm text-gray-500">User not found.</div>
  }

  const db = viewer.db as any
  const id = viewer.userId
  const role = viewer.role
  const p = viewer.profile

  const Tile = ({ icon, label, value, tone }: any) => (
    <div className={`rounded-2xl border p-3.5 flex items-center gap-3 ${tone}`}>
      <div className="w-9 h-9 rounded-xl bg-white/70 border flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-lg font-black leading-none">{value}</div>
        <div className="text-[10px] font-bold uppercase tracking-wide opacity-70 mt-1">{label}</div>
      </div>
    </div>
  )

  const Bars = ({ data, unit }: { data: { label: string; value: number }[]; unit?: string }) => {
    const max = Math.max(1, ...data.map(d => d.value))
    return (
      <div className="flex items-end gap-2 h-32 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-brand/80 rounded-t-md transition-all" style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 4 : 0 }} title={`${d.value}${unit ?? ''}`} />
            <span className="text-[9px] text-gray-400 font-semibold">{d.label}</span>
          </div>
        ))}
      </div>
    )
  }

  // ---------------------------------------------------------------- STUDENT
  if (role === 'student') {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const [{ data: focus }, { data: quizzes }, { data: perf }] = await Promise.all([
      db.from('focus_sessions').select('duration_minutes, created_at').eq('user_id', id).eq('completed', true).gte('created_at', sevenDaysAgo),
      db.from('quiz_sessions').select('score, total_questions, topic, created_at').eq('user_id', id).eq('completed', true).order('created_at', { ascending: false }).limit(10),
      db.from('performance_records').select('score, max_score, subjects(name)').eq('user_id', id).limit(60),
    ])

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86400000)
      return { label: d.toLocaleDateString('en-IN', { weekday: 'narrow' }), iso: d.toISOString().split('T')[0], value: 0 }
    })
    for (const f of focus ?? []) { const day = days.find(x => x.iso === f.created_at.split('T')[0]); if (day) day.value += f.duration_minutes }
    const weeklyHrs = ((focus ?? []).reduce((s: number, f: any) => s + f.duration_minutes, 0) / 60).toFixed(1)
    const quizArr = (quizzes ?? []).slice().reverse().map((q: any, i: number) => ({ label: `Q${i + 1}`, value: Math.round(((q.score ?? 0) / q.total_questions) * 100) }))
    const avgQuiz = quizArr.length ? Math.round(quizArr.reduce((s: number, q: any) => s + q.value, 0) / quizArr.length) : 0

    const subjMap: Record<string, { t: number; m: number }> = {}
    for (const r of perf ?? []) { const n = r.subjects?.name; if (!n) continue; subjMap[n] ??= { t: 0, m: 0 }; subjMap[n].t += Number(r.score); subjMap[n].m += Number(r.max_score) }
    const subjects = Object.entries(subjMap).map(([label, v]) => ({ label: label.slice(0, 4), value: Math.round((v.t / v.m) * 100) }))

    return (
      <div className="space-y-4">
        <Header role="Student" name={p?.full_name} />
        <div className="grid grid-cols-2 gap-2.5">
          <Tile icon={<Zap className="w-4 h-4 text-amber-600" />} label="XP" value={p?.xp_points ?? 0} tone="bg-amber-50 border-amber-200 text-amber-900" />
          <Tile icon={<Flame className="w-4 h-4 text-orange-600" />} label="Streak" value={`${p?.streak_days ?? 0}d`} tone="bg-orange-50 border-orange-200 text-orange-900" />
          <Tile icon={<Clock className="w-4 h-4 text-emerald-600" />} label="Focus 7d" value={`${weeklyHrs}h`} tone="bg-emerald-50 border-emerald-200 text-emerald-900" />
          <Tile icon={<FileText className="w-4 h-4 text-indigo-600" />} label="Avg Quiz" value={`${avgQuiz}%`} tone="bg-indigo-50 border-indigo-200 text-indigo-900" />
        </div>
        <Card title="Weekly Focus (minutes)"><Bars data={days.map(d => ({ label: d.label, value: d.value }))} unit=" min" /></Card>
        <Card title="Subject Performance (%)">{subjects.length ? <Bars data={subjects} unit="%" /> : <Empty />}</Card>
      </div>
    )
  }

  // ---------------------------------------------------------------- TEACHER
  if (role === 'teacher') {
    const [{ data: tc }, { data: notes }, { data: logs }] = await Promise.all([
      db.from('teacher_classes').select('class_id').eq('teacher_id', id),
      db.from('notes').select('title, subject_name, created_at').eq('teacher_id', id).order('created_at', { ascending: false }).limit(5),
      db.from('student_logs').select('log_type, content, profiles:student_id(full_name)').eq('teacher_id', id).order('created_at', { ascending: false }).limit(5),
    ])
    const classIds = (tc ?? []).map((x: any) => x.class_id)
    const { count: studentCount } = await db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').in('class_id', classIds.length ? classIds : ['00000000-0000-0000-0000-000000000000'])

    return (
      <div className="space-y-4">
        <Header role="Teacher" name={p?.full_name} />
        <div className="grid grid-cols-2 gap-2.5">
          <Tile icon={<Users className="w-4 h-4 text-brand" />} label="Students" value={studentCount ?? 0} tone="bg-indigo-50 border-indigo-200 text-indigo-900" />
          <Tile icon={<GraduationCap className="w-4 h-4 text-emerald-600" />} label="Classes" value={classIds.length} tone="bg-emerald-50 border-emerald-200 text-emerald-900" />
        </div>
        <Card title="Recent Study Notes">
          {(notes ?? []).length ? (notes ?? []).map((n: any, i: number) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b last:border-0 border-slate-100 text-xs">
              <BookMarked className="w-3.5 h-3.5 text-brand" /><span className="font-bold text-gray-800">{n.title}</span>
              {n.subject_name && <span className="ml-auto text-[10px] text-gray-400">{n.subject_name}</span>}
            </div>
          )) : <Empty />}
        </Card>
        <Card title="Recent Observations">
          {(logs ?? []).length ? (logs ?? []).map((l: any, i: number) => (
            <div key={i} className="py-1.5 border-b last:border-0 border-slate-100 text-xs">
              <span className="font-bold text-gray-800">{l.profiles?.full_name ?? 'Student'}</span>
              <span className="ml-1 text-[9px] uppercase text-gray-400">{l.log_type}</span>
              <p className="text-gray-500 mt-0.5 line-clamp-1">{l.content}</p>
            </div>
          )) : <Empty />}
        </Card>
      </div>
    )
  }

  // ---------------------------------------------------------------- PARENT
  if (role === 'parent') {
    const { data: kids } = await db.from('profiles').select('full_name, xp_points, streak_days').eq('parent_id', id)
    return (
      <div className="space-y-4">
        <Header role="Parent" name={p?.full_name} />
        <Card title="Linked Children">
          {(kids ?? []).length ? (kids ?? []).map((k: any, i: number) => (
            <div key={i} className="flex items-center gap-2 py-2 border-b last:border-0 border-slate-100">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand to-indigo-600 text-white flex items-center justify-center text-xs font-black">{k.full_name.charAt(0)}</div>
              <span className="text-sm font-bold text-gray-800">{k.full_name}</span>
              <span className="ml-auto text-[11px] text-gray-500 font-semibold">{k.xp_points} XP · 🔥 {k.streak_days}d</span>
            </div>
          )) : <Empty />}
        </Card>
      </div>
    )
  }

  return <div className="p-6 text-sm text-gray-500">No preview for this role.</div>
}

function Header({ role, name }: { role: string; name?: string | null }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
      <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-black uppercase tracking-wider">{role}</span>
      <span className="text-sm font-extrabold text-gray-900">{name ?? 'User'}</span>
    </div>
  )
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-xs font-extrabold text-gray-700 mb-1">{title}</h3>
      {children}
    </div>
  )
}
function Empty() {
  return <div className="text-[11px] text-gray-400 italic py-4 text-center">No data yet.</div>
}
