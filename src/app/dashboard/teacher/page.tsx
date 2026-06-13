import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeacherPortalForm from './TeacherPortalForm'

export const metadata = { title: 'Teacher Portal - EduAI' }

export default async function TeacherPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Fetch teacher profile
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'teacher') {
    redirect('/dashboard')
  }

  // Fetch student roster (selecting class_id for filtering)
  const { data: students } = await (supabase.from('profiles') as any)
    .select('id, full_name, xp_points, streak_days, class_id')
    .eq('role', 'student')
    .order('full_name', { ascending: true })

  // Fetch notes created by this teacher
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('teacher_id', session.user.id)
    .order('created_at', { ascending: false })

  // Fetch logs created by this teacher
  const { data: logs } = await (supabase.from('student_logs') as any)
    .select(`
      id,
      student_id,
      log_type,
      content,
      created_at,
      profiles:student_id ( full_name )
    `)
    .eq('teacher_id', session.user.id)
    .order('created_at', { ascending: false })

  // Fetch teacher's active class & subject mappings
  const { data: teacherClasses } = await (supabase.from('teacher_classes') as any)
    .select('*, classes(name)')
    .eq('teacher_id', session.user.id)

  const formattedLogs = (logs ?? []).map((l: any) => ({
    id: l.id,
    student_id: l.student_id,
    log_type: l.log_type,
    content: l.content,
    created_at: l.created_at,
    profiles: l.profiles ? { full_name: l.profiles.full_name } : null
  }))

  return (
    <TeacherPortalForm
      teacherId={session.user.id}
      teacherName={profile.full_name}
      students={students || []}
      initialNotes={notes || []}
      initialLogs={formattedLogs}
      teacherClasses={teacherClasses || []}
    />
  )
}
