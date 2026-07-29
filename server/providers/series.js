import {
  searchAniList,
  getTrendingAniList,
  getAniListInfo,
} from './anilist.js';
import {
  getMovieStreamSources,
  searchMovieStream,
  getMovieStreamInfo,
  getMovieStreamEpisode,
  MOVIE_ORDER,
} from './stream.js';
import { mergeResults, withTimeout } from './fallback.js';
import { findStreamSources } from './resolver.js';

const STREAM_IDS = MOVIE_ORDER;

const SERIES_SOURCES = [
  { id: 'anilist', name: 'AniList', color: '#02A9FF' },
  ...getMovieStreamSources(),
];

export async function searchSeries(query, source = 'all', limit = 24) {
  if (source !== 'all' && source !== 'anilist' && STREAM_IDS.includes(source)) {
    try {
      return await searchMovieStream(source, query, limit);
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
      searchMovieStream(s, query, 4).catch(() => [])
    ),
  ];

  return mergeResults(tasks, limit);
}

export async function getSeriesInfo(source, id) {
  if (source === 'anilist') return getAniListInfo(id, 'ANIME');
  if (STREAM_IDS.includes(source)) {
    try {
      return await getMovieStreamInfo(source, id);
    } catch {
      return getAniListInfo(id, 'ANIME');
    }
  }
  return getAniListInfo(id, 'ANIME');
}

export async function getSeriesEpisode(source, episodeId, opts = {}) {
  const { title, episodeNum, exclude = [] } = opts;

  if (STREAM_IDS.includes(source)) {
    try {
      const data = await withTimeout(getMovieStreamEpisode(source, episodeId), 18000);
      if (data.sources?.length) return { ...data, usedSource: source };
    } catch {
      // fall through
    }
  }

  if (title && episodeNum) {
    try {
      return await findStreamSources('series', title, episodeNum, [
        ...exclude,
        ...(STREAM_IDS.includes(source) ? [source] : []),
      ]);
    } catch {
      // continue
    }
  }

  for (const alt of STREAM_IDS.filter((s) => s !== source)) {
    try {
      const data = await withTimeout(getMovieStreamEpisode(alt, episodeId), 12000);
      if (data.sources?.length) return { ...data, usedSource: alt, fallbackUsed: true };
    } catch {
      // try next
    }
  }

  return { sources: [], message: 'No stream found. Try alternate sources.' };
}

export async function getTrendingSeries(limit = 20) {
  return getTrendingAniList(limit, 'ANIME');
}

export { SERIES_SOURCES };
