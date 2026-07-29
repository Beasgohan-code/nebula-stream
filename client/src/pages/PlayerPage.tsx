import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Download } from 'lucide-react'
import { fetchAnimeEpisode, fetchSeriesEpisode, getVideoProxyUrl } from '../services/api'

const STREAM_SOURCES = ['hianime', 'animepahe', 'animekai', 'kickassanime', 'animesaturn', 'flixhq', 'sflix', 'dramacool', 'himovies']

export default function PlayerPage() {
  const { mode, source, episodeId } = useParams<{
    mode: string; source: string; episodeId: string
  }>()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<any>(null)
  const [sources, setSources] = useState<{ url: string; quality: string; isM3U8?: boolean }[]>([])
  const [subtitles, setSubtitles] = useState<{ url: string; lang: string }[]>([])
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [currentSource, setCurrentSource] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showControls, setShowControls] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!mode || !source || !episodeId) return
    setLoading(true)
    setError('')

    const fetcher = mode === 'series' ? fetchSeriesEpisode : fetchAnimeEpisode
    fetcher(source, episodeId)
      .then((data) => {
        if (data.error) throw new Error(data.error)
        const srcs = data.sources || []
        setSources(srcs)
        setSubtitles(data.subtitles || [])
        setDownloadUrl(data.download || srcs[0]?.url || null)
        if (!srcs.length) throw new Error(data.message || 'No stream sources available')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [mode, source, episodeId])

  useEffect(() => {
    if (!sources.length || !videoRef.current) return
    const src = sources[currentSource]
    if (!src) return

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const videoUrl = src.isM3U8
      ? getVideoProxyUrl(src.url)
      : getVideoProxyUrl(src.url)

    if (src.isM3U8) {
      import('hls.js').then(({ default: Hls }) => {
        if (Hls.isSupported() && videoRef.current) {
          const hls = new Hls()
          hlsRef.current = hls
          hls.loadSource(videoUrl)
          hls.attachMedia(videoRef.current!)
        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = videoUrl
        }
      }).catch(() => {
        if (videoRef.current) videoRef.current.src = videoUrl
      })
    } else {
      videoRef.current.src = videoUrl
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [sources, currentSource])

  const handleDownload = () => {
    const url = downloadUrl || sources[currentSource]?.url
    if (!url) return
    setDownloading(true)
    const a = document.createElement('a')
    a.href = getVideoProxyUrl(url, true)
    a.download = `episode-${episodeId}.mp4`
    a.click()
    setTimeout(() => setDownloading(false), 2000)
  }

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
        <p className="text-sm opacity-50 mb-2">
          {STREAM_SOURCES.includes(source || '')
            ? 'Source may be temporarily unavailable. Try again or pick another source.'
            : 'Pick a streaming source like HiAnime or FlixHQ from search filters.'}
        </p>
        <button className="action-btn mt-4" onClick={() => navigate(-1)}>
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
            <div className="flex gap-2 items-center">
              {sources.map((s, i) => (
                <button
                  key={i}
                  className={`source-chip text-xs ${currentSource === i ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setCurrentSource(i) }}
                >
                  {s.quality}
                </button>
              ))}
              <button
                className="action-btn primary py-2 px-3"
                onClick={(e) => { e.stopPropagation(); handleDownload() }}
                disabled={downloading}
              >
                <Download size={16} />
                {downloading ? '...' : 'Save'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center min-h-screen p-4 pt-16 pb-8">
        <div className="w-full max-w-5xl">
          <div className="video-container w-full">
            <video
              ref={videoRef}
              controls
              autoPlay
              className="w-full h-full"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {subtitles.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="text-xs opacity-50">Subtitles:</span>
              {subtitles.map((sub, i) => (
                <a
                  key={i}
                  href={getVideoProxyUrl(sub.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-chip text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  {sub.lang || `Track ${i + 1}`}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
