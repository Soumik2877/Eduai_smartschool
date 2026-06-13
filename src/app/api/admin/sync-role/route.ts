import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Protected endpoint - use with care
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get currently authenticated user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user metadata from session
    const role = session.user.user_metadata?.role || 'student'
    
    console.log(`Syncing role for user ${session.user.id}: ${role}`)

    const { data, error } = await (supabase.from('profiles') as any)
      .update({ role })
      .eq('id', session.user.id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, profile: data, role })
  } catch (error) {
    console.error('Sync role error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
