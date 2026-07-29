import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Bookmark, BookmarkCheck, Play, BookOpen,
  Star, Tag, ChevronRight, RefreshCw, Sparkles, Layers, ListPlus, Share2
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../components/Toast'
import { listItem } from '../components/PageTransition'
import {
  fetchMangaInfo, fetchAnimeInfo, fetchSeriesInfo,
  fetchAlternateSources, fetchSimilar, fetchAISummary
} from '../services/api'

export default function DetailPage() {
  const { mode, source, id } = useParams<{ mode: string; source: string; id: string }>()
  const navigate = useNavigate()
  const { isBookmarked, addBookmark, removeBookmark, addHistory, addToQueue } = useApp()
  const { toast } = useToast()
  const [info, setInfo] = useState<any>(null)
  const [alternates, setAlternates] = useState<any[]>([])
  const [similar, setSimilar] = useState<any[]>([])
  const [aiSummary, setAiSummary] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingAlts, setLoadingAlts] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!mode || !source || !id) return
    setLoading(true)
    setError('')
    setAlternates([])
    setSimilar([])
    setAiSummary('')

    const fetcher =
      mode === 'manga' ? fetchMangaInfo :
      mode === 'anime' ? fetchAnimeInfo :
      fetchSeriesInfo

    fetcher(source, id)
      .then(async (data) => {
        if (data.error) throw new Error(data.error)
        setInfo(data)
        addHistory({
          id, title: data.title, image: data.image,
          source, mode: mode as any, visitedAt: Date.now(),
        })

        if (source === 'anilist' && id) {
          setTimeout(() => {
            fetchSimilar(id).then(setSimilar).catch(() => {})
          }, 600)
        }

        const desc = data.description?.replace(/<[^>]*>/g, '').trim()
        if (!desc && data.title) {
          setTimeout(() => {
            fetchAISummary(data.title, mode).then((s) => setAiSummary(s.summary)).catch(() => {})
          }, 1200)
        }
      })
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [mode, source, id])

  const findStreams = async () => {
    if (!info?.title) return
    setLoadingAlts(true)
    try {
      const alts = await fetchAlternateSources(info.title, mode || 'anime')
      setAlternates(alts)
      if (alts.length) toast(`Found ${alts.length} streaming sources!`, 'success')
      else toast('No streams found — try again later', 'error')
    } catch {
      toast('Could not find alternate sources', 'error')
    } finally {
      setLoadingAlts(false)
    }
  }

  const bookmarked = id && source ? isBookmarked(id, source) : false

  const toggleBookmark = () => {
    if (!info || !id || !source || !mode) return
    if (bookmarked) removeBookmark(id, source)
    else addBookmark({ id, title: info.title, image: info.image, source, mode: mode as any, addedAt: Date.now() })
    toast(bookmarked ? 'Removed from library' : 'Saved to library', 'success')
  }

  const addQueue = () => {
    if (!info || !id || !source || !mode) return
    addToQueue({ id, title: info.title, image: info.image, source, mode: mode as any, addedAt: Date.now() })
    toast('Added to watch queue', 'success')
  }

  const shareTitle = async () => {
    const text = `Check out ${info?.title} on NebulaStream!`
    if (navigator.share) {
      await navigator.share({ title: info?.title, text })
    } else {
      await navigator.clipboard.writeText(text)
      toast('Link copied!', 'success')
    }
  }

  const playEpisode = (item: any, epSource: string, epId: string, index: number, orderedList: any[]) => {
    const prev = orderedList[index - 1]
    const next = orderedList[index + 1]
    const navParams = new URLSearchParams({
      title: info.title,
      ...(mode === 'manga'
        ? { chapter: String(item.number || item.id) }
        : { ep: String(item.number || item.id) }),
    })
    if (prev) navParams.set('prev', prev.id)
    if (next) navParams.set('next', next.id)
    if (mode === 'manga') {
      if (item.externalUrl) window.open(item.externalUrl, '_blank')
      else navigate(`/read/${epSource}/${id}/${item.id}?${navParams}`)
    } else if (item.url) {
      window.open(item.url, '_blank')
    } else {
      navigate(`/watch/${mode}/${epSource}/${epId}?${navParams}`)
    }
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
  const orderedList = mode === 'manga' ? [...list].reverse() : list
  const epSource = source || alternates[0]?.source || 'hianime'

  return (
    <motion.div className="fade-in pb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <button className="action-btn mb-5" onClick={() => navigate('/')}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="glass-card overflow-hidden mb-6">
        <div className="flex flex-col md:flex-row gap-6 p-5">
          <div className="flex-shrink-0 mx-auto md:mx-0">
            {info.image ? (
              <motion.img src={info.image} alt={info.title}
                className="w-40 md:w-48 rounded-xl object-cover"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} />
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

            {aiSummary && (
              <div className="glass-card p-3 mb-4 text-sm opacity-80 leading-relaxed">
                <div className="flex items-center gap-2 mb-2 text-xs glow-text-purple">
                  <Sparkles size={12} /> AI Summary
                </div>
                {aiSummary.split('**').map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
              </div>
            )}

            {!aiSummary && info.description && (
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
              <button className="action-btn" onClick={addQueue}>
                <ListPlus size={16} /> Queue
              </button>
              <button className="action-btn" onClick={shareTitle}>
                <Share2 size={16} /> Share
              </button>
              {list.length > 0 && (
                <button className="action-btn" onClick={() => playEpisode(orderedList[0], epSource, orderedList[0].id, 0, orderedList)}>
                  {mode === 'manga' ? <BookOpen size={16} /> : <Play size={16} />}
                  {mode === 'manga' ? 'Start Reading' : 'Start Watching'}
                </button>
              )}
              {mode !== 'manga' && (
                <button className="action-btn" onClick={findStreams} disabled={loadingAlts}>
                  <RefreshCw size={16} className={loadingAlts ? 'animate-spin' : ''} />
                  Find Streams
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {alternates.length > 0 && (
        <div className="mb-6">
          <div className="section-title">
            <Layers size={14} className="glow-text-cyan" />
            Available Streams ({alternates.length})
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {alternates.map((alt) => (
              <motion.div key={alt.source}
                className="glass-card p-3 flex-shrink-0 cursor-pointer min-w-[140px]"
                onClick={() => navigate(`/${mode}/${alt.source}/${alt.id}`)}
                whileHover={{ scale: 1.05 }}>
                <p className="text-sm font-bold">{alt.sourceName}</p>
                <p className="text-xs opacity-50 mt-1">Tap to open</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {list.length > 0 && (
        <div className="mb-6">
          <div className="section-title">
            {mode === 'manga' ? 'Chapters' : 'Episodes'}
            <span className="text-xs opacity-50 ml-2">({list.length})</span>
          </div>
          <div className="glass-card divide-y divide-purple-900/30 max-h-96 overflow-y-auto">
            {orderedList.map((item: any, i: number) => (
              <motion.div
                key={item.id || i}
                className="ep-item"
                onClick={() => playEpisode(item, epSource, item.id, i, orderedList)}
                variants={listItem}
                initial="initial"
                animate="animate"
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                whileHover={{ x: 6, backgroundColor: 'rgba(0,245,255,0.05)' }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="w-8 h-8 rounded-lg bg-purple-900/40 flex items-center justify-center text-xs font-bold text-cyan-400">
                  {item.number || i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{item.title}</div>
                  {item.externalUrl && <span className="text-xs text-cyan-400">External ↗</span>}
                  {item.readable === false && <span className="text-xs text-orange-400">External</span>}
                  {item.isFiller && <span className="text-xs text-orange-400">Filler</span>}
                </div>
                <ChevronRight size={16} className="opacity-30" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {similar.length > 0 && (
        <div>
          <div className="section-title">
            <Sparkles size={14} className="glow-text-pink" />
            Similar Titles
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {similar.map((s) => (
              <motion.div key={s.id} className="glass-card p-2 cursor-pointer"
                onClick={() => navigate(`/${s.mode || mode}/${s.source}/${s.id}`)}
                whileHover={{ scale: 1.03 }}>
                {s.image && <img src={s.image} alt={s.title} className="w-full h-28 object-cover rounded-lg mb-2" />}
                <p className="text-xs font-semibold truncate">{s.title}</p>
                {s.score && <p className="text-xs text-yellow-400">★ {s.score}</p>}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {info.streamable === false && info.streamingLinks?.length > 0 && (
        <div className="glass-card p-4 mt-4">
          <div className="section-title mb-3">Watch On</div>
          <div className="flex flex-wrap gap-2">
            {info.streamingLinks.map((link: any) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="action-btn primary">
                {link.site} ↗
              </a>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
