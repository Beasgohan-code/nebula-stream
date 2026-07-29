import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Mode } from '../context/AppContext'

interface Item {
  id: string
  title: string
  source: string
}

interface Props {
  items: Item[]
  mode: Mode
  loading?: boolean
}

export default function SurpriseMe({ items, mode, loading }: Props) {
  const navigate = useNavigate()

  const pickRandom = () => {
    if (!items.length) return
    const pick = items[Math.floor(Math.random() * items.length)]
    navigate(`/${mode}/${pick.source}/${pick.id}`)
  }

  return (
    <motion.button
      className="surprise-btn"
      onClick={pickRandom}
      disabled={loading || !items.length}
      whileHover={{ scale: 1.03, boxShadow: '0 0 24px rgba(255,45,149,0.5)' }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <motion.span
        animate={{ rotate: [0, 15, -15, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        <Sparkles size={16} />
      </motion.span>
      Surprise Me
    </motion.button>
  )
}
