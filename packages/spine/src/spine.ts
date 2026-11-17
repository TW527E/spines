import { hex, inkFor } from './color.ts'
import { fit } from './text.ts'
import { isTheme, type Sheet, type Theme, type ThemeId, themes } from './themes.ts'
import { esc, hash, n, random } from './util.ts'

/** Every spine is drawn lying down on a canvas this long; only its thickness varies. */
export const LENGTH = 1200

/** Thickness of the case, in canvas units. A real jewel case spine is about 142 × 10 mm. */
export const widths = { slim: 84, regular: 100, wide: 120 } as const
export type Width = keyof typeof widths

/** A monochrome mark printed at the head of the spine. */
export interface Icon {
  /** SVG path data. */
  path: string
  /** Side of the square viewBox the path was drawn in. Defaults to 24. */
  box?: number
  /** Fill with the even-odd rule, for traced line art whose holes share a winding. */
  evenodd?: boolean
}

/** A spine typeset by the renderer. */
export interface Spine {
  title: string
  /** The small catalog line at the foot: a version, a star count, an artist. */
  sub?: string
  theme?: ThemeId
  icon?: Icon
  /** `#rrggbb` overrides for the theme's colors. */
  paper?: string
  ink?: string
  accent?: string
  width?: Width
}

/** A finished spine image (for instance one made with the cd-spine-art skill), upright. */
export interface Print {
  /** Shown to screen readers and on hover. */
  title: string
  /** Image URL; use a data URI when the SVG must stand alone, as it must in a README. */
  href: string
  /** Pixel size of the upright image. */
  width: number
  height: number
}

export type Item = Spine | Print

export function isPrint(item: Item): item is Print {
  return 'href' in item
}

/** Picks a theme for a title, so an unstyled shelf still comes out varied — and stable. */
export function themeFor(title: string): ThemeId {
  const ids = Object.keys(themes) as ThemeId[]
  return ids[hash(title.toLowerCase()) % ids.length]!
}

// Case anatomy, in canvas units.
const TAB = 46 // molded end tabs
const RAIL = 7 // clear rails above and below the inlay
const PAD = 30 // inlay margin
const SUB = 0.19 // cap height of the catalog line, as a fraction of the inlay

export interface Drawn {
  thickness: number
  title: string
  svg: string
}

/** Draws one item lying down, left to right, in a `LENGTH × thickness` box at the origin. */
export function draw(item: Item, id: string): Drawn {
  if (isPrint(item)) {
    const thickness = (item.width / item.height) * LENGTH
    // The image is upright; lay it down so its top lands on the left.
    const svg = `<image href="${esc(item.href)}" width="${n(thickness)}" height="${LENGTH}" preserveAspectRatio="none" transform="matrix(0 -1 1 0 0 ${n(thickness)})"/>`
    return { thickness, title: item.title, svg }
  }

  const theme: Theme = themes[isTheme(item.theme) ? item.theme : themeFor(item.title)]
  const thickness = widths[item.width ?? 'regular'] ?? widths.regular
  const paper = hex(item.paper) ?? theme.paper
  const ink = hex(item.ink) ?? (item.paper && hex(item.paper) ? inkFor(paper) : theme.ink)
  const accent = hex(item.accent) ?? theme.accent

  const x = TAB
  const y = RAIL
  const w = LENGTH - TAB * 2
  const h = thickness - RAIL * 2
  const mid = y + h / 2

  // Catalog line, set from the foot of the spine.
  const subText = item.sub?.trim().toUpperCase()
  const sub = subText
    ? fit(subText, { face: 'mono', cap: SUB * h, tracking: 0.12 }, w * 0.36)
    : undefined
  const subX = x + w - PAD - (sub?.width ?? 0)

  // Mark, then title, from the head.
  let pen = x + PAD
  let icon = ''
  if (item.icon && /^[\sMmZzLlHhVvCcSsQqTtAa0-9eE,.+-]+$/.test(item.icon.path)) {
    const size = h * 0.56
    const scale = size / (item.icon.box ?? 24)
    icon = `<path fill="${ink}"${item.icon.evenodd ? ' fill-rule="evenodd"' : ''} transform="translate(${n(pen)} ${n(mid - size / 2)}) scale(${scale.toFixed(4)})" d="${item.icon.path}"/>`
    pen += size + h * 0.3
  }

  const { face, tracking, upper, skew } = theme.title
  const cap = h * theme.title.cap
  const room = (sub ? subX - PAD : x + w - PAD) - pen
  const titleText = upper ? item.title.toUpperCase() : item.title
  const type = { face, cap, ...(tracking ? { tracking } : {}) }
  const title = fit(titleText, type, room)
  const titleCap = title.cap
  const baseline = mid + titleCap / 2
  const titleX = theme.plate ? pen + 16 : pen
  const titleEnd = titleX + title.width + (theme.plate ? 16 : 0)

  const sheet: Sheet = {
    x,
    y,
    w,
    h,
    free: { x0: titleEnd + PAD, x1: sub ? subX - PAD : x + w },
    paper,
    ink,
    accent,
    rand: random(hash(item.title)),
    id,
  }

  const svg =
    `<clipPath id="${id}c"><rect x="${x}" y="${y}" width="${w}" height="${n(h)}" rx="1.5"/></clipPath>` +
    `<rect width="${LENGTH}" height="${thickness}" rx="5" fill="#0c0c0e"/>` +
    `<g clip-path="url(#${id}c)">` +
    `<rect x="${x}" y="${y}" width="${w}" height="${n(h)}" fill="${paper}"/>` +
    (theme.art?.(sheet) ?? '') +
    (theme.plate?.(sheet, { x: titleX, y: baseline - titleCap, w: title.width, h: titleCap }) ??
      '') +
    icon +
    title.draw(titleX, baseline, ink, skew) +
    (sub ? `<g opacity=".78">${sub.draw(subX, mid + (SUB * h) / 2, ink)}</g>` : '') +
    `<rect x="${x}" y="${y}" width="${w}" height="${n(h)}" filter="url(#grain)" opacity="${theme.grain}"/>` +
    `</g>` +
    shell(thickness)

  return { thickness, title: item.title, svg }
}

