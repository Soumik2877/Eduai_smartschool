import { redirect } from 'next/navigation'
import { resolveViewer } from '@/lib/viewer'
import { formatDate, daysUntil } from '@/lib/utils'
import Link from 'next/link'
import {
  Zap, Flame, Calendar, Clock, BookOpen, ClipboardList, BookMarked,
  GraduationCap, ArrowUpRight, CheckCircle2, FileText, AlertCircle, Compass
} from 'lucide-react'

export const metadata = { title: 'Dashboard - EduAI' }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>
}) {
  const { preview } = await searchParams
  const viewer = await resolveViewer(preview)
  if (!viewer) return null

  const role = viewer.role
  const previewQS = preview ? `?preview=${preview}` : ''

  // Route non-students to their own portals (carry the preview target through).
  if (role === 'admin' && !viewer.isPreview) redirect('/dashboard/admin')
  if (role === 'teacher') redirect(`/dashboard/teacher${previewQS}`)
  if (role === 'parent') redirect(`/dashboard/parent${previewQS}`)

  const supabase = viewer.db as any
  const uid = viewer.userId
  const today = new Date().toISOString().split('T')[0]

  const [
    { data: profile }, 
    { data: todaySessions }, 
    { data: pendingAssignments }, 
    { data: upcomingExams }, 
    { data: recentPerf },
    { data: studentLogs },
    { data: sharedNotes }
  ] = await Promise.all([
    (supabase.from('profiles') as any).select('*').eq('id', uid).single(),
    supabase.from('focus_sessions').select('*, subjects(name,color)').eq('user_id', uid).eq('date', today),
    supabase.from('assignments').select('*, subjects(name,color)').eq('user_id', uid).eq('status', 'pending').order('due_date').limit(5),
    supabase.from('exams').select('*, subjects(name,color)').eq('user_id', uid).gte('exam_date', new Date().toISOString()).order('exam_date').limit(3),
    (supabase.from('focus_sessions') as any).select('duration_minutes').eq('user_id', uid).eq('completed', true).gte('created_at', new Date(Date.now() - 7*86400000).toISOString()),
    (supabase.from('student_logs') as any).select('*, profiles:teacher_id(full_name)').eq('student_id', uid).order('created_at', { ascending: false }).limit(4),
    supabase.from('notes').select('*, profiles:teacher_id(full_name)').order('created_at', { ascending: false }).limit(6)
  ])

  const weeklyFocusHours = ((recentPerf ?? []) as any[]).reduce((s: number, f: any) => s + f.duration_minutes, 0) / 60

  const logs = (studentLogs ?? []).map((l: any) => ({
    id: l.id,
    log_type: l.log_type,
    content: l.content,
    created_at: l.created_at,
    teacher_name: l.profiles ? (l.profiles as any).full_name : 'School Teacher'
  }))

  const notesList = (sharedNotes ?? []).map((n: any) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    file_url: n.file_url,
    created_at: n.created_at,
    teacher_name: n.profiles ? (n.profiles as any).full_name : 'School Teacher'
  }))

  function getLogTypeStyle(type: string) {
    switch (type) {
      case 'academic': return 'bg-blue-50/50 border-blue-200 text-blue-700 shadow-blue-500/5'
      case 'behavior': return 'bg-amber-50/50 border-amber-200 text-amber-700 shadow-amber-500/5'
      case 'attendance': return 'bg-purple-50/50 border-purple-200 text-purple-700 shadow-purple-500/5'
      default: return 'bg-slate-50/50 border-slate-200 text-slate-700 shadow-slate-500/5'
    }
  }

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-300">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-8 rounded-3xl border border-indigo-800/30 text-white shadow-xl relative overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-purple-500/15 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 translate-y-1/2" />
        
        <div className="relative z-10 space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black text-indigo-350 border border-white/15 mb-2 uppercase tracking-wider">
            🎓 Student Portal
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
            Good morning, {profile?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-indigo-200/75 text-sm font-medium">
            Ready to learn? Explore your schedule, finish pending assignments, and level up your skills today.
          </p>
        </div>
        <div className="relative z-10 flex-shrink-0 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-3.5 rounded-2xl text-right">
          <p className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold">Academic Date</p>
          <p className="text-sm font-extrabold text-white mt-0.5">{formatDate(new Date())}</p>
        </div>
      </div>

      {/* STATS TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'XP Points', value: profile?.xp_points ?? 0, icon: <Zap className="w-5 h-5" />, color: 'from-amber-500/10 via-amber-600/5 to-transparent border-amber-500/20 text-amber-800 shadow-amber-500/5', iconBg: 'bg-amber-100/70 border-amber-250/20 text-amber-600' },
          { label: 'Day Streak', value: `${profile?.streak_days ?? 0}d`, icon: <Flame className="w-5 h-5" />, color: 'from-orange-500/10 via-orange-600/5 to-transparent border-orange-500/20 text-orange-800 shadow-orange-500/5', iconBg: 'bg-orange-100/70 border-orange-250/20 text-orange-600' },
          { label: "Today's Sessions", value: todaySessions?.length ?? 0, icon: <Calendar className="w-5 h-5" />, color: 'from-blue-500/10 via-blue-600/5 to-transparent border-blue-500/20 text-blue-800 shadow-blue-500/5', iconBg: 'bg-blue-100/70 border-blue-250/20 text-blue-600' },
          { label: 'Focus (7d)', value: `${weeklyFocusHours.toFixed(1)}h`, icon: <Clock className="w-5 h-5" />, color: 'from-emerald-500/10 via-emerald-600/5 to-transparent border-emerald-500/20 text-emerald-800 shadow-emerald-500/5', iconBg: 'bg-emerald-100/70 border-emerald-250/20 text-emerald-600' },
        ].map(s => (
          <div key={s.label} className={`card p-5 bg-gradient-to-br border flex items-center gap-4 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg ${s.color}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-sm ${s.iconBg}`}>
              {s.icon}
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight">{s.value}</div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-70 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* SCHEDULE & HOMEWORK GRID */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Today's schedule */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand" /> Today's Schedule
            </h2>
            <Link href="/dashboard/planner" className="text-xs text-brand font-bold hover:underline flex items-center gap-0.5">View all <ArrowUpRight className="w-3.5 h-3.5" /></Link>
          </div>
          
          {todaySessions && todaySessions.length > 0 ? (
            <div className="space-y-3">
              {todaySessions.map((s: any) => (
                <div key={s.id} className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50/60 transition-colors duration-200">
                  <span className="w-3.5 h-3.5 rounded-full ring-4 ring-offset-2 flex-shrink-0" style={{ backgroundColor: s.subjects?.color ?? '#4F46E5', color: s.subjects?.color ?? '#4F46E5' }} />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{s.subjects?.name ?? 'General'}</p>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {s.start_time} – {s.end_time}
                    </p>
                  </div>
                  {s.completed ? (
                    <span className="badge bg-emerald-50 border-emerald-200 text-emerald-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm shadow-emerald-500/5">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  ) : (
                    <span className="badge bg-indigo-50 border-indigo-200 text-indigo-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-sm">
                      Planned
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 flex flex-col items-center justify-center bg-slate-50/20 rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
              <p className="text-xs text-gray-400 font-semibold">No study sessions planned for today</p>
              <Link href="/dashboard/planner" className="btn-primary text-xs py-2 px-4 shadow-sm hover:scale-[1.02] active:scale-[0.98]">Create Plan</Link>
            </div>
          )}
        </div>

        {/* Pending assignments */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand" /> Pending Assignments
            </h2>
            <Link href="/dashboard/homework" className="text-xs text-brand font-bold hover:underline flex items-center gap-0.5">View all <ArrowUpRight className="w-3.5 h-3.5" /></Link>
          </div>
          
          {pendingAssignments && pendingAssignments.length > 0 ? (
            <div className="space-y-3">
              {pendingAssignments.map((a: any) => {
                const days = daysUntil(a.due_date)
                return (
                  <div key={a.id} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50/60 transition-colors duration-200">
                    <div className="space-y-1">
                      <p className="font-extrabold text-gray-900 text-sm leading-snug">{a.title}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-450">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: a.subjects?.color || '#4F46E5' }} />
                        <span className="font-semibold text-gray-550">{a.subjects?.name || 'General'}</span>
                      </div>
                    </div>
                    <span className={`badge border text-[10px] font-black uppercase rounded-lg px-2.5 py-1 flex items-center gap-1 shadow-sm ${
                      days <= 1 
                        ? 'bg-rose-50 border-rose-250 text-rose-700 shadow-rose-500/5' 
                        : days <= 3 
                        ? 'bg-amber-50 border-amber-250 text-amber-700 shadow-amber-500/5' 
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      {days <= 0 ? '⚠️ Due Today' : `${days}d left`}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-gray-400 font-semibold italic bg-slate-50/20 rounded-2xl border border-slate-100 flex flex-col items-center justify-center p-6 space-y-2">
              <span>🎉</span>
              <span>No pending assignments! All caught up</span>
            </div>
          )}
        </div>
      </div>

      {/* PORTAL FEED GRID */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* TEACHER REMARKS & PROGRESS FEED */}
        <div className="card p-6 space-y-5">
          <div className="border-b pb-3 border-slate-100">
            <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-brand" /> Teacher Remarks & Observations
            </h2>
            <p className="text-xs text-gray-400 mt-1 font-semibold">Progress reviews and observational remarks posted by teachers.</p>
          </div>
          
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {logs.map((log: any) => (
              <div key={log.id} className="p-4 bg-slate-50/20 border border-slate-100 rounded-2xl hover:border-slate-200 transition-colors space-y-3 shadow-sm">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand to-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-sm shadow-brand/15">
                      {log.teacher_name.charAt(0)}
                    </div>
                    {log.teacher_name}
                  </span>
                  <span className={`badge border text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${getLogTypeStyle(log.log_type)}`}>
                    {log.log_type}
                  </span>
                </div>
                <p className="text-gray-750 leading-relaxed font-semibold text-xs bg-white/50 p-3 rounded-xl border border-slate-100/80">{log.content}</p>
                <div className="flex justify-between items-center text-[10px] text-gray-400 pt-0.5 border-t border-slate-50">
                  <span className="font-semibold text-slate-400">Teacher Observation</span>
                  <span>{formatDate(log.created_at)}</span>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-center py-14 text-xs text-gray-400 font-semibold italic bg-slate-50/10 rounded-2xl border border-slate-100">
                No observations logged by school instructors yet.
              </div>
            )}
          </div>
        </div>

        {/* SHARED STUDY NOTES */}
        <div className="card p-6 space-y-5">
          <div className="border-b pb-3 border-slate-100">
            <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-brand" /> Shared Study Notes
            </h2>
            <p className="text-xs text-gray-400 mt-1 font-semibold">Curriculum notes and attachment files uploaded by teachers.</p>
          </div>
          
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {notesList.map((note: any) => (
              <div key={note.id} className="p-4 bg-slate-50/20 border border-slate-100 rounded-2xl hover:border-slate-200 transition-colors space-y-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-slate-800 text-sm block leading-snug flex items-center gap-1.5">
                      <BookMarked className="w-4 h-4 text-brand flex-shrink-0" />
                      {note.title}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold block">By: {note.teacher_name}</span>
                  </div>
                </div>
                <p className="text-gray-550 leading-relaxed text-xs">{note.content}</p>
                
                {note.file_url && (
                  <a
                    href={note.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand/5 border border-brand/10 hover:bg-brand/10 text-brand font-extrabold rounded-lg text-[11px] transition-colors"
                  >
                    📎 Attachment File <ArrowUpRight className="w-3 h-3" />
                  </a>
                )}
                
                <span className="block text-[9px] text-gray-400 font-bold text-right pt-0.5 border-t border-slate-50">{formatDate(note.created_at)}</span>
              </div>
            ))}
            {notesList.length === 0 && (
              <div className="text-center py-14 text-xs text-gray-400 font-semibold italic bg-slate-50/10 rounded-2xl border border-slate-100">
                No shared study notes found.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* UPCOMING EXAMS PORTLET */}
      {upcomingExams && upcomingExams.length > 0 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-extrabold text-gray-900 text-base border-b pb-3 border-slate-100 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-brand" /> Upcoming Exams
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {upcomingExams.map((e: any) => {
              const days = daysUntil(e.exam_date)
              return (
                <div key={e.id} className={`flex-shrink-0 p-4.5 rounded-2xl border-2 min-w-[175px] shadow-sm relative overflow-hidden flex flex-col justify-between ${
                  days <= 3 
                    ? 'border-rose-150 bg-rose-50/20 text-rose-900' 
                    : days <= 7 
                    ? 'border-amber-150 bg-amber-50/20 text-amber-900' 
                    : 'border-slate-100 bg-slate-50/20 text-slate-900'
                }`}>
                  <div>
                    <p className={`text-3xl font-black tracking-tight ${days <= 3 ? 'text-rose-600 animate-pulse' : days <= 7 ? 'text-amber-600' : 'text-slate-650'}`}>{days}d</p>
                    <p className="text-xs font-black text-slate-850 mt-1.5 leading-snug line-clamp-1">{e.title}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-450 font-bold border-t pt-2 border-slate-100/50">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: e.subjects?.color ?? '#4F46E5' }} />
                    <span className="truncate">{e.subjects?.name}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* QUICK ACTION TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/dashboard/doubt-solver', icon: <Compass className="w-5 h-5" />, label: 'Ask AI Tutor', desc: 'AI interactive learning helper', bg: 'hover:bg-indigo-50/30 border-indigo-100/40 text-indigo-700' },
          { href: '/dashboard/focus', icon: <Clock className="w-5 h-5" />, label: 'Start Focus Timer', desc: 'Pomodoro focus builder', bg: 'hover:bg-emerald-50/30 border-emerald-100/40 text-emerald-700' },
          { href: '/dashboard/quiz', icon: <FileText className="w-5 h-5" />, label: 'Take Quiz', desc: 'Verify classroom progress', bg: 'hover:bg-amber-50/30 border-amber-100/40 text-amber-700' },
          { href: '/dashboard/planner', icon: <Calendar className="w-5 h-5" />, label: 'Plan Study Schedule', desc: 'Personal calendar organizer', bg: 'hover:bg-purple-50/30 border-purple-100/40 text-purple-700' },
        ].map(a => (
          <Link key={a.href} href={a.href} className={`card p-5 group flex flex-col items-start text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ${a.bg}`}>
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100/80 flex items-center justify-center mb-3 text-slate-700 group-hover:scale-110 transition-transform">
              {a.icon}
            </div>
            <span className="text-sm font-extrabold text-slate-850 group-hover:text-brand transition-colors">{a.label}</span>
            <span className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">{a.desc}</span>
          </Link>
        ))}
      </div>

    </div>
  )
}
