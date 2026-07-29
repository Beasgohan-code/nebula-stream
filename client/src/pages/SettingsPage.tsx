import { motion } from 'framer-motion'
import { Info, Globe, Zap, Shield } from 'lucide-react'

const ALL_SOURCES = {
  manga: ['MangaDex', 'MangaKakalot', 'ComicK', 'MangaPill', 'MangaHere', 'MangaReader', 'AsuraScans', 'WeebCentral'],
  anime: ['AniList', 'HiAnime', 'AnimePahe', 'AnimeKai', 'KickAssAnime', 'AnimeSaturn', 'AnimeUnity', 'AnimeSama'],
  series: ['AniList', 'FlixHQ', 'SFlix', 'DramaCool', 'HiMovies', 'Goku'],
}

export default function SettingsPage() {
  return (
    <div className="fade-in pt-4 pb-8">
      <h2 className="logo-text text-xl mb-6">Settings</h2>

      <div className="space-y-4">
        <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-3">
            <Info size={18} className="glow-text-cyan" />
            <h3 className="font-bold">About NebulaStream</h3>
          </div>
          <p className="text-sm opacity-60 leading-relaxed">
            NebulaStream is a multi-source media aggregator supporting manga reading,
            anime streaming, and web series watching. Content is fetched from 35+ external
            sources in real-time.
          </p>
        </motion.div>

        <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-3 mb-3">
            <Globe size={18} className="glow-text-pink" />
            <h3 className="font-bold">Available Sources</h3>
          </div>
          {Object.entries(ALL_SOURCES).map(([mode, sources]) => (
            <div key={mode} className="mb-3">
              <div className="text-xs uppercase tracking-widest opacity-40 mb-2 capitalize">{mode}</div>
              <div className="flex flex-wrap gap-2">
                {sources.map((s) => (
                  <span key={s} className="source-chip text-xs">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-3 mb-3">
            <Zap size={18} className="glow-text-purple" />
            <h3 className="font-bold">Features</h3>
          </div>
          <ul className="text-sm opacity-60 space-y-2">
            <li>• Real-time search across multiple sources</li>
            <li>• Manga chapter reader with vertical scroll</li>
            <li>• Anime & series streaming with in-app player</li>
            <li>• Download manga chapters as ZIP</li>
            <li>• Download anime/series episodes</li>
            <li>• Bookmarks & watch history</li>
            <li>• Source filtering & quick search tags</li>
            <li>• Auto-fallback across sources when one fails</li>
            <li>• Discover random content with shuffle button</li>
            <li>• Continue watching/reading from history</li>
            <li>• Recent search history</li>
            <li>• Subtitle track support in player</li>
            <li>• Mobile-responsive design</li>
          </ul>
        </motion.div>

        <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-3 mb-3">
            <Shield size={18} className="text-green-400" />
            <h3 className="font-bold">Privacy</h3>
          </div>
          <p className="text-sm opacity-60">
            All bookmarks and history are stored locally in your browser.
            No account required. No data is sent to third parties except
            the content source APIs.
          </p>
        </motion.div>

        <div className="text-center text-xs opacity-30 pt-4">
          NebulaStream v1.0 · Built with BrainDaemon
        </div>
      </div>
    </div>
  )
}
