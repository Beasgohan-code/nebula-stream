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
} from './stream.js';

const STREAM_IDS = ['flixhq', 'sflix', 'dramacool', 'himovies'];

const SERIES_SOURCES = [
  { id: 'anilist', name: 'AniList', color: '#02A9FF' },
  ...getMovieStreamSources(),
];

export async function searchSeries(query, source = 'all', limit = 24) {
  const tasks = [];

  if (source === 'all' || source === 'anilist') {
    tasks.push(searchAniList(query, limit, 'ANIME').catch(() => []));
  }

  const streamSources = source === 'all' ? STREAM_IDS : STREAM_IDS.includes(source) ? [source] : [];
  for (const s of streamSources) {
    tasks.push(
      searchMovieStream(s, query, Math.ceil(limit / streamSources.length)).catch(() => [])
    );
  }

  const results = await Promise.all(tasks);
  const merged = results.flat();
  const seen = new Set();
  return merged.filter((s) => {
    const key = s.title?.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}

export async function getSeriesInfo(source, id) {
  if (source === 'anilist') return getAniListInfo(id, 'ANIME');
  if (STREAM_IDS.includes(source)) return getMovieStreamInfo(source, id);
  return getAniListInfo(id, 'ANIME');
}

export async function getSeriesEpisode(source, episodeId) {
  if (STREAM_IDS.includes(source)) return getMovieStreamEpisode(source, episodeId);
  return { sources: [], message: 'Select a streaming source (FlixHQ, SFlix, etc.)' };
}

export async function getTrendingSeries(limit = 20) {
  return getTrendingAniList(limit, 'ANIME');
}

export { SERIES_SOURCES };
