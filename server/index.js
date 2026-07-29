import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  searchManga,
  getMangaInfo,
  getMangaChapter,
  getTrendingManga,
  MANGA_SOURCES,
} from './providers/manga.js';
import {
  searchAnime,
  getAnimeInfo,
  getAnimeEpisode,
  getTrendingAnime,
  ANIME_SOURCES,
} from './providers/anime.js';
import {
  searchSeries,
  getSeriesInfo,
  getSeriesEpisode,
  getTrendingSeries,
  SERIES_SOURCES,
} from './providers/series.js';
import { downloadMangaChapter, proxyStream, proxyImage } from './providers/download.js';
import { findAlternateSources, resolveMangaChapter, resolveDetail } from './providers/resolver.js';
import { aiChat, getAIRecommendations, getSimilarTitles, getAISummary } from './providers/ai.js';

const app = express();
const PORT = process.env.PORT || 3001;
const REQUEST_TIMEOUT_MS = 40000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.setTimeout(REQUEST_TIMEOUT_MS, () => {
    if (!res.headersSent) {
      res.status(504).json({ error: 'Request timed out — try again' });
    }
  });
  next();
});

function handleApiError(res, err) {
  const msg = err.message || 'Server error';
  if (/rate.?limit|429|too many/i.test(msg)) {
    return res.status(429).json({ error: 'Too many requests — wait a moment and retry' });
  }
  if (/timed out/i.test(msg)) {
    return res.status(504).json({ error: msg });
  }
  return res.status(500).json({ error: msg });
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    name: 'NebulaStream API',
    version: '5.1',
    features: ['streaming', 'download', 'fallback', 'ai', 'cache', 'autoresolve', 'embed-preview'],
  });
});

