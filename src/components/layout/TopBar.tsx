'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/types/database.types'
import NotificationBell from './NotificationBell'

export default function TopBar({ profile }: { profile: Profile | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className="h-14 glass-header px-6 flex items-center justify-between">
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        {profile && <NotificationBell userId={profile.id} />}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
          >
            <div className="w-7 h-7 bg-brand/10 rounded-full flex items-center justify-center">
              <span className="text-brand text-xs font-bold">{getInitials(profile?.full_name ?? 'U')}</span>
            </div>
            <span className="text-sm text-gray-700 max-w-[120px] truncate">{profile?.full_name}</span>
          </button>
          {open && (
            <div className="absolute right-0 top-10 w-40 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-50">
              <div className="px-3 py-2 text-xs text-gray-500 capitalize border-b border-gray-50">{profile?.role}</div>
              <Link
                href="/dashboard/settings"
                onClick={() => setOpen(false)}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Settings
              </Link>
              <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-50">
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
