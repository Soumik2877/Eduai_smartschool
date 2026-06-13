import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get all auth users with role in metadata
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) throw usersError
    
    // Update profiles with roles from auth metadata
    for (const user of users || []) {
      const role = user.user_metadata?.role || 'student'
      await (supabase.from('profiles') as any)
        .update({ role })
        .eq('id', user.id)
    }
    
    return NextResponse.json({ success: true, updated: users?.length || 0 })
  } catch (error) {
    console.error('Fix roles error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
