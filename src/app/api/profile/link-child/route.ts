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
    const childEmail = body.childEmail?.trim().toLowerCase()

    if (!childEmail) {
      return NextResponse.json({ error: 'Child email is required' }, { status: 400 })
    }

    // Invoke RPC function that runs with SECURITY DEFINER inside the database
    const { data, error } = await (supabase as any).rpc('link_child_by_email', { child_email: childEmail })

    if (error) {
      console.error('RPC link_child_by_email error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const res = data as any
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      childId: res.childId,
      childName: res.childName 
    })

  } catch (error: any) {
    console.error('Link child API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const childId = body.childId

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 })
    }

    // Invoke RPC function to unlink inside the database
    const { data, error } = await (supabase as any).rpc('unlink_child_by_id', { child_uid: childId })

    if (error) {
      console.error('RPC unlink_child_by_id error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const res = data as any
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Unlink child API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
