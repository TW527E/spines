import type { ThemeId } from '@repo/spine'
import {
  type SimpleIcon,
  siAndroid,
  siAngular,
  siAnthropic,
  siApple,
  siAstro,
  siBun,
  siClaude,
  siCloudflare,
  siCloudflareworkers,
  siCplusplus,
  siCrewai,
  siCursor,
  siDart,
  siDeepseek,
  siDeno,
  siDify,
  siDjango,
  siDocker,
  siDotnet,
  siElectron,
  siElixir,
  siFastapi,
  siFigma,
  siFirebase,
  siFlutter,
  siGhostty,
  siGit,
  siGithub,
  siGithubcopilot,
  siGo,
  siGooglegemini,
  siGraphql,
  siHaskell,
  siHono,
  siHuggingface,
  siJavascript,
  siJetbrains,
  siJupyter,
  siKotlin,
  siKubernetes,
  siLangchain,
  siLanggraph,
  siLinux,
  siLua,
  siMeta,
  siMistralai,
  siMongodb,
  siMysql,
  siN8n,
  siNeovim,
  siNextdotjs,
  siNginx,
  siNodedotjs,
  siNotion,
  siNuxt,
  siObsidian,
  siOllama,
  siOpenjdk,
  siOpenrouter,
  siOsu,
  siPerplexity,
  siPhp,
  siPnpm,
  siPostgresql,
  siPrisma,
  siPython,
  siPytorch,
  siRaycast,
  siReact,
  siRedis,
  siReplicate,
  siReplit,
  siRuby,
  siRust,
  siSqlite,
  siSupabase,
  siSvelte,
  siSwift,
  siTailwindcss,
  siTauri,
  siTensorflow,
  siTerraform,
  siTypescript,
  siV0,
  siVercel,
  siVite,
  siVrchat,
  siVuedotjs,
  siWarp,
  siWebassembly,
  siWindsurf,
  siZedindustries,
  siZig,
} from 'simple-icons'
import { lunlunsworld } from './marks/lunlunsworld.ts'
import { minecraft } from './marks/minecraft.ts'
import { rebocap } from './marks/rebocap.ts'

/**
 * The catalog of common AI tools and tech stacks, used like shields.io badges:
 * `/badge/typescript,react,docker.svg`. Each entry is meant to be a print of
 * its own in `art/<group>/<slug>.png`; until that print is drawn, the entry
 * is typeset in the look given here. Marks and brand colors come from Simple
 * Icons and are bundled, so a badge never waits on another server.
 *
 * `paper` prints the whole sheet in the brand color; `accent` keeps the
 * theme's paper and uses the brand color for the artwork only, which suits
 * colors that are too light or too dark to carry text.
 */
export interface Preset {
  slug: string
  title: string
  /** Also the folder under `art/` that holds its print. */
  group: 'ai' | 'stack' | 'games'
  theme: ThemeId
  icon: Mark
  paint?: 'paper' | 'accent'
}

type Row = [icon: Mark, theme: ThemeId, paint?: 'paper' | 'accent' | undefined, title?: string]

/** A mark Simple Icons lacks; with no `path` the entry is typeset bare. `box` is its viewBox. */
type Mark = SimpleIcon & { box?: number }
const own = (title: string, hex: string, slug = 'none', path = '', box?: number) =>
  ({ title, hex, slug, path, box, svg: '', source: '' }) as Mark

