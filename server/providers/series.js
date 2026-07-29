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
  getMovieStreamEpisodeFallback,
  MOVIE_ORDER,
} from './stream.js';
import { mergeResults } from './fallback.js';

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

export async function getSeriesEpisode(source, episodeId) {
  if (STREAM_IDS.includes(source)) {
    try {
      return await getMovieStreamEpisode(source, episodeId);
    } catch {
      return getMovieStreamEpisodeFallback(episodeId, [source, ...STREAM_IDS.filter((s) => s !== source)]);
    }
  }
  return { sources: [], message: 'Select a streaming source (FlixHQ, SFlix, etc.)' };
}

export async function getTrendingSeries(limit = 20) {
  return getTrendingAniList(limit, 'ANIME');
}

export { SERIES_SOURCES };
