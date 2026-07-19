import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Profile, Role } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

export const PREVIEW_COOKIE = 'eduai_preview_uid'

/**
 * Guard for admin-only pages. Uses the REAL session (ignores any preview cookie)
 * and returns a service client for RLS-free aggregate reads.
 * Returns null if the caller is not an authenticated admin.
 */
export async function requireAdmin(): Promise<{ svc: SupabaseClient<any, any, any>; profile: Profile } | null> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data: profile } = await (supabase.from('profiles') as any).select('*').eq('id', session.user.id).single()
  const role = profile?.role ?? session.user.user_metadata?.role
  if (role !== 'admin') return null
  return { svc: createServiceClient(), profile: profile as Profile }
}

export interface Viewer {
  /** Supabase client to read the viewer's data with. Service client when previewing (RLS bypass, READ-ONLY). */
  db: SupabaseClient<any, any, any>
  /** The id whose dashboard we are showing (real user, or previewed user for admins). */
  userId: string
  /** The role of the dashboard being shown. */
  role: Role
  /** Profile of the dashboard being shown. */
  profile: Profile | null
  /** True when an admin is viewing another user's dashboard. Writes must be disabled. */
  isPreview: boolean
  /** True when the real logged-in user is an admin. */
  isAdmin: boolean
  /** The real logged-in user's id (the admin, when previewing). */
  realUserId: string
  /** The real logged-in user's profile. */
  realProfile: Profile | null
}

/**
 * Resolves whose dashboard to render.
 * - Normal users: their own session + profile (auto-creates/syncs the profile row if needed).
 * - Admins with a `preview` search-param or `eduai_preview_uid` cookie: the target user's
 *   dashboard, read through the service client (bypasses RLS, strictly read-only).
 * Returns null when there is no session.
 */
export async function resolveViewer(previewParam?: string): Promise<Viewer | null> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const uid = session.user.id
  const metaRole = session.user.user_metadata?.role as Role | undefined

  // Fetch (and if necessary create/sync) the real user's profile.
  let { data: realProfile } = await (supabase.from('profiles') as any).select('*').eq('id', uid).single()

  if (!realProfile) {
    const defaultName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
    const insertRole: Role = (metaRole === 'teacher' || metaRole === 'parent' || metaRole === 'admin' || metaRole === 'student') ? metaRole : 'student'
    const { data: created } = await (supabase.from('profiles') as any)
      .upsert({ id: uid, email: session.user.email ?? '', full_name: defaultName, role: insertRole, xp_points: 0, streak_days: 0 })
      .select()
      .single()
    realProfile = created ?? ({ id: uid, email: session.user.email ?? '', full_name: defaultName, role: insertRole } as Profile)
  } else if (metaRole && metaRole !== realProfile.role && ['teacher', 'parent', 'student', 'admin'].includes(metaRole)) {
    const { data: updated } = await (supabase.from('profiles') as any).update({ role: metaRole }).eq('id', uid).select().single()
    if (updated) realProfile = updated
  }

  const realRole = (realProfile?.role ?? metaRole ?? 'student') as Role
  const isAdmin = realRole === 'admin'

  // Preview target (admins only): search param wins over cookie.
  const cookieStore = await cookies()
  const targetId = previewParam || cookieStore.get(PREVIEW_COOKIE)?.value

  if (isAdmin && targetId && targetId !== uid) {
    const svc = createServiceClient()
    const { data: target } = await (svc.from('profiles') as any).select('*').eq('id', targetId).single()
    if (target) {
      return {
        db: svc, userId: target.id, role: target.role as Role, profile: target as Profile,
        isPreview: true, isAdmin: true, realUserId: uid, realProfile,
      }
    }
  }

  return {
    db: supabase, userId: uid, role: realRole, profile: realProfile,
    isPreview: false, isAdmin, realUserId: uid, realProfile,
  }
}
