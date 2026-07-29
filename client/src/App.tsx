import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { Home, Library, Settings, Bot } from 'lucide-react'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './components/Toast'
import Particles from './components/Particles'
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

  const isReader = path.startsWith('/read') || path.startsWith('/watch')
  if (isReader) return null

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
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}

function AppLayout() {
  const location = useLocation()
  const isReader = location.pathname.startsWith('/read') || location.pathname.startsWith('/watch')

  return (
    <>
      <div className="nebula-bg" />
      <Particles />
      <div className={`app-container ${isReader ? '' : 'content-wrapper'}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/:mode/:source/:id" element={<DetailPage />} />
          <Route path="/read/:source/:mangaId/:chapterId" element={<ReaderPage />} />
          <Route path="/watch/:mode/:source/:episodeId" element={<PlayerPage />} />
        </Routes>
      </div>
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
