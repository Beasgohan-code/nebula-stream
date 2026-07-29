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
    <div className="flex gap-2 flex-wrap">
      {MODES.map((m) => {
        const Icon = m.icon
        const active = mode === m.id
        return (
          <button
            key={m.id}
            type="button"
            className={`mode-tab ${active ? 'active' : ''}`}
            onClick={() => setMode(m.id)}
            style={active ? { borderColor: m.color, color: m.color } : undefined}
          >
            <Icon size={14} />
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
