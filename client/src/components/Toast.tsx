import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Toast {
  id: number
  message: string
  type: 'info' | 'success' | 'error'
}

const ToastContext = createContext<{
  toast: (message: string, type?: Toast['type']) => void
} | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card px-4 py-3 text-sm font-medium mx-auto max-w-sm text-center pointer-events-auto"
              style={{
                borderColor: t.type === 'error' ? 'rgba(255,45,149,0.5)' : t.type === 'success' ? 'rgba(0,245,255,0.5)' : undefined,
                boxShadow: t.type === 'error' ? 'var(--glow-pink)' : t.type === 'success' ? 'var(--glow-cyan)' : undefined,
              }}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
