import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ModeSwitcher from '../components/ModeSwitcher'
import SourceFilters from '../components/SourceFilters'
import MediaGrid from '../components/MediaGrid'
import { searchContent, fetchTrending } from '../services/api'

const MODE_LABELS = { manga: 'Manga', anime: 'Anime', series: 'Web Series' }
const SOURCE_COUNTS = { manga: '35+', anime: '28+', series: '20+' }

export default function HomePage() {
  const { mode, source } = useApp()
  const [query, setQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState([])
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(false)
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    setTrendingLoading(true)
    fetchTrending(mode).then(setTrending).catch(() => setTrending([])).finally(() => setTrendingLoading(false))
    setSearched(false)
    setSearchQuery('')
    setQuery('')
    setResults([])
  }, [mode])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    setSearched(true)
    setSearchQuery(q)
    try {
      const data = await searchContent(mode, q, source)
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [mode, source])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(query)
  }

  return (
    <div className="fade-in">
      {/* Hero Header */}
      <motion.div
        className="pt-6 pb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{ background: 'var(--neon-pink)', boxShadow: 'var(--glow-pink)' }}
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <h1 className="logo-text">NebulaStream</h1>
          </div>
          <motion.span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: 'var(--neon-cyan)' }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {SOURCE_COUNTS[mode]} sources
          </motion.span>
        </div>
        <p className="text-sm opacity-40 mb-5 pl-6">
          {MODE_LABELS[mode]} · Search across multiple platforms
        </p>

        <ModeSwitcher />
      </motion.div>

      {/* Search */}
      <motion.form
        onSubmit={handleSubmit}
        className="flex gap-3 mb-4 mt-5"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40"
          />
          <input
            className="search-input w-full"
            placeholder={`Search ${MODE_LABELS[mode].toLowerCase()}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <motion.button
          type="submit"
          className="go-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Go
        </motion.button>
      </motion.form>

      {/* Quick search buttons */}
      <div className="flex gap-2 flex-wrap mb-5">
        {['One Piece', 'Naruto', 'Attack on Titan', 'Demon Slayer', 'Jujutsu Kaisen'].map((tag) => (
          <button
            key={tag}
            className="source-chip text-xs"
            onClick={() => { setQuery(tag); doSearch(tag) }}
          >
            {tag}
          </button>
        ))}
      </div>

      <SourceFilters />

      {/* Results or Trending */}
      <div className="mt-6">
        {searched ? (
          <>
            <div className="section-title">
              <Sparkles size={14} className="glow-text-cyan" />
              Results for "{searchQuery}"
            </div>
            <MediaGrid items={results} loading={loading} />
          </>
        ) : (
          <>
            <div className="section-title">
              <Sparkles size={14} className="glow-text-pink" />
              Trending {MODE_LABELS[mode]}
            </div>
            <MediaGrid items={trending} loading={trendingLoading} />
          </>
        )}
      </div>
    </div>
  )
}
