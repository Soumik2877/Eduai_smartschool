'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/database.types'

const NAV = [
  // Admin
  { href: '/dashboard/admin', icon: '🛡️', label: 'Overview', roles: ['admin'] },
  { href: '/dashboard/admin/users', icon: '👥', label: 'Users', roles: ['admin'] },
  { href: '/dashboard/admin/analytics', icon: '📈', label: 'School Analytics', roles: ['admin'] },
  { href: '/dashboard/admin/preview', icon: '🪟', label: 'Role Preview', roles: ['admin'] },
  // Shared home (students land on their dashboard; teachers/parents on their portal)
  { href: '/dashboard', icon: '🏠', label: 'Dashboard', roles: ['student','teacher','parent'] },
  // Student
  { href: '/dashboard/planner', icon: '📅', label: 'Study Planner', roles: ['student'] },
  { href: '/dashboard/homework', icon: '📋', label: 'Homework', roles: ['student'] },
  { href: '/dashboard/doubt-solver', icon: '🤖', label: 'AI Tutor', roles: ['student'] },
  { href: '/dashboard/quiz', icon: '📝', label: 'Quiz', roles: ['student'] },
  { href: '/dashboard/focus', icon: '⏱️', label: 'Focus Timer', roles: ['student'] },
  { href: '/dashboard/gamification', icon: '🏆', label: 'Achievements', roles: ['student'] },
  { href: '/dashboard/career', icon: '🎓', label: 'Career Guide', roles: ['student'] },
  { href: '/dashboard/subjects', icon: '📚', label: 'Subjects', roles: ['student'] },
  // Analytics: students, teachers, parents
  { href: '/dashboard/analytics', icon: '📊', label: 'Analytics', roles: ['student','teacher','parent'] },
  // Everyone
  { href: '/dashboard/settings', icon: '⚙️', label: 'Settings', roles: ['student','teacher','parent','admin'] },
]

export default function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname()
  const links = NAV.filter(n => n.roles.includes(role))

  return (
    <aside className="w-56 glass-sidebar flex flex-col">
      <div className="p-5 border-b border-gray-100/60">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-gradient-to-tr from-brand to-indigo-500 rounded-xl flex items-center justify-center shadow-md shadow-brand/15 group-hover:scale-105 transition-transform shrink-0">
            <span className="text-white font-black text-sm">E</span>
          </div>
          <div className="leading-tight">
            <span className="block font-extrabold text-gray-900 text-base tracking-tight">EduAI</span>
            <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wide">AF School Kalaikunda</span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map(link => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-brand to-indigo-800 text-white shadow-md shadow-brand/25 translate-x-0.5'
                  : 'text-gray-500 hover:bg-gray-100/60 hover:text-gray-900'
              )}
            >
              <span className={cn('text-base transition-transform duration-200', isActive ? 'scale-110' : 'group-hover:scale-110')}>{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
