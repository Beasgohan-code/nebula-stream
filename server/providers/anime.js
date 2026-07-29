import {
  searchAniList,
  getTrendingAniList,
  getAniListInfo,
} from './anilist.js';
import {
  getAnimeStreamSources,
  searchAnimeStream,
  getAnimeStreamInfo,
  getAnimeStreamEpisode,
} from './stream.js';

const STREAM_IDS = ['hianime', 'animepahe', 'animekai', 'kickassanime', 'animesaturn'];

const ANIME_SOURCES = [
  { id: 'anilist', name: 'AniList', color: '#02A9FF' },
  ...getAnimeStreamSources(),
];

export async function searchAnime(query, source = 'all', limit = 24) {
  const tasks = [];

  if (source === 'all' || source === 'anilist') {
    tasks.push(searchAniList(query, limit, 'ANIME').catch(() => []));
  }

  const streamSources = source === 'all' ? STREAM_IDS : STREAM_IDS.includes(source) ? [source] : [];
  for (const s of streamSources) {
    tasks.push(
      searchAnimeStream(s, query, Math.ceil(limit / streamSources.length)).catch(() => [])
    );
  }

  const results = await Promise.all(tasks);
  const merged = results.flat();
  const seen = new Set();
  return merged.filter((a) => {
    const key = a.title?.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}

export async function getAnimeInfo(source, id) {
  if (source === 'anilist') return getAniListInfo(id, 'ANIME');
  if (STREAM_IDS.includes(source)) return getAnimeStreamInfo(source, id);
  return getAniListInfo(id, 'ANIME');
}

export async function getAnimeEpisode(source, episodeId) {
  if (STREAM_IDS.includes(source)) return getAnimeStreamEpisode(source, episodeId);
  return { sources: [], message: 'Select a streaming source (HiAnime, AnimePahe, etc.)' };
}

export async function getTrendingAnime(limit = 20) {
  return getTrendingAniList(limit, 'ANIME');
}

export { ANIME_SOURCES };
