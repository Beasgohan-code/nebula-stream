import axios from 'axios';
import {
  searchAniList,
  getTrendingAniList,
  getAniListInfo,
} from './anilist.js';

const CONSUMET = 'https://api.consumet.org';

const ANIME_SOURCES = [
  { id: 'anilist', name: 'AniList', color: '#02A9FF' },
  { id: 'gogoanime', name: 'GogoAnime', color: '#ff006e' },
  { id: 'zoro', name: 'Zoro', color: '#8338ec' },
  { id: 'animepahe', name: 'AnimePahe', color: '#3a86ff' },
  { id: 'hianime', name: 'HiAnime', color: '#ef476f' },
];

async function searchConsumetAnime(provider, query, limit = 20) {
  try {
    const { data } = await axios.get(
      `${CONSUMET}/anime/${provider}/${encodeURIComponent(query)}`,
      { timeout: 8000, maxRedirects: 0, validateStatus: (s) => s < 400 }
    );
    const results = data.results || [];
    const source = ANIME_SOURCES.find((s) => s.id === provider);
    return results.slice(0, limit).map((a) => ({
      id: a.id,
      title: a.title,
      image: a.image,
      source: provider,
      sourceName: source?.name || provider,
      type: 'streamable',
    }));
  } catch {
    return [];
  }
}

export async function searchAnime(query, source = 'all', limit = 24) {
  if (source === 'anilist' || source === 'all') {
    const anilist = await searchAniList(query, limit, 'ANIME').catch(() => []);
    if (source === 'anilist') return anilist;
    const streamSources = ['gogoanime', 'zoro', 'hianime'];
    const streams = await Promise.allSettled(
      streamSources.map((s) => searchConsumetAnime(s, query, 6))
    );
    const streamResults = streams
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => r.value);
    const merged = [...anilist, ...streamResults];
    const seen = new Set();
    return merged.filter((a) => {
      const key = a.title?.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, limit);
  }

  return searchConsumetAnime(source, query, limit);
}

export async function getAnimeInfo(source, id) {
  if (source === 'anilist') {
    return getAniListInfo(id, 'ANIME');
  }

  try {
    const { data } = await axios.get(
      `${CONSUMET}/anime/${source}/info/${encodeURIComponent(id)}`,
      { timeout: 12000, maxRedirects: 0, validateStatus: (s) => s < 400 }
    );
    return {
      id: data.id || id,
      title: data.title,
      image: data.image,
      source,
      sourceName: ANIME_SOURCES.find((s) => s.id === source)?.name || source,
      description: data.description || '',
      genres: data.genres || [],
      episodes: (data.episodes || []).map((ep) => ({
        id: ep.id,
        number: ep.number,
        title: ep.title || `Episode ${ep.number}`,
      })),
      streamable: true,
    };
  } catch {
    return getAniListInfo(id, 'ANIME');
  }
}

export async function getAnimeEpisode(source, episodeId) {
  if (source === 'anilist') {
    return { external: true, message: 'Use episode link from detail page' };
  }
  const { data } = await axios.get(
    `${CONSUMET}/anime/${source}/watch?episodeId=${encodeURIComponent(episodeId)}`,
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

export async function getTrendingAnime(limit = 20) {
  return getTrendingAniList(limit, 'ANIME');
}

export { ANIME_SOURCES };
