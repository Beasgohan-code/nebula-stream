import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    if (!items.length) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), 5000)
    return () => clearInterval(timer)
  }, [items.length])

  if (loading) {
    return <div className="hero-carousel shimmer" />
  }

  if (!items.length) return null

  const item = items[index]

  return (
    <div className="hero-carousel relative mb-6 overflow-hidden rounded-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          className="relative h-48 md:h-56 cursor-pointer"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => navigate(`/${mode}/${item.source}/${item.id}`)}
        >
          {item.image && (
            <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <motion.span
              className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-1 block"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Featured · {item.sourceName}
            </motion.span>
            <motion.h2
              className="text-xl md:text-2xl font-bold glow-text-cyan"
              style={{ fontFamily: 'Orbitron' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {item.title}
            </motion.h2>
            {item.score && (
              <motion.span
                className="text-sm text-yellow-400 mt-1 inline-block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                ★ {item.score}
              </motion.span>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass-card flex items-center justify-center opacity-70 hover:opacity-100"
        onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + items.length) % items.length) }}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass-card flex items-center justify-center opacity-70 hover:opacity-100"
        onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % items.length) }}
      >
        <ChevronRight size={16} />
      </button>

      <div className="absolute bottom-3 right-4 flex gap-1.5">
        {items.slice(0, 8).map((_, i) => (
          <motion.div
            key={i}
            className="h-1 rounded-full"
            animate={{
              width: i === index ? 20 : 6,
              background: i === index ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.3)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        ))}
      </div>
    </div>
  )
}
