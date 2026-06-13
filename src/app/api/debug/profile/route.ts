import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get profile from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message, user_id: session.user.id }, { status: 400 })
    }

    // Get auth user metadata
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    return NextResponse.json({ 
      profile,
      auth_user: user?.user_metadata,
      user_id: session.user.id 
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
