import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Download, RefreshCw } from 'lucide-react'
import { fetchAnimeEpisode, fetchSeriesEpisode, getVideoProxyUrl } from '../services/api'
import { useToast } from '../components/Toast'

export default function PlayerPage() {
  const { mode, source, episodeId } = useParams<{
    mode: string; source: string; episodeId: string
  }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<any>(null)
  const [sources, setSources] = useState<{ url: string; quality: string; isM3U8?: boolean }[]>([])
  const [subtitles, setSubtitles] = useState<{ url: string; lang: string }[]>([])
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [currentSource, setCurrentSource] = useState(0)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)
  const [error, setError] = useState('')
  const [showControls, setShowControls] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [usedSource, setUsedSource] = useState(source || '')
  const [triedSources, setTriedSources] = useState<string[]>([])

  const title = searchParams.get('title') || ''
  const ep = searchParams.get('ep') || ''

  const loadStream = async (exclude: string[] = []) => {
    if (!mode || !source || !episodeId) return
    setLoading(true)
    setError('')

    const fetcher = mode === 'series' ? fetchSeriesEpisode : fetchAnimeEpisode
    try {
      const data = await fetcher(source, episodeId, {
        title: title || undefined,
        ep: ep || undefined,
        exclude: exclude.join(','),
      })
      if (data.error) throw new Error(data.error)
      const srcs = data.sources || []
      if (!srcs.length) throw new Error(data.message || 'No stream sources available')

      setSources(srcs)
      setSubtitles(data.subtitles || [])
      setDownloadUrl(data.download || srcs[0]?.url || null)
      setUsedSource(data.usedSource || data.provider || source)
      if (data.fallbackUsed) {
        toast(`Switched to ${data.usedSource || data.provider} (auto-fallback)`, 'success')
      }
    } catch (e: any) {
      setError(e.message)
      setTriedSources((prev) => [...new Set([...prev, source, ...exclude])])
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }

  useEffect(() => {
    loadStream()
  }, [mode, source, episodeId])

  useEffect(() => {
    if (!sources.length || !videoRef.current) return
    const src = sources[currentSource]
    if (!src) return

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const videoUrl = getVideoProxyUrl(src.url)

    const onVideoError = () => {
      if (sources.length > currentSource + 1) {
        setCurrentSource((i) => i + 1)
        toast('Switching quality...', 'info')
      }
    }

    if (src.isM3U8) {
      import('hls.js').then(({ default: Hls }) => {
        if (Hls.isSupported() && videoRef.current) {
          const hls = new Hls()
          hlsRef.current = hls
          hls.loadSource(videoUrl)
          hls.attachMedia(videoRef.current!)
          hls.on(Hls.Events.ERROR, () => onVideoError())
        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = videoUrl
        }
      }).catch(() => {
        if (videoRef.current) videoRef.current.src = videoUrl
      })
    } else {
      videoRef.current.src = videoUrl
      videoRef.current.onerror = onVideoError
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [sources, currentSource])

  const handleRetryFallback = () => {
    setRetrying(true)
    loadStream(triedSources)
  }

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-black gap-4">
        <motion.div className="logo-text text-xl" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
          {retrying ? 'Trying alternate sources...' : 'Loading Stream...'}
        </motion.div>
        {retrying && (
          <motion.div className="w-48 h-1 bg-purple-900 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-pink-500 to-cyan-400" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: '50%' }} />
          </motion.div>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-black min-h-screen px-4">
        <p className="glow-text-pink mb-2 text-lg">{error}</p>
        <p className="text-sm opacity-50 mb-6">Auto-fallback will search HiAnime, AnimePahe, FlixHQ & more</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button className="action-btn primary" onClick={handleRetryFallback} disabled={retrying}>
            <RefreshCw size={16} className={retrying ? 'animate-spin' : ''} />
            Try All Sources
          </button>
          <button className="action-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
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
            <span className="text-xs opacity-50 hidden sm:block">{usedSource}</span>
            <div className="flex gap-2 items-center">
              {sources.map((s, i) => (
                <button key={i} className={`source-chip text-xs ${currentSource === i ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setCurrentSource(i) }}>
                  {s.quality}
                </button>
              ))}
              <button className="action-btn primary py-2 px-3" onClick={(e) => { e.stopPropagation(); handleDownload() }} disabled={downloading}>
                <Download size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center min-h-screen p-4 pt-16 pb-8">
        <div className="w-full max-w-5xl">
          <div className="video-container w-full">
            <video ref={videoRef} controls autoPlay className="w-full h-full" onClick={(e) => e.stopPropagation()} />
          </div>
          {subtitles.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="text-xs opacity-50">Subtitles:</span>
              {subtitles.map((sub, i) => (
                <a key={i} href={getVideoProxyUrl(sub.url)} target="_blank" rel="noopener noreferrer"
                  className="source-chip text-xs" onClick={(e) => e.stopPropagation()}>
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
