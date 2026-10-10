import "server-only"

type Entry = { count: number; resetAt: number }

/**
 * Best-effort, per-instance fixed-window rate limiter. Use a shared store
 * (e.g. Upstash Redis) if strict limits across serverless instances are needed.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const entries = new Map<string, Entry>()

  return function isRateLimited(key: string) {
    const now = Date.now()

    for (const [entryKey, entry] of entries) {
      if (now > entry.resetAt) entries.delete(entryKey)
    }

    const entry = entries.get(key)
    if (!entry) {
      entries.set(key, { count: 1, resetAt: now + windowMs })
      return false
    }

    entry.count += 1
    return entry.count > limit
  }
}

export function clientIpFrom(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown"
}
