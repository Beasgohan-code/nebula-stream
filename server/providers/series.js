import axios from 'axios';

const CONSUMET = 'https://api.consumet.org';
const JIKAN = 'https://api.jikan.moe/v4';

const SERIES_SOURCES = [
  { id: 'flixhq', name: 'FlixHQ', color: '#e63946' },
  { id: 'sflix', name: 'SFlix', color: '#457b9d' },
  { id: 'dramacool', name: 'DramaCool', color: '#2a9d8f' },
  { id: 'viewasian', name: 'ViewAsian', color: '#e9c46a' },
  { id: 'jikan', name: 'MyAnimeList', color: '#264653' },
];

async function searchJikanSeries(query, limit = 12) {
  try {
    const [animeRes, mangaRes] = await Promise.all([
      axios.get(`${JIKAN}/anime`, {
        params: { q: query, limit: Math.ceil(limit / 2), type: 'tv' },
        timeout: 12000,
      }),
      axios.get(`${JIKAN}/anime`, {
        params: { q: query, limit: Math.ceil(limit / 2), type: 'ona' },
        timeout: 12000,
      }),
    ]);

    const combined = [...animeRes.data.data, ...mangaRes.data.data];
    return combined.map((a) => ({
      id: String(a.mal_id),
      title: a.title,
      image: a.images?.webp?.large_image_url,
      source: 'jikan',
      sourceName: 'MyAnimeList',
      description: a.synopsis || '',
      year: a.year,
      type: 'metadata',
    }));
  } catch {
    return [];
  }
}

async function searchConsumetMovies(provider, query, limit = 20) {
  try {
    const { data } = await axios.get(
      `${CONSUMET}/movies/${provider}/${encodeURIComponent(query)}`,
      { timeout: 12000 }
    );
    const results = data.results || [];
    const source = SERIES_SOURCES.find((s) => s.id === provider);
    return results.slice(0, limit).map((s) => ({
      id: s.id,
      title: s.title,
      image: s.image || s.poster,
      source: provider,
      sourceName: source?.name || provider,
      year: s.releaseDate,
      type: 'streamable',
    }));
  } catch {
    return [];
  }
}

export async function searchSeries(query, source = 'all', limit = 24) {
  const streamSources =
    source === 'all' ? ['flixhq', 'sflix', 'dramacool'] : source === 'jikan' ? [] : [source];

  const tasks = [
    searchJikanSeries(query, 12),
    ...streamSources.map((s) =>
      searchConsumetMovies(s, query, Math.ceil(limit / streamSources.length))
    ),
  ];

  const results = await Promise.allSettled(tasks);
  return results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .filter((s, i, arr) => {
      const key = s.title?.toLowerCase();
      return arr.findIndex((x) => x.title?.toLowerCase() === key) === i;
    });
}

export async function getSeriesInfo(source, id) {
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
      episodes: a.episodes,
      streamable: false,
    };
  }

  const { data } = await axios.get(
    `${CONSUMET}/movies/${source}/info/${encodeURIComponent(id)}`,
    { timeout: 12000 }
  );

  return {
    id: data.id || id,
    title: data.title,
    image: data.image || data.cover,
    source,
    sourceName: SERIES_SOURCES.find((s) => s.id === source)?.name || source,
    description: data.description || '',
    episodes: (data.episodes || data.seasons?.flatMap((s) => s.episodes) || []).map(
      (ep, i) => ({
        id: ep.id || String(i + 1),
        number: ep.number || i + 1,
        title: ep.title || `Episode ${ep.number || i + 1}`,
      })
    ),
    streamable: true,
  };
}

export async function getSeriesEpisode(source, episodeId) {
  const { data } = await axios.get(
    `${CONSUMET}/movies/${source}/watch?episodeId=${encodeURIComponent(episodeId)}`,
    { timeout: 15000 }
  );

  return {
    sources: (data.sources || []).map((s) => ({
      url: s.url,
      quality: s.quality || 'default',
      isM3U8: s.isM3U8,
    })),
    subtitles: data.subtitles || [],
  };
}

export async function getTrendingSeries(limit = 20) {
  try {
    const { data } = await axios.get(`${JIKAN}/seasons/now`, {
      timeout: 12000,
    });
    return data.data.slice(0, limit).map((a) => ({
      id: String(a.mal_id),
      title: a.title,
      image: a.images?.webp?.image_url,
      source: 'jikan',
      sourceName: 'MyAnimeList',
      score: a.score,
    }));
  } catch {
    return [];
  }
}

export { SERIES_SOURCES };
