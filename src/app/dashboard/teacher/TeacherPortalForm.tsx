'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { 
  X, Loader2, Sparkles, Flame, Clock, Calendar, 
  BookOpen, ClipboardList, Activity, GraduationCap, 
  PlusCircle, BookMarked, MessageSquare, Trash2, ArrowUpRight,
  User, Filter, BookOpenCheck, FileUp
} from 'lucide-react'

interface Student {
  id: string
  full_name: string
  xp_points: number
  streak_days: number
  class_id: string | null
}

interface Note {
  id: string
  title: string
  content: string
  file_url: string | null
  created_at: string
  class_id?: string | null
  subject_name?: string | null
}

interface Log {
  id: string
  student_id: string
  log_type: 'academic' | 'behavior' | 'attendance' | 'remark'
  content: string
  created_at: string
  subject_name?: string | null
  profiles?: { full_name: string } | null
}

interface TeacherPortalFormProps {
  teacherId: string
  teacherName: string
  students: Student[]
  initialNotes: Note[]
  initialLogs: Log[]
  teacherClasses: any[]
}

export default function TeacherPortalForm({
  teacherId,
  teacherName,
  students = [],
  initialNotes = [],
  initialLogs = [],
  teacherClasses = []
}: TeacherPortalFormProps) {
  const router = useRouter()
  const supabase = createClient()

  // Filter list of unique classes taught by this teacher
  const taughtClasses = Array.from(
    new Map(
      teacherClasses
        .filter(tc => tc.classes)
        .map(tc => [tc.class_id, { id: tc.class_id, name: tc.classes.name }])
    ).values()
  )

  // Class Filter state for Roster
  const [selectedClassId, setSelectedClassId] = useState<string>(
    taughtClasses[0]?.id || 'all'
  )

  // Notes state
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [noteForm, setNoteForm] = useState({ 
    title: '', 
    content: '', 
    file_url: '', 
    class_id: taughtClasses[0]?.id || '', 
    subject_name: teacherClasses[0]?.subject_name || '' 
  })
  const [noteLoading, setNoteLoading] = useState(false)
  const [noteMsg, setNoteMsg] = useState({ text: '', type: '' })

  // Remarks/Logs state
  const [logs, setLogs] = useState<Log[]>(initialLogs)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [logForm, setLogForm] = useState({ 
    log_type: 'remark' as any, 
    content: '', 
    subject_name: teacherClasses[0]?.subject_name || '' 
  })
  const [logLoading, setLogLoading] = useState(false)
  const [logMsg, setLogMsg] = useState({ text: '', type: '' })

  // Progress modal state
  const [progressStudent, setProgressStudent] = useState<Student | null>(null)
  const [progressData, setProgressData] = useState<{
    loading: boolean
    studySessions: any[]
    focusSessions: any[]
    logs: any[]
    error: string | null
  }>({
    loading: false,
    studySessions: [],
    focusSessions: [],
    logs: [],
    error: null
  })

  // Filter roster students
  const filteredStudents = students.filter(student => {
    if (selectedClassId === 'all') return true
    return student.class_id === selectedClassId
  })

  // Subjects taught in selected class (for notes sharing)
  const subjectsInSelectedClass = teacherClasses
    .filter(tc => !noteForm.class_id || tc.class_id === noteForm.class_id)
    .map(tc => tc.subject_name)
  const uniqueSubjects = Array.from(new Set(subjectsInSelectedClass))

  // Subjects taught by teacher (for remarks logging)
  const teacherSubjects = Array.from(new Set(teacherClasses.map(tc => tc.subject_name)))

  // Fetch Student Progress Data
  async function fetchStudentProgress(studentId: string) {
    setProgressData(p => ({ ...p, loading: true, error: null }))
    try {
      const [studyRes, focusRes, logsRes] = await Promise.all([
        supabase
          .from('study_sessions')
          .select('*, subjects(name, color)')
          .eq('user_id', studentId)
          .order('date', { ascending: false }),
        supabase
          .from('focus_sessions')
          .select('*, subjects(name, color)')
          .eq('user_id', studentId)
          .order('created_at', { ascending: false }),
        (supabase.from('student_logs') as any)
          .select('*, profiles:teacher_id(full_name)')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
      ])

      if (studyRes.error) throw studyRes.error
      if (focusRes.error) throw focusRes.error
      if (logsRes.error) throw logsRes.error

      setProgressData({
        loading: false,
        studySessions: studyRes.data || [],
        focusSessions: focusRes.data || [],
        logs: logsRes.data || [],
        error: null
      })
    } catch (err: any) {
      console.error('Error fetching student progress:', err)
      setProgressData(p => ({ ...p, loading: false, error: err.message || 'Failed to fetch student progress details.' }))
    }
  }

  // Handle Note Submission
  async function handleNoteSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!noteForm.title.trim() || !noteForm.content.trim()) return

    setNoteLoading(true)
    setNoteMsg({ text: '', type: '' })

    try {
      const payload = {
        teacher_id: teacherId,
        title: noteForm.title.trim(),
        content: noteForm.content.trim(),
        file_url: noteForm.file_url.trim() || null,
        class_id: noteForm.class_id || null,
        subject_name: noteForm.subject_name || null
      }

      const { data, error } = await (supabase.from('notes') as any)
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      setNotes(p => [data, ...p])
      setNoteForm(p => ({ ...p, title: '', content: '', file_url: '' }))
      setNoteMsg({ text: 'Study note shared successfully!', type: 'success' })
      router.refresh()
    } catch (err: any) {
      setNoteMsg({ text: err.message || 'Failed to share study note.', type: 'error' })
    } finally {
      setNoteLoading(false)
    }
  }

  // Handle Note Deletion
  async function handleNoteDelete(noteId: string) {
    if (!confirm('Are you sure you want to delete this study note? Students will lose access to it.')) return

    try {
      const { error } = await supabase.from('notes').delete().eq('id', noteId)
      if (error) throw error
      setNotes(p => p.filter(n => n.id !== noteId))
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Failed to delete note.')
    }
  }

  // Handle Remark Submission
  async function handleLogSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedStudent || !logForm.content.trim()) return

    setLogLoading(true)
    setLogMsg({ text: '', type: '' })

    try {
      const payload = {
        teacher_id: teacherId,
        student_id: selectedStudent.id,
        log_type: logForm.log_type,
        content: logForm.content.trim(),
        subject_name: logForm.subject_name || null
      }

      const { data, error } = await (supabase.from('student_logs') as any)
        .insert(payload)
        .select(`
          id,
          student_id,
          log_type,
          content,
          subject_name,
          created_at,
          profiles:student_id ( full_name )
        `)
        .single()

      if (error) throw error

      // Cast student profile data properly
      const formattedLog: Log = {
        id: data.id,
        student_id: data.student_id,
        log_type: data.log_type,
        content: data.content,
        subject_name: data.subject_name,
        created_at: data.created_at,
        profiles: data.profiles ? { full_name: (data.profiles as any).full_name } : null
      }

      setLogs(p => [formattedLog, ...p])
      setLogForm(p => ({ ...p, content: '' }))
      setSelectedStudent(null)
      setLogMsg({ text: `Remark logged successfully for ${selectedStudent.full_name}!`, type: 'success' })
      router.refresh()
    } catch (err: any) {
      setLogMsg({ text: err.message || 'Failed to log remark.', type: 'error' })
    } finally {
      setLogLoading(false)
    }
  }

  // Get type color badge helper
  function getLogTypeStyle(type: string) {
    switch (type) {
      case 'academic': return 'bg-blue-50 border-blue-200 text-blue-700'
      case 'behavior': return 'bg-amber-50 border-amber-200 text-amber-700'
      case 'attendance': return 'bg-purple-50 border-purple-200 text-purple-700'
      default: return 'bg-slate-50 border-slate-200 text-slate-700'
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-7xl mx-auto">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-8 rounded-3xl border border-indigo-850/30 text-white shadow-xl relative overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-purple-500/15 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 translate-y-1/2" />
        
        <div className="relative z-10 space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black text-brand-light border border-white/15 mb-2 uppercase tracking-wider">
            👩‍🏫 Teacher Portal
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
            Welcome, {teacherName} 👋
          </h1>
          <p className="text-indigo-200/75 text-sm font-medium">
            Manage student rosters, post progress logs, and publish study materials for your classes.
          </p>
        </div>
        <div className="relative z-10 flex-shrink-0 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-3.5 rounded-2xl text-right">
          <p className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold">Academic Term</p>
          <p className="text-sm font-extrabold text-white mt-0.5">{formatDate(new Date())}</p>
        </div>
      </div>

      {/* Warnings if teacher has no active classes */}
      {teacherClasses.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl flex items-center justify-between gap-4 font-semibold">
          <span>⚠️ You are not linked to any classes or subjects yet. Students and homework stats will not appear.</span>
          <button 
            onClick={() => router.push('/dashboard/settings')}
            className="px-3.5 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg transition-all"
          >
            Configure Settings
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* STUDENT ROSTER & REMARK LOGGER COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* ROSTER CARD */}
          <div className="card p-6 space-y-5 border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-100">
              <h2 className="font-extrabold text-gray-950 text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-brand" /> Student Roster
              </h2>
              
              {/* Class Filter Dropdown */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  className="input py-1.5 text-xs bg-slate-50 border border-slate-200 font-bold text-gray-750 cursor-pointer rounded-xl"
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                >
                  <option value="all">All My Students</option>
                  {taughtClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {logMsg.text && (
              <div className={`text-xs px-4 py-3 rounded-xl font-semibold border ${logMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-rose-50 border-rose-200 text-rose-700'} animate-in fade-in`}>
                {logMsg.text}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-500">
                <thead className="text-[10px] text-gray-400 uppercase tracking-wider bg-slate-50/50">
                  <tr>
                    <th className="px-4 py-3 font-black rounded-l-xl">Full Name</th>
                    <th className="px-4 py-3 font-black text-center">XP Points</th>
                    <th className="px-4 py-3 font-black text-center">Streak</th>
                    <th className="px-4 py-3 font-black text-right rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-4 py-4 font-bold text-gray-800 text-sm">
                        {student.full_name}
                        {/* Display class indicator tag */}
                        <span className="block text-[9px] text-gray-400 font-semibold mt-0.5">
                          {taughtClasses.find(c => c.id === student.class_id)?.name || 'Classroom Link Needed'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-lg">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> {student.xp_points} XP
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-700 font-bold rounded-lg">
                          <Flame className="w-3.5 h-3.5 text-orange-500" /> {student.streak_days}d
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedStudent(student)
                              setLogMsg({ text: '', type: '' })
                            }}
                            className="px-3 py-2 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-xl hover:bg-indigo-100 text-[11px] font-bold transition-all flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Log Remark
                          </button>
                          <button
                            onClick={() => {
                              setProgressStudent(student)
                              fetchStudentProgress(student.id)
                            }}
                            className="px-3 py-2 bg-emerald-50 border border-emerald-150 text-emerald-700 rounded-xl hover:bg-emerald-100 text-[11px] font-bold transition-all flex items-center gap-1.5"
                          >
                            <Activity className="w-3.5 h-3.5" /> View Progress
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-400 italic">No registered students found matching filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ACTIVE REMARK LOGGING MODAL / CONTAINER */}
          {selectedStudent && (
            <div className="card p-6 border-2 border-brand/25 bg-gradient-to-br from-indigo-50/20 via-transparent to-purple-50/10 space-y-4 animate-in slide-in-from-top-4 duration-300">
              <div className="flex justify-between items-center border-b pb-3 border-slate-100">
                <h3 className="font-extrabold text-gray-955 text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand" /> Log Observations for: <span className="text-brand font-black">{selectedStudent.full_name}</span>
                </h3>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-gray-400 hover:text-gray-650 bg-slate-100 p-1.5 rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleLogSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <label className="label">Log Category</label>
                    <select
                      className="input mt-1 bg-white cursor-pointer font-semibold text-gray-750"
                      value={logForm.log_type}
                      onChange={e => setLogForm(p => ({ ...p, log_type: e.target.value as any }))}
                    >
                      <option value="remark">General Remark</option>
                      <option value="academic">Academic Progress</option>
                      <option value="behavior">Behavior Observation</option>
                      <option value="attendance">Attendance Record</option>
                    </select>
                  </div>

                  <div className="sm:col-span-1">
                    <label className="label">Tag Subject</label>
                    <select
                      className="input mt-1 bg-white cursor-pointer font-semibold text-gray-750"
                      value={logForm.subject_name}
                      onChange={e => setLogForm(p => ({ ...p, subject_name: e.target.value }))}
                      required
                    >
                      <option value="">-- Choose Subject --</option>
                      {teacherSubjects.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-1">
                    <label className="label">Comments & Observations</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Participated actively, scored high."
                      className="input mt-1"
                      value={logForm.content}
                      onChange={e => setLogForm(p => ({ ...p, content: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="btn-secondary text-xs px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={logLoading}
                    className="btn-primary text-xs px-5 py-2"
                  >
                    {logLoading ? 'Logging…' : '✓ Save Log Remark'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* HISTORICAL REMARKS FEED */}
          <div className="card p-6 space-y-5 border border-slate-100">
            <h2 className="font-extrabold text-gray-955 text-base border-b pb-4 border-slate-100 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-brand" /> Observation Log History
            </h2>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {logs.map(log => (
                <div key={log.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/20 text-xs space-y-2 hover:border-slate-200 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-955 text-sm">
                        Student: <span className="text-slate-800 font-extrabold">{log.profiles?.full_name || 'Student'}</span>
                      </p>
                      {log.subject_name && (
                        <span className="badge bg-indigo-50 border-indigo-200 text-indigo-700 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                          {log.subject_name}
                        </span>
                      )}
                    </div>
                    <span className={`badge border text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${getLogTypeStyle(log.log_type)}`}>
                      {log.log_type}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed font-semibold text-xs">{log.content}</p>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1 border-t border-slate-50">
                    <span>Logged by: {teacherName}</span>
                    <span>{formatDate(log.created_at)}</span>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center py-10 text-gray-405 italic">No historical log entries saved yet.</div>
              )}
            </div>
          </div>

        </div>

        {/* NOTES SHARER & VIEW LIST COLUMN */}
        <div className="space-y-8">
          
          {/* UPLOAD FORM */}
          <div className="card p-6 space-y-5 border border-slate-100 hover:shadow-md transition-shadow">
            <h2 className="font-extrabold text-gray-955 text-lg border-b pb-4 border-slate-100 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-brand" /> Share Study Note
            </h2>
            
            {noteMsg.text && (
              <div className={`text-xs px-3.5 py-2.5 rounded-xl font-semibold border ${noteMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                {noteMsg.text}
              </div>
            )}

            <form onSubmit={handleNoteSubmit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Target Class</label>
                  <select
                    className="input mt-1.5 bg-white cursor-pointer font-semibold text-gray-700 text-xs py-1.5"
                    value={noteForm.class_id}
                    onChange={e => setNoteForm(p => ({ ...p, class_id: e.target.value }))}
                  >
                    <option value="">All Classes (Global)</option>
                    {taughtClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Subject</label>
                  <select
                    className="input mt-1.5 bg-white cursor-pointer font-semibold text-gray-700 text-xs py-1.5"
                    value={noteForm.subject_name}
                    onChange={e => setNoteForm(p => ({ ...p, subject_name: e.target.value }))}
                    required
                  >
                    <option value="">-- Choose Subject --</option>
                    {uniqueSubjects.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Note Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Trigonometry Formulas Sheet"
                  className="input mt-1.5"
                  value={noteForm.title}
                  onChange={e => setNoteForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">Note Details / Outline</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter formula listings or study guidance details..."
                  className="input mt-1.5 resize-none"
                  value={noteForm.content}
                  onChange={e => setNoteForm(p => ({ ...p, content: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">Attachment URL (Drive, pdf, image - Optional)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  className="input mt-1.5"
                  value={noteForm.file_url}
                  onChange={e => setNoteForm(p => ({ ...p, file_url: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                disabled={noteLoading}
                className="w-full btn-primary justify-center text-xs py-3 rounded-xl font-extrabold flex items-center gap-2"
              >
                <FileUp className="w-4 h-4" />
                {noteLoading ? 'Sharing…' : 'Share Note with Class'}
              </button>
            </form>
          </div>

          {/* ACTIVE NOTES FEED */}
          <div className="card p-6 space-y-5 border border-slate-100">
            <h2 className="font-extrabold text-gray-955 text-lg border-b pb-4 border-slate-100 flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-brand" /> Shared Notes Feed
            </h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {notes.map(note => (
                <div key={note.id} className="p-4 bg-slate-50/30 border border-slate-100 rounded-2xl space-y-3 relative group hover:border-slate-200 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-gray-955 text-[13px] block pr-8 leading-snug">{note.title}</span>
                      {/* Class and subject metadata indicators */}
                      <div className="flex gap-1.5 items-center mt-1">
                        {note.subject_name && (
                          <span className="badge bg-indigo-50 border-indigo-200 text-indigo-700 text-[8px] font-bold uppercase rounded-md px-1.5 py-0.5">
                            {note.subject_name}
                          </span>
                        )}
                        <span className="text-[9px] text-gray-400 font-semibold">
                          {note.class_id ? taughtClasses.find(c => c.id === note.class_id)?.name : 'Global'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNoteDelete(note.id)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-rose-600 bg-white hover:shadow p-1.5 rounded-full border border-slate-100 transition-all"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-xs max-w-[240px] break-words font-medium">{note.content}</p>
                  
                  {note.file_url && (
                    <a
                      href={note.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand font-bold hover:underline text-xs"
                    >
                      📎 View Attachment <ArrowUpRight className="w-3 h-3" />
                    </a>
                  )}
                  
                  <div className="flex justify-between items-center text-[10px] text-gray-400 pt-2 border-t border-slate-100/60">
                    <span>By: {teacherName}</span>
                    <span>{formatDate(note.created_at)}</span>
                  </div>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="text-center py-10 text-gray-405 italic">No notes shared with the class yet.</div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* STUDENT PROGRESS MODAL */}
      {progressStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in scale-in duration-300">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-brand to-purple-600 text-white p-6 relative">
              <button
                onClick={() => setProgressStudent(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl font-bold">
                  {progressStudent.full_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">{progressStudent.full_name}</h2>
                  <p className="text-xs text-white/80 mt-0.5">Academic Progress & Dashboard Performance Profile</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {progressData.loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 className="w-8 h-8 text-brand animate-spin" />
                  <p className="text-sm font-bold text-gray-500">Retrieving student history profile...</p>
                </div>
              ) : progressData.error ? (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-xl text-center">
                  {progressData.error}
                </div>
              ) : (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Stat Card: XP */}
                    <div className="p-4 bg-amber-50/50 border border-amber-250/20 rounded-2xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 text-lg">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl font-extrabold text-amber-900">{progressStudent.xp_points}</div>
                        <div className="text-[9px] font-bold text-amber-700 uppercase tracking-wider">XP Points</div>
                      </div>
                    </div>
                    
                    {/* Stat Card: Streak */}
                    <div className="p-4 bg-orange-50/50 border border-orange-250/20 rounded-2xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700 text-lg">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl font-extrabold text-orange-900">{progressStudent.streak_days}d</div>
                        <div className="text-[9px] font-bold text-orange-700 uppercase tracking-wider">Day Streak</div>
                      </div>
                    </div>

                    {/* Stat Card: Focus Hours */}
                    <div className="p-4 bg-emerald-50/50 border border-emerald-250/20 rounded-2xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-lg">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl font-extrabold text-emerald-900">
                          {(progressData.focusSessions.filter(fs => fs.completed).reduce((acc, fs) => acc + (fs.duration_minutes || 0), 0) / 60).toFixed(1)}h
                        </div>
                        <div className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Focus Time</div>
                      </div>
                    </div>

                    {/* Stat Card: Active Days */}
                    <div className="p-4 bg-blue-50/50 border border-blue-250/20 rounded-2xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 text-lg">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl font-extrabold text-blue-900">
                          {new Set([
                            ...progressData.studySessions.filter(ss => ss.completed).map(ss => ss.date),
                            ...progressData.focusSessions.filter(fs => fs.completed).map(fs => new Date(fs.created_at).toISOString().split('T')[0])
                          ]).size}
                        </div>
                        <div className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">Active Days</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Panel: Subject breakdown & Logs */}
                    <div className="space-y-6">
                      
                      {/* Subject Performance Breakdown */}
                      <div className="card p-5 space-y-4 border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 text-sm border-b pb-2 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-brand" /> Focus & Study by Subject
                        </h3>
                        
                        {Object.keys(
                          (() => {
                            const stats: { [key: string]: { focus: number, study: number, color: string } } = {}
                            progressData.focusSessions.filter(fs => fs.completed).forEach(fs => {
                              const name = fs.subjects?.name || 'General'
                              if (!stats[name]) stats[name] = { focus: 0, study: 0, color: fs.subjects?.color || '#6366F1' }
                              stats[name].focus += fs.duration_minutes || 0
                            })
                            progressData.studySessions.filter(ss => ss.completed).forEach(ss => {
                              const name = ss.subjects?.name || 'General'
                              if (!stats[name]) stats[name] = { focus: 0, study: 0, color: ss.subjects?.color || '#6366F1' }
                              stats[name].study += 1
                            })
                            return stats
                          })()
                        ).length === 0 ? (
                          <p className="text-xs text-gray-400 italic py-4 text-center">No completed subject activities found.</p>
                        ) : (
                          <div className="space-y-3.5">
                            {Object.entries(
                              (() => {
                                const stats: { [key: string]: { focus: number, study: number, color: string } } = {}
                                progressData.focusSessions.filter(fs => fs.completed).forEach(fs => {
                                  const name = fs.subjects?.name || 'General'
                                  if (!stats[name]) stats[name] = { focus: 0, study: 0, color: fs.subjects?.color || '#6366F1' }
                                  stats[name].focus += fs.duration_minutes || 0
                                })
                                progressData.studySessions.filter(ss => ss.completed).forEach(ss => {
                                  const name = ss.subjects?.name || 'General'
                                  if (!stats[name]) stats[name] = { focus: 0, study: 0, color: ss.subjects?.color || '#6366F1' }
                                  stats[name].study += 1
                                })
                                return stats
                              })()
                            ).map(([subject, stat]) => (
                              <div key={subject} className="space-y-1.5 text-xs">
                                <div className="flex justify-between items-center font-semibold">
                                  <span className="flex items-center gap-1.5 text-gray-800">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stat.color }} />
                                    {subject}
                                  </span>
                                  <span className="text-gray-500">
                                    {stat.focus > 0 ? `${(stat.focus / 60).toFixed(1)}h focus` : ''} 
                                    {stat.focus > 0 && stat.study > 0 ? ' • ' : ''}
                                    {stat.study > 0 ? `${stat.study} sessions` : ''}
                                  </span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full transition-all duration-500" 
                                    style={{ 
                                      backgroundColor: stat.color, 
                                      width: `${Math.min(100, (stat.focus / 60) * 20 + stat.study * 10)}%` 
                                    }} 
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Observations logged for student */}
                      <div className="card p-5 space-y-4 border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 text-sm border-b pb-2 flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-brand" /> Observations & Remarks Feed
                        </h3>
                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                          {progressData.logs.map(log => (
                            <div key={log.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1.5 text-xs">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                  <span className={`badge border text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${getLogTypeStyle(log.log_type)}`}>
                                    {log.log_type}
                                  </span>
                                  {log.subject_name && (
                                    <span className="badge bg-indigo-50 border-indigo-200 text-indigo-700 text-[8px] font-bold uppercase rounded-md px-1.5 py-0.5">
                                      {log.subject_name}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-400">{formatDate(log.created_at)}</span>
                              </div>
                              <p className="text-gray-700 leading-relaxed font-semibold">{log.content}</p>
                              <p className="text-[9px] text-gray-400 italic">Logged by: {log.profiles?.full_name || 'Teacher'}</p>
                            </div>
                          ))}
                          {progressData.logs.length === 0 && (
                            <p className="text-xs text-gray-400 italic text-center py-6">No observation remarks logged yet.</p>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Right Panel: Study Timeline & Focus log */}
                    <div className="space-y-6">
                      
                      {/* Study Sessions Schedule */}
                      <div className="card p-5 space-y-4 border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 text-sm border-b pb-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-brand" /> Study Sessions Timeline
                        </h3>
                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                          {progressData.studySessions.map((session: any) => (
                            <div key={session.id} className="flex justify-between items-center p-3 bg-slate-50/50 border border-slate-100 rounded-xl text-xs">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: session.subjects?.color || '#6366F1' }} />
                                  <span className="font-bold text-gray-800">{session.subjects?.name || 'General'}</span>
                                </div>
                                <p className="text-gray-500 text-[10px]">{formatDate(session.date)} • {session.start_time} - {session.end_time}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{session.session_type}</span>
                                <span className={`badge ${session.completed ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                  {session.completed ? 'Completed' : 'Planned'}
                                </span>
                              </div>
                            </div>
                          ))}
                          {progressData.studySessions.length === 0 && (
                            <p className="text-xs text-gray-400 italic text-center py-8">No study sessions logged.</p>
                          )}
                        </div>
                      </div>

                      {/* Focus Sessions list */}
                      <div className="card p-5 space-y-4 border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 text-sm border-b pb-2 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-brand" /> Focus Pomodoros History
                        </h3>
                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                          {progressData.focusSessions.map((focus: any) => (
                            <div key={focus.id} className="flex justify-between items-center p-3 bg-slate-50/50 border border-slate-100 rounded-xl text-xs">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: focus.subjects?.color || '#10B981' }} />
                                  <span className="font-bold text-gray-800">{focus.subjects?.name || 'General'}</span>
                                </div>
                                <p className="text-gray-500 text-[10px]">{formatDate(focus.created_at)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-600">{focus.duration_minutes}m</span>
                                <span className={`badge ${focus.completed ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                  {focus.completed ? 'Completed' : 'Incomplete'}
                                </span>
                              </div>
                            </div>
                          ))}
                          {progressData.focusSessions.length === 0 && (
                            <p className="text-xs text-gray-400 italic text-center py-8">No focus sessions recorded.</p>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProgressStudent(null)}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs transition-all"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
