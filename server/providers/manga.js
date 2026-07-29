import { MANGA } from '@consumet/extensions';
import axios from 'axios';
import { withFallback, mergeResults } from './fallback.js';

const MANGADEX = 'https://api.mangadex.org';

const MANGA_PROVIDERS = {
  mangadex: { cls: MANGA.MangaDex, name: 'MangaDex', color: '#ff6b35', direct: false },
  mangakakalot: { cls: MANGA.MangaKakalot, name: 'MangaKakalot', color: '#00f5d4', direct: true },
  mangahere: { cls: MANGA.MangaHere, name: 'MangaHere', color: '#f72585', direct: true },
  mangapill: { cls: MANGA.MangaPill, name: 'MangaPill', color: '#7b2cbf', direct: true },
  mangareader: { cls: MANGA.MangaReader, name: 'MangaReader', color: '#4cc9f0', direct: true },
  asurascans: { cls: MANGA.AsuraScans, name: 'AsuraScans', color: '#fee440', direct: true },
  weebcentral: { cls: MANGA.WeebCentral, name: 'WeebCentral', color: '#ff6b6b', direct: true },
  comick: { cls: MANGA.ComicK, name: 'ComicK', color: '#a8dadc', direct: true },
};

const MANGA_FALLBACK_ORDER = ['mangadex', 'mangakakalot', 'comick', 'mangapill', 'mangahere', 'mangareader', 'asurascans', 'weebcentral'];

const instances = new Map();

function getProvider(id) {
  const cfg = MANGA_PROVIDERS[id];
  if (!cfg?.direct) return null;
  if (!instances.has(id)) instances.set(id, new cfg.cls());
  return { instance: instances.get(id), cfg };
}

export const MANGA_SOURCES = [
  { id: 'mangadex', name: 'MangaDex', color: '#ff6b35' },
  ...Object.entries(MANGA_PROVIDERS)
    .filter(([id]) => id !== 'mangadex')
    .map(([id, p]) => ({ id, name: p.name, color: p.color })),
];

async function searchMangaDex(query, limit = 20) {
  const { data } = await axios.get(`${MANGADEX}/manga`, {
    params: {
      title: query,
      limit,
      'includes[]': ['cover_art'],
      'order[followedCount]': 'desc',
    },
    timeout: 12000,
  });

  return data.data.map((m) => {
    const coverRel = m.relationships?.find((r) => r.type === 'cover_art');
    const title = m.attributes.title.en || Object.values(m.attributes.title)[0] || 'Unknown';
    return {
      id: m.id,
      title,
      image: coverRel ? `https://uploads.mangadex.org/covers/${m.id}/${coverRel.id}.512.jpg` : null,
      source: 'mangadex',
      sourceName: 'MangaDex',
      type: 'readable',
    };
  });
}

async function searchMangaProvider(provider, query, limit = 20) {
  const p = getProvider(provider);
  if (!p) return [];
  const data = await p.instance.search(query);
  return (data.results || []).slice(0, limit).map((m) => ({
    id: m.id,
    title: m.title,
    image: m.image || m.thumbnail || m.cover,
    source: provider,
    sourceName: p.cfg.name,
    type: 'readable',
  }));
}

export async function searchManga(query, source = 'all', limit = 24) {
  if (source !== 'all' && source !== 'mangadex') {
    try {
      return await searchMangaProvider(source, query, limit);
    } catch {
      return [];
    }
  }

  if (source === 'mangadex') {
    return searchMangaDex(query, limit);
  }

  const providerIds = MANGA_FALLBACK_ORDER;
  const perSource = Math.max(3, Math.ceil(limit / providerIds.length));
  const tasks = providerIds.map(async (id) => {
    try {
      if (id === 'mangadex') return searchMangaDex(query, perSource);
      return await searchMangaProvider(id, query, perSource);
    } catch {
      return [];
    }
  });

  return mergeResults(tasks, limit);
}

export async function getMangaInfo(source, id) {
  if (source === 'mangadex') {
    const { data } = await axios.get(`${MANGADEX}/manga/${id}`, {
      params: { 'includes[]': ['cover_art'] },
      timeout: 12000,
    });
    const m = data.data;
    const coverRel = m.relationships?.find((r) => r.type === 'cover_art');
    const title = m.attributes.title.en || Object.values(m.attributes.title)[0];
    const cover = coverRel ? `https://uploads.mangadex.org/covers/${id}/${coverRel.id}.512.jpg` : null;

    const { data: chapters } = await axios.get(`${MANGADEX}/manga/${id}/feed`, {
      params: {
        limit: 500,
        'translatedLanguage[]': ['en'],
        'order[chapter]': 'asc',
      },
      timeout: 12000,
    });

    return {
      id, title, image: cover,
      source: 'mangadex', sourceName: 'MangaDex',
      description: m.attributes.description?.en || '',
      status: m.attributes.status,
      chapters: chapters.data.map((c) => ({
        id: c.id,
        number: c.attributes.chapter,
        title: c.attributes.title || `Chapter ${c.attributes.chapter}`,
        pages: c.attributes.pages,
        externalUrl: c.attributes.externalUrl || null,
        readable: (c.attributes.pages || 0) > 0 && !c.attributes.externalUrl,
        source: 'mangadex',
      })).sort((a, b) => {
        if (a.readable !== b.readable) return a.readable ? -1 : 1;
        return parseFloat(b.number || 0) - parseFloat(a.number || 0);
      }),
    };
  }

  const p = getProvider(source);
  if (!p) throw new Error('Unknown manga source');
  const info = await p.instance.fetchMangaInfo(id);
  return {
    id: info.id || id,
    title: info.title,
    image: info.image || info.cover,
    source,
    sourceName: p.cfg.name,
    description: info.description || '',
    status: info.status,
    chapters: (info.chapters || []).map((c) => ({
      id: c.id,
      number: c.chapterNumber || c.number,
      title: c.title || `Chapter ${c.chapterNumber || c.number}`,
      readable: true,
      source,
    })).reverse(),
  };
}

export async function getMangaChapter(source, mangaId, chapterId) {
  if (source === 'mangadex') {
    const { data: chData } = await axios.get(`${MANGADEX}/chapter/${chapterId}`, { timeout: 12000 });
    const attrs = chData.data?.attributes;
    if (attrs?.externalUrl) return { externalUrl: attrs.externalUrl, pages: [] };

    const { data } = await axios.get(`${MANGADEX}/at-home/server/${chapterId}`, { timeout: 12000 });
    if (!data.chapter) return { pages: [], error: 'Chapter not available' };
    const base = data.baseUrl;
    const hash = data.chapter.hash;
    const files = data.chapter.data?.length ? data.chapter.data : data.chapter.dataSaver || [];
    const folder = data.chapter.data?.length ? 'data' : 'data-saver';
    return { pages: files.map((f) => `${base}/${folder}/${hash}/${f}`) };
  }

  const p = getProvider(source);
  if (!p) throw new Error('Unknown source');
  const data = await p.instance.fetchChapterPages(chapterId);
  return { pages: data || [] };
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
      const title = m.attributes.title.en || Object.values(m.attributes.title)[0];
      return {
        id: m.id,
        title,
        image: coverRel ? `https://uploads.mangadex.org/covers/${m.id}/${coverRel.id}.512.jpg` : null,
        source: 'mangadex',
        sourceName: 'MangaDex',
      };
    });
  } catch {
    return [];
  }
}

export { MANGA_FALLBACK_ORDER };
