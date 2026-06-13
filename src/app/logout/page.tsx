'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const logout = async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/auth/login')
    }
    logout()
  }, [router])

  return <div className="flex items-center justify-center min-h-screen">Logging out...</div>
}
