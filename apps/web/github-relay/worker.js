/**
 * Forwards GitHub API reads for the spines Worker.
 * Cloudflare tags a Worker's outbound requests with its zone (CF-Worker), and
 * GitHub answers requests tagged tw527e.zip with 525. This relay is reached
 * on its workers.dev URL, so its own requests carry that name instead.
 * Only the spines Worker holds RELAY_KEY, so this is not an open proxy.
 */
export default {
  fetch(request, env) {
    const { pathname, search } = new URL(request.url)
    const key = request.headers.get('x-relay-key')
    if (!env.RELAY_KEY || key !== env.RELAY_KEY) return new Response('Forbidden', { status: 403 })
    if (request.method !== 'GET' || !/^\/(users|repos)\//.test(pathname)) {
      return new Response('Not found', { status: 404 })
    }
    const headers = new Headers(request.headers)
    headers.delete('x-relay-key')
    return fetch(`https://api.github.com${pathname}${search}`, { headers })
  },
}
