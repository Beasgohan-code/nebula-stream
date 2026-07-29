import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, Clock, Trash2, Heart, ListVideo, Play } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { staggerContainer, staggerItem } from '../components/PageTransition'

export default function LibraryPage() {
  const { bookmarks, history, queue, clearHistory, removeBookmark, removeFromQueue } = useApp()
  const navigate = useNavigate()

  return (
    <div className="pt-4">
      <motion.h2
        className="logo-text text-xl mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        My Library
      </motion.h2>

      {/* Watch Queue */}
      <motion.div className="mb-8" variants={staggerContainer} initial="initial" animate="animate">
        <div className="section-title">
          <ListVideo size={14} className="glow-text-purple" />
          Watch Queue ({queue.length})
        </div>
        {queue.length === 0 ? (
          <motion.div variants={staggerItem} className="glass-card p-6 text-center opacity-50">
            <ListVideo size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Queue is empty</p>
            <p className="text-xs mt-1 opacity-60">Add titles from detail pages</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {queue.map((q, i) => (
                <motion.div
                  key={`${q.source}-${q.id}`}
                  className="glass-card flex items-center gap-4 p-3 cursor-pointer"
                  onClick={() => navigate(`/${q.mode}/${q.source}/${q.id}`)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ x: 6, borderColor: 'rgba(0,245,255,0.3)' }}
                >
                  <span className="text-xs font-bold text-purple-400 w-5">{i + 1}</span>
                  {q.image ? (
                    <img src={q.image} alt={q.title} className="w-12 h-16 object-cover rounded-lg" />
                  ) : (
                    <div className="w-12 h-16 shimmer rounded-lg" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{q.title}</div>
                    <div className="text-xs opacity-50 capitalize">{q.mode}</div>
                  </div>
                  <Play size={14} className="opacity-40" />
                  <button
                    className="action-btn p-2"
                    onClick={(e) => { e.stopPropagation(); removeFromQueue(q.id, q.source) }}
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

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
          </div>
        ) : (
          <div className="space-y-2">
            {bookmarks.map((b, i) => (
              <motion.div
                key={`${b.source}-${b.id}`}
                className="glass-card flex items-center gap-4 p-3 cursor-pointer"
                onClick={() => navigate(`/${b.mode}/${b.source}/${b.id}`)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ x: 4, scale: 1.01 }}
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
            <button className="ml-auto text-xs opacity-50 hover:opacity-100 action-btn py-1 px-3" onClick={clearHistory}>
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
            {history.map((h, i) => (
              <motion.div
                key={`${h.source}-${h.id}-${h.visitedAt}`}
                className="glass-card flex items-center gap-4 p-3 cursor-pointer"
                onClick={() => navigate(`/${h.mode}/${h.source}/${h.id}`)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
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
                  {h.progress && (
                    <div className="progress-bar mt-1">
                      <div className="progress-bar-fill" style={{ width: h.progress }} />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
