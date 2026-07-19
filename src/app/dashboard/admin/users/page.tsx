import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/viewer'
import UsersTable from './UsersTable'

export const metadata = { title: 'Users - EduAI Admin' }

export default async function AdminUsers() {
  const admin = await requireAdmin()
  if (!admin) redirect('/dashboard')
  const svc = admin.svc as any

  const [{ data: profiles }, { data: classes }] = await Promise.all([
    svc.from('profiles').select('id, full_name, email, role, enrollment_no, teacher_id, class_id, xp_points, streak_days').order('role').order('full_name'),
    svc.from('classes').select('id, name'),
  ])
  const classMap: Record<string, string> = Object.fromEntries((classes ?? []).map((c: any) => [c.id, c.name]))
  const users = (profiles ?? []).map((p: any) => ({ ...p, class_name: p.class_id ? classMap[p.class_id] : null }))

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Users & Directory</h1>
        <p className="text-sm text-gray-500 mt-1">All {users.length} accounts across the school. Filter by role, search, and open any dashboard in read-only preview.</p>
      </div>
      <UsersTable users={users} />
    </div>
  )
}
