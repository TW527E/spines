import { readFile } from 'node:fs/promises'
import { render } from '@repo/spine'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Env } from '../src/http.ts'
import worker from '../src/index.ts'
import { shelfItem } from '../src/params.ts'
import { preset, presets } from '../src/presets.ts'
import { compact } from '../src/sources/github.ts'

const publicDir = new URL('../public/', import.meta.url)

const env = {
  ASSETS: {
    fetch: async (input: string) => {
      const path = new URL(input).pathname.slice(1)
      try {
        return new Response(await readFile(new URL(path, publicDir)))
      } catch {
        return new Response('missing', { status: 404 })
      }
    },
  },
} as unknown as Env

const get = (path: string, init?: RequestInit) =>
  worker.fetch(new Request(`https://spines.test${path}`, init), env)

const dims = (svg: string) => {
  const [, w, h] = svg.match(/^<svg[^>]* width="([\d.]+)" height="([\d.]+)"/) ?? []
  return { width: Number(w), height: Number(h) }
}

/** Fails the test if anything reaches the network that the test did not expect. */
function network(routes: Record<string, () => Response>) {
  const calls: string[] = []
  vi.stubGlobal('fetch', async (input: string) => {
    calls.push(input)
    const match = Object.entries(routes).find(([prefix]) => input.startsWith(prefix))
    if (!match) throw new Error(`unexpected fetch ${input}`)
    return match[1]()
  })
  return calls
}

const hono = {
  name: 'hono',
  owner: { login: 'honojs' },
  stargazers_count: 26543,
  language: 'TypeScript',
  fork: false,
  archived: false,
}

const hono4321 = {
  number: 4321,
  title: 'Add streaming helpers',
  state: 'open',
  base: { repo: hono },
}

afterEach(() => vi.unstubAllGlobals())

describe('/badge', () => {
  it('draws one preset lying down, without touching the network', async () => {
    const calls = network({})
    const response = await get('/badge/typescript.svg')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('image/svg+xml')
    expect(response.headers.get('cache-control')).toContain('s-maxage')
    const svg = await response.text()
    expect(svg).toContain('aria-label="TypeScript"')
    const { width, height } = dims(svg)
    expect(width).toBeGreaterThan(height)
    expect(calls).toEqual([])
  })

  it('stands several presets on a shelf', async () => {
    const svg = await (await get('/badge/ts,react,docker,claude')).text()
    expect(svg).toContain('aria-label="TypeScript, React, Docker, Claude"')
    const { width, height } = dims(svg)
    expect(height).toBeGreaterThan(width)
  })

  it('lets the caller lay them down instead', async () => {
    const { width, height } = dims(await (await get('/badge/ts,react?layout=stack')).text())
    expect(width).toBeGreaterThan(height)
  })

  it('shows the print once one has been drawn, and typesets on request', async () => {
    expect(await (await get('/badge/typescript')).text()).toContain('data:image/webp')
    expect(await (await get('/badge/typescript?theme=grid')).text()).not.toContain('data:image')
    expect(await (await get('/badge/react')).text()).toContain('data:image/webp')
    expect(await (await get('/badge/docker?theme=noir')).text()).not.toContain('data:image')
  })

  it('lets the caller restyle a preset', async () => {
    const svg = await (await get('/badge/python?sub=3.13&theme=noir')).text()
    expect(svg).toContain('aria-label="Python"')
    expect(svg).toContain('#0e0e10') // noir paper
  })

  it('answers an unknown name with a badge that says so', async () => {
    const response = await get('/badge/nope.svg')
    expect(response.status).toBe(404)
    expect(await response.text()).toContain('aria-label="no badge called nope"')
  })

  it('has a mark and a color for every preset', () => {
    expect(presets.length).toBeGreaterThan(80)
    for (const p of presets) {
      if (p.icon.slug !== 'none') expect(p.icon.path, p.slug).toMatch(/^[Mm]/)
      expect(p.icon.hex, p.slug).toMatch(/^[0-9A-F]{6}$/)
    }
    expect(new Set(presets.map((p) => p.slug)).size).toBe(presets.length)
    expect(preset('K8S')?.slug).toBe('kubernetes')
  })

  it('typesets an entry Simple Icons has no mark for', async () => {
    const response = await get('/badge/minecraft.svg')
    expect(response.status).toBe(200)
    expect(await response.text()).toContain('aria-label="Minecraft"')
  })
})

