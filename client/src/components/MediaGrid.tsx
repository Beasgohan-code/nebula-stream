import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const STREAM_SOURCES = new Set([
  'hianime', 'animepahe', 'animekai', 'kickassanime', 'animesaturn', 'animeunity', 'animesama',
  'flixhq', 'sflix', 'dramacool', 'himovies', 'goku',
])

interface MediaItem {
  id: string
  title: string
  image?: string | null
  source: string
  sourceName?: string
  score?: number
}

interface Props {
  items: MediaItem[]
  loading?: boolean
}

export default function MediaGrid({ items, loading }: Props) {
  const navigate = useNavigate()
  const { mode } = useApp()

  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="media-card shimmer" style={{ aspectRatio: '2/3' }} />
        ))}
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="text-center py-16 glass-card">
        <p className="glow-text-purple text-lg font-semibold mb-2">No results found</p>
        <p className="text-sm opacity-50">Try a different search term or source</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4 media-grid-stable">
      {items.map((item) => (
        <div
          key={`${item.source}-${item.id}`}
          className="media-card"
          onClick={() => navigate(`/${mode}/${item.source}/${item.id}`)}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full shimmer" style={{ height: '75%' }} />
          )}
          <div className="media-card-info">
            <div className="media-card-title">{item.title}</div>
            <div className="media-card-source">{item.sourceName || item.source}</div>
          </div>
          {item.score && (
            <div className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-0.5 text-xs font-bold text-yellow-400">
              ★ {item.score}
            </div>
          )}
          {STREAM_SOURCES.has(item.source) && (
            <div className="absolute top-2 left-2 bg-pink-600/80 rounded-full px-2 py-0.5 text-xs font-bold">
              ▶ Stream
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
