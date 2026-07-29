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
import { mergeResultsConcurrent, withTimeout, timeBudget } from './fallback.js';
import { cached, cacheKey } from './cache.js';
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

  return cached(cacheKey('search-anime', query, limit), 90000, async () => {
    const anilist = await searchAniList(query, Math.min(limit, 15), 'ANIME').catch(() => []);
    if (anilist.length >= 8) return anilist.slice(0, limit);

    const streamFactories = [
      () => searchAnimeStream('hianime', query, 5).catch(() => []),
      () => searchAnimeStream('animepahe', query, 5).catch(() => []),
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
  const budget = timeBudget(22000);

  if (STREAM_IDS.includes(source)) {
    try {
      const data = await withTimeout(getAnimeStreamEpisode(source, episodeId), 10000);
      if (data.sources?.length) return { ...data, usedSource: source };
    } catch {
      // fall through to cross-provider fallback
    }
  }

  if (title && episodeNum && !budget.expired()) {
    try {
      const resolved = await findStreamSources('anime', title, episodeNum, [
        ...exclude,
        ...(STREAM_IDS.includes(source) ? [source] : []),
      ], budget);
      return resolved;
    } catch {
      // continue
    }
  }

  if (STREAM_IDS.includes(source) && !budget.expired()) {
    const alts = STREAM_IDS.filter((s) => s !== source && !exclude.includes(s)).slice(0, 3);
    for (const alt of alts) {
      if (budget.expired()) break;
      try {
        const data = await withTimeout(getAnimeStreamEpisode(alt, episodeId), 8000);
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
