import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // After successful session exchange, get current user and update profile with role
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.user_metadata?.role) {
        // Update profile with the role from user metadata
        const { error: updateError } = await (supabase.from('profiles') as any)
          .update({ role: user.user_metadata.role })
          .eq('id', user.id)
        
        if (updateError) {
          console.error('Failed to save role:', updateError)
        } else {
          console.log('✓ Role saved:', user.user_metadata.role, 'for user:', user.id)
        }
      }
    }
  }
  
  return NextResponse.redirect(`${origin}/dashboard`)
}
