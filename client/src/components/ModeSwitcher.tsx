import { motion } from 'framer-motion'
import type { Mode } from '../context/AppContext'
import { useApp } from '../context/AppContext'
import { BookOpen, Tv, Film } from 'lucide-react'

const MODES: { id: Mode; label: string; icon: typeof BookOpen; color: string }[] = [
  { id: 'manga', label: 'Manga', icon: BookOpen, color: '#ff2d95' },
  { id: 'anime', label: 'Anime', icon: Tv, color: '#00f5ff' },
  { id: 'series', label: 'Web Series', icon: Film, color: '#b537f2' },
]

export default function ModeSwitcher() {
  const { mode, setMode } = useApp()

  return (
    <div className="flex gap-2 flex-wrap relative">
      {MODES.map((m) => {
        const Icon = m.icon
        const active = mode === m.id
        return (
          <motion.button
            key={m.id}
            className={`mode-tab ${active ? 'active' : ''}`}
            onClick={() => setMode(m.id)}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            layout
          >
            {active && (
              <motion.div
                className="mode-tab-glow"
                layoutId="mode-glow"
                style={{ boxShadow: `0 0 20px ${m.color}60, inset 0 0 20px ${m.color}20` }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <motion.span
                animate={active ? { rotate: [0, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <Icon size={14} style={{ color: active ? m.color : undefined }} />
              </motion.span>
              {m.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
