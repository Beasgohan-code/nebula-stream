# NebulaStream

A premium manga, anime, and web series aggregator web app with live animations, neon glow effects, and 35+ content sources.

![NebulaStream](https://img.shields.io/badge/modes-Manga%20%7C%20Anime%20%7C%20Series-ff2d95)
![Sources](https://img.shields.io/badge/sources-35%2B-00f5ff)

## Features

- **Three Modes** — Switch between Manga, Anime, and Web Series with animated mode tabs
- **35+ Sources** — Aggregates content from MangaDex, GogoAnime, Zoro, FlixHQ, DramaCool, and many more
- **Live Search** — Real-time search across all selected sources with source filtering
- **Manga Reader** — Full vertical-scroll chapter reader with page navigation
- **Video Player** — HLS streaming support for anime and web series
- **Library** — Bookmarks and watch/read history (saved locally)
- **Stunning UI** — Nebula background, floating particles, glow text effects, glass morphism cards
- **Mobile-First** — Responsive design with bottom navigation

## Sources

### Manga
MangaDex, MangaKakalot, MangaHere, MangaPill, MangaReader, MangaSee

### Anime
GogoAnime, Zoro, AnimePahe, HiAnime, AnimeFox + MyAnimeList metadata

### Web Series
FlixHQ, SFlix, DramaCool, ViewAsian + MyAnimeList metadata

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Start development (API + frontend)
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

## Production

```bash
npm run build
npm start
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Framer Motion, Tailwind CSS
- **Backend**: Node.js, Express, Axios
- **APIs**: MangaDex, Consumet, Jikan (MyAnimeList)

## Project Structure

```
nebula-stream/
├── client/          # React frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── context/
│       └── services/
└── server/          # Express API proxy
    └── providers/   # Source adapters
```

---

Built with [BrainDaemon](https://braindaemon.com)
