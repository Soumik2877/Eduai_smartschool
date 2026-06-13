import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const identifier = body.identifier?.trim()

    if (!identifier) {
      return NextResponse.json({ error: 'Enrollment No / Teacher ID is required' }, { status: 400 })
    }

    // If it contains an '@', it's already an email address (e.g. for Parents)
    if (identifier.includes('@')) {
      return NextResponse.json({ email: identifier.toLowerCase() })
    }

    // Initialize normal supabase client (non-admin, no service key required)
    const supabase = await createClient()

    // Call the SECURITY DEFINER RPC function to safely search profiles
    const { data: email, error } = await (supabase as any).rpc('lookup_email_by_identifier', { p_identifier: identifier })

    if (error || !email) {
      return NextResponse.json({ 
        error: 'Invalid Enrollment No / Teacher ID. No registered account found.' 
      }, { status: 400 })
    }

    return NextResponse.json({ email })

  } catch (error) {
    console.error('Login lookup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
