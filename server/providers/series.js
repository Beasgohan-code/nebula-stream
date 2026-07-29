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
import { mergeResultsConcurrent, withTimeout, timeBudget } from './fallback.js';
import { cached, cacheKey } from './cache.js';
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

  return cached(cacheKey('search-series', query, limit), 90000, async () => {
    const anilist = await searchAniList(query, Math.min(limit, 15), 'ANIME').catch(() => []);
    if (anilist.length >= 8) return anilist.slice(0, limit);

    const streamFactories = [
      () => searchMovieStream('flixhq', query, 5).catch(() => []),
      () => searchMovieStream('sflix', query, 5).catch(() => []),
    ];
    const streamResults = await mergeResultsConcurrent(streamFactories, limit, 2);

    const seen = new Set(anilist.map((i) => i.title?.toLowerCase()));
    const merged = [...anilist];
    for (const item of streamResults) {
      const key = item.title?.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
      if (merged.length >= limit) break;
    }
    return merged;
  });
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
  const budget = timeBudget(22000);

  if (STREAM_IDS.includes(source)) {
    try {
      const data = await withTimeout(getMovieStreamEpisode(source, episodeId), 10000);
      if (data.sources?.length) return { ...data, usedSource: source };
    } catch {
      // fall through
    }
  }

  if (title && episodeNum && !budget.expired()) {
    try {
      return await findStreamSources('series', title, episodeNum, [
        ...exclude,
        ...(STREAM_IDS.includes(source) ? [source] : []),
      ], budget);
    } catch {
      // continue
    }
  }

  const alts = STREAM_IDS.filter((s) => s !== source && !exclude.includes(s)).slice(0, 3);
  for (const alt of alts) {
    if (budget.expired()) break;
    try {
      const data = await withTimeout(getMovieStreamEpisode(alt, episodeId), 8000);
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
