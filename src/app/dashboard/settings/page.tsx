import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from './SettingsForm'

export const metadata = { title: 'Settings - EduAI' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Fetch current user profile
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!profile) {
    redirect('/dashboard')
  }

  // Fetch specific linkages depending on user role
  let parentProfile = null
  let childrenList: { id: string; full_name: string; email: string }[] = []

  if (profile.role === 'student' && profile.parent_id) {
    const { data: parent } = await (supabase.from('profiles') as any)
      .select('full_name, email')
      .eq('id', profile.parent_id)
      .single()
    parentProfile = parent
  } else if (profile.role === 'parent') {
    const { data: children } = await (supabase.from('profiles') as any)
      .select('id, full_name, email')
      .eq('parent_id', session.user.id)
    childrenList = children || []
  }

  // Fetch all classes
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .order('name')

  // Fetch teacher's active mappings if teacher
  let teacherClasses: any[] = []
  if (profile.role === 'teacher') {
    const { data: tc } = await (supabase.from('teacher_classes') as any)
      .select('*, classes(name)')
      .eq('teacher_id', session.user.id)
    teacherClasses = (tc || []) as any[]
  }

  return (
    <SettingsForm 
      profile={profile} 
      parentProfile={parentProfile} 
      childrenList={childrenList} 
      classesList={classes || []}
      teacherClasses={teacherClasses}
    />
  )
}
