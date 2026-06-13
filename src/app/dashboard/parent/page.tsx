import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { 
  User, Calendar, Clock, Activity, BookOpen, ClipboardList, 
  BookMarked, ArrowUpRight, Flame, Sparkles, ShieldCheck, HelpCircle 
} from 'lucide-react'

export const metadata = { title: 'Parent Portal - EduAI' }

export default async function ParentPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Fetch parent profile details
  const { data: parentProfile } = await (supabase.from('profiles') as any)
    .select('full_name')
    .eq('id', session.user.id)
    .single()

  // Fetch linked children profiles
  const { data: children } = await (supabase.from('profiles') as any)
    .select('id, full_name, xp_points, streak_days, email')
    .eq('parent_id', session.user.id)

  const kids = children ?? []

  if (kids.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 animate-in fade-in duration-300">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-6">Parent Portal</h1>
        <div className="card p-10 text-center text-gray-400 space-y-5 rounded-3xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-3xl mx-auto shadow-sm">
            👨‍👩‍👧
          </div>
          <p className="text-lg font-bold text-gray-700">No children linked to your account yet</p>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Please ask your child to log in, navigate to **Settings**, and enter your registered parent email:
            <span className="block font-bold text-brand mt-2 select-all font-mono bg-slate-50 p-2 rounded-xl border border-slate-150/50">{(session.user.email) || 'your-email'}</span>
          </p>
        </div>
      </div>
    )
  }

  // Get active child from URL search params or default to first child
  const resolvedParams = await searchParams
  const activeChildId = resolvedParams.child || kids[0].id
  const activeChild = kids.find((k: any) => k.id === activeChildId) || kids[0]

  // Fetch active child's logs (remarks from teachers)
  const { data: logs } = await (supabase.from('student_logs') as any)
    .select(`
      id,
      log_type,
      content,
      created_at,
      profiles:teacher_id ( full_name )
    `)
    .eq('student_id', activeChild.id)
    .order('created_at', { ascending: false })

  // Fetch shared study notes posted by school teachers
  const { data: notes } = await supabase
    .from('notes')
    .select(`
      id,
      title,
      content,
      file_url,
      created_at,
      profiles:teacher_id ( full_name )
    `)
    .order('created_at', { ascending: false })

  // Cast join elements for typescript safety
  const childLogs = (logs ?? []).map((l: any) => ({
    id: l.id,
    log_type: l.log_type,
    content: l.content,
    created_at: l.created_at,
    teacher_name: l.profiles ? (l.profiles as any).full_name : 'School Teacher'
  }))

  const sharedNotes = (notes ?? []).map((n: any) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    file_url: n.file_url,
    created_at: n.created_at,
    teacher_name: n.profiles ? (n.profiles as any).full_name : 'School Teacher'
  }))

  // Helper color check for type badges
  function getLogTypeStyle(type: string) {
    switch (type) {
      case 'academic': return 'bg-blue-50/50 border-blue-200 text-blue-700 shadow-blue-500/5'
      case 'behavior': return 'bg-amber-50/50 border-amber-200 text-amber-700 shadow-amber-500/5'
      case 'attendance': return 'bg-purple-50/50 border-purple-200 text-purple-700 shadow-purple-500/5'
      default: return 'bg-slate-50/50 border-slate-200 text-slate-700'
    }
  }

  return (
    <div className="max-w-5xl space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 rounded-3xl border border-slate-800/30 text-white shadow-xl relative overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-brand/15 rounded-full blur-[80px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[120px] h-[120px] bg-purple-500/10 rounded-full blur-[60px] pointer-events-none -translate-x-1/2 translate-y-1/2" />
        
        <div className="relative z-10 space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black text-brand-light border border-white/15 mb-2 uppercase tracking-wider">
            👨‍👩‍👧 Parent Portal
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
            Welcome, {parentProfile?.full_name?.split(' ')[0] || 'Parent'} 👋
          </h1>
          <p className="text-slate-350 text-sm font-medium">
            Monitor your child's progress logs and review curriculum notes shared by school teachers.
          </p>
        </div>

        {/* CHILD PICKER TABS */}
        {kids.length > 1 && (
          <div className="relative z-10 flex items-center gap-1 bg-white/5 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl shadow-lg">
            {kids.map((k: any) => (
              <Link
                key={k.id}
                href={`/dashboard/parent?child=${k.id}`}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                  k.id === activeChildId 
                    ? 'bg-gradient-to-r from-brand to-indigo-650 text-white shadow-md shadow-brand/25' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {k.full_name.split(' ')[0]}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ACTIVE MONITORING SUMMARY */}
      <div className="card p-6 bg-gradient-to-br from-indigo-50/15 via-purple-50/10 to-transparent border border-indigo-150/30 flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all duration-300 hover:shadow-md rounded-3xl">
        <div className="flex items-center gap-4.5">
          <div className="w-13 h-13 bg-gradient-to-tr from-brand to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-brand/15">
            <User className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <h2 className="font-extrabold text-indigo-950 text-base">Monitoring: {activeChild.full_name}</h2>
            <div className="flex items-center gap-3 text-xs text-indigo-800 font-bold flex-wrap">
              <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200/50">
                <Sparkles className="w-3.5 h-3.5" /> Level {Math.floor(activeChild.xp_points / 500) + 1}
              </span>
              <span>•</span>
              <span>{activeChild.xp_points} Total XP</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-orange-700 font-bold">
                <Flame className="w-3.5 h-3.5 text-orange-600" /> {activeChild.streak_days} Day Streak
              </span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <span className="badge px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-xs rounded-xl shadow-sm shadow-emerald-500/5 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> Connected Account
          </span>
        </div>
      </div>

      {/* TIMELINES & MATERIALS COLS */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* PROGRESS OBSERVATION LOG TIMELINE */}
        <div className="card p-6 lg:col-span-2 space-y-5 rounded-3xl">
          <div className="border-b pb-3 border-slate-100">
            <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-brand" /> Teacher Observations & Remarks
            </h2>
            <p className="text-xs text-gray-400 mt-1 font-semibold">Official remarks and feedback registered by school instructors.</p>
          </div>

          <div className="space-y-4 pr-1 max-h-[550px] overflow-y-auto">
            {childLogs.length > 0 ? (
              childLogs.map((log: any) => (
                <div key={log.id} className="p-4.5 rounded-2xl border border-slate-100 bg-slate-50/20 hover:border-slate-200 transition-all duration-200 hover:-translate-y-0.5 shadow-sm space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 text-[13px] flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand to-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                        {log.teacher_name.charAt(0)}
                      </div>
                      Instructor: {log.teacher_name}
                    </span>
                    <span className={`badge border text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${getLogTypeStyle(log.log_type)}`}>
                      {log.log_type}
                    </span>
                  </div>
                  
                  <p className="text-gray-800 leading-relaxed text-xs font-semibold bg-white/60 p-3 rounded-2xl border border-slate-100/80">
                    {log.content}
                  </p>
                  
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold border-t border-slate-50 pt-2">
                    <span className="text-slate-400 uppercase tracking-wider text-[8px]">Observation entry</span>
                    <span>{formatDate(log.created_at)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 text-gray-400 text-xs italic bg-slate-50/10 rounded-2xl border border-slate-100 flex flex-col items-center justify-center p-6 space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-350" />
                <span>No remarks logged for {activeChild.full_name} yet.</span>
              </div>
            )}
          </div>
        </div>

        {/* SHARED STUDY NOTES FOR PARENTS */}
        <div className="card p-6 space-y-5 rounded-3xl">
          <div className="border-b pb-3 border-slate-100">
            <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-brand" /> Shared Study Materials
            </h2>
            <p className="text-xs text-gray-400 mt-1 font-semibold">Reference notes and attachments shared by teachers.</p>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {sharedNotes.length > 0 ? (
              sharedNotes.map((note: any) => (
                <div key={note.id} className="p-4 bg-slate-50/20 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all duration-200 space-y-3 shadow-sm">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 text-[13px] block leading-snug flex items-center gap-1.5">
                      <BookMarked className="w-4 h-4 text-brand flex-shrink-0" />
                      {note.title}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">By: {note.teacher_name}</span>
                  </div>
                  
                  <p className="text-gray-500 leading-relaxed text-xs">{note.content}</p>
                  
                  {note.file_url && (
                    <div className="pt-1">
                      <a
                        href={note.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand/5 border border-brand/10 hover:bg-brand/10 text-brand font-extrabold rounded-lg text-[10px] transition-colors"
                      >
                        📎 View File Attachment <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  <span className="block text-[9px] text-gray-450 font-bold text-right pt-2 border-t border-slate-50">{formatDate(note.created_at)}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-14 text-gray-400 text-xs italic bg-slate-50/10 rounded-2xl border border-slate-100">
                No study notes shared by teachers yet.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
