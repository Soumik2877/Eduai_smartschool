import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/viewer'
import PreviewLauncher from './PreviewLauncher'

export const metadata = { title: 'Role Preview - EduAI Admin' }

export default async function AdminPreview() {
  const admin = await requireAdmin()
  if (!admin) redirect('/dashboard')
  const svc = admin.svc as any

  // Pick one representative account per role for the showcase.
  const [{ data: students }, { data: teachers }, { data: parents }] = await Promise.all([
    svc.from('profiles').select('id, full_name, enrollment_no').eq('role', 'student').order('enrollment_no').limit(1),
    svc.from('profiles').select('id, full_name, teacher_id').eq('role', 'teacher').limit(1),
    svc.from('profiles').select('id, full_name').eq('role', 'parent').limit(1),
  ])

  const cards = [
    { role: 'student', tone: 'from-indigo-500 to-indigo-700', label: 'Student', user: students?.[0], dest: '/dashboard' },
    { role: 'teacher', tone: 'from-emerald-500 to-emerald-700', label: 'Teacher', user: teachers?.[0], dest: '/dashboard/teacher' },
    { role: 'parent', tone: 'from-amber-500 to-amber-600', label: 'Parent', user: parents?.[0], dest: '/dashboard/parent' },
  ].filter(c => c.user)

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Role Preview — Judges' View</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every role's dashboard, live and read-only, on one screen. Click <strong>Open full dashboard</strong> to walk through the complete experience, then <strong>Exit preview</strong> to return here.
        </p>
      </div>

      {!cards.length && (
        <div className="card p-10 text-center text-gray-400">No demo users found — run <code className="font-mono">npm run seed</code> first.</div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {cards.map(c => (
          <div key={c.role} className="card overflow-hidden flex flex-col">
            <div className={`bg-gradient-to-r ${c.tone} px-5 py-3.5 text-white flex items-center justify-between`}>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider opacity-80">{c.label} Portal</span>
                <p className="font-extrabold text-sm leading-tight">{c.user!.full_name}</p>
              </div>
              <PreviewLauncher userId={c.user!.id} dest={c.dest} />
            </div>
            <div className="bg-slate-100 h-[540px] overflow-hidden">
              <iframe src={`/embed/${c.user!.id}`} title={`${c.label} preview`} className="w-full h-full border-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
