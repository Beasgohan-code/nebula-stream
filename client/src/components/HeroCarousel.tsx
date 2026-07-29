import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Props {
  items: { id: string; title: string; image?: string; source: string; sourceName?: string; score?: number }[]
  mode: string
  loading?: boolean
}

export default function HeroCarousel({ items, mode, loading }: Props) {
  const [index, setIndex] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    setIndex(0)
  }, [mode])

  useEffect(() => {
    if (items.length < 2) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000)
    return () => clearInterval(timer)
  }, [items.length])

  if (loading) {
    return <div className="hero-carousel shimmer h-48 md:h-56 mb-6" />
  }

  if (!items.length) return null

  const item = items[index] || items[0]

  return (
    <div className="hero-carousel relative mb-6 overflow-hidden rounded-2xl">
      <div
        className="relative h-48 md:h-56 cursor-pointer hero-slide"
        onClick={() => navigate(`/${mode}/${item.source}/${item.id}`)}
      >
        {item.image && (
          <img
            key={item.id}
            src={item.image}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover hero-slide-img"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-1 block">
            Featured · {item.sourceName}
          </span>
          <h2 className="text-xl md:text-2xl font-bold glow-text-cyan" style={{ fontFamily: 'Orbitron' }}>
            {item.title}
          </h2>
          {item.score && (
            <span className="text-sm text-yellow-400 mt-1 inline-block">★ {item.score}</span>
          )}
        </div>
      </div>

      <button
        type="button"
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass-card flex items-center justify-center opacity-70 hover:opacity-100"
        onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + items.length) % items.length) }}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass-card flex items-center justify-center opacity-70 hover:opacity-100"
        onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % items.length) }}
      >
        <ChevronRight size={16} />
      </button>

      <div className="absolute bottom-3 right-4 flex gap-1.5">
        {items.slice(0, 8).map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: i === index ? 20 : 6,
              background: i === index ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
