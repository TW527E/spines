import type { Icon } from '@repo/spine'
import { remember } from '../http.ts'
import { bundledIcon } from '../presets.ts'

// Simple Icons: one 24×24 single-path SVG per brand, named by slug.
const CDN = 'https://cdn.jsdelivr.net/npm/simple-icons@16/icons'

/**
 * Looks up a brand mark by its Simple Icons slug (`github`, `typescript`, …).
 * An unknown slug yields no icon rather than an error: a spine without its
 * mark is still a spine.
 */
export async function icon(slug: string | undefined): Promise<Icon | undefined> {
  if (!slug || !/^[a-z0-9_]{1,40}$/.test(slug)) return undefined
  const bundled = bundledIcon(slug)
  if (bundled)
    return bundled.box ? { path: bundled.path, box: bundled.box } : { path: bundled.path }
  const path = await remember(`icon/${slug}`, 30 * 24 * 3600, async () => {
    const response = await fetch(`${CDN}/${slug}.svg`).catch(() => undefined)
    if (!response?.ok) return ''
    return (await response.text()).match(/<path d="([^"]+)"/)?.[1] ?? ''
  })
  return path ? { path } : undefined
}
