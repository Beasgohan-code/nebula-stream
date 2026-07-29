import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ChevronLeft, ChevronRight, Maximize2, Minimize2, Download, RefreshCw
} from 'lucide-react'
import { fetchMangaChapter, getMangaDownloadUrl, getImageProxyUrl } from '../services/api'
import { useToast } from '../components/Toast'
import { useApp } from '../context/AppContext'
import EmbedViewer from '../components/EmbedViewer'

export default function ReaderPage() {
  const { source, mangaId } = useParams<{
    source: string; mangaId: string
  }>()
  const [searchParams] = useSearchParams()
  const chapterId = searchParams.get('chapterId') || ''
  const navigate = useNavigate()
  const { toast } = useToast()
  const { updateProgress, addHistory } = useApp()
  const [pages, setPages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [fit, setFit] = useState<'width' | 'height'>('width')
  const [showControls, setShowControls] = useState(true)
  const [scrollProgress, setScrollProgress] = useState(0)

  const title = searchParams.get('title') || ''
  const chapter = searchParams.get('chapter') || ''
  const prevChapter = searchParams.get('prev')
  const nextChapter = searchParams.get('next')
  const embedUrlParam = searchParams.get('embedUrl') || ''
  const [embedUrl, setEmbedUrl] = useState(embedUrlParam)
  const [useEmbed, setUseEmbed] = useState(false)

  const goChapter = (id: string, swap: 'prev' | 'next') => {
    const params = new URLSearchParams(searchParams)
    params.set('chapterId', id)
    if (swap === 'next') {
      params.set('prev', chapterId)
      params.delete('next')
    } else {
      params.set('next', chapterId)
      params.delete('prev')
    }
    navigate(`/read/${source}/${mangaId}?${params}`)
  }

  const saveReadingProgress = (pct: number) => {
    if (!mangaId || !source || !title) return
    updateProgress(mangaId, source, {
      progress: `${Math.round(pct)}%`,
      chapterNum: chapter || undefined,
      title,
      mode: 'manga',
      visitedAt: Date.now(),
    })
  }

  useEffect(() => {
    if (!source || !mangaId || !chapterId) return
    if (title) {
      addHistory({
        id: mangaId,
        title,
        source,
        mode: 'manga',
        chapterNum: chapter || undefined,
        visitedAt: Date.now(),
      })
    }
    setLoading(true)

    fetchMangaChapter(source, mangaId, chapterId, {
      title: title || undefined,
      chapter: chapter || undefined,
    })
      .then((data) => {
        if (data.error) throw new Error(data.error)
        if (data.externalUrl) {
          setEmbedUrl(data.externalUrl)
          setUseEmbed(true)
          return
        }
        if (!data.pages?.length) {
          throw new Error('No pages found — try external preview or another source')
        }
        if (data.fallbackUsed) toast(`Loaded from ${data.provider} (in-app)`, 'success')
        const proxied = (data.pages || []).map((p: string) =>
          getImageProxyUrl(p, source === 'comick' ? 'https://comick.io' : undefined)
        )
        setPages(proxied)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [source, mangaId, chapterId, title, chapter, toast])

  useEffect(() => {
    let lastSave = 0
    const onScroll = () => {
      const doc = document.documentElement
      const pct = (window.scrollY / (doc.scrollHeight - doc.clientHeight)) * 100
      const clamped = Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0
      setScrollProgress(clamped)
      const now = Date.now()
      if (now - lastSave > 3000) {
        lastSave = now
        saveReadingProgress(clamped)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [mangaId, source, title, chapter])

  const nextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, pages.length - 1))
  }, [pages.length])

  const prevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 0))
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextPage()
      if (e.key === 'ArrowLeft') prevPage()
      if (e.key === 'Escape') navigate(-1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [nextPage, prevPage, navigate])

  if (useEmbed && embedUrl) {
    return (
      <EmbedViewer
        url={embedUrl}
        title={title}
        subtitle={chapter ? `Chapter ${chapter}` : undefined}
        onBack={() => navigate(-1)}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          className="text-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="logo-text text-2xl mb-2">Loading Chapter...</div>
          <div className="w-48 h-1 bg-purple-900 rounded-full overflow-hidden mx-auto">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-500 to-cyan-400"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: '50%' }}
            />
          </div>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="glow-text-pink mb-4">{error}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button className="action-btn primary" onClick={() => {
            setError('')
            setLoading(true)
            fetchMangaChapter(source!, mangaId!, chapterId!, {
              title: title || undefined,
              chapter: chapter || undefined,
            })
              .then((data) => {
                if (data.externalUrl) {
                  setEmbedUrl(data.externalUrl)
                  setUseEmbed(true)
                  setError('')
                  return
                }
                if (data.pages?.length) {
                  const proxied = data.pages.map((p: string) =>
                    getImageProxyUrl(p, source === 'comick' ? 'https://comick.io' : undefined)
                  )
                  setPages(proxied)
                  setError('')
                } else throw new Error('Still no pages')
              })
              .catch((e) => setError(e.message))
              .finally(() => setLoading(false))
          }}>
            <RefreshCw size={16} /> Retry Sources
          </button>
          {embedUrl && (
            <button className="action-btn primary" onClick={() => setUseEmbed(true)}>
              Preview Externally
            </button>
          )}
          <button className="action-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-black"
      onClick={() => setShowControls((s) => !s)}
    >
      <AnimatePresence>
        {showControls && (
          <motion.div
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)' }}
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
          >
            <button className="action-btn" onClick={(e) => { e.stopPropagation(); navigate(-1) }}>
              <ArrowLeft size={16} /> Back
            </button>
            <span className="text-sm font-semibold glow-text-cyan">
              {title && <span className="block truncate max-w-[140px] sm:max-w-none">{title}</span>}
              Page {currentPage + 1} / {pages.length}
            </span>
            <div className="flex gap-2">
              <a
                href={getMangaDownloadUrl(source!, mangaId!, chapterId!)}
                className="action-btn primary py-2 px-3"
                onClick={(e) => e.stopPropagation()}
                download
              >
                <Download size={16} /> ZIP
              </a>
              <button className="action-btn p-2" onClick={(e) => { e.stopPropagation(); setFit(f => f === 'width' ? 'height' : 'width') }}>
                {fit === 'width' ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vertical scroll mode - all pages */}
      <div className="pt-16 pb-20">
        {pages.map((page, i) => (
          <motion.img
            key={i}
            src={page}
            alt={`Page ${i + 1}`}
            className="reader-page mb-1"
            style={{
              objectFit: fit === 'width' ? 'contain' : 'cover',
              maxHeight: fit === 'height' ? '100vh' : undefined,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            loading="lazy"
          />
        ))}
      </div>

      {/* Bottom nav */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center gap-3 p-4"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
          >
            <div className="w-full max-w-md h-1 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-pink-500 to-cyan-400"
                animate={{ width: `${scrollProgress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <div className="flex items-center justify-center gap-4 w-full">
              <motion.button
                className="action-btn"
                disabled={!prevChapter}
                onClick={(e) => { e.stopPropagation(); if (prevChapter) goChapter(prevChapter, 'prev') }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft size={20} /> Ch
              </motion.button>
              <button className="action-btn" onClick={(e) => { e.stopPropagation(); prevPage() }}>
                <ChevronLeft size={20} />
              </button>
              <div className="w-24 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-cyan-400 transition-all"
                  style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
                />
              </div>
              <button className="action-btn" onClick={(e) => { e.stopPropagation(); nextPage() }}>
                <ChevronRight size={20} />
              </button>
              <motion.button
                className="action-btn primary"
                disabled={!nextChapter}
                onClick={(e) => { e.stopPropagation(); if (nextChapter) goChapter(nextChapter, 'next') }}
                whileTap={{ scale: 0.9 }}
              >
                Ch <ChevronRight size={20} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