/**
 * The clear polystyrene case, drawn over the inlay: a sheen across the window,
 * two rails, and a molded tab with its hinge ridges at either end.
 */
function shell(t: number): string {
  const tab = (flip: boolean) => {
    const g = flip ? ` transform="translate(${LENGTH} 0) scale(-1 1)"` : ''
    const ridges = [9, 13, 17].map((rx) => `M${rx} ${n(t * 0.24)}V${n(t * 0.76)}`).join('')
    return (
      `<g${g}>` +
      `<path d="M5 0H${TAB}V${t}H5a5 5 0 0 1-5-5V5a5 5 0 0 1 5-5z" fill="url(#tab)"/>` +
      `<rect x="23" y="${n(t * 0.16)}" width="16" height="${n(t * 0.68)}" rx="2.5" fill="#000" fill-opacity=".35" stroke="#fff" stroke-opacity=".3" stroke-width=".8"/>` +
      `<path d="${ridges}" stroke="#fff" stroke-opacity=".22" stroke-width="1.2"/>` +
      `<path d="M${TAB - 0.5} 1V${t - 1}" stroke="#fff" stroke-opacity=".42"/>` +
      `</g>`
    )
  }
  return (
    `<rect x="${TAB}" y="${RAIL}" width="${LENGTH - TAB * 2}" height="${t - RAIL * 2}" fill="url(#sheen)"/>` +
    `<rect x="${TAB}" width="${LENGTH - TAB * 2}" height="${RAIL}" fill="url(#rail)"/>` +
    `<rect x="${TAB}" y="${t - RAIL}" width="${LENGTH - TAB * 2}" height="${RAIL}" fill="url(#rail)"/>` +
    `<path d="M${TAB} ${RAIL - 0.5}H${LENGTH - TAB}M${TAB} ${t - RAIL + 0.5}H${LENGTH - TAB}" stroke="#fff" stroke-opacity=".38"/>` +
    tab(false) +
    tab(true) +
    `<rect x=".5" y=".5" width="${LENGTH - 1}" height="${t - 1}" rx="4.5" fill="none" stroke="#fff" stroke-opacity=".28"/>`
  )
}

/** Gradients and filters shared by every spine in a document. */
export const defs =
  `<linearGradient id="rail" x1="0" y1="0" x2="0" y2="1">` +
  `<stop offset="0" stop-color="#6b6b73"/><stop offset=".35" stop-color="#2a2a2f"/><stop offset="1" stop-color="#17171a"/>` +
  `</linearGradient>` +
  `<linearGradient id="tab" x1="0" y1="0" x2="0" y2="1">` +
  `<stop offset="0" stop-color="#5a5a62"/><stop offset=".12" stop-color="#2b2b30"/><stop offset=".5" stop-color="#1b1b1f"/><stop offset=".9" stop-color="#2b2b30"/><stop offset="1" stop-color="#4a4a52"/>` +
  `</linearGradient>` +
  `<linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">` +
  `<stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".14" stop-color="#fff" stop-opacity=".06"/>` +
  `<stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/>` +
  `</linearGradient>` +
  `<filter id="grain" x="0" y="0" width="100%" height="100%">` +
  `<feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/>` +
  `<feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .5 .5 .5 0 -.62"/>` +
  `<feComposite in2="SourceAlpha" operator="in"/>` +
  `</filter>`
