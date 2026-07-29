import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { fetchSources } from '../services/api'

export default function SourceFilters() {
  const { mode, source, setSource } = useApp()
  const [sources, setSources] = useState<{ id: string; name: string; color: string }[]>([])

  useEffect(() => {
    fetchSources(mode).then(setSources).catch(() => setSources([]))
    setSource('all')
  }, [mode])

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
      <button
        className={`source-chip ${source === 'all' ? 'active' : ''}`}
        onClick={() => setSource('all')}
      >
        All Sources
      </button>
      {sources.map((s) => (
        <button
          key={s.id}
          className={`source-chip ${source === s.id ? 'active' : ''}`}
          onClick={() => setSource(s.id)}
          style={source === s.id ? { borderColor: s.color, color: s.color } : {}}
        >
          {s.name}
        </button>
      ))}
    </div>
  )
}
