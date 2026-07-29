const API = '/api'

export async function fetchSources(mode: string) {
  const res = await fetch(`${API}/sources?mode=${mode}`)
  return res.json()
}

export async function fetchTrending(mode: string, limit = 20) {
  const res = await fetch(`${API}/trending?mode=${mode}&limit=${limit}`)
  return res.json()
}

export async function fetchDiscover(mode: string, limit = 12) {
  const res = await fetch(`${API}/discover?mode=${mode}&limit=${limit}`)
  return res.json()
}

export async function searchContent(mode: string, q: string, source = 'all', limit = 24) {
  const res = await fetch(
    `${API}/search?mode=${mode}&q=${encodeURIComponent(q)}&source=${source}&limit=${limit}`
  )
  return res.json()
}

export async function fetchMangaInfo(source: string, id: string) {
  const res = await fetch(`${API}/manga/${source}/${id}`)
  return res.json()
}

export async function fetchMangaChapter(
  source: string, id: string, chapterId: string,
  opts?: { title?: string; chapter?: string }
) {
  const params = new URLSearchParams()
  if (opts?.title) params.set('title', opts.title)
  if (opts?.chapter) params.set('chapter', opts.chapter)
  const qs = params.toString() ? `?${params}` : ''
  const res = await fetch(`${API}/manga/${source}/${id}/chapter/${chapterId}${qs}`)
  return res.json()
}

export async function fetchAnimeInfo(source: string, id: string) {
  const res = await fetch(`${API}/anime/${source}/${id}`)
  return res.json()
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
  const res = await fetch(`${API}/anime/${source}/watch/${episodeId}${qs}`)
  return res.json()
}

export async function fetchSeriesInfo(source: string, id: string) {
  const res = await fetch(`${API}/series/${source}/${id}`)
  return res.json()
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
  const res = await fetch(`${API}/series/${source}/watch/${episodeId}${qs}`)
  return res.json()
}

export async function fetchAlternateSources(title: string, mode: string) {
  const res = await fetch(`${API}/resolve/sources?title=${encodeURIComponent(title)}&mode=${mode}`)
  return res.json()
}

export async function fetchSimilar(id: string) {
  const res = await fetch(`${API}/ai/similar/${id}`)
  return res.json()
}

export async function fetchAISummary(title: string, mode: string) {
  const res = await fetch(`${API}/ai/summary?title=${encodeURIComponent(title)}&mode=${mode}`)
  return res.json()
}

export async function aiChat(message: string, mode: string, history: any[]) {
  const res = await fetch(`${API}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, mode, history }),
  })
  return res.json()
}

export async function fetchAIRecommend(mode: string, history: any[]) {
  const res = await fetch(`${API}/ai/recommend?mode=${mode}&history=${encodeURIComponent(JSON.stringify(history))}`)
  return res.json()
}

export function getMangaDownloadUrl(source: string, mangaId: string, chapterId: string) {
  return `${API}/download/manga/${source}/${mangaId}/chapter/${chapterId}`
}

export function getVideoProxyUrl(url: string, download = false) {
  return `${API}/proxy?url=${encodeURIComponent(url)}${download ? '&download=1' : ''}`
}
