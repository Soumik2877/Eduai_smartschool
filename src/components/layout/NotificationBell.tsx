'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types/database.types'

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => setNotifications(p => [payload.new as Notification, ...p])
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  async function loadNotifications() {
    const { data } = await (supabase.from('notifications') as any).select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
    if (data) setNotifications(data)
  }

  async function markRead(id: string) {
    await (supabase.from('notifications') as any).update({ read: true }).eq('id', id)
    setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const unread = notifications.filter(n => !n.read).length

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-10 w-72 bg-white border border-gray-100 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100 text-sm font-medium text-gray-900">Notifications</div>
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">All caught up!</div>
          ) : notifications.map(n => (
            <button key={n.id} onClick={() => markRead(n.id)}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${n.read ? 'opacity-60' : ''}`}>
              <p className="text-sm font-medium text-gray-900">{n.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
