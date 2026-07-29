import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bookmark, Clock, Trash2, Heart } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function LibraryPage() {
  const { bookmarks, history, clearHistory, removeBookmark } = useApp()
  const navigate = useNavigate()

  return (
    <div className="fade-in pt-4">
      <h2 className="logo-text text-xl mb-6">My Library</h2>

      {/* Bookmarks */}
      <div className="mb-8">
        <div className="section-title">
          <Bookmark size={14} className="glow-text-pink" />
          Saved ({bookmarks.length})
        </div>
        {bookmarks.length === 0 ? (
          <div className="glass-card p-8 text-center opacity-50">
            <Heart size={32} className="mx-auto mb-3 opacity-30" />
            <p>No saved items yet</p>
            <p className="text-xs mt-1">Tap the bookmark icon on any title</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookmarks.map((b) => (
              <motion.div
                key={`${b.source}-${b.id}`}
                className="glass-card flex items-center gap-4 p-3 cursor-pointer"
                onClick={() => navigate(`/${b.mode}/${b.source}/${b.id}`)}
                whileHover={{ x: 4 }}
              >
                {b.image ? (
                  <img src={b.image} alt={b.title} className="w-12 h-16 object-cover rounded-lg" />
                ) : (
                  <div className="w-12 h-16 shimmer rounded-lg" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{b.title}</div>
                  <div className="text-xs opacity-50 capitalize">{b.mode} · {b.source}</div>
                </div>
                <button
                  className="action-btn p-2"
                  onClick={(e) => { e.stopPropagation(); removeBookmark(b.id, b.source) }}
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <div className="section-title flex items-center">
          <Clock size={14} className="glow-text-cyan" />
          Recent ({history.length})
          {history.length > 0 && (
            <button
              className="ml-auto text-xs opacity-50 hover:opacity-100 action-btn py-1 px-3"
              onClick={clearHistory}
            >
              Clear
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <div className="glass-card p-8 text-center opacity-50">
            <Clock size={32} className="mx-auto mb-3 opacity-30" />
            <p>No history yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <motion.div
                key={`${h.source}-${h.id}-${h.visitedAt}`}
                className="glass-card flex items-center gap-4 p-3 cursor-pointer"
                onClick={() => navigate(`/${h.mode}/${h.source}/${h.id}`)}
                whileHover={{ x: 4 }}
              >
                {h.image ? (
                  <img src={h.image} alt={h.title} className="w-12 h-16 object-cover rounded-lg" />
                ) : (
                  <div className="w-12 h-16 shimmer rounded-lg" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{h.title}</div>
                  <div className="text-xs opacity-50 capitalize">
                    {h.mode} · {new Date(h.visitedAt).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
