import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
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

  const addBookmark = useCallback((b: Bookmark) => {
    setBookmarks((prev) => {
      if (prev.some((x) => x.id === b.id && x.source === b.source)) return prev
      return [b, ...prev]
    })
  }, [])

  const removeBookmark = useCallback((id: string, src: string) => {
    setBookmarks((prev) => prev.filter((b) => !(b.id === id && b.source === src)))
  }, [])

  const isBookmarked = useCallback((id: string, src: string) =>
    bookmarks.some((b) => b.id === id && b.source === src),
  [bookmarks])

  const addHistory = useCallback((h: HistoryItem) => {
    setHistory((prev) => {
      const existing = prev.find((x) => x.id === h.id && x.source === h.source)
      if (existing && existing.title === h.title) {
        return prev
      }
      return [h, ...prev.filter((x) => !(x.id === h.id && x.source === h.source))].slice(0, 50)
    })
  }, [])

  const clearHistory = useCallback(() => setHistory([]), [])

  const addRecentSearch = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((x) => x.toLowerCase() !== trimmed.toLowerCase())].slice(0, 10)
      if (next.length === prev.length && next.every((v, i) => v === prev[i])) return prev
      return next
    })
  }, [])

  const clearRecentSearches = useCallback(() => setRecentSearches([]), [])

  const addToQueue = useCallback((item: QueueItem) => {
    setQueue((prev) => {
      if (prev.some((x) => x.id === item.id && x.source === item.source)) return prev
      return [item, ...prev].slice(0, 30)
    })
  }, [])

  const removeFromQueue = useCallback((id: string, src: string) => {
    setQueue((prev) => prev.filter((q) => !(q.id === id && q.source === src)))
  }, [])

  const updateProgress = useCallback((id: string, src: string, progress: Partial<HistoryItem>) => {
    setHistory((prev) => {
      const idx = prev.findIndex((h) => h.id === id && h.source === src)
      if (idx === -1) return prev
      const current = prev[idx]
      const nextItem = { ...current, ...progress, visitedAt: Date.now() }
      if (
        current.progress === nextItem.progress &&
        current.chapterNum === nextItem.chapterNum &&
        current.episodeNum === nextItem.episodeNum
      ) {
        return prev
      }
      const next = [...prev]
      next[idx] = nextItem
      return next
    })
  }, [])

  const getProgress = useCallback((id: string, src: string) =>
    history.find((h) => h.id === id && h.source === src),
  [history])

  const value = useMemo(() => ({
    mode, setMode, source, setSource,
    bookmarks, addBookmark, removeBookmark, isBookmarked,
    history, addHistory, clearHistory,
    recentSearches, addRecentSearch, clearRecentSearches,
    queue, addToQueue, removeFromQueue, updateProgress, getProgress,
  }), [
    mode, source, bookmarks, history, recentSearches, queue,
    addBookmark, removeBookmark, isBookmarked, addHistory, clearHistory,
    addRecentSearch, clearRecentSearches, addToQueue, removeFromQueue,
    updateProgress, getProgress,
  ])

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
