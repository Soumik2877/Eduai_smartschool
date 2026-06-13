'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Assignment, Subject, Profile } from '@/types/database.types'
import { formatDate, daysUntil } from '@/lib/utils'

type AssignmentWithSubjectAndProfile = Assignment & { 
  subjects: Subject | null
  profiles: Profile | null
}

const TABS = ['pending', 'completed', 'overdue'] as const
const TEACHER_TABS = ['tracker', 'submissions'] as const

export default function HomeworkPage() {
  const supabase = createClient()
  const [role, setRole] = useState<'student' | 'teacher' | 'parent' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Student & general state
  const [tab, setTab] = useState<typeof TABS[number]>('pending')
  const [assignments, setAssignments] = useState<AssignmentWithSubjectAndProfile[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', subject_id: '', due_date: '', priority: '2', assign_to: 'all' })

  // Teacher specific state
  const [students, setStudents] = useState<any[]>([])
  const [teacherTab, setTeacherTab] = useState<typeof TEACHER_TABS[number]>('tracker')
  const [gradingAssignment, setGradingAssignment] = useState<AssignmentWithSubjectAndProfile | null>(null)
  const [gradingStatus, setGradingStatus] = useState<'idle' | 'grading' | 'done'>('idle')
  const [gradingOutput, setGradingOutput] = useState({ score: 85, feedback: '' })
  const [teacherClasses, setTeacherClasses] = useState<any[]>([])

  // Parent specific state
  const [children, setChildren] = useState<Profile[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string>('')

  useEffect(() => {
    initPage()
  }, [])

  useEffect(() => {
    if (role) {
      loadData()
    }
  }, [role, tab, selectedChildId])

  async function initPage() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setLoading(false)
      return
    }
    setUserId(session.user.id)

    // Load profile
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile) {
      setRole(profile.role as any)
    } else {
      setRole('student')
    }
  }

  async function loadData() {
    if (!userId) return
    setLoading(true)

    if (role === 'student') {
      const [{ data: a }, { data: s }] = await Promise.all([
        supabase
          .from('assignments')
          .select('*, subjects(*)')
          .eq('user_id', userId)
          .eq('status', tab)
          .order('due_date'),
        supabase
          .from('subjects')
          .select('*')
          .eq('user_id', userId),
      ])
      setAssignments((a ?? []) as any)
      setSubjects(s ?? [])

    } else if (role === 'teacher') {
      // Fetch teacher classes & subjects mapping
      const { data: tc } = await (supabase.from('teacher_classes') as any).select('*, classes(name)').eq('teacher_id', userId)
      const activeTC = (tc || []) as any[]
      setTeacherClasses(activeTC)

      const taughtClassIds = activeTC.map(tc => tc.class_id)
      const taughtSubjects = activeTC.map(tc => tc.subject_name.toLowerCase())

      // Teachers load students in their classes, and all assignments
      const [{ data: studs }, { data: allSaves }] = await Promise.all([
        (supabase.from('profiles') as any)
          .select('*')
          .eq('role', 'student')
          .in('class_id', taughtClassIds.length > 0 ? taughtClassIds : ['00000000-0000-0000-0000-000000000000'])
          .order('full_name'),
        supabase
          .from('assignments')
          .select('*, subjects(*), profiles:user_id(*)')
          .order('due_date')
      ])

      // Only show assignments matching subjects & classes the teacher teaches
      const filteredAssignments = (allSaves ?? []).filter((a: any) => {
        const subName = a.subjects?.name?.toLowerCase() || ''
        const studClassId = a.profiles?.class_id
        return taughtSubjects.includes(subName) && taughtClassIds.includes(studClassId)
      })

      setStudents(studs ?? [])
      setAssignments(filteredAssignments as any)

      // Map teacher's subjects as the selectable list
      const mappedSubjects = activeTC.map((tc: any) => ({
        id: tc.id,
        name: `${tc.subject_name} (${tc.classes?.name || 'Class'})`,
        color: '#4F46E5',
        difficulty: 3,
        user_id: userId
      }))
      setSubjects(mappedSubjects as any)

    } else if (role === 'parent') {
      // Parents load children, then load assignments for selected child
      const { data: kids } = await (supabase.from('profiles') as any)
        .select('*')
        .eq('parent_id', userId)

      const activeKids = kids ?? []
      setChildren(activeKids)

      if (activeKids.length > 0) {
        const activeId = selectedChildId || activeKids[0].id
        if (!selectedChildId) setSelectedChildId(activeId)

        const [{ data: childAss }, { data: s }] = await Promise.all([
          supabase
            .from('assignments')
            .select('*, subjects(*), profiles:user_id(*)')
            .eq('user_id', activeId)
            .eq('status', tab)
            .order('due_date'),
          supabase
            .from('subjects')
            .select('*')
            .eq('user_id', activeId),
        ])
        setAssignments((childAss ?? []) as any)
        setSubjects(s ?? [])
      }
    }
    setLoading(false)
  }

  async function addAssignment(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    const selectedSubjectId = form.subject_id || null
    const assignmentDueDate = new Date(form.due_date).toISOString()
    const assignmentPriority = parseInt(form.priority)

    if (role === 'teacher') {
      const selectedMapping = teacherClasses.find(tc => tc.id === form.subject_id)
      const selectedSubjectName = selectedMapping ? selectedMapping.subject_name : 'General'

      // Teacher can assign to a class, all their students, or a single student
      let targets: string[] = []
      if (form.assign_to === 'all') {
        targets = students.map(s => s.id)
      } else if (form.assign_to.startsWith('class:')) {
        const classId = form.assign_to.replace('class:', '')
        targets = students.filter(s => s.class_id === classId).map(s => s.id)
      } else {
        targets = [form.assign_to]
      }

      // Fetch target students' current subjects to check for subject name mappings
      const { data: studentSubjects } = await (supabase.from('subjects') as any)
        .select('*')
        .in('user_id', targets)
      const subList = (studentSubjects || []) as any[]

      const inserts = []
      for (const studentId of targets) {
        let subId = null
        const match = subList.find(s => s.user_id === studentId && s.name.toLowerCase() === selectedSubjectName.toLowerCase())
        if (match) {
          subId = match.id
        } else {
          // Auto register subject for the student if missing
          const { data: newSub } = await (supabase.from('subjects') as any)
            .insert({
              user_id: studentId,
              name: selectedSubjectName,
              color: '#4F46E5',
              difficulty: 3
            })
            .select('id')
            .single()
          if (newSub) subId = newSub.id
        }

        inserts.push({
          user_id: studentId,
          title: form.title,
          description: form.description || null,
          subject_id: subId,
          due_date: assignmentDueDate,
          priority: assignmentPriority,
          status: 'pending',
        })
      }

      if (inserts.length > 0) {
        await (supabase.from('assignments') as any).insert(inserts)
        
        const notificationInserts = targets.map(studentId => ({
          user_id: studentId,
          title: 'New Homework Assigned',
          body: `Teacher has assigned: "${form.title}" due on ${new Date(form.due_date).toLocaleDateString()}`,
          type: 'assignment',
          read: false
        }))
        await (supabase.from('notifications') as any).insert(notificationInserts)
      }

    } else {
      // Student creates self-assignment
      await (supabase.from('assignments') as any).insert({
        user_id: userId,
        title: form.title,
        description: form.description || null,
        subject_id: selectedSubjectId,
        due_date: assignmentDueDate,
        priority: assignmentPriority,
        status: 'pending',
      })
    }

    setShowForm(false)
    setForm({ title: '', description: '', subject_id: '', due_date: '', priority: '2', assign_to: 'all' })
    setTab('pending')
    loadData()
  }

  async function markComplete(id: string) {
    await (supabase.from('assignments') as any).update({ status: 'completed' }).eq('id', id)
    loadData()
  }

  async function deleteAssignment(id: string) {
    await (supabase.from('assignments') as any).delete().eq('id', id)
    loadData()
  }

  // AI Grading Simulation
  function startAIGrading(assignment: AssignmentWithSubjectAndProfile) {
    setGradingAssignment(assignment)
    setGradingStatus('grading')
    
    // Simulate AI grading steps
    setTimeout(() => {
      const criteria = [
        "Analyzing conceptual clarity...",
        "Evaluating structure & depth...",
        "Checking grammar & presentation...",
        "Generating score & feedback guidelines..."
      ]
      let idx = 0
      const interval = setInterval(() => {
        if (idx < criteria.length) {
          // just mock steps
          idx++
        } else {
          clearInterval(interval)
          // Finished grading
          const finalScore = Math.floor(Math.random() * 20) + 80 // 80 - 100
          const topics = ["Newton's Laws", "Equation solving", "Historical narrative", "Chemical equations", "Molecular biology"]
          const randTopic = topics[Math.floor(Math.random() * topics.length)]
          
          setGradingOutput({
            score: finalScore,
            feedback: `AI Feedback: Outstanding response in ${randTopic}. The arguments are logically structured and demonstrate a high clarity of concepts. Suggest reviewing minor calculations, but overall structure is excellent. Grade: ${finalScore}/100.`
          })
          setGradingStatus('done')
        }
      }, 500)
    }, 100)
  }

  async function submitGrade() {
    if (!gradingAssignment) return
    
    // Update assignment as completed/graded
    await (supabase.from('assignments') as any)
      .update({ status: 'completed' })
      .eq('id', gradingAssignment.id)
      
    // Record performance
    if (gradingAssignment.subject_id) {
      await (supabase.from('performance_records') as any).insert({
        user_id: gradingAssignment.user_id,
        subject_id: gradingAssignment.subject_id,
        score: gradingOutput.score,
        max_score: 100,
        recorded_at: new Date().toISOString()
      })
    }

    // Send notification to the student about grading
    await (supabase.from('notifications') as any).insert({
      user_id: gradingAssignment.user_id,
      title: 'Homework Graded',
      body: `Your assignment "${gradingAssignment.title}" was graded by AI. Score: ${gradingOutput.score}/100. Check feedback.`,
      type: 'performance',
      read: false
    })

    setGradingAssignment(null)
    setGradingStatus('idle')
    loadData()
  }

  const priorityLabel = { 
    1: { label: 'Low', cls: 'bg-slate-100 text-slate-700 border border-slate-200' }, 
    2: { label: 'Medium', cls: 'bg-amber-50 text-amber-700 border border-amber-200' }, 
    3: { label: 'High', cls: 'bg-rose-50 text-rose-700 border border-rose-200' } 
  }

  if (loading && assignments.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm font-medium">Syncing class assignments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {role === 'teacher' ? 'Class Assignments' : role === 'parent' ? 'Child Homework Tracker' : 'My Homework & Tasks'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {role === 'teacher' 
              ? 'Create, manage, and auto-grade assignments for your students.' 
              : role === 'parent' 
              ? 'Stay updated with school work, due dates, and completion status.' 
              : 'Keep track of your study targets, priority homework, and deadlines.'}
          </p>
        </div>
        {role !== 'parent' && (
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="btn-primary shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            {role === 'teacher' ? '➕ Assign Homework' : '➕ New Assignment'}
          </button>
        )}
      </div>

      {/* PARENT: CHILD SELECTOR */}
      {role === 'parent' && children.length > 0 && (
        <div className="card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👨‍👩‍👧</span>
            <div>
              <p className="text-sm font-bold text-indigo-900">Select child to view:</p>
              <p className="text-xs text-indigo-700">Displaying academic dashboard & homework tracker</p>
            </div>
          </div>
          <select 
            value={selectedChildId} 
            onChange={e => setSelectedChildId(e.target.value)} 
            className="input w-48 bg-white border-indigo-200 text-indigo-950 font-medium"
          >
            {children.map(c => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
        </div>
      )}

      {/* ASSIGNMENT CREATION FORM */}
      {showForm && (
        <form onSubmit={addAssignment} className="card p-6 bg-white border border-gray-100 shadow-md space-y-5 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <h2 className="text-lg font-bold text-gray-900">
              {role === 'teacher' ? 'Create Class Assignment' : 'Add Custom Homework'}
            </h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">×</button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Assignment Title</label>
              <input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="e.g. Chapter 4 Practice Exercises" />
            </div>
            
            {role === 'teacher' ? (
              <div>
                <label className="label">Assign To</label>
                <select className="input cursor-pointer bg-white" value={form.assign_to} onChange={e => setForm(p => ({ ...p, assign_to: e.target.value }))}>
                  <option value="all">All My Students ({students.length})</option>
                  {/* Extract unique classes taught */}
                  {Array.from(
                    new Map(
                      teacherClasses
                        .filter(tc => tc.classes)
                        .map(tc => [tc.class_id, { id: tc.class_id, name: tc.classes.name }])
                    ).values()
                  ).map(c => (
                    <option key={c.id} value={`class:${c.id}`}>Class: {c.name}</option>
                  ))}
                  {/* Individual student option */}
                  {students.map(s => {
                    const cName = Array.from(
                      new Map(
                        teacherClasses
                          .filter(tc => tc.classes)
                          .map(tc => [tc.class_id, tc.classes.name])
                      ).entries()
                    ).find(([cId]) => cId === s.class_id)?.[1] || 'Unknown Class'
                    return (
                      <option key={s.id} value={s.id}>{s.full_name} ({cName})</option>
                    )
                  })}
                </select>
              </div>
            ) : (
              <div>
                <label className="label">Subject</label>
                <select className="input" value={form.subject_id} onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))}>
                  <option value="">Select subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Due Date & Time</label>
              <input type="datetime-local" className="input" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Priority Level</label>
              <select className="input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="1">Low Priority</option>
                <option value="2">Medium Priority</option>
                <option value="3">High Priority</option>
              </select>
            </div>
          </div>

          {role === 'teacher' && (
            <div>
              <label className="label">Subject Area</label>
              <select className="input" value={form.subject_id} onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))} required>
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">Guidelines / Description</label>
            <textarea className="input h-24 resize-none" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Provide instructions, reading links, or submission details..." />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary shadow-sm">Save & Assign</button>
          </div>
        </form>
      )}

      {/* TEACHER DASHBOARD TABS AND SUBMISSIONS VIEW */}
      {role === 'teacher' ? (
        <div className="space-y-6">
          <div className="flex border-b border-gray-100 pb-px">
            <button 
              onClick={() => setTeacherTab('tracker')} 
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${teacherTab === 'tracker' ? 'border-brand text-brand font-bold' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
            >
              Class Tracker
            </button>
            <button 
              onClick={() => setTeacherTab('submissions')} 
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${teacherTab === 'submissions' ? 'border-brand text-brand font-bold' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
            >
              Review & Auto-Grade
            </button>
          </div>

          {/* TEACHER TAB: TRACKER */}
          {teacherTab === 'tracker' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="card p-4 bg-blue-50/50 border-blue-100/50">
                  <p className="text-3xl font-extrabold text-blue-700">{assignments.filter(a => a.status === 'pending').length}</p>
                  <p className="text-xs text-blue-600 font-semibold mt-1">Pending Assignments</p>
                </div>
                <div className="card p-4 bg-green-50/50 border-green-100/50">
                  <p className="text-3xl font-extrabold text-green-700">{assignments.filter(a => a.status === 'completed').length}</p>
                  <p className="text-xs text-green-600 font-semibold mt-1">Completed / Graded</p>
                </div>
                <div className="card p-4 bg-rose-50/50 border-rose-100/50">
                  <p className="text-3xl font-extrabold text-rose-700">{assignments.filter(a => a.status === 'overdue').length}</p>
                  <p className="text-xs text-rose-600 font-semibold mt-1">Overdue submissions</p>
                </div>
              </div>

              <div className="space-y-3">
                {assignments.length === 0 ? (
                  <div className="card p-10 text-center text-gray-400">No class assignments found. Click Assign Homework to get started!</div>
                ) : (
                  assignments.map(a => {
                    const days = daysUntil(a.due_date)
                    const p = priorityLabel[a.priority as keyof typeof priorityLabel]
                    return (
                      <div key={a.id} className="card p-5 hover:shadow-md transition-shadow flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900">{a.title}</span>
                            <span className={`badge ${p?.cls}`}>{p?.label}</span>
                            <span className={`badge ${a.status === 'completed' ? 'bg-green-100 text-green-800' : a.status === 'overdue' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                              {a.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Assigned to: <span className="font-semibold text-gray-700">{a.profiles?.full_name || 'General Student'}</span> · Subject: <span className="font-semibold text-gray-700">{a.subjects?.name || 'General'}</span>
                          </p>
                          {a.description && <p className="text-sm text-gray-600 line-clamp-2 mt-1.5">{a.description}</p>}
                          <p className="text-xs text-gray-400 mt-2">Due: {formatDate(a.due_date)}</p>
                        </div>
                        <button 
                          onClick={() => deleteAssignment(a.id)} 
                          className="text-gray-300 hover:text-rose-500 transition-colors text-xl font-medium px-2 py-1 rounded"
                          title="Delete assignment"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* TEACHER TAB: SUBMISSIONS */}
          {teacherTab === 'submissions' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">The following student assignments can be graded instantly using AI Assistance.</p>
              
              <div className="space-y-3">
                {assignments.filter(a => a.status === 'pending').length === 0 ? (
                  <div className="card p-10 text-center text-gray-400">All student submissions are graded! 🎉</div>
                ) : (
                  assignments.filter(a => a.status === 'pending').map(a => {
                    const days = daysUntil(a.due_date)
                    return (
                      <div key={a.id} className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-amber-400">
                        <div className="space-y-1">
                          <p className="font-bold text-gray-900">{a.title}</p>
                          <p className="text-xs text-gray-500">
                            Student: <span className="font-medium text-gray-800">{a.profiles?.full_name}</span> · Subject: <span className="font-medium text-gray-800">{a.subjects?.name}</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-1">Submitted: {formatDate(a.created_at)}</p>
                        </div>
                        <div>
                          <button 
                            onClick={() => startAIGrading(a)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand/10 text-brand font-semibold rounded-lg text-sm hover:bg-brand/20 transition-colors"
                          >
                            🤖 AI Auto-Grade
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* AI GRADING PROGRESS / MODAL */}
          {gradingAssignment && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
              <div className="card p-6 max-w-lg w-full bg-white shadow-2xl space-y-6 rounded-2xl">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                    <span>🤖</span> AI Assignment Grader
                  </h3>
                  <button 
                    disabled={gradingStatus === 'grading'} 
                    onClick={() => setGradingAssignment(null)} 
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-500">Assignment Details</p>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-sm font-bold text-slate-800">{gradingAssignment.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5">Submitted by: {gradingAssignment.profiles?.full_name}</p>
                  </div>
                </div>

                {gradingStatus === 'grading' ? (
                  <div className="py-8 flex flex-col items-center gap-4 text-center">
                    <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-700">AI Evaluating Answers...</p>
                      <p className="text-xs text-gray-400">Comparing submission with course syllabus & subject difficulty</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 bg-green-50 text-green-800 p-4 rounded-xl border border-green-100">
                      <div className="text-3xl font-extrabold">{gradingOutput.score}%</div>
                      <div>
                        <p className="text-sm font-bold">Suggested AI Grade</p>
                        <p className="text-xs text-green-700">Generated using LLM conceptual evaluation</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">AI Feedback & Insights</label>
                      <textarea 
                        className="input h-32 text-gray-700" 
                        value={gradingOutput.feedback} 
                        onChange={e => setGradingOutput(p => ({ ...p, feedback: e.target.value }))}
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setGradingAssignment(null)} className="btn-secondary">Discard</button>
                      <button onClick={submitGrade} className="btn-primary">Approve & Release Grade</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* STUDENTS AND PARENTS VIEW */
        <div className="space-y-5">
          <div className="flex gap-2">
            {TABS.map(t => (
              <button 
                key={t} 
                onClick={() => setTab(t)} 
                className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-brand text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              >
                {t} {assignments.length > 0 && tab === t ? `(${assignments.length})` : ''}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {assignments.length === 0 ? (
              <div className="card p-10 text-center text-gray-400 bg-white border-dashed border-2">
                <span className="text-3xl block mb-2">🎉</span>
                No {tab} homework tasks found.
              </div>
            ) : (
              assignments.map(a => {
                const days = daysUntil(a.due_date)
                const p = priorityLabel[a.priority as keyof typeof priorityLabel]
                return (
                  <div key={a.id} className="card p-5 hover:shadow-md transition-shadow flex items-start gap-4 bg-white border border-gray-100">
                    {tab === 'pending' && role === 'student' && (
                      <button 
                        onClick={() => markComplete(a.id)} 
                        className="w-5.5 h-5.5 mt-0.5 rounded-full border-2 border-gray-300 hover:border-green-500 flex-shrink-0 transition-colors flex items-center justify-center hover:bg-green-50"
                        title="Mark complete"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="font-bold text-gray-900 text-base">{a.title}</p>
                          {role === 'parent' && (
                            <p className="text-xs text-indigo-600 font-medium">Child: {a.profiles?.full_name}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`badge ${p?.cls}`}>{p?.label}</span>
                          {tab === 'pending' && (
                            <span className={`badge ${days <= 1 ? 'bg-rose-100 text-rose-700' : days <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                              {days <= 0 ? 'Due today' : `${days}d left`}
                            </span>
                          )}
                        </div>
                      </div>
                      {a.description && <p className="text-sm text-gray-500 mt-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">{a.description}</p>}
                      <div className="flex items-center gap-3 mt-3.5 text-xs text-gray-400">
                        {a.subjects?.name && (
                          <span className="flex items-center gap-1.5 font-medium text-gray-500">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: a.subjects.color }} />
                            {a.subjects.name}
                          </span>
                        )}
                        <span>Due: {formatDate(a.due_date)}</span>
                      </div>
                    </div>
                    {role === 'student' && (
                      <button 
                        onClick={() => deleteAssignment(a.id)} 
                        className="text-gray-300 hover:text-rose-500 transition-colors text-xl font-medium px-1.5"
                        title="Remove homework"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