const rows: Record<Preset['group'], Record<string, Row>> = {
  ai: {
    anthropic: [siAnthropic, 'paper', 'accent'],
    claude: [siClaude, 'clay', 'paper'],
    googlegemini: [siGooglegemini, 'midnight', 'accent', 'Gemini'],
    githubcopilot: [siGithubcopilot, 'noir', undefined, 'Copilot'],
    cursor: [siCursor, 'steel'],
    windsurf: [siWindsurf, 'midnight'],
    deepseek: [siDeepseek, 'midnight', 'paper'],
    mistralai: [siMistralai, 'signal', 'paper'],
    perplexity: [siPerplexity, 'midnight', 'accent'],
    meta: [siMeta, 'paper', 'accent', 'Meta AI'],
    ollama: [siOllama, 'paper'],
    huggingface: [siHuggingface, 'signal', 'paper'],
    replicate: [siReplicate, 'noir'],
    openrouter: [siOpenrouter, 'steel'],
    langchain: [siLangchain, 'grid', 'accent'],
    langgraph: [siLanggraph, 'grid', 'accent'],
    crewai: [siCrewai, 'candy', 'paper'],
    dify: [siDify, 'midnight', 'accent'],
    n8n: [siN8n, 'candy', 'paper'],
    v0: [siV0, 'noir'],
    replit: [siReplit, 'signal', 'paper'],
  },
  stack: {
    typescript: [siTypescript, 'grid', 'accent'],
    javascript: [siJavascript, 'signal', 'paper'],
    python: [siPython, 'grid', 'accent'],
    rust: [siRust, 'clay'],
    go: [siGo, 'grid', 'accent'],
    swift: [siSwift, 'clay', 'paper'],
    kotlin: [siKotlin, 'candy', 'paper'],
    cplusplus: [siCplusplus, 'grid', 'accent'],
    dotnet: [siDotnet, 'midnight', 'paper'],
    openjdk: [siOpenjdk, 'clay', undefined, 'Java'],
    php: [siPhp, 'paper', 'accent'],
    ruby: [siRuby, 'clay', 'paper'],
    elixir: [siElixir, 'midnight', 'paper'],
    zig: [siZig, 'signal', 'paper'],
    lua: [siLua, 'midnight', 'paper'],
    haskell: [siHaskell, 'midnight', 'paper'],
    dart: [siDart, 'grid', 'accent'],
    webassembly: [siWebassembly, 'midnight', 'paper'],
    react: [siReact, 'midnight', 'accent'],
    nextdotjs: [siNextdotjs, 'noir'],
    vuedotjs: [siVuedotjs, 'paper', 'accent'],
    nuxt: [siNuxt, 'paper', 'accent'],
    svelte: [siSvelte, 'clay', 'paper'],
    angular: [siAngular, 'noir'],
    astro: [siAstro, 'candy', 'paper'],
    nodedotjs: [siNodedotjs, 'grid', 'accent'],
    bun: [siBun, 'paper'],
    deno: [siDeno, 'noir'],
    hono: [siHono, 'clay', 'paper'],
    django: [siDjango, 'grid', 'accent'],
    fastapi: [siFastapi, 'grid', 'accent'],
    flutter: [siFlutter, 'midnight', 'paper'],
    electron: [siElectron, 'steel'],
    tauri: [siTauri, 'signal', 'paper'],
    tailwindcss: [siTailwindcss, 'midnight', 'accent'],
    vite: [siVite, 'candy', 'paper'],
    prisma: [siPrisma, 'steel'],
    pytorch: [siPytorch, 'clay', 'paper'],
    tensorflow: [siTensorflow, 'signal', 'paper'],
    jupyter: [siJupyter, 'paper', 'accent'],
    docker: [siDocker, 'grid', 'accent'],
    kubernetes: [siKubernetes, 'midnight', 'paper'],
    cloudflare: [siCloudflare, 'signal', 'paper'],
    cloudflareworkers: [siCloudflareworkers, 'signal', 'paper', 'Workers'],
    vercel: [siVercel, 'noir'],
    github: [siGithub, 'steel'],
    git: [siGit, 'paper', 'accent'],
    linux: [siLinux, 'signal', 'paper'],
    nginx: [siNginx, 'grid', 'accent'],
    terraform: [siTerraform, 'midnight', 'paper'],
    postgresql: [siPostgresql, 'midnight', 'paper'],
    mysql: [siMysql, 'grid', 'accent'],
    sqlite: [siSqlite, 'grid', 'accent'],
    redis: [siRedis, 'clay', 'paper'],
    mongodb: [siMongodb, 'paper', 'accent'],
    supabase: [siSupabase, 'noir'],
    firebase: [siFirebase, 'signal', 'paper'],
    graphql: [siGraphql, 'candy', 'paper'],
    pnpm: [siPnpm, 'signal', 'paper'],
    figma: [siFigma, 'candy', 'paper'],
    notion: [siNotion, 'paper'],
    obsidian: [siObsidian, 'midnight', 'paper'],
    neovim: [siNeovim, 'noir'],
    zedindustries: [siZedindustries, 'midnight', 'paper', 'Zed'],
    jetbrains: [siJetbrains, 'noir'],
    raycast: [siRaycast, 'candy', 'paper'],
    warp: [siWarp, 'midnight', 'accent'],
    ghostty: [siGhostty, 'midnight', 'paper'],
    apple: [siApple, 'steel'],
    android: [siAndroid, 'grid', 'accent'],
  },
  games: {
    osu: [siOsu, 'candy', 'paper'],
    minecraft: [own('Minecraft', '5B8731', 'minecraft', minecraft), 'clay', 'paper'],
    vrchat: [siVrchat, 'noir'],
    rebocap: [own('Rebocap', 'D373AA', 'rebocap', rebocap, 50), 'midnight', 'accent'],
    lunlunsworld: [
      own("Lunlun's World", 'FFD2E1', 'lunlunsworld', lunlunsworld, 1080),
      'candy',
      'paper',
    ],
  },
}

export const presets: Preset[] = (Object.keys(rows) as Preset['group'][]).flatMap((group) =>
  Object.entries(rows[group]).map(([slug, [icon, theme, paint, title]]) => ({
    slug,
    title: title ?? icon.title,
    group,
    theme,
    icon,
    ...(paint ? { paint } : {}),
  })),
)

const bySlug = new Map(presets.map((preset) => [preset.slug, preset]))

/** Short names people reach for first. */
const aliases: Record<string, string> = {
  ts: 'typescript',
  js: 'javascript',
  py: 'python',
  golang: 'go',
  node: 'nodedotjs',
  nodejs: 'nodedotjs',
  next: 'nextdotjs',
  nextjs: 'nextdotjs',
  vue: 'vuedotjs',
  tailwind: 'tailwindcss',
  postgres: 'postgresql',
  k8s: 'kubernetes',
  gemini: 'googlegemini',
  copilot: 'githubcopilot',
  mistral: 'mistralai',
  workers: 'cloudflareworkers',
  java: 'openjdk',
  cpp: 'cplusplus',
  wasm: 'webassembly',
  zed: 'zedindustries',
  nvim: 'neovim',
  hf: 'huggingface',
  mc: 'minecraft',
  lunlun: 'lunlunsworld',
}

/** The short names that lead to a preset, so search can find it by them too. */
export function aliasesOf(slug: string): string[] {
  return Object.keys(aliases).filter((alias) => aliases[alias] === slug)
}

export function preset(slug: string): Preset | undefined {
  const key = slug.toLowerCase()
  return bySlug.get(aliases[key] ?? key)
}

/** A bundled Simple Icons mark by slug, so presets' marks need no network. */
export function bundledIcon(slug: string): Mark | undefined {
  const mark = preset(slug)?.icon
  return mark?.path ? mark : undefined
}
