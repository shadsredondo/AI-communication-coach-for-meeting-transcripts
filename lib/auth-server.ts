import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

// The number of meetings a user can analyse on the free tier. This is the
// seed of the paywall — raising it (or gating it by plan) is how paid tiers
// will work later. Keep it here as the single source of truth.
export const FREE_MEETING_LIMIT = 1

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** A stateless Supabase client that carries the caller's token, so row-level
 *  security applies as that user (used for reads like the quota count). */
function userClient(token: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export interface AuthedCaller {
  userId: string
  token: string
}

/** Verify the Bearer token on a request. Returns the caller, or null if there
 *  is no valid signed-in user — the paid routes reject on null. */
export async function authenticateRequest(request: NextRequest): Promise<AuthedCaller | null> {
  const header = request.headers.get('authorization') ?? request.headers.get('Authorization')
  const token = header?.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : null
  if (!token) return null

  // getUser(jwt) validates the token against Supabase Auth — a forged or
  // expired token returns an error here, so this is a real check, not a decode.
  const { data, error } = await userClient(token).auth.getUser(token)
  if (error || !data.user) return null

  return { userId: data.user.id, token }
}

export interface QuotaResult {
  ok: boolean
  used: number
  limit: number
}

/** How many meetings this user has already analysed, vs. their free allowance.
 *  Counts persisted sessions under RLS. Note (v1): a user who deletes past
 *  meetings frees quota — a durable increment-only counter comes with billing. */
export async function checkQuota(caller: AuthedCaller): Promise<QuotaResult> {
  const { count } = await userClient(caller.token)
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', caller.userId)

  const used = count ?? 0
  return { ok: used < FREE_MEETING_LIMIT, used, limit: FREE_MEETING_LIMIT }
}
