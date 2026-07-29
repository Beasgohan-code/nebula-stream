import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { fetchAnimeEpisode, fetchSeriesEpisode } from '../services/api'

export default function PlayerPage() {
  const { mode, source, episodeId } = useParams<{
    mode: string; source: string; episodeId: string
  }>()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [sources, setSources] = useState<{ url: string; quality: string; isM3U8?: boolean }[]>([])
  const [currentSource, setCurrentSource] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showControls, setShowControls] = useState(true)

  useEffect(() => {
    if (!mode || !source || !episodeId) return
    setLoading(true)

    const fetcher = mode === 'series' ? fetchSeriesEpisode : fetchAnimeEpisode
    fetcher(source, episodeId)
      .then((data) => {
        if (data.error) throw new Error(data.error)
        const srcs = data.sources || []
        setSources(srcs)
        if (!srcs.length) throw new Error('No stream sources available')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [mode, source, episodeId])

  useEffect(() => {
    if (!sources.length || !videoRef.current) return
    const src = sources[currentSource]
    if (!src) return

    if (src.isM3U8) {
      import('hls.js').then(({ default: Hls }) => {
        if (Hls.isSupported() && videoRef.current) {
          const hls = new Hls()
          hls.loadSource(src.url)
          hls.attachMedia(videoRef.current!)
          return () => hls.destroy()
        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = src.url
        }
      }).catch(() => {
        if (videoRef.current) videoRef.current.src = src.url
      })
    } else {
      videoRef.current.src = src.url
    }
  }, [sources, currentSource])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <motion.div
          className="logo-text text-xl"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading Stream...
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-black min-h-screen">
        <p className="glow-text-pink mb-2 text-lg">{error}</p>
        <p className="text-sm opacity-50 mb-6">Try a different source or episode</p>
        <button className="action-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black" onClick={() => setShowControls(s => !s)}>
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
            <div className="flex gap-2">
              {sources.map((s, i) => (
                <button
                  key={i}
                  className={`source-chip text-xs ${currentSource === i ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setCurrentSource(i) }}
                >
                  {s.quality}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center min-h-screen p-4 pt-16">
        <div className="video-container w-full max-w-5xl">
          <video
            ref={videoRef}
            controls
            autoPlay
            className="w-full h-full"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  )
}
