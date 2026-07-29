import axios from 'axios';
import {
  searchAniList,
  getTrendingAniList,
  getAniListInfo,
} from './anilist.js';

const CONSUMET = 'https://api.consumet.org';

const SERIES_SOURCES = [
  { id: 'anilist', name: 'AniList', color: '#02A9FF' },
  { id: 'flixhq', name: 'FlixHQ', color: '#e63946' },
  { id: 'sflix', name: 'SFlix', color: '#457b9d' },
  { id: 'dramacool', name: 'DramaCool', color: '#2a9d8f' },
];

async function searchConsumetMovies(provider, query, limit = 20) {
  try {
    const { data } = await axios.get(
      `${CONSUMET}/movies/${provider}/${encodeURIComponent(query)}`,
      { timeout: 8000, maxRedirects: 0, validateStatus: (s) => s < 400 }
    );
    const results = data.results || [];
    const source = SERIES_SOURCES.find((s) => s.id === provider);
    return results.slice(0, limit).map((s) => ({
      id: s.id,
      title: s.title,
      image: s.image || s.poster,
      source: provider,
      sourceName: source?.name || provider,
      type: 'streamable',
    }));
  } catch {
    return [];
  }
}

export async function searchSeries(query, source = 'all', limit = 24) {
  if (source === 'anilist' || source === 'all') {
    const anilist = await searchAniList(query, limit, 'ANIME').catch(() => []);
    if (source === 'anilist') return anilist;
    const streamSources = ['flixhq', 'sflix', 'dramacool'];
    const streams = await Promise.allSettled(
      streamSources.map((s) => searchConsumetMovies(s, query, 6))
    );
    const streamResults = streams
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => r.value);
    const merged = [...anilist, ...streamResults];
    const seen = new Set();
    return merged.filter((s) => {
      const key = s.title?.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, limit);
  }
  return searchConsumetMovies(source, query, limit);
}

export async function getSeriesInfo(source, id) {
  if (source === 'anilist') {
    return getAniListInfo(id, 'ANIME');
  }
  try {
    const { data } = await axios.get(
      `${CONSUMET}/movies/${source}/info/${encodeURIComponent(id)}`,
      { timeout: 12000, maxRedirects: 0, validateStatus: (s) => s < 400 }
    );
    return {
      id: data.id || id,
      title: data.title,
      image: data.image || data.cover,
      source,
      sourceName: SERIES_SOURCES.find((s) => s.id === source)?.name || source,
      description: data.description || '',
      episodes: (data.episodes || []).map((ep, i) => ({
        id: ep.id || String(i + 1),
        number: ep.number || i + 1,
        title: ep.title || `Episode ${ep.number || i + 1}`,
      })),
      streamable: true,
    };
  } catch {
    return getAniListInfo(id, 'ANIME');
  }
}

export async function getSeriesEpisode(source, episodeId) {
  const { data } = await axios.get(
    `${CONSUMET}/movies/${source}/watch?episodeId=${encodeURIComponent(episodeId)}`,
    { timeout: 15000 }
  );
  return {
    sources: (data.sources || []).map((s) => ({
      url: s.url,
      quality: s.quality || 'default',
      isM3U8: s.isM3U8,
    })),
    subtitles: data.subtitles || [],
  };
}

export async function getTrendingSeries(limit = 20) {
  return getTrendingAniList(limit, 'ANIME');
}

export { SERIES_SOURCES };
