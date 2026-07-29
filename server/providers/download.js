import axios from 'axios';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const archiver = require('archiver');
import { getMangaChapter } from './manga.js';

export async function downloadMangaChapter(source, mangaId, chapterId, res) {
  const data = await getMangaChapter(source, mangaId, chapterId);
  if (data.externalUrl) {
    return res.redirect(data.externalUrl);
  }
  if (!data.pages?.length) {
    return res.status(404).json({ error: 'No pages to download' });
  }

  const filename = `chapter-${chapterId.slice(0, 8)}.zip`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const archive = archiver('zip', { zlib: { level: 5 } });
  archive.pipe(res);

  for (let i = 0; i < data.pages.length; i++) {
    try {
      const response = await axios.get(data.pages[i], {
        responseType: 'arraybuffer',
        timeout: 20000,
        headers: { Referer: 'https://mangadex.org/' },
      });
      const ext = data.pages[i].includes('.png') ? 'png' : 'jpg';
      archive.append(Buffer.from(response.data), { name: `page-${String(i + 1).padStart(3, '0')}.${ext}` });
    } catch {
      // skip failed pages
    }
  }

  await archive.finalize();
}

export async function proxyStream(url, res, download = false) {
  const response = await axios.get(url, {
    responseType: 'stream',
    timeout: 30000,
    headers: {
      Referer: 'https://hianime.to/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  const contentType = response.headers['content-type'] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  if (download) {
    res.setHeader('Content-Disposition', 'attachment; filename="episode.mp4"');
  }
  response.data.pipe(res);
}
