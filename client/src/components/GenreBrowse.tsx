import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'

const GENRES: Record<string, string[]> = {
  manga: ['Action', 'Romance', 'Fantasy', 'Horror', 'Comedy', 'Drama', 'Sci-Fi'],
  anime: ['Action', 'Adventure', 'Romance', 'Fantasy', 'Comedy', 'Thriller', 'Slice of Life'],
  series: ['Drama', 'Thriller', 'Comedy', 'Action', 'Romance', 'Sci-Fi', 'Mystery'],
}

interface Props {
  onSelect: (genre: string) => void
}

export default function GenreBrowse({ onSelect }: Props) {
  const { mode } = useApp()
  const genres = GENRES[mode] || GENRES.anime

  return (
    <div className="mb-5">
      <div className="section-title mb-3">Browse by Genre</div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {genres.map((g, i) => (
          <motion.button
            key={g}
            className="genre-chip"
            onClick={() => onSelect(g)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
            whileHover={{ scale: 1.08, boxShadow: '0 0 16px rgba(0,245,255,0.4)' }}
            whileTap={{ scale: 0.95 }}
          >
            {g}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
