import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Sparkles, Bot, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { aiChat, fetchAIRecommend } from '../services/api'

interface Message {
  role: 'user' | 'ai'
  text: string
  items?: any[]
}

const SUGGESTIONS = [
  'Recommend something for me',
  'What\'s trending?',
  'Similar to Demon Slayer',
  'Search One Piece',
  'Best action anime',
]

export default function AIPage() {
  const { mode, history } = useApp()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Hey! I\'m **Nebula AI** — your personal media guide. Ask me for recommendations, trending picks, or search anything!' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    setLoading(true)

    try {
      const res = await aiChat(text, mode, history)
      setMessages((m) => [...m, { role: 'ai', text: res.text, items: res.items }])
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: 'Sorry, I had trouble with that. Try again!' }])
    } finally {
      setLoading(false)
    }
  }

  const loadPersonalized = async () => {
    setLoading(true)
    try {
      const items = await fetchAIRecommend(mode, history)
      setMessages((m) => [...m,
        { role: 'user', text: 'Personalized picks for me' },
        { role: 'ai', text: 'Based on your watch history, here\'s what I think you\'ll love:', items },
      ])
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: 'Could not load recommendations. Try searching instead!' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in pt-4 pb-24 flex flex-col" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--neon-pink), var(--neon-purple))', boxShadow: 'var(--glow-pink)' }}>
          <Bot size={20} />
        </div>
        <div>
          <h2 className="logo-text text-lg">Nebula AI</h2>
          <p className="text-xs opacity-50">Smart recommendations & search</p>
        </div>
        <button className="action-btn primary ml-auto text-xs" onClick={loadPersonalized} disabled={loading}>
          <Sparkles size={14} /> For You
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="source-chip text-xs" onClick={() => send(s)} disabled={loading}>
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto mb-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
              msg.role === 'ai' ? 'bg-purple-900/50' : 'bg-cyan-900/30'
            }`}>
              {msg.role === 'ai' ? <Bot size={14} className="text-pink-400" /> : <User size={14} className="text-cyan-400" />}
            </div>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div className={`glass-card p-3 text-sm leading-relaxed inline-block ${
                msg.role === 'user' ? 'bg-cyan-900/20' : ''
              }`}>
                {msg.text.split('**').map((part, j) => j % 2 === 1 ? <strong key={j} className="glow-text-cyan">{part}</strong> : part)}
              </div>
              {msg.items && msg.items.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {msg.items.map((item: any) => (
                    <motion.div
                      key={`${item.source}-${item.id}`}
                      className="glass-card p-2 cursor-pointer"
                      onClick={() => navigate(`/${item.mode || mode}/${item.source}/${item.id}`)}
                      whileHover={{ scale: 1.03 }}
                    >
                      {item.image && (
                        <img src={item.image} alt={item.title} className="w-full h-24 object-cover rounded-lg mb-2" />
                      )}
                      <p className="text-xs font-semibold truncate">{item.title}</p>
                      {item.aiReason && <p className="text-xs opacity-50 mt-1">{item.aiReason}</p>}
                      {item.score && <p className="text-xs text-yellow-400">★ {item.score}</p>}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-2 items-center opacity-50 text-sm pl-11">
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              Nebula AI is thinking...
            </motion.div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input) }}
        className="fixed bottom-20 left-0 right-0 px-4 max-w-2xl mx-auto"
      >
        <div className="flex gap-2">
          <input
            className="search-input flex-1"
            placeholder="Ask Nebula AI anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="go-btn px-4" disabled={loading || !input.trim()}>
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  )
}
