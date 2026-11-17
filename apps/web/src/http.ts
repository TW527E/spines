import type { Fetcher } from '@cloudflare/workers-types'

export interface Env {
  ASSETS: Fetcher
  VERSION?: { id: string }
  /** Optional; raises the GitHub API limit. */
  GITHUB_TOKEN?: string
  /** Optional stand-in for https://api.github.com; see github-relay/. */
  GITHUB_RELAY?: string
  /** Shared with the relay, so only this Worker can use it. */
  RELAY_KEY?: string
}

/** A failure the caller should see, drawn onto a spine with this status. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

const HOUR = 3600
const DAY = 24 * HOUR

/** How long a response may be reused, in seconds, by browsers and by shared caches. */
export const ttl = {
  /** Pure functions of the URL. */
  static: { browser: DAY, edge: 30 * DAY },
  /** Anything that reads GitHub. */
  live: { browser: HOUR, edge: 2 * HOUR },
  error: { browser: 60, edge: 60 },
} as const

export function svg(
  body: string,
  cache: { browser: number; edge: number },
  status = 200,
): Response {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': `public, max-age=${cache.browser}, s-maxage=${cache.edge}`,
      'access-control-allow-origin': '*',
      'x-content-type-options': 'nosniff',
      // These documents carry user-supplied text; make sure one opened directly can do nothing.
      'content-security-policy': "default-src 'none'; img-src data:; style-src 'unsafe-inline'",
    },
  })
}

export function json(data: unknown, cache: { browser: number; edge: number }): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${cache.browser}, s-maxage=${cache.edge}`,
      'access-control-allow-origin': '*',
    },
  })
}

/**
 * Memoizes a JSON value in the edge cache under a synthetic key. Outside
 * Workers (tests) there is no cache and the value is simply produced.
 */
export async function remember<T>(
  key: string,
  seconds: number,
  produce: () => Promise<T>,
): Promise<T> {
  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default
  const request = new Request(`https://cache.internal/${key}`)
  const hit = await cache?.match(request)
  if (hit) return (await hit.json()) as T

  const value = await produce()
  await cache?.put(
    request,
    new Response(JSON.stringify(value), {
      headers: { 'content-type': 'application/json', 'cache-control': `max-age=${seconds}` },
    }),
  )
  return value
}
