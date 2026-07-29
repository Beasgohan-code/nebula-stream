import axios from 'axios';

const CONSUMET = 'https://api.consumet.org';
const JIKAN = 'https://api.jikan.moe/v4';

const ANIME_SOURCES = [
  { id: 'gogoanime', name: 'GogoAnime', color: '#ff006e' },
  { id: 'zoro', name: 'Zoro', color: '#8338ec' },
  { id: 'animepahe', name: 'AnimePahe', color: '#3a86ff' },
  { id: 'animefox', name: 'AnimeFox', color: '#fb5607' },
  { id: 'animesaturn', name: 'AnimeSaturn', color: '#06d6a0' },
  { id: 'hianime', name: 'HiAnime', color: '#ef476f' },
];

async function searchJikan(query, limit = 12) {
  try {
    const { data } = await axios.get(`${JIKAN}/anime`, {
      params: { q: query, limit, order_by: 'popularity', sort: 'asc' },
      timeout: 12000,
    });
    return data.data.map((a) => ({
      id: String(a.mal_id),
      title: a.title,
      image: a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url,
      source: 'jikan',
      sourceName: 'MyAnimeList',
      description: a.synopsis || '',
      score: a.score,
      episodes: a.episodes,
      status: a.status,
      genres: a.genres?.map((g) => g.name) || [],
      type: 'metadata',
    }));
  } catch {
    return [];
  }
}

async function searchConsumetAnime(provider, query, limit = 20) {
  try {
    const { data } = await axios.get(
      `${CONSUMET}/anime/${provider}/${encodeURIComponent(query)}`,
      { timeout: 12000 }
    );
    const results = data.results || [];
    const source = ANIME_SOURCES.find((s) => s.id === provider);
    return results.slice(0, limit).map((a) => ({
      id: a.id,
      title: a.title,
      image: a.image,
      source: provider,
      sourceName: source?.name || provider,
      description: '',
      subOrDub: a.subOrDub,
      type: 'streamable',
    }));
  } catch {
    return [];
  }
}

export async function searchAnime(query, source = 'all', limit = 24) {
  const streamSources =
    source === 'all'
      ? ['gogoanime', 'zoro', 'animepahe', 'hianime']
      : source === 'jikan'
        ? []
        : [source];

  const tasks = [
    searchJikan(query, Math.min(12, limit)),
    ...streamSources.map((s) =>
      searchConsumetAnime(s, query, Math.ceil(limit / streamSources.length))
    ),
  ];

  const results = await Promise.allSettled(tasks);
  return results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .filter((a, i, arr) => {
      const key = a.title?.toLowerCase();
      return arr.findIndex((x) => x.title?.toLowerCase() === key) === i;
    });
}

export async function getAnimeInfo(source, id) {
  if (source === 'jikan') {
    const { data } = await axios.get(`${JIKAN}/anime/${id}/full`, {
      timeout: 12000,
    });
    const a = data.data;
    return {
      id,
      title: a.title,
      image: a.images?.webp?.large_image_url,
      source: 'jikan',
      sourceName: 'MyAnimeList',
      description: a.synopsis,
      score: a.score,
      episodes: a.episodes,
      status: a.status,
      genres: a.genres?.map((g) => g.name),
      streamable: false,
    };
  }

  const { data } = await axios.get(
    `${CONSUMET}/anime/${source}/info/${encodeURIComponent(id)}`,
    { timeout: 12000 }
  );

  return {
    id: data.id || id,
    title: data.title,
    image: data.image,
    source,
    sourceName: ANIME_SOURCES.find((s) => s.id === source)?.name || source,
    description: data.description || '',
    genres: data.genres || [],
    episodes: (data.episodes || []).map((ep) => ({
      id: ep.id,
      number: ep.number,
      title: ep.title || `Episode ${ep.number}`,
      isFiller: ep.isFiller,
      isRecap: ep.isRecap,
    })),
    streamable: true,
  };
}

export async function getAnimeEpisode(source, episodeId) {
  const { data } = await axios.get(
    `${CONSUMET}/anime/${source}/watch?episodeId=${encodeURIComponent(episodeId)}`,
    { timeout: 15000 }
  );

  return {
    sources: (data.sources || []).map((s) => ({
      url: s.url,
      quality: s.quality || 'default',
      isM3U8: s.isM3U8,
    })),
    subtitles: data.subtitles || [],
    intro: data.intro,
    outro: data.outro,
  };
}

export async function getTrendingAnime(limit = 20) {
  try {
    const { data } = await axios.get(`${JIKAN}/top/anime`, {
      params: { limit },
      timeout: 12000,
    });
    return data.data.map((a) => ({
      id: String(a.mal_id),
      title: a.title,
      image: a.images?.webp?.large_image_url,
      source: 'jikan',
      sourceName: 'MyAnimeList',
      score: a.score,
    }));
  } catch {
    return [];
  }
}

export { ANIME_SOURCES };
