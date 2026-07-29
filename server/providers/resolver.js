import {
  searchAnimeStream,
  getAnimeStreamInfo,
  getAnimeStreamEpisode,
  searchMovieStream,
  getMovieStreamInfo,
  getMovieStreamEpisode,
  ANIME_ORDER,
  MOVIE_ORDER,
} from './stream.js';
import { withTimeout, titleMatch, runPool } from './fallback.js';
import { searchMangaProvider, getMangaInfo, MANGA_FALLBACK_ORDER } from './manga.js';

const ANIME_RESOLVE_ORDER = ['hianime', 'animepahe', 'animekai', 'kickassanime'];
const MOVIE_RESOLVE_ORDER = ['flixhq', 'sflix', 'dramacool', 'himovies'];
const MANGA_RESOLVE_ORDER = ['comick', 'mangapill', 'mangakakalot', 'mangahere', 'mangareader'];

export async function findStreamSources(mode, title, episodeNum, exclude = [], budget = null) {
  const providers = (mode === 'series' ? MOVIE_RESOLVE_ORDER : ANIME_RESOLVE_ORDER).filter(
    (p) => !exclude.includes(p)
  );

  for (const provider of providers) {
    if (budget?.expired()) break;
    const timeout = budget ? Math.min(8000, budget.remaining()) : 8000;
    if (timeout < 2000) break;

    try {
      const searchFn = mode === 'series' ? searchMovieStream : searchAnimeStream;
      const results = await withTimeout(searchFn(provider, title, 5), timeout);
      if (!results?.length) continue;

      const match = results.find((r) => titleMatch(r.title, title)) || results[0];
      const infoFn = mode === 'series' ? getMovieStreamInfo : getAnimeStreamInfo;
      const info = await withTimeout(infoFn(provider, match.id), timeout);
      const episodes = info.episodes || [];
      if (!episodes.length) continue;

      const epNum = parseFloat(episodeNum);
      const ep =
        episodes.find((e) => parseFloat(e.number) === epNum) ||
        episodes[epNum - 1] ||
        episodes[0];

      const streamFn = mode === 'series' ? getMovieStreamEpisode : getAnimeStreamEpisode;
      const stream = await withTimeout(streamFn(provider, ep.id), timeout);
      if (stream.sources?.length) {
        return {
          provider,
          animeId: match.id,
          episodeId: ep.id,
          episodeNumber: ep.number,
          title: info.title,
          ...stream,
          fallbackUsed: true,
          usedSource: provider,
        };
      }
    } catch {
      // try next
    }
  }

  throw new Error(`Could not find stream across ${providers.length} sources`);
}

export async function findAlternateSources(mode, title) {
  const providers = mode === 'series' ? MOVIE_RESOLVE_ORDER : ANIME_RESOLVE_ORDER;
  const searchFn = mode === 'series' ? searchMovieStream : searchAnimeStream;

  return runPool(providers, async (provider) => {
    const results = await withTimeout(searchFn(provider, title, 3), 10000);
    const match = results?.find((r) => titleMatch(r.title, title));
    if (!match) return null;
    return {
      id: match.id,
      title: match.title,
      image: match.image,
      source: provider,
      sourceName: match.sourceName,
      type: 'streamable',
    };
  }, 2);
}

export async function resolveStreamDetail(mode, title) {
  const alts = await findAlternateSources(mode, title);
  if (!alts.length) return null;

  const best = alts[0];
  const infoFn = mode === 'series' ? getMovieStreamInfo : getAnimeStreamInfo;
  const info = await withTimeout(infoFn(best.source, best.id), 12000);
  return {
    ...info,
    source: best.source,
    sourceName: info.sourceName || best.sourceName,
    streamable: true,
    resolved: true,
    resolvedFrom: best.source,
  };
}

export async function resolveMangaByTitle(title) {
  for (const provider of MANGA_RESOLVE_ORDER) {
    try {
      const results = await withTimeout(searchMangaProvider(provider, title, 5), 10000);
      const match = results.find((r) => titleMatch(r.title, title)) || results[0];
      if (!match) continue;

      const info = await withTimeout(getMangaInfo(provider, match.id), 12000);
      if (info.chapters?.length >= 3) {
        return {
          ...info,
          resolved: true,
          resolvedFrom: provider,
          source: provider,
        };
      }
    } catch {
      // try next
    }
  }
  return null;
}

export async function resolveMangaChapter(title, chapterNum, exclude = []) {
  const providers = MANGA_RESOLVE_ORDER.filter((p) => !exclude.includes(p));

  for (const provider of providers) {
    try {
      const results = await withTimeout(searchMangaProvider(provider, title, 5), 8000);
      const match = results?.find((r) => titleMatch(r.title, title));
      if (!match) continue;

      const info = await withTimeout(getMangaInfo(provider, match.id), 8000);
      const chNum = parseFloat(chapterNum);
      const ch =
        info.chapters?.find((c) => parseFloat(c.number) === chNum) ||
        info.chapters?.[info.chapters.length - 1];

      if (!ch) continue;
      const { getMangaChapter } = await import('./manga.js');
      const pages = await withTimeout(getMangaChapter(provider, match.id, ch.id), 12000);
      if (pages.pages?.length) {
        return {
          provider,
          mangaId: match.id,
          chapterId: ch.id,
          source: provider,
          ...pages,
          fallbackUsed: true,
        };
      }
    } catch {
      // try next
    }
  }
  throw new Error('No readable chapter found across sources');
}

export async function resolveDetail(mode, source, id, title) {
  if (mode === 'manga') {
    if (source !== 'mangadex') return null;
    const info = await getMangaInfo(source, id);
    const readable = (info.chapters || []).filter((c) => c.readable !== false && !c.externalUrl).length;
    if (readable >= 5) return { ...info, needsResolve: false };
    const resolved = await resolveMangaByTitle(info.title || title);
    if (resolved) return { ...resolved, needsResolve: true, previousSource: source };
    return { ...info, needsResolve: false };
  }

  if (mode === 'anime' || mode === 'series') {
    const isMeta = source === 'anilist' || source === 'jikan';
    let info = null;
    if (isMeta) {
      const { getAniListInfo } = await import('./anilist.js');
      info = await getAniListInfo(id, 'ANIME');
    } else {
      const infoFn = mode === 'series' ? getMovieStreamInfo : getAnimeStreamInfo;
      try {
        info = await infoFn(source, id);
      } catch {
        info = null;
      }
    }

    const hasInternalEps = info?.episodes?.length && !info.episodes[0]?.url;
    if (!isMeta && hasInternalEps) return { ...info, needsResolve: false };

    const resolved = await resolveStreamDetail(mode, info?.title || title);
    if (resolved) return { ...resolved, needsResolve: true, meta: info };
    return info ? { ...info, needsResolve: false } : null;
  }

  return null;
}
