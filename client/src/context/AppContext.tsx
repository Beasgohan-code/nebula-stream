import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

export type Mode = 'manga' | 'anime' | 'series'

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
}

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
  visitedAt: number
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

  useEffect(() => {
    localStorage.setItem('ns-bookmarks', JSON.stringify(bookmarks))
  }, [bookmarks])

  useEffect(() => {
    localStorage.setItem('ns-history', JSON.stringify(history.slice(0, 50)))
  }, [history])

  useEffect(() => {
    localStorage.setItem('ns-recent-searches', JSON.stringify(recentSearches.slice(0, 10)))
  }, [recentSearches])

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

  return (
    <AppContext.Provider value={{
      mode, setMode, source, setSource,
      bookmarks, addBookmark, removeBookmark, isBookmarked,
      history, addHistory, clearHistory,
      recentSearches, addRecentSearch, clearRecentSearches,
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
