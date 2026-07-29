import { ANIME, MOVIES } from '@consumet/extensions';
import { withFallback } from './fallback.js';
import { consumetLimiter } from './ratelimit.js';

const ANIME_PROVIDERS = {
  hianime: { cls: ANIME.Hianime, name: 'HiAnime', color: '#ef476f' },
  animepahe: { cls: ANIME.AnimePahe, name: 'AnimePahe', color: '#3a86ff' },
  animekai: { cls: ANIME.AnimeKai, name: 'AnimeKai', color: '#8338ec' },
  kickassanime: { cls: ANIME.KickAssAnime, name: 'KickAssAnime', color: '#ff006e' },
  animesaturn: { cls: ANIME.AnimeSaturn, name: 'AnimeSaturn', color: '#06d6a0' },
  animeunity: { cls: ANIME.AnimeUnity, name: 'AnimeUnity', color: '#ffd166' },
  animesama: { cls: ANIME.AnimeSama, name: 'AnimeSama', color: '#06ffa5' },
};

const MOVIE_PROVIDERS = {
  flixhq: { cls: MOVIES.FlixHQ, name: 'FlixHQ', color: '#e63946' },
  sflix: { cls: MOVIES.SFlix, name: 'SFlix', color: '#457b9d' },
  dramacool: { cls: MOVIES.DramaCool, name: 'DramaCool', color: '#2a9d8f' },
  himovies: { cls: MOVIES.HiMovies, name: 'HiMovies', color: '#e9c46a' },
  goku: { cls: MOVIES.Goku, name: 'Goku', color: '#f4a261' },
};

const ANIME_ORDER = Object.keys(ANIME_PROVIDERS);
const MOVIE_ORDER = Object.keys(MOVIE_PROVIDERS);
const instances = new Map();

function getProvider(map, id) {
  const cfg = map[id];
  if (!cfg) return null;
  const key = `${id}`;
  if (!instances.has(key)) instances.set(key, new cfg.cls());
  return { instance: instances.get(key), cfg };
}

export function getAnimeStreamSources() {
  return Object.entries(ANIME_PROVIDERS).map(([id, p]) => ({
    id, name: p.name, color: p.color,
  }));
}

export function getMovieStreamSources() {
  return Object.entries(MOVIE_PROVIDERS).map(([id, p]) => ({
    id, name: p.name, color: p.color,
  }));
}

function wrapConsumet(fn) {
  return consumetLimiter.schedule(fn);
}

export async function searchAnimeStream(provider, query, limit = 20) {
  const p = getProvider(ANIME_PROVIDERS, provider);
  if (!p) return [];
  const data = await wrapConsumet(() =>
    Promise.race([
      p.instance.search(query),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
    ])
  );
  return (data.results || []).slice(0, limit).map((a) => ({
    id: a.id,
    title: a.title,
    image: a.image,
    source: provider,
    sourceName: p.cfg.name,
    type: 'streamable',
    subOrDub: a.subOrDub,
  }));
}

export async function searchAnimeStreamFallback(query, limit = 20) {
  const { result } = await withFallback(ANIME_ORDER, async (provider) => {
    const items = await searchAnimeStream(provider, query, limit);
    return items.length ? items : null;
  }, 'anime search');
  return result;
}

export async function getAnimeStreamInfo(provider, id) {
  const p = getProvider(ANIME_PROVIDERS, provider);
  if (!p) throw new Error('Unknown provider');
  const info = await wrapConsumet(() => p.instance.fetchAnimeInfo(id));
  return {
    id: info.id || id,
    title: info.title,
    image: info.image,
    source: provider,
    sourceName: p.cfg.name,
    description: info.description || '',
    genres: info.genres || [],
    status: info.status,
    episodes: (info.episodes || []).map((ep) => ({
      id: ep.id,
      number: ep.number,
      title: ep.title || `Episode ${ep.number}`,
      isFiller: ep.isFiller,
      isRecap: ep.isRecap,
    })),
    streamable: true,
  };
}

