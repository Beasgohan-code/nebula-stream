import {
  searchAniList,
  getTrendingAniList,
  getAniListInfo,
} from './anilist.js';
import {
  getAnimeStreamSources,
  searchAnimeStream,
  searchAnimeStreamFallback,
  getAnimeStreamInfo,
  getAnimeStreamEpisode,
  getAnimeStreamEpisodeFallback,
  ANIME_ORDER,
} from './stream.js';
import { mergeResults } from './fallback.js';

const STREAM_IDS = ANIME_ORDER;

const ANIME_SOURCES = [
  { id: 'anilist', name: 'AniList', color: '#02A9FF' },
  ...getAnimeStreamSources(),
];

export async function searchAnime(query, source = 'all', limit = 24) {
  if (source !== 'all' && source !== 'anilist' && STREAM_IDS.includes(source)) {
    try {
      return await searchAnimeStream(source, query, limit);
    } catch {
      return [];
    }
  }

  if (source === 'anilist') {
    return searchAniList(query, limit, 'ANIME').catch(() => []);
  }

  const tasks = [
    searchAniList(query, Math.min(12, limit), 'ANIME').catch(() => []),
    ...STREAM_IDS.map((s) =>
      searchAnimeStream(s, query, 4).catch(() => [])
    ),
  ];

  return mergeResults(tasks, limit);
}

export async function getAnimeInfo(source, id) {
  if (source === 'anilist') return getAniListInfo(id, 'ANIME');
  if (STREAM_IDS.includes(source)) {
    try {
      return await getAnimeStreamInfo(source, id);
    } catch {
      return getAniListInfo(id, 'ANIME');
    }
  }
  return getAniListInfo(id, 'ANIME');
}

export async function getAnimeEpisode(source, episodeId) {
  if (STREAM_IDS.includes(source)) {
    try {
      return await getAnimeStreamEpisode(source, episodeId);
    } catch {
      return getAnimeStreamEpisodeFallback(episodeId, [source, ...STREAM_IDS.filter((s) => s !== source)]);
    }
  }
  return { sources: [], message: 'Select a streaming source (HiAnime, AnimePahe, etc.)' };
}

export async function getTrendingAnime(limit = 20) {
  return getTrendingAniList(limit, 'ANIME');
}

export { ANIME_SOURCES };
