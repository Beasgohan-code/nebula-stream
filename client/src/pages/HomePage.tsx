import { useState, useEffect, useCallback } from 'react'
import { Search, Sparkles, Shuffle, Clock, History } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import ModeSwitcher from '../components/ModeSwitcher'
import SourceFilters from '../components/SourceFilters'
import MediaGrid from '../components/MediaGrid'
import HeroCarousel from '../components/HeroCarousel'
import GenreBrowse from '../components/GenreBrowse'
import SurpriseMe from '../components/SurpriseMe'
import { searchContent, fetchTrending, fetchDiscover } from '../services/api'

const MODE_LABELS = { manga: 'Manga', anime: 'Anime', series: 'Web Series' }
const SOURCE_COUNTS = { manga: '40+', anime: '35+', series: '25+' }

export default function HomePage() {
  const { mode, source, history, recentSearches, addRecentSearch } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState([])
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(false)
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [discoverLoading, setDiscoverLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const continueItems = history.filter((h) => h.mode === mode).slice(0, 6)

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
    addRecentSearch(q)
    try {
      const data = await searchContent(mode, q, source)
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [mode, source, addRecentSearch])

  const handleDiscover = async () => {
    setDiscoverLoading(true)
    setSearched(true)
    setSearchQuery('Discover')
    try {
      const data = await fetchDiscover(mode, 18)
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setDiscoverLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(query)
  }

  const quickTags = mode === 'manga'
    ? ['One Piece', 'Chainsaw Man', 'Jujutsu Kaisen', 'Solo Leveling', 'Blue Lock']
    : mode === 'anime'
      ? ['Naruto', 'Attack on Titan', 'Demon Slayer', 'Frieren', 'One Piece']
      : ['Squid Game', 'Breaking Bad', 'Stranger Things', 'The Boys', 'Wednesday']

  return (
    <div>
      <div className="pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full pulse-dot"
            style={{ background: 'var(--neon-pink)', boxShadow: 'var(--glow-pink)' }}
          />
          <h1 className="logo-text">NebulaStream</h1>
        </div>
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--neon-cyan)' }}>
          {SOURCE_COUNTS[mode]} sources
        </span>
      </div>
        <p className="text-sm opacity-40 mb-5 pl-6">
          {MODE_LABELS[mode]} · Stream, read & download
        </p>
        <ModeSwitcher />
        {!searched && (
          <div className="mt-4">
            <SurpriseMe items={trending} mode={mode} loading={trendingLoading} />
          </div>
        )}
      </div>

      {!searched && (
        <HeroCarousel items={trending.slice(0, 8)} mode={mode} loading={trendingLoading} />
      )}

      <form
        onSubmit={handleSubmit}
        className="flex gap-3 mb-3 mt-5"
      >
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            className="search-input w-full"
            placeholder={`Search ${MODE_LABELS[mode].toLowerCase()}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="go-btn">Go</button>
        <button
          type="button"
          className="action-btn px-4"
          onClick={handleDiscover}
          disabled={discoverLoading}
          title="Random discover"
        >
          <Shuffle size={18} className={discoverLoading ? 'animate-spin' : ''} />
        </button>
      </form>

      <div className="flex gap-2 flex-wrap mb-4">
        {quickTags.map((tag) => (
          <button key={tag} className="source-chip text-xs" onClick={() => { setQuery(tag); doSearch(tag) }}>
            {tag}
          </button>
        ))}
      </div>

      {recentSearches.length > 0 && !searched && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2 text-xs opacity-50">
            <History size={12} /> Recent
          </div>
          <div className="flex gap-2 flex-wrap">
            {recentSearches.slice(0, 5).map((s) => (
              <button key={s} className="source-chip text-xs opacity-70" onClick={() => { setQuery(s); doSearch(s) }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <SourceFilters />

      {!searched && <GenreBrowse onSelect={(g) => { setQuery(g); doSearch(g) }} />}

      {!searched && continueItems.length > 0 && (
        <div className="mt-6">
          <div className="section-title">
            <Clock size={14} className="glow-text-cyan" />
            Continue {MODE_LABELS[mode]}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {continueItems.map((item) => (
              <div
                key={`${item.source}-${item.id}`}
                className="flex-shrink-0 w-28 cursor-pointer continue-card"
                onClick={() => navigate(`/${item.mode}/${item.source}/${item.id}`)}
              >
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-28 h-36 object-cover rounded-xl border border-purple-500/20" />
                ) : (
                  <div className="w-28 h-36 shimmer rounded-xl" />
                )}
                <p className="text-xs font-semibold mt-2 truncate">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        {searched ? (
          <div>
            <div className="section-title">
              <Sparkles size={14} className="glow-text-cyan" />
              {searchQuery === 'Discover' ? 'Discover' : `Results for "${searchQuery}"`}
            </div>
            <MediaGrid items={results} loading={loading || discoverLoading} />
          </div>
        ) : (
          <div>
            <div className="section-title">
              <Sparkles size={14} className="glow-text-pink" />
              Trending {MODE_LABELS[mode]}
            </div>
            <MediaGrid items={trending} loading={trendingLoading} />
          </div>
        )}
      </div>
    </div>
  )
}
