import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createPublicKey, verify as cryptoVerify, type KeyObject } from 'node:crypto'
import type { NextRequest } from 'next/server'

// The number of meetings a user can analyse on the free tier. This is the
// seed of the paywall — raising it (or gating it by plan) is how paid tiers
// will work later. Keep it here as the single source of truth.
export const FREE_MEETING_LIMIT = 1

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Supabase signs user tokens with asymmetric ES256 keys and publishes the
// matching public keys here. We verify tokens locally against these — instant,
// offline, and not subject to the auth server's rate limits (unlike getUser).
const JWKS_URL = `${supabaseUrl}/auth/v1/.well-known/jwks.json`
const ISSUER = `${supabaseUrl}/auth/v1`

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

// ── Local JWT verification ──────────────────────────────────────────────────

interface Jwk { kid?: string; kty?: string; [k: string]: unknown }
let jwksCache: { keys: Jwk[]; fetchedAt: number } | null = null
const JWKS_TTL_MS = 10 * 60 * 1000 // refresh the key set at most every 10 min

/** Resolve the public key for a given `kid`, fetching (and caching) the JWKS as
 *  needed. Falls back to the cached set if a refresh fails, and only refetches
 *  on an unknown kid (i.e. after a Supabase key rotation). */
async function publicKeyForKid(kid: string): Promise<KeyObject | null> {
  const fresh = jwksCache !== null && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS
  const known = jwksCache?.keys.some(k => k.kid === kid) ?? false
  // Refetch when we've never loaded the keys, the kid is unknown (likely a key
  // rotation), or the cache has aged out.
  if (!known || !fresh) {
    try {
      const res = await fetch(JWKS_URL)
      if (res.ok) {
        const body = (await res.json()) as { keys?: Jwk[] }
        if (Array.isArray(body.keys)) jwksCache = { keys: body.keys, fetchedAt: Date.now() }
      }
    } catch {
      // Network hiccup — keep any cached keys and try to satisfy from them.
    }
  }
  const jwk = jwksCache?.keys.find(k => k.kid === kid)
  if (!jwk) return null
  try {
    return createPublicKey({ key: jwk, format: 'jwk' } as Parameters<typeof createPublicKey>[0])
  } catch {
    return null
  }
}

function decodeSegment(seg: string): Record<string, unknown> | null {
  try {
    return JSON.parse(Buffer.from(seg, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

/** Verify the Bearer token on a request locally against Supabase's public keys.
 *  Returns the caller, or null if the token is missing, forged, expired, or for
 *  the wrong issuer/audience — the paid routes reject on null. */
export async function authenticateRequest(request: NextRequest): Promise<AuthedCaller | null> {
  const header = request.headers.get('authorization') ?? request.headers.get('Authorization')
  const token = header?.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : null
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerB64, payloadB64, sigB64] = parts

  const jwtHeader = decodeSegment(headerB64)
  const payload = decodeSegment(payloadB64)
  if (!jwtHeader || !payload) return null

  // Pin the algorithm to ES256. Never trust the token's own alg beyond this —
  // accepting anything else is the classic JWT confusion / alg:none hole.
  if (jwtHeader.alg !== 'ES256' || typeof jwtHeader.kid !== 'string') return null

  const key = await publicKeyForKid(jwtHeader.kid)
  if (!key) return null

  // ES256 signatures are raw r‖s (IEEE P1363), which is what JWS uses.
  let valid = false
  try {
    valid = cryptoVerify(
      'sha256',
      Buffer.from(`${headerB64}.${payloadB64}`),
      { key, dsaEncoding: 'ieee-p1363' },
      Buffer.from(sigB64, 'base64url'),
    )
  } catch {
    return null
  }
  if (!valid) return null

  // Claim checks: unexpired, right issuer, right audience, has a subject.
  const now = Math.floor(Date.now() / 1000)
  const exp = typeof payload.exp === 'number' ? payload.exp : 0
  if (exp <= now) return null
  if (payload.iss !== ISSUER) return null
  if (payload.aud !== 'authenticated') return null
  if (typeof payload.sub !== 'string' || !payload.sub) return null

  return { userId: payload.sub, token }
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
