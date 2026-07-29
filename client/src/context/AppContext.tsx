import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

export type Mode = 'manga' | 'anime' | 'series'

export interface Bookmark {
  id: string
  title: string
  image?: string
  source: string
  mode: Mode
  addedAt: number
}

export interface HistoryItem {
  id: string
  title: string
  image?: string
  source: string
  mode: Mode
  progress?: string
  episodeNum?: number
  chapterNum?: string
  visitedAt: number
}

export interface QueueItem {
  id: string
  title: string
  image?: string
  source: string
  mode: Mode
  episodeId?: string
  addedAt: number
}

interface AppState {
  mode: Mode
  setMode: (m: Mode) => void
  source: string
  setSource: (s: string) => void
  bookmarks: Bookmark[]
  addBookmark: (b: Bookmark) => void
  removeBookmark: (id: string, source: string) => void
  isBookmarked: (id: string, source: string) => boolean
  history: HistoryItem[]
  addHistory: (h: HistoryItem) => void
  clearHistory: () => void
  recentSearches: string[]
  addRecentSearch: (q: string) => void
  clearRecentSearches: () => void
  queue: QueueItem[]
  addToQueue: (item: QueueItem) => void
  removeFromQueue: (id: string, source: string) => void
  updateProgress: (id: string, source: string, progress: Partial<HistoryItem>) => void
  getProgress: (id: string, source: string) => HistoryItem | undefined
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('manga')
  const [source, setSource] = useState('all')
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try { return JSON.parse(localStorage.getItem('ns-bookmarks') || '[]') } catch { return [] }
  })
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('ns-history') || '[]') } catch { return [] }
  })
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('ns-recent-searches') || '[]') } catch { return [] }
  })
  const [queue, setQueue] = useState<QueueItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('ns-queue') || '[]') } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('ns-bookmarks', JSON.stringify(bookmarks))
  }, [bookmarks])

  useEffect(() => {
    localStorage.setItem('ns-history', JSON.stringify(history.slice(0, 50)))
  }, [history])

  useEffect(() => {
    localStorage.setItem('ns-recent-searches', JSON.stringify(recentSearches.slice(0, 10)))
  }, [recentSearches])

  useEffect(() => {
    localStorage.setItem('ns-queue', JSON.stringify(queue.slice(0, 30)))
  }, [queue])

  const addBookmark = (b: Bookmark) => {
    setBookmarks((prev) => {
      if (prev.some((x) => x.id === b.id && x.source === b.source)) return prev
      return [b, ...prev]
    })
  }

  const removeBookmark = (id: string, src: string) => {
    setBookmarks((prev) => prev.filter((b) => !(b.id === id && b.source === src)))
  }

  const isBookmarked = (id: string, src: string) =>
    bookmarks.some((b) => b.id === id && b.source === src)

  const addHistory = (h: HistoryItem) => {
    setHistory((prev) => [h, ...prev.filter((x) => !(x.id === h.id && x.source === h.source))].slice(0, 50))
  }

  const clearHistory = () => setHistory([])

  const addRecentSearch = (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setRecentSearches((prev) => [trimmed, ...prev.filter((x) => x.toLowerCase() !== trimmed.toLowerCase())].slice(0, 10))
  }

  const clearRecentSearches = () => setRecentSearches([])

  const addToQueue = (item: QueueItem) => {
    setQueue((prev) => {
      if (prev.some((x) => x.id === item.id && x.source === item.source)) return prev
      return [item, ...prev].slice(0, 30)
    })
  }

  const removeFromQueue = (id: string, src: string) => {
    setQueue((prev) => prev.filter((q) => !(q.id === id && q.source === src)))
  }

  const updateProgress = (id: string, src: string, progress: Partial<HistoryItem>) => {
    setHistory((prev) => prev.map((h) =>
      h.id === id && h.source === src ? { ...h, ...progress, visitedAt: Date.now() } : h
    ))
  }

  const getProgress = (id: string, src: string) =>
    history.find((h) => h.id === id && h.source === src)

  return (
    <AppContext.Provider value={{
      mode, setMode, source, setSource,
      bookmarks, addBookmark, removeBookmark, isBookmarked,
      history, addHistory, clearHistory,
      recentSearches, addRecentSearch, clearRecentSearches,
      queue, addToQueue, removeFromQueue, updateProgress, getProgress,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