app.get('/api/discover', async (req, res) => {
  try {
    const mode = req.query.mode || 'anime';
    const limit = parseInt(req.query.limit) || 12;
    let data;
    if (mode === 'manga') data = await getTrendingManga(limit);
    else if (mode === 'series') data = await getTrendingSeries(limit);
    else data = await getTrendingAnime(limit);
    const shuffled = data.sort(() => Math.random() - 0.5).slice(0, limit);
    res.json(shuffled);
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get('/api/sources', (req, res) => {
  const mode = req.query.mode || 'manga';
  const sources =
    mode === 'anime'
      ? ANIME_SOURCES
      : mode === 'series'
        ? SERIES_SOURCES
        : MANGA_SOURCES;
  res.json(sources);
});

app.get('/api/trending', async (req, res) => {
  try {
    const mode = req.query.mode || 'manga';
    const limit = parseInt(req.query.limit) || 20;
    let data;
    if (mode === 'anime') data = await getTrendingAnime(limit);
    else if (mode === 'series') data = await getTrendingSeries(limit);
    else data = await getTrendingManga(limit);
    res.json(data);
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const { q, mode = 'manga', source = 'all', limit = 24 } = req.query;
    if (!q?.trim()) return res.json([]);

    let data;
    if (mode === 'anime') data = await searchAnime(q, source, parseInt(limit));
    else if (mode === 'series') data = await searchSeries(q, source, parseInt(limit));
    else data = await searchManga(q, source, parseInt(limit));

    res.json(data);
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get('/api/manga/:source/:id', async (req, res) => {
  try {
    const title = req.query.title || '';
    const resolved = await resolveDetail('manga', req.params.source, req.params.id, title);
    if (resolved) return res.json(resolved);
    const data = await getMangaInfo(req.params.source, req.params.id);
    res.json(data);
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get('/api/manga/:source/:id/chapter', async (req, res) => {
  try {
    const chapterId = req.query.chapterId;
    if (!chapterId) return res.status(400).json({ error: 'chapterId required' });
    let data = await getMangaChapter(req.params.source, req.params.id, chapterId);
    const needsFallback = !data.pages?.length || data.needsFallback || data.externalUrl;
    if (needsFallback && req.query.title && req.query.chapter) {
      data = await resolveMangaChapter(
        req.query.title,
        req.query.chapter,
        [req.params.source]
      );
    }
    res.json(data);
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get('/api/anime/:source/:id', async (req, res) => {
  try {
    const title = req.query.title || '';
    const resolved = await resolveDetail('anime', req.params.source, req.params.id, title);
    if (resolved) return res.json(resolved);
    const data = await getAnimeInfo(req.params.source, req.params.id);
    res.json(data);
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get('/api/anime/:source/watch/:episodeId', async (req, res) => {
  try {
    const data = await getAnimeEpisode(req.params.source, req.params.episodeId, {
      title: req.query.title,
      episodeNum: req.query.ep,
      exclude: req.query.exclude?.split(',') || [],
    });
    res.json(data);
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get('/api/series/:source/:id', async (req, res) => {
  try {
    const title = req.query.title || '';
    const resolved = await resolveDetail('series', req.params.source, req.params.id, title);
    if (resolved) return res.json(resolved);
    const data = await getSeriesInfo(req.params.source, req.params.id);
    res.json(data);
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get('/api/series/:source/watch/:episodeId', async (req, res) => {
  try {
    const data = await getSeriesEpisode(req.params.source, req.params.episodeId, {
      title: req.query.title,
      episodeNum: req.query.ep,
      exclude: req.query.exclude?.split(',') || [],
    });
    res.json(data);
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get('/api/resolve/detail', async (req, res) => {
  try {
    const { mode = 'anime', source, id, title } = req.query;
    if (!source || !id) return res.status(400).json({ error: 'source and id required' });
    const data = await resolveDetail(mode, source, id, title || '');
    res.json(data || { error: 'Could not resolve' });
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get('/api/resolve/sources', async (req, res) => {
  try {
    const { title, mode = 'anime' } = req.query;
    if (!title) return res.status(400).json({ error: 'title required' });
    const sources = await findAlternateSources(mode, title);
    res.json(sources);
  } catch (err) {
    handleApiError(res, err);
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, mode, history, lastTitle } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });
    const response = await aiChat(message, { mode, history, lastTitle });
    res.json(response);
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get('/api/ai/recommend', async (req, res) => {
  try {
    const mode = req.query.mode || 'anime';
    const history = req.query.history ? JSON.parse(req.query.history) : [];
    const data = await getAIRecommendations(history, mode);
    res.json(data);
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get('/api/ai/similar/:id', async (req, res) => {
  try {
    const data = await getSimilarTitles(req.params.id);
    res.json(data);
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get('/api/ai/summary', async (req, res) => {
  try {
    const { title, mode = 'anime' } = req.query;
    if (!title) return res.status(400).json({ error: 'title required' });
    const data = await getAISummary(title, mode);
    res.json(data);
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get('/api/download/manga/:source/:id/chapter', async (req, res) => {
  try {
    const chapterId = req.query.chapterId;
    if (!chapterId) return res.status(400).json({ error: 'chapterId required' });
    await downloadMangaChapter(req.params.source, req.params.id, chapterId, res);
  } catch (err) {
    if (!res.headersSent) handleApiError(res, err);
  }
});

app.get('/api/proxy/image', async (req, res) => {
  try {
    const { url, referer } = req.query;
    if (!url) return res.status(400).json({ error: 'url required' });
    await proxyImage(decodeURIComponent(url), res, referer ? decodeURIComponent(referer) : '');
  } catch (err) {
    if (!res.headersSent) handleApiError(res, err);
  }
});

app.get('/api/proxy', async (req, res) => {
  try {
    const { url, download } = req.query;
    if (!url) return res.status(400).json({ error: 'url required' });
    await proxyStream(decodeURIComponent(url), res, download === '1');
  } catch (err) {
    if (!res.headersSent) handleApiError(res, err);
  }
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '..', 'client', 'dist');
import { existsSync } from 'fs';
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`NebulaStream API running on port ${PORT}`);
});
