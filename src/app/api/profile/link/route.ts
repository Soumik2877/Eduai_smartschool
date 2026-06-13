import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parentEmail = body.parentEmail?.trim().toLowerCase()

    if (!parentEmail) {
      return NextResponse.json({ error: 'Parent email is required' }, { status: 400 })
    }

    // Call the SECURITY DEFINER RPC function link_parent_by_email
    const { data, error } = await (supabase as any).rpc('link_parent_by_email', { parent_email: parentEmail })

    if (error) {
      console.error('RPC link_parent_by_email error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const res = data as any
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      parentName: res.parentName 
    })

  } catch (error) {
    console.error('Link parent API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Call the SECURITY DEFINER RPC function unlink_parent
    const { data, error } = await (supabase as any).rpc('unlink_parent')

    if (error) {
      console.error('RPC unlink_parent error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const res = data as any
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Unlink parent API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
