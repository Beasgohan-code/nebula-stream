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
import { withFallback, withTimeout, titleMatch } from './fallback.js';

export async function findStreamSources(mode, title, episodeNum, exclude = []) {
  const providers = (mode === 'series' ? MOVIE_ORDER : ANIME_ORDER).filter(
    (p) => !exclude.includes(p)
  );

  const errors = [];
  for (const provider of providers) {
    try {
      const searchFn = mode === 'series' ? searchMovieStream : searchAnimeStream;
      const results = await withTimeout(searchFn(provider, title, 5), 12000);
      if (!results?.length) continue;

      const match = results.find((r) => titleMatch(r.title, title)) || results[0];
      const infoFn = mode === 'series' ? getMovieStreamInfo : getAnimeStreamInfo;
      const info = await withTimeout(infoFn(provider, match.id), 12000);
      const episodes = info.episodes || [];
      if (!episodes.length) continue;

      const epNum = parseFloat(episodeNum);
      const ep =
        episodes.find((e) => parseFloat(e.number) === epNum) ||
        episodes[epNum - 1] ||
        episodes[0];

      const streamFn = mode === 'series' ? getMovieStreamEpisode : getAnimeStreamEpisode;
      const stream = await withTimeout(streamFn(provider, ep.id), 15000);
      if (stream.sources?.length) {
        return {
          provider,
          animeId: match.id,
          episodeId: ep.id,
          episodeNumber: ep.number,
          title: info.title,
          ...stream,
          fallbackUsed: true,
        };
      }
    } catch (err) {
      errors.push({ provider, error: err.message });
    }
  }

  throw new Error(`Could not find stream across ${providers.length} sources`);
}

export async function findAlternateSources(mode, title) {
  const providers = mode === 'series' ? MOVIE_ORDER : ANIME_ORDER;
  const searchFn = mode === 'series' ? searchMovieStream : searchAnimeStream;

  const tasks = providers.map(async (provider) => {
    try {
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
    } catch {
      return null;
    }
  });

  const results = await Promise.allSettled(tasks);
  return results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value);
}

export async function resolveMangaChapter(title, chapterNum, exclude = []) {
  const { searchManga, getMangaInfo, getMangaChapter, MANGA_FALLBACK_ORDER } = await import('./manga.js');
  const providers = MANGA_FALLBACK_ORDER.filter((p) => p !== 'mangadex' && !exclude.includes(p));

  for (const provider of providers) {
    try {
      const results = await withTimeout(searchManga(title, provider, 3), 12000);
      const match = results?.find((r) => titleMatch(r.title, title));
      if (!match) continue;

      const info = await withTimeout(getMangaInfo(provider, match.id), 12000);
      const chNum = parseFloat(chapterNum);
      const ch =
        info.chapters?.find((c) => parseFloat(c.number) === chNum) ||
        info.chapters?.[info.chapters.length - 1];

      if (!ch) continue;
      const pages = await withTimeout(getMangaChapter(provider, match.id, ch.id), 15000);
      if (pages.pages?.length) {
        return { provider, mangaId: match.id, chapterId: ch.id, ...pages, fallbackUsed: true };
      }
    } catch {
      // try next provider
    }
  }
  throw new Error('No readable chapter found across sources');
}
