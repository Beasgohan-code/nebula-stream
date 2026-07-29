import { ANIME, MOVIES } from '@consumet/extensions';

const ANIME_PROVIDERS = {
  hianime: { cls: ANIME.Hianime, name: 'HiAnime', color: '#ef476f' },
  animepahe: { cls: ANIME.AnimePahe, name: 'AnimePahe', color: '#3a86ff' },
  animekai: { cls: ANIME.AnimeKai, name: 'AnimeKai', color: '#8338ec' },
  kickassanime: { cls: ANIME.KickAssAnime, name: 'KickAssAnime', color: '#ff006e' },
  animesaturn: { cls: ANIME.AnimeSaturn, name: 'AnimeSaturn', color: '#06d6a0' },
};

const MOVIE_PROVIDERS = {
  flixhq: { cls: MOVIES.FlixHQ, name: 'FlixHQ', color: '#e63946' },
  sflix: { cls: MOVIES.SFlix, name: 'SFlix', color: '#457b9d' },
  dramacool: { cls: MOVIES.DramaCool, name: 'DramaCool', color: '#2a9d8f' },
  himovies: { cls: MOVIES.HiMovies, name: 'HiMovies', color: '#e9c46a' },
};

const instances = new Map();

function getProvider(map, id) {
  const cfg = map[id];
  if (!cfg) return null;
  if (!instances.has(id)) instances.set(id, new cfg.cls());
  return instances.get(id);
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

export async function searchAnimeStream(provider, query, limit = 20) {
  const p = getProvider(ANIME_PROVIDERS, provider);
  if (!p) return [];
  const data = await p.search(query);
  const cfg = ANIME_PROVIDERS[provider];
  return (data.results || []).slice(0, limit).map((a) => ({
    id: a.id,
    title: a.title,
    image: a.image,
    source: provider,
    sourceName: cfg.name,
    type: 'streamable',
    subOrDub: a.subOrDub,
  }));
}

export async function getAnimeStreamInfo(provider, id) {
  const p = getProvider(ANIME_PROVIDERS, provider);
  if (!p) throw new Error('Unknown provider');
  const cfg = ANIME_PROVIDERS[provider];
  const info = await p.fetchAnimeInfo(id);
  return {
    id: info.id || id,
    title: info.title,
    image: info.image,
    source: provider,
    sourceName: cfg.name,
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

export async function getAnimeStreamEpisode(provider, episodeId) {
  const p = getProvider(ANIME_PROVIDERS, provider);
  if (!p) throw new Error('Unknown provider');
  const data = await p.fetchEpisodeSources(episodeId);
  return {
    sources: (data.sources || []).map((s) => ({
      url: s.url,
      quality: s.quality || 'auto',
      isM3U8: s.isM3U8,
    })),
    subtitles: (data.subtitles || []).map((s) => ({
      url: s.url,
      lang: s.lang,
    })),
    intro: data.intro,
    outro: data.outro,
    download: data.download || null,
  };
}

export async function searchMovieStream(provider, query, limit = 20) {
  const p = getProvider(MOVIE_PROVIDERS, provider);
  if (!p) return [];
  const data = await p.search(query);
  const cfg = MOVIE_PROVIDERS[provider];
  return (data.results || []).slice(0, limit).map((s) => ({
    id: s.id,
    title: s.title,
    image: s.image || s.poster,
    source: provider,
    sourceName: cfg.name,
    type: 'streamable',
    year: s.releaseDate,
  }));
}

export async function getMovieStreamInfo(provider, id) {
  const p = getProvider(MOVIE_PROVIDERS, provider);
  if (!p) throw new Error('Unknown provider');
  const cfg = MOVIE_PROVIDERS[provider];
  const info = await p.fetchMediaInfo(id);
  const episodes = info.episodes || info.seasons?.flatMap((s) => s.episodes) || [];
  return {
    id: info.id || id,
    title: info.title,
    image: info.image || info.cover,
    source: provider,
    sourceName: cfg.name,
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
  const data = await p.fetchEpisodeSources(episodeId);
  return {
    sources: (data.sources || []).map((s) => ({
      url: s.url,
      quality: s.quality || 'auto',
      isM3U8: s.isM3U8,
    })),
    subtitles: data.subtitles || [],
    download: data.download || null,
  };
}
