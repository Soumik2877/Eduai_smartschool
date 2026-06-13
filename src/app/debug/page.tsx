'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const { data: { user } } = await supabase.auth.getUser()
      
      setData({
        session_user_id: session?.user?.id,
        user_id: user?.id,
        user_metadata: user?.user_metadata,
        app_metadata: user?.app_metadata,
      })
      setLoading(false)
    }
    check()
  }, [])

  if (loading) return <div className="p-4">Loading...</div>
  
  return (
    <div className="p-4 font-mono text-sm bg-gray-100">
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
