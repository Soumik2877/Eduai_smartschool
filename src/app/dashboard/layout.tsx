import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  let { data: profile } = await (supabase.from('profiles') as any)
    .select('*')
    .eq('id', session.user.id)
    .single()

  const metaRole = session.user.user_metadata?.role

  if (!profile) {
    console.log('Profile row missing in layout. Creating one...')
    const defaultName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
    const insertRole = (metaRole === 'teacher' || metaRole === 'parent' || metaRole === 'student') ? metaRole : 'student'
    
    const { data: newProfile } = await (supabase.from('profiles') as any)
      .upsert({
        id: session.user.id,
        email: session.user.email,
        full_name: defaultName,
        role: insertRole,
        xp_points: 0,
        streak_days: 0
      })
      .select()
      .single()
    
    profile = newProfile || { id: session.user.id, email: session.user.email || '', full_name: defaultName, role: insertRole }
  } else if (metaRole && (metaRole === 'teacher' || metaRole === 'parent' || metaRole === 'student') && metaRole !== profile.role) {
    console.log(`Syncing profile role in layout to match user metadata: ${metaRole}`)
    const { data: updatedProfile } = await (supabase.from('profiles') as any)
      .update({ role: metaRole })
      .eq('id', session.user.id)
      .select()
      .single()
    
    profile = updatedProfile || { ...profile, role: metaRole }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar role={profile?.role ?? 'student'} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
