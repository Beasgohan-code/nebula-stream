import axios from 'axios';
import JSZip from 'jszip';
import { getMangaChapter } from './manga.js';

export async function downloadMangaChapter(source, mangaId, chapterId, res) {
  const data = await getMangaChapter(source, mangaId, chapterId);
  if (!data.pages?.length) {
    return res.status(404).json({ error: 'No pages to download — try reading in app first' });
  }

  const zip = new JSZip();
  const folder = zip.folder(`chapter-${chapterId.slice(0, 8)}`);

  for (let i = 0; i < data.pages.length; i++) {
    try {
      const response = await axios.get(data.pages[i], {
        responseType: 'arraybuffer',
        timeout: 20000,
        headers: { Referer: 'https://mangadex.org/' },
      });
      const ext = data.pages[i].includes('.png') ? 'png' : 'jpg';
      folder.file(`page-${String(i + 1).padStart(3, '0')}.${ext}`, response.data);
    } catch {
      // skip failed pages
    }
  }

  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const filename = `chapter-${chapterId.slice(0, 8)}.zip`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
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

export async function proxyImage(url, res, referer = '') {
  const response = await axios.get(url, {
    responseType: 'stream',
    timeout: 20000,
    headers: {
      Referer: referer || new URL(url).origin,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'image/*,*/*',
    },
  });

  res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  response.data.pipe(res);
}
