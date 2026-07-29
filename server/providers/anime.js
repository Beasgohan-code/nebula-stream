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
  ANIME_ORDER,
} from './stream.js';
import { mergeResults, withTimeout } from './fallback.js';
import { findStreamSources } from './resolver.js';

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

export async function getAnimeEpisode(source, episodeId, opts = {}) {
  const { title, episodeNum, exclude = [] } = opts;

  if (STREAM_IDS.includes(source)) {
    try {
      const data = await withTimeout(getAnimeStreamEpisode(source, episodeId), 18000);
      if (data.sources?.length) return { ...data, usedSource: source };
    } catch {
      // fall through to cross-provider fallback
    }
  }

  if (title && episodeNum) {
    try {
      const resolved = await findStreamSources('anime', title, episodeNum, [
        ...exclude,
        ...(STREAM_IDS.includes(source) ? [source] : []),
      ]);
      return resolved;
    } catch {
      // continue
    }
  }

  if (STREAM_IDS.includes(source)) {
    for (const alt of STREAM_IDS.filter((s) => s !== source)) {
      try {
        const data = await withTimeout(getAnimeStreamEpisode(alt, episodeId), 12000);
        if (data.sources?.length) return { ...data, usedSource: alt, fallbackUsed: true };
      } catch {
        // try next
      }
    }
  }

  return { sources: [], message: 'No stream found. Try alternate sources below.' };
}

export async function getTrendingAnime(limit = 20) {
  return getTrendingAniList(limit, 'ANIME');
}

export { ANIME_SOURCES };
