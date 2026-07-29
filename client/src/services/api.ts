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

export async function fetchMangaChapter(source: string, id: string, chapterId: string) {
  const res = await fetch(`${API}/manga/${source}/${id}/chapter/${chapterId}`)
  return res.json()
}

export async function fetchAnimeInfo(source: string, id: string) {
  const res = await fetch(`${API}/anime/${source}/${id}`)
  return res.json()
}

export async function fetchAnimeEpisode(source: string, episodeId: string) {
  const res = await fetch(`${API}/anime/${source}/watch/${episodeId}`)
  return res.json()
}

export async function fetchSeriesInfo(source: string, id: string) {
  const res = await fetch(`${API}/series/${source}/${id}`)
  return res.json()
}

export async function fetchSeriesEpisode(source: string, episodeId: string) {
  const res = await fetch(`${API}/series/${source}/watch/${episodeId}`)
  return res.json()
}

export function getMangaDownloadUrl(source: string, mangaId: string, chapterId: string) {
  return `${API}/download/manga/${source}/${mangaId}/chapter/${chapterId}`
}

export function getVideoProxyUrl(url: string, download = false) {
  return `${API}/proxy?url=${encodeURIComponent(url)}${download ? '&download=1' : ''}`
}
