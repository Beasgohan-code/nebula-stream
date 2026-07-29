import axios from 'axios';

const CONSUMET = 'https://api.consumet.org';
const MANGADEX = 'https://api.mangadex.org';

const MANGA_SOURCES = [
  { id: 'mangadex', name: 'MangaDex', color: '#ff6b35' },
  { id: 'mangakakalot', name: 'MangaKakalot', color: '#00f5d4' },
  { id: 'mangahere', name: 'MangaHere', color: '#f72585' },
  { id: 'mangapill', name: 'MangaPill', color: '#7b2cbf' },
  { id: 'mangareader', name: 'MangaReader', color: '#4cc9f0' },
  { id: 'mangasee', name: 'MangaSee', color: '#fee440' },
];

async function searchMangaDex(query, limit = 20) {
  const { data } = await axios.get(`${MANGADEX}/manga`, {
    params: {
      title: query,
      limit,
      'includes[]': ['cover_art', 'author'],
      'order[followedCount]': 'desc',
    },
    timeout: 12000,
  });

  return data.data.map((m) => {
    const coverRel = m.relationships?.find((r) => r.type === 'cover_art');
    const authorRel = m.relationships?.find((r) => r.type === 'author');
    const title =
      m.attributes.title.en ||
      Object.values(m.attributes.title)[0] ||
      'Unknown';
    const coverId = coverRel?.id;
    const cover = coverId
      ? `https://uploads.mangadex.org/covers/${m.id}/${coverId}.512.jpg`
      : null;

    return {
      id: m.id,
      title,
      image: cover,
      source: 'mangadex',
      sourceName: 'MangaDex',
      description: m.attributes.description?.en || '',
      status: m.attributes.status,
      year: m.attributes.year,
      tags: m.attributes.tags?.slice(0, 5).map((t) => t.attributes.name.en) || [],
      author: authorRel?.id || null,
    };
  });
}

async function searchConsumetManga(provider, query, limit = 20) {
  try {
    const { data } = await axios.get(
      `${CONSUMET}/manga/${provider}/${encodeURIComponent(query)}`,
      { timeout: 12000 }
    );
    const results = data.results || data || [];
    const source = MANGA_SOURCES.find((s) => s.id === provider);
    return (Array.isArray(results) ? results : []).slice(0, limit).map((m) => ({
      id: m.id,
      title: m.title,
      image: m.image || m.thumbnail || m.cover,
      source: provider,
      sourceName: source?.name || provider,
      description: m.description || '',
      status: m.status,
      genres: m.genres || [],
    }));
  } catch {
    return [];
  }
}

export async function searchManga(query, source = 'all', limit = 24) {
  const sources =
    source === 'all'
      ? ['mangadex', 'mangakakalot', 'mangahere', 'mangapill', 'mangareader', 'mangasee']
      : [source];

  const perSource = Math.ceil(limit / sources.length);
  const tasks = sources.map(async (s) => {
    if (s === 'mangadex') return searchMangaDex(query, perSource);
    return searchConsumetManga(s, query, perSource);
  });

  const results = await Promise.allSettled(tasks);
  const merged = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  const seen = new Set();
  return merged.filter((m) => {
    const key = m.title?.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getMangaInfo(source, id) {
  if (source === 'mangadex') {
    const { data } = await axios.get(`${MANGADEX}/manga/${id}`, {
      params: { 'includes[]': ['cover_art', 'author', 'artist'] },
      timeout: 12000,
    });
    const m = data.data;
    const coverRel = m.relationships?.find((r) => r.type === 'cover_art');
    const title =
      m.attributes.title.en || Object.values(m.attributes.title)[0];
    const cover = coverRel
      ? `https://uploads.mangadex.org/covers/${id}/${coverRel.id}.512.jpg`
      : null;

    const { data: chapters } = await axios.get(`${MANGADEX}/manga/${id}/feed`, {
      params: {
        limit: 500,
        'translatedLanguage[]': ['en'],
        'order[chapter]': 'asc',
        'includes[]': ['scanlation_group'],
      },
      timeout: 12000,
    });

    return {
      id,
      title,
      image: cover,
      source: 'mangadex',
      sourceName: 'MangaDex',
      description: m.attributes.description?.en || '',
      status: m.attributes.status,
      chapters: chapters.data.map((c) => ({
        id: c.id,
        number: c.attributes.chapter,
        title: c.attributes.title || `Chapter ${c.attributes.chapter}`,
        pages: c.attributes.pages,
        source: 'mangadex',
      })),
    };
  }

  const { data } = await axios.get(
    `${CONSUMET}/manga/${source}/info/${encodeURIComponent(id)}`,
    { timeout: 12000 }
  );

  const info = data;
  return {
    id: info.id || id,
    title: info.title,
    image: info.image || info.cover,
    source,
    sourceName: MANGA_SOURCES.find((s) => s.id === source)?.name || source,
    description: info.description || '',
    status: info.status,
    chapters: (info.chapters || []).map((c) => ({
      id: c.id,
      number: c.chapterNumber || c.number,
      title: c.title || `Chapter ${c.chapterNumber || c.number}`,
      source,
    })),
  };
}

export async function getMangaChapter(source, mangaId, chapterId) {
  if (source === 'mangadex') {
    const { data } = await axios.get(
      `https://api.mangadex.org/at-home/server/${chapterId}`,
      { timeout: 12000 }
    );
    const base = data.baseUrl;
    const hash = data.chapter.hash;
    const pages = data.chapter.data.map(
      (f) => `${base}/data/${hash}/${f}`
    );
    return { pages };
  }

  const { data } = await axios.get(
    `${CONSUMET}/manga/${source}/read?chapterId=${encodeURIComponent(chapterId)}`,
    { timeout: 15000 }
  );
  return { pages: data.images || data.pages || [] };
}

export async function getTrendingManga(limit = 20) {
  try {
    const { data } = await axios.get(`${MANGADEX}/manga`, {
      params: {
        limit,
        'includes[]': ['cover_art'],
        'order[followedCount]': 'desc',
        'availableTranslatedLanguage[]': ['en'],
      },
      timeout: 12000,
    });
    return data.data.map((m) => {
      const coverRel = m.relationships?.find((r) => r.type === 'cover_art');
      const title =
        m.attributes.title.en || Object.values(m.attributes.title)[0];
      return {
        id: m.id,
        title,
        image: coverRel
          ? `https://uploads.mangadex.org/covers/${m.id}/${coverRel.id}.512.jpg`
          : null,
        source: 'mangadex',
        sourceName: 'MangaDex',
      };
    });
  } catch {
    return [];
  }
}

export { MANGA_SOURCES };
