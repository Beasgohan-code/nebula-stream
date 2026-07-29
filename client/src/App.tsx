import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
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
import EmbedPage from './pages/EmbedPage'

function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname
  const { queue } = useApp()

  const immersive = path.startsWith('/read') || path.startsWith('/watch') || path.startsWith('/embed')
  if (immersive) return null

  const tabs = [
    { id: '/', icon: Home, label: 'Home' },
    { id: '/ai', icon: Bot, label: 'AI' },
    { id: '/library', icon: Library, label: 'Library' },
    { id: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const active = path === tab.id
        return (
          <button
            key={tab.id}
            className={`nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(tab.id)}
          >
            <Icon size={22} />
            <span>{tab.label}</span>
            {tab.id === '/library' && queue.length > 0 && (
              <span className="queue-badge">
                {queue.length > 9 ? '9+' : queue.length}
              </span>
            )}
            {active && <span className="nav-indicator" />}
          </button>
        )
      })}
    </nav>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  const immersive =
    location.pathname.startsWith('/read') ||
    location.pathname.startsWith('/watch') ||
    location.pathname.startsWith('/embed')

  return (
    <div className={`app-container ${immersive ? '' : 'content-wrapper'}`}>
      <Routes location={location}>
        <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
        <Route path="/ai" element={<PageWrapper><AIPage /></PageWrapper>} />
        <Route path="/library" element={<PageWrapper><LibraryPage /></PageWrapper>} />
        <Route path="/settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
        <Route path="/embed" element={<ImmersiveWrapper><EmbedPage /></ImmersiveWrapper>} />
        <Route path="/:mode/:source/:id" element={<PageWrapper><DetailPage /></PageWrapper>} />
        <Route path="/read/:source/:mangaId" element={<ImmersiveWrapper><ReaderPage /></ImmersiveWrapper>} />
        <Route path="/watch/:mode/:source/:episodeId" element={<ImmersiveWrapper><PlayerPage /></ImmersiveWrapper>} />
      </Routes>
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
