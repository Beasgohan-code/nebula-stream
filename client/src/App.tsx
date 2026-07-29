import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, Library, Settings, Bot } from 'lucide-react'
import { AppProvider, useApp } from './context/AppContext'
import { ToastProvider } from './components/Toast'
import Particles from './components/Particles'
import ScrollToTop from './components/ScrollToTop'
import ScrollToTopButton from './components/ScrollToTopButton'
import { PageWrapper, ImmersiveWrapper } from './components/PageTransition'
import HomePage from './pages/HomePage'
import DetailPage from './pages/DetailPage'
import ReaderPage from './pages/ReaderPage'
import PlayerPage from './pages/PlayerPage'
import LibraryPage from './pages/LibraryPage'
import SettingsPage from './pages/SettingsPage'
import AIPage from './pages/AIPage'

function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname
  const { queue } = useApp()

  const isReader = path.startsWith('/read') || path.startsWith('/watch')
  if (isReader) return null

  const tabs = [
    { id: '/', icon: Home, label: 'Home' },
    { id: '/ai', icon: Bot, label: 'AI' },
    { id: '/library', icon: Library, label: 'Library' },
    { id: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <motion.nav
      className="bottom-nav"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const active = path === tab.id
        return (
          <motion.button
            key={tab.id}
            className={`nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(tab.id)}
            whileTap={{ scale: 0.9 }}
            layout
          >
            <motion.div layout>
              <Icon size={22} />
            </motion.div>
            <motion.span layout>{tab.label}</motion.span>
            {tab.id === '/library' && queue.length > 0 && (
              <motion.span
                className="queue-badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                key={queue.length}
              >
                {queue.length > 9 ? '9+' : queue.length}
              </motion.span>
            )}
            {active && (
              <motion.div
                className="nav-indicator"
                layoutId="nav-indicator"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </motion.button>
        )
      })}
    </motion.nav>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  const isReader = location.pathname.startsWith('/read') || location.pathname.startsWith('/watch')

  return (
    <div className={`app-container ${isReader ? '' : 'content-wrapper'}`}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
          <Route path="/ai" element={<PageWrapper><AIPage /></PageWrapper>} />
          <Route path="/library" element={<PageWrapper><LibraryPage /></PageWrapper>} />
          <Route path="/settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
          <Route path="/:mode/:source/:id" element={<PageWrapper><DetailPage /></PageWrapper>} />
          <Route path="/read/:source/:mangaId/:chapterId" element={<ImmersiveWrapper><ReaderPage /></ImmersiveWrapper>} />
          <Route path="/watch/:mode/:source/:episodeId" element={<ImmersiveWrapper><PlayerPage /></ImmersiveWrapper>} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

function AppLayout() {
  return (
    <>
      <ScrollToTop />
      <div className="nebula-bg" />
      <Particles />
      <AnimatedRoutes />
      <ScrollToTopButton />
      <BottomNav />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppLayout />
      </ToastProvider>
    </AppProvider>
  )
}
