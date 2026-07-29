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
import { downloadMangaChapter, proxyStream } from './providers/download.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', name: 'NebulaStream API' });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/manga/:source/:id', async (req, res) => {
  try {
    const data = await getMangaInfo(req.params.source, req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/manga/:source/:id/chapter/:chapterId', async (req, res) => {
  try {
    const data = await getMangaChapter(
      req.params.source,
      req.params.id,
      req.params.chapterId
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/anime/:source/:id', async (req, res) => {
  try {
    const data = await getAnimeInfo(req.params.source, req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/anime/:source/watch/:episodeId', async (req, res) => {
  try {
    const data = await getAnimeEpisode(req.params.source, req.params.episodeId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/series/:source/:id', async (req, res) => {
  try {
    const data = await getSeriesInfo(req.params.source, req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/series/:source/watch/:episodeId', async (req, res) => {
  try {
    const data = await getSeriesEpisode(req.params.source, req.params.episodeId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/download/manga/:source/:id/chapter/:chapterId', async (req, res) => {
  try {
    await downloadMangaChapter(
      req.params.source,
      req.params.id,
      req.params.chapterId,
      res
    );
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

app.get('/api/proxy', async (req, res) => {
  try {
    const { url, download } = req.query;
    if (!url) return res.status(400).json({ error: 'url required' });
    await proxyStream(decodeURIComponent(url), res, download === '1');
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
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
