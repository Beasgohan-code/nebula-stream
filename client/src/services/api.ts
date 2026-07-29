const API = '/api'
const DEFAULT_TIMEOUT = 35000

async function apiFetch<T = any>(
  path: string,
  opts: RequestInit & { timeout?: number } = {}
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, ...init } = opts
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(`${API}${path}`, { ...init, signal: controller.signal })
    const data = await res.json().catch(() => ({}))

    if (res.status === 429) {
      throw new Error(data.error || 'Too many requests — wait a moment and try again')
    }
    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`)
    }
    return data as T
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out — try again')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchSources(mode: string) {
  return apiFetch(`/sources?mode=${mode}`)
}

export async function fetchTrending(mode: string, limit = 20) {
  return apiFetch(`/trending?mode=${mode}&limit=${limit}`)
}

export async function fetchDiscover(mode: string, limit = 12) {
  return apiFetch(`/discover?mode=${mode}&limit=${limit}`)
}

export async function searchContent(mode: string, q: string, source = 'all', limit = 24) {
  return apiFetch(
    `/search?mode=${mode}&q=${encodeURIComponent(q)}&source=${source}&limit=${limit}`
  )
}

export async function fetchMangaInfo(source: string, id: string) {
  return apiFetch(`/manga/${source}/${id}`)
}

export async function fetchMangaChapter(
  source: string, id: string, chapterId: string,
  opts?: { title?: string; chapter?: string }
) {
  const params = new URLSearchParams()
  if (opts?.title) params.set('title', opts.title)
  if (opts?.chapter) params.set('chapter', opts.chapter)
  const qs = params.toString() ? `?${params}` : ''
  return apiFetch(`/manga/${source}/${id}/chapter/${chapterId}${qs}`, { timeout: 45000 })
}

export async function fetchAnimeInfo(source: string, id: string) {
  return apiFetch(`/anime/${source}/${id}`)
}

export async function fetchAnimeEpisode(
  source: string, episodeId: string,
  opts?: { title?: string; ep?: string; exclude?: string }
) {
  const params = new URLSearchParams()
  if (opts?.title) params.set('title', opts.title)
  if (opts?.ep) params.set('ep', opts.ep)
  if (opts?.exclude) params.set('exclude', opts.exclude)
  const qs = params.toString() ? `?${params}` : ''
  return apiFetch(`/anime/${source}/watch/${episodeId}${qs}`, { timeout: 45000 })
}

export async function fetchSeriesInfo(source: string, id: string) {
  return apiFetch(`/series/${source}/${id}`)
}

export async function fetchSeriesEpisode(
  source: string, episodeId: string,
  opts?: { title?: string; ep?: string; exclude?: string }
) {
  const params = new URLSearchParams()
  if (opts?.title) params.set('title', opts.title)
  if (opts?.ep) params.set('ep', opts.ep)
  if (opts?.exclude) params.set('exclude', opts.exclude)
  const qs = params.toString() ? `?${params}` : ''
  return apiFetch(`/series/${source}/watch/${episodeId}${qs}`, { timeout: 45000 })
}

export async function fetchAlternateSources(title: string, mode: string) {
  return apiFetch(`/resolve/sources?title=${encodeURIComponent(title)}&mode=${mode}`, { timeout: 40000 })
}

export async function fetchSimilar(id: string) {
  return apiFetch(`/ai/similar/${id}`)
}

export async function fetchAISummary(title: string, mode: string) {
  return apiFetch(`/ai/summary?title=${encodeURIComponent(title)}&mode=${mode}`)
}

export async function aiChat(message: string, mode: string, history: unknown[]) {
  return apiFetch('/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, mode, history }),
  })
}

export async function fetchAIRecommend(mode: string, history: unknown[]) {
  return apiFetch(
    `/ai/recommend?mode=${mode}&history=${encodeURIComponent(JSON.stringify(history))}`
  )
}

export function getMangaDownloadUrl(source: string, mangaId: string, chapterId: string) {
  return `${API}/download/manga/${source}/${mangaId}/chapter/${chapterId}`
}

export function getVideoProxyUrl(url: string, download = false) {
  return `${API}/proxy?url=${encodeURIComponent(url)}${download ? '&download=1' : ''}`
}
