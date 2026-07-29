import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ChevronLeft, ChevronRight, Maximize2, Minimize2, Download, RefreshCw
} from 'lucide-react'
import { fetchMangaChapter, getMangaDownloadUrl } from '../services/api'
import { useToast } from '../components/Toast'

export default function ReaderPage() {
  const { source, mangaId, chapterId } = useParams<{
    source: string; mangaId: string; chapterId: string
  }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [pages, setPages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [fit, setFit] = useState<'width' | 'height'>('width')
  const [showControls, setShowControls] = useState(true)

  useEffect(() => {
    if (!source || !mangaId || !chapterId) return
    setLoading(true)
    const title = searchParams.get('title') || undefined
    const chapter = searchParams.get('chapter') || undefined

    fetchMangaChapter(source, mangaId, chapterId, { title, chapter })
      .then((data) => {
        if (data.error) throw new Error(data.error)
        if (data.externalUrl) {
          window.location.href = data.externalUrl
          return
        }
        if (!data.pages?.length) throw new Error('No pages — tap retry to try other sources')
        if (data.fallbackUsed) toast(`Loaded from ${data.provider} (fallback)`, 'success')
        setPages(data.pages || [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [source, mangaId, chapterId, searchParams, toast])

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
        <div className="flex gap-3 justify-center">
          <button className="action-btn primary" onClick={() => {
            const title = searchParams.get('title')
            const chapter = searchParams.get('chapter')
            if (title && chapter) {
              setError('')
              setLoading(true)
              fetchMangaChapter(source!, mangaId!, chapterId!, { title, chapter })
                .then((data) => {
                  if (data.pages?.length) { setPages(data.pages); setError('') }
                  else throw new Error('Still no pages')
                })
                .catch((e) => setError(e.message))
                .finally(() => setLoading(false))
            }
          }}>
            <RefreshCw size={16} /> Try Fallback Sources
          </button>
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
            className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-6 p-4"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
          >
            <button className="action-btn" onClick={(e) => { e.stopPropagation(); prevPage() }}>
              <ChevronLeft size={20} />
            </button>
            <div className="w-32 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-cyan-400 transition-all"
                style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
              />
            </div>
            <button className="action-btn" onClick={(e) => { e.stopPropagation(); nextPage() }}>
              <ChevronRight size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
