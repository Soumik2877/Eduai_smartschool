import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PREVIEW_COOKIE } from '@/lib/viewer'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Admin-only. Sets (or clears) the read-only preview cookie so the admin can
 * walk any user's dashboard live. Verifies the caller is an admin server-side.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: me } = await (supabase.from('profiles') as any).select('role').eq('id', session.user.id).single()
    if (me?.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const cookieStore = await cookies()

    if (body.clear) {
      cookieStore.delete(PREVIEW_COOKIE)
      return NextResponse.json({ success: true, cleared: true })
    }

    const userId = body.userId as string | undefined
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    // Validate the target exists (service client bypasses RLS).
    const svc = createServiceClient()
    const { data: target } = await (svc.from('profiles') as any).select('id, full_name, role').eq('id', userId).single()
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    cookieStore.set(PREVIEW_COOKIE, userId, {
      httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60, // 1h
    })
    return NextResponse.json({ success: true, target })
  } catch (error) {
    console.error('preview-as error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
