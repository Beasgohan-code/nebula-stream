import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Bookmark, BookmarkCheck, Play, BookOpen,
  Star, Tag, ChevronRight
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  fetchMangaInfo, fetchAnimeInfo, fetchSeriesInfo
} from '../services/api'

export default function DetailPage() {
  const { mode, source, id } = useParams<{ mode: string; source: string; id: string }>()
  const navigate = useNavigate()
  const { isBookmarked, addBookmark, removeBookmark, addHistory } = useApp()
  const [info, setInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!mode || !source || !id) return
    setLoading(true)
    setError('')

    const fetcher =
      mode === 'manga' ? fetchMangaInfo :
      mode === 'anime' ? fetchAnimeInfo :
      fetchSeriesInfo

    fetcher(source, id)
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setInfo(data)
        addHistory({
          id, title: data.title, image: data.image,
          source, mode: mode as any, visitedAt: Date.now(),
        })
      })
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [mode, source, id, addHistory])

  const bookmarked = id && source ? isBookmarked(id, source) : false

  const toggleBookmark = () => {
    if (!info || !id || !source || !mode) return
    if (bookmarked) removeBookmark(id, source)
    else addBookmark({ id, title: info.title, image: info.image, source, mode: mode as any, addedAt: Date.now() })
  }

  if (loading) {
    return (
      <div className="fade-in pt-4">
        <div className="glass-card shimmer" style={{ height: 300, marginBottom: 20 }} />
        <div className="glass-card shimmer" style={{ height: 200 }} />
      </div>
    )
  }

  if (error || !info) {
    return (
      <div className="text-center py-20 fade-in">
        <p className="glow-text-pink text-lg mb-4">{error || 'Not found'}</p>
        <button className="action-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    )
  }

  const chapters = info.chapters || []
  const episodes = info.episodes || []
  const list = chapters.length ? chapters : (Array.isArray(episodes) ? episodes : [])

  return (
    <motion.div
      className="fade-in pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <button
        className="action-btn mb-5"
        onClick={() => navigate('/')}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Hero */}
      <div className="glass-card overflow-hidden mb-6">
        <div className="flex flex-col md:flex-row gap-6 p-5">
          <div className="flex-shrink-0 mx-auto md:mx-0">
            {info.image ? (
              <motion.img
                src={info.image}
                alt={info.title}
                className="w-40 md:w-48 rounded-xl object-cover"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              />
            ) : (
              <div className="w-40 h-60 shimmer rounded-xl" />
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 glow-text-cyan" style={{ fontFamily: 'Orbitron' }}>
              {info.title}
            </h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="source-chip active text-xs">{info.sourceName || source}</span>
              {info.status && <span className="source-chip text-xs">{info.status}</span>}
              {info.score && (
                <span className="source-chip text-xs flex items-center gap-1">
                  <Star size={12} className="text-yellow-400" /> {info.score}
                </span>
              )}
            </div>

            {info.description && (
              <p className="text-sm opacity-70 leading-relaxed mb-4 line-clamp-4">
                {info.description.replace(/<[^>]*>/g, '')}
              </p>
            )}

            {info.genres && (
              <div className="flex flex-wrap gap-2 mb-4">
                {info.genres.slice(0, 6).map((g: string) => (
                  <span key={g} className="text-xs px-2 py-1 rounded-full border border-purple-500/30 opacity-60 flex items-center gap-1">
                    <Tag size={10} /> {g}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              <button className="action-btn primary" onClick={toggleBookmark}>
                {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                {bookmarked ? 'Saved' : 'Save'}
              </button>
              {list.length > 0 && (
                <button
                  className="action-btn"
                  onClick={() => {
                    const first = list[0]
                    if (mode === 'manga') {
                      navigate(`/read/${source}/${id}/${first.id}`)
                    } else {
                      navigate(`/watch/${mode}/${source}/${first.id}`)
                    }
                  }}
                >
                  {mode === 'manga' ? <BookOpen size={16} /> : <Play size={16} />}
                  {mode === 'manga' ? 'Start Reading' : 'Start Watching'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chapter/Episode list */}
      {list.length > 0 && (
        <div>
          <div className="section-title">
            {mode === 'manga' ? 'Chapters' : 'Episodes'}
            <span className="text-xs opacity-50 ml-2">({list.length})</span>
          </div>
          <div className="glass-card divide-y divide-purple-900/30 max-h-96 overflow-y-auto">
            {(mode === 'manga' ? [...list].reverse() : list).map((item: any, i: number) => (
              <motion.div
                key={item.id || i}
                className="ep-item"
                onClick={() => {
                  if (mode === 'manga') {
                    navigate(`/read/${source}/${id}/${item.id}`)
                  } else {
                    navigate(`/watch/${mode}/${source}/${item.id}`)
                  }
                }}
                whileHover={{ x: 4 }}
              >
                <div className="w-8 h-8 rounded-lg bg-purple-900/40 flex items-center justify-center text-xs font-bold text-cyan-400">
                  {item.number || i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{item.title}</div>
                  {item.isFiller && <span className="text-xs text-orange-400">Filler</span>}
                </div>
                <ChevronRight size={16} className="opacity-30" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {info.streamable === false && (
        <div className="glass-card p-4 mt-4 text-center text-sm opacity-60">
          Metadata from MyAnimeList. Select a streamable source from search for playback.
        </div>
      )}
    </motion.div>
  )
}
