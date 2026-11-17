import { type Env, HttpError, remember } from '../http.ts'

export interface Repo {
  owner: string
  name: string
  stars: number
  language: string | null
}

interface ApiRepo {
  name: string
  owner: { login: string }
  stargazers_count: number
  language: string | null
  fork: boolean
  archived: boolean
}

/** A pull request, with the language of the repository it targets for its mark. */
export interface Pull {
  owner: string
  repo: string
  number: number
  title: string
  language: string | null
}

interface ApiPull {
  number: number
  title: string
  base: { repo: { name: string; owner: { login: string }; language: string | null } }
}

const NAME = /^[\w.-]{1,100}$/

export async function pull(owner: string, name: string, number: number, env: Env): Promise<Pull> {
  if (!NAME.test(owner) || !NAME.test(name)) throw new HttpError(400, 'not a repository name')
  if (!Number.isSafeInteger(number) || number < 1) {
    throw new HttpError(400, 'not a pull request number')
  }
  return remember(`gh/pull/${owner}/${name}/${number}`.toLowerCase(), 3600, async () => {
    const p = await api<ApiPull>(`/repos/${owner}/${name}/pulls/${number}`, env)
    const { repo } = p.base
    return {
      owner: repo.owner.login,
      repo: repo.name,
      number: p.number,
      title: p.title,
      language: repo.language,
    }
  })
}

export async function repo(owner: string, name: string, env: Env): Promise<Repo> {
  if (!NAME.test(owner) || !NAME.test(name)) throw new HttpError(400, 'not a repository name')
  return remember(`gh/repo/${owner}/${name}`.toLowerCase(), 3600, async () =>
    slim(await api<ApiRepo>(`/repos/${owner}/${name}`, env)),
  )
}

/** An account's own most-starred repositories, forks and archives left out. */
export async function topRepos(owner: string, count: number, env: Env): Promise<Repo[]> {
  if (!NAME.test(owner)) throw new HttpError(400, 'not an account name')
  const all = await remember(`gh/repos/${owner}`.toLowerCase(), 3600, async () => {
    const list = await api<ApiRepo[]>(
      `/users/${owner}/repos?type=owner&sort=pushed&per_page=100`,
      env,
    )
    return list
      .filter((r) => !r.fork && !r.archived)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 24)
      .map(slim)
  })
  return all.slice(0, count)
}

function slim(r: ApiRepo): Repo {
  return { owner: r.owner.login, name: r.name, stars: r.stargazers_count, language: r.language }
}

async function api<T>(path: string, env: Env): Promise<T> {
  const response = await fetch(`${env.GITHUB_RELAY ?? 'https://api.github.com'}${path}`, {
    headers: {
      accept: 'application/vnd.github+json',
      'user-agent': 'spine-badges',
      'x-github-api-version': '2022-11-28',
      ...(env.GITHUB_TOKEN ? { authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
      ...(env.RELAY_KEY ? { 'x-relay-key': env.RELAY_KEY } : {}),
    },
  })
  if (response.status === 404) throw new HttpError(404, 'not found on GitHub')
  if (response.status === 403 || response.status === 429) {
    throw new HttpError(503, 'GitHub rate limit, try later')
  }
  if (!response.ok) throw new HttpError(502, `GitHub answered ${response.status}`)
  return (await response.json()) as T
}

/** 1234 → `1.2k`, the way GitHub abbreviates. */
export function compact(count: number): string {
  if (count < 1000) return String(count)
  const [value, unit] = count < 1e6 ? [count / 1e3, 'k'] : [count / 1e6, 'M']
  return `${value < 100 ? Math.floor(value * 10) / 10 : Math.floor(value)}${unit}`
}

/** Simple Icons slugs for the languages GitHub reports, used as a repo's default mark. */
export const languageIcon: Record<string, string> = {
  Astro: 'astro',
  C: 'c',
  'C++': 'cplusplus',
  Clojure: 'clojure',
  CSS: 'css',
  Dart: 'dart',
  Dockerfile: 'docker',
  Elixir: 'elixir',
  Erlang: 'erlang',
  Go: 'go',
  Haskell: 'haskell',
  HTML: 'html5',
  JavaScript: 'javascript',
  Julia: 'julia',
  'Jupyter Notebook': 'jupyter',
  Kotlin: 'kotlin',
  Lua: 'lua',
  MDX: 'mdx',
  Nix: 'nixos',
  OCaml: 'ocaml',
  Perl: 'perl',
  PHP: 'php',
  Python: 'python',
  R: 'r',
  Ruby: 'ruby',
  Rust: 'rust',
  Scala: 'scala',
  Shell: 'gnubash',
  Svelte: 'svelte',
  Swift: 'swift',
  TypeScript: 'typescript',
  Vue: 'vuedotjs',
  Zig: 'zig',
}
