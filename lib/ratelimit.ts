import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Global sliding-window rate limit: 1000 API calls per 24 hours across all users.
// Each game round consumes 1–2 calls (/api/clue and/or /api/guess).
// At Haiku pricing this caps daily spend well under $5.
//
// If the Upstash env vars are not set (e.g. local dev), rate limiting is skipped.

function buildRatelimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(1000, '24 h'),
    prefix: 'wavelength',
  })
}

const ratelimitInstance = buildRatelimit()

/** Returns { success: true } when rate limiting is disabled (no env vars configured). */
export async function checkRateLimit(): Promise<{ success: boolean }> {
  if (!ratelimitInstance) return { success: true }
  return ratelimitInstance.limit('global')
}
