import { useState, useEffect } from 'react'
import { ArrowLeft, ExternalLink, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react'

interface Props {
  url: string
  title?: string
  onBack: () => void
  subtitle?: string
}

export default function EmbedViewer({ url, title, onBack, subtitle }: Props) {
  const [loadError, setLoadError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [key, setKey] = useState(0)

  const openExternal = () => window.open(url, '_blank', 'noopener,noreferrer')

  useEffect(() => {
    setLoading(true)
    setLoadError(false)
    const timer = setTimeout(() => setLoading(false), 12000)
    return () => clearTimeout(timer)
  }, [url, key])

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div
        className="flex items-center justify-between gap-3 p-4 z-50"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.95), rgba(0,0,0,0.7))' }}
      >
        <button className="action-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex-1 min-w-0 text-center">
          {title && <p className="text-sm font-semibold truncate glow-text-cyan">{title}</p>}
          {subtitle && <p className="text-xs opacity-50 truncate">{subtitle}</p>}
        </div>
        <div className="flex gap-2">
          <button className="action-btn" onClick={() => { setLoadError(false); setKey((k) => k + 1) }} title="Reload preview">
            <RefreshCw size={16} />
          </button>
          <button className="action-btn primary" onClick={openExternal}>
            <ExternalLink size={16} /> Open
          </button>
        </div>
      </div>

      <div className="flex-1 relative w-full" style={{ minHeight: 'calc(100vh - 72px)' }}>
        {loading && !loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-black/80">
            <Loader2 size={28} className="animate-spin glow-text-cyan" />
            <p className="text-sm opacity-60">Loading preview...</p>
          </div>
        )}
        {loadError ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
            <AlertTriangle size={40} className="text-yellow-400 opacity-80" />
            <p className="glow-text-pink text-lg">Preview blocked by this site</p>
            <p className="text-sm opacity-60 max-w-md">
              Some sites don&apos;t allow embedded previews. Use Open to watch in a new tab — you&apos;ll stay in NebulaStream when you come back.
            </p>
            <button className="action-btn primary" onClick={openExternal}>
              <ExternalLink size={16} /> Open in Browser
            </button>
          </div>
        ) : (
          <iframe
            key={key}
            src={url}
            title={title || 'Preview'}
            className="absolute inset-0 w-full h-full border-0 bg-black"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            onLoad={() => setLoading(false)}
            onError={() => { setLoadError(true); setLoading(false) }}
          />
        )}
      </div>

      <div className="p-3 text-center text-xs opacity-40 border-t border-purple-900/30">
        Embedded preview · If blank, tap Open
      </div>
    </div>
  )
}