describe('/spine', () => {
  it('typesets any title', async () => {
    network({})
    const svg = await (
      await get('/spine/Hello%2C%20World.svg?theme=clay&sub=v1&icon=typescript')
    ).text()
    expect(svg).toContain('aria-label="Hello, World"')
    expect(svg).toContain(preset('typescript')!.icon.path)
  })

  it('fetches marks that are not bundled', async () => {
    const calls = network({
      'https://cdn.jsdelivr.net/': () => new Response('<svg><path d="M0 0h24v24H0z"/></svg>'),
    })
    const svg = await (await get('/spine/Hi?icon=hashnode')).text()
    expect(calls[0]).toContain('/hashnode.svg')
    expect(svg).toContain('M0 0h24v24H0z')
  })

  it('rejects an empty title', async () => {
    expect((await get('/spine/%20')).status).toBe(400)
  })

  it('rejects malformed escapes', async () => {
    expect((await get('/spine/%E0%A4%A')).status).toBe(400)
  })
})

describe('/art', () => {
  it('inlines prints so the SVG stands alone', async () => {
    const svg = await (await get('/art/claude,typescript.svg')).text()
    expect(svg).toContain('aria-label="Claude, TypeScript"')
    expect(svg.match(/href="data:image\/webp;base64,/g)).toHaveLength(2)
  })

  it('says which print is missing', async () => {
    const response = await get('/art/nope')
    expect(response.status).toBe(404)
  })
})

describe('/shelf', () => {
  it('mixes every kind of spine', async () => {
    network({
      'https://api.github.com/repos/honojs/hono': () =>
        Response.json({
          name: 'hono',
          owner: { login: 'honojs' },
          stargazers_count: 26543,
          language: 'TypeScript',
          fork: false,
          archived: false,
        }),
    })
    const query = ['Hello;theme=signal', 'badge:rust', 'gh:honojs/hono', 'art:cursor']
      .map((s) => `s=${encodeURIComponent(s)}`)
      .join('&')
    const response = await get(`/shelf.svg?${query}`)
    expect(response.status).toBe(200)
    // Reads GitHub, so it may not be cached as long as a pure drawing.
    expect(response.headers.get('cache-control')).toContain('max-age=3600')
    expect(await response.text()).toContain('aria-label="Hello, Rust, hono, Cursor"')
  })

  it('needs at least one item', async () => {
    expect((await get('/shelf')).status).toBe(400)
  })

  it('caps its length', async () => {
    const query = Array.from({ length: 25 }, (_, i) => `s=${i}`).join('&')
    expect((await get(`/shelf?${query}`)).status).toBe(400)
  })

  it('shelves a pull request beside its repository', async () => {
    const calls = network({
      'https://api.github.com/repos/honojs/hono/pulls/4321': () => Response.json(hono4321),
      'https://api.github.com/repos/honojs/hono': () => Response.json(hono),
    })
    const response = await get('/shelf.svg?s=gh:honojs/hono&s=pr:honojs/hono/4321')
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('max-age=3600')
    expect(await response.text()).toContain('aria-label="hono, Add streaming helpers"')
    expect(calls.sort()).toEqual([
      'https://api.github.com/repos/honojs/hono',
      'https://api.github.com/repos/honojs/hono/pulls/4321',
    ])
  })

  it('counts pull requests among the GitHub reads it caps', async () => {
    const calls = network({})
    const query = Array.from({ length: 13 }, (_, i) => `s=pr:a/b/${i + 1}`).join('&')
    expect((await get(`/shelf?${query}`)).status).toBe(400)
    expect(calls).toEqual([])
  })
})

describe('/gh', () => {
  it('draws one repository lying down', async () => {
    const calls = network({ 'https://api.github.com/repos/honojs/hono': () => Response.json(hono) })
    const response = await get('/gh/honojs/hono.svg')
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('max-age=3600')
    const svg = await response.text()
    expect(svg).toContain('aria-label="hono"')
    const { width, height } = dims(svg)
    expect(width).toBeGreaterThan(height)
    expect(calls).toEqual(['https://api.github.com/repos/honojs/hono'])
  })

  it('draws a pull request: its title, with the repository and number at the foot', async () => {
    const calls = network({
      'https://api.github.com/repos/honojs/hono/pulls/4321': () => Response.json(hono4321),
    })
    const response = await get('/gh/honojs/hono/pull/4321.svg')
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('max-age=3600')
    const svg = await response.text()
    expect(svg).toContain('aria-label="Add streaming helpers"')
    const icon = { path: preset('typescript')!.icon.path }
    const drawn = (sub: string) =>
      render([{ title: 'Add streaming helpers', sub, icon }], { layout: 'stack', length: 420 })
    expect(svg).toBe(drawn('hono #4321'))
    expect(svg).not.toBe(drawn('#4321'))
    expect(calls).toEqual(['https://api.github.com/repos/honojs/hono/pulls/4321'])
  })

  it('keeps the number when the repository name would crowd it out', async () => {
    const long = { ...hono, name: 'a-rather-long-repository', language: null }
    network({
      'https://api.github.com/repos/me/a-rather-long-repository/pulls/7': () =>
        Response.json({ number: 7, title: 'Fix the build', base: { repo: long } }),
    })
    const svg = await (await get('/gh/me/a-rather-long-repository/pull/7.svg')).text()
    const icon = { path: preset('github')!.icon.path }
    expect(svg).toBe(
      render([{ title: 'Fix the build', sub: '#7', icon }], { layout: 'stack', length: 420 }),
    )
  })

  it('says when a pull request does not exist', async () => {
    network({ 'https://api.github.com/': () => new Response('', { status: 404 }) })
    const response = await get('/gh/honojs/hono/pull/999999.svg')
    expect(response.status).toBe(404)
    expect(await response.text()).toContain('aria-label="not found on GitHub"')
  })

  it('turns a rate limit on a pull request into a readable badge', async () => {
    network({ 'https://api.github.com/': () => new Response('', { status: 429 }) })
    const response = await get('/gh/honojs/hono/pull/1.svg')
    expect(response.status).toBe(503)
    expect(await response.text()).toContain('rate limit')
  })

  it('turns GitHub rate limits into a readable badge', async () => {
    network({ 'https://api.github.com/': () => new Response('', { status: 403 }) })
    const response = await get('/gh/someone/something')
    expect(response.status).toBe(503)
    expect(await response.text()).toContain('rate limit')
  })

  it('shelves an account by stars, leaving out forks', async () => {
    const repo = (name: string, stars: number, fork = false) => ({
      name,
      owner: { login: 'me' },
      stargazers_count: stars,
      language: 'Go',
      fork,
      archived: false,
    })
    network({
      'https://api.github.com/users/me/repos': () =>
        Response.json([repo('small', 3), repo('big', 900), repo('forked', 5000, true)]),
    })
    const svg = await (await get('/gh/me.svg?count=2')).text()
    expect(svg).toContain('aria-label="big, small"')
  })
})

describe('the rest', () => {
  it('only answers reads', async () => {
    expect((await get('/badge/ts', { method: 'POST' })).status).toBe(405)
  })

  it('lists what the home page offers', async () => {
    const meta = (await (await get('/api/meta')).json()) as Record<string, unknown[]>
    expect(meta.themes!.length).toBe(8)
    expect(meta.badges!.length).toBe(presets.length)
    expect(meta.prints!.length).toBeGreaterThan(10)
  })

  it('gives search the short names and print sizes it needs', async () => {
    const meta = (await (await get('/api/meta')).json()) as {
      badges: { slug: string; aliases: string[] }[]
      prints: { slug: string; width: number; height: number }[]
    }
    expect(meta.badges.find((b) => b.slug === 'typescript')?.aliases).toEqual(['ts'])
    expect(meta.badges.find((b) => b.slug === 'nodedotjs')?.aliases).toEqual(['node', 'nodejs'])
    for (const p of meta.prints) expect(p.height).toBeGreaterThan(p.width)
  })

  it('reads shelf items', () => {
    expect(shelfItem('art:Claude')).toEqual({ kind: 'print', slug: 'claude' })
    expect(shelfItem('badge:ts;sub=5.9')).toEqual({
      kind: 'badge',
      slug: 'ts',
      style: { sub: '5.9' },
    })
    expect(shelfItem('gh:a/b;theme=clay')).toMatchObject({ kind: 'repo', owner: 'a', name: 'b' })
    expect(shelfItem('Just a title')).toEqual({ kind: 'spine', title: 'Just a title', style: {} })
    expect(() => shelfItem('gh:nope')).toThrow()
    expect(shelfItem('pr:honojs/hono/4321;theme=clay')).toEqual({
      kind: 'pull',
      owner: 'honojs',
      name: 'hono',
      number: 4321,
      style: { theme: 'clay' },
    })
    expect(() => shelfItem('pr:honojs/hono')).toThrow()
    expect(() => shelfItem('pr:honojs/hono/abc')).toThrow()
    expect(() => shelfItem('pr:honojs/hono/1/2')).toThrow()
  })

  it('abbreviates counts the way GitHub does', () => {
    expect(compact(999)).toBe('999')
    expect(compact(1234)).toBe('1.2k')
    expect(compact(26543)).toBe('26.5k')
    expect(compact(123456)).toBe('123k')
    expect(compact(2_500_000)).toBe('2.5M')
  })
})