export async function getAnimeStreamEpisode(provider, episodeId, server) {
  const p = getProvider(ANIME_PROVIDERS, provider);
  if (!p) throw new Error('Unknown provider');

  let data;
  if (server && p.instance.fetchEpisodeSources.length > 1) {
    data = await wrapConsumet(() => p.instance.fetchEpisodeSources(episodeId, server));
  } else {
    data = await wrapConsumet(() => p.instance.fetchEpisodeSources(episodeId));
  }

  return {
    sources: (data.sources || []).map((s) => ({
      url: s.url,
      quality: s.quality || 'auto',
      isM3U8: s.isM3U8,
    })),
    subtitles: (data.subtitles || []).map((s) => ({
      url: s.url,
      lang: s.lang || s.language,
    })),
    intro: data.intro,
    outro: data.outro,
    download: data.download || data.sources?.[0]?.url || null,
    headers: data.headers || null,
  };
}

export async function getAnimeStreamEpisodeFallback(episodeId, providers = ANIME_ORDER) {
  const errors = [];
  for (const provider of providers) {
    try {
      const data = await getAnimeStreamEpisode(provider, episodeId);
      if (data.sources?.length) return { ...data, provider };
    } catch (err) {
      errors.push({ provider, error: err.message });
    }
  }
  throw new Error('No streaming source available. Try another episode or source.');
}

export async function searchMovieStream(provider, query, limit = 20) {
  const p = getProvider(MOVIE_PROVIDERS, provider);
  if (!p) return [];
  const data = await wrapConsumet(() =>
    Promise.race([
      p.instance.search(query),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
    ])
  );
  return (data.results || []).slice(0, limit).map((s) => ({
    id: s.id,
    title: s.title,
    image: s.image || s.poster,
    source: provider,
    sourceName: p.cfg.name,
    type: 'streamable',
    year: s.releaseDate,
  }));
}

export async function searchMovieStreamFallback(query, limit = 20) {
  const { result } = await withFallback(MOVIE_ORDER, async (provider) => {
    const items = await searchMovieStream(provider, query, limit);
    return items.length ? items : null;
  }, 'series search');
  return result;
}

export async function getMovieStreamInfo(provider, id) {
  const p = getProvider(MOVIE_PROVIDERS, provider);
  if (!p) throw new Error('Unknown provider');
  const info = await wrapConsumet(() => p.instance.fetchMediaInfo(id));
  const episodes = info.episodes || info.seasons?.flatMap((s) => s.episodes) || [];
  return {
    id: info.id || id,
    title: info.title,
    image: info.image || info.cover,
    source: provider,
    sourceName: p.cfg.name,
    description: info.description || '',
    episodes: episodes.map((ep, i) => ({
      id: ep.id || String(i + 1),
      number: ep.number || i + 1,
      title: ep.title || `Episode ${ep.number || i + 1}`,
    })),
    streamable: true,
  };
}

export async function getMovieStreamEpisode(provider, episodeId) {
  const p = getProvider(MOVIE_PROVIDERS, provider);
  if (!p) throw new Error('Unknown provider');
  const data = await wrapConsumet(() => p.instance.fetchEpisodeSources(episodeId));
  return {
    sources: (data.sources || []).map((s) => ({
      url: s.url,
      quality: s.quality || 'auto',
      isM3U8: s.isM3U8,
    })),
    subtitles: data.subtitles || [],
    download: data.download || data.sources?.[0]?.url || null,
  };
}

export async function getMovieStreamEpisodeFallback(episodeId, providers = MOVIE_ORDER) {
  for (const provider of providers) {
    try {
      const data = await getMovieStreamEpisode(provider, episodeId);
      if (data.sources?.length) return { ...data, provider };
    } catch {
      // try next
    }
  }
  throw new Error('No streaming source available.');
}

export { ANIME_ORDER, MOVIE_ORDER };
