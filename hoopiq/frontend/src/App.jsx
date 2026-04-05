import { Routes, Route, useLocation } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import Navbar from './components/Navbar'
import MobileNav from './components/MobileNav'
import HomePage from './pages/HomePage'
import UpcomingPage from './pages/UpcomingPage'
import GameDetailPage from './pages/GameDetailPage'
import TeamsPage from './pages/TeamsPage'
import TeamDetailPage from './pages/TeamDetailPage'
import PlayerDetailPage from './pages/PlayerDetailPage'
import PredictionsPage from './pages/PredictionsPage'
import NewsPage from './pages/NewsPage'
import InjuriesPage from './pages/InjuriesPage'
import RankingsPage from './pages/RankingsPage'
import StandingsPage from './pages/StandingsPage'
import StatLeadersPage from './pages/StatLeadersPage'
import FloatingChat from './components/FloatingChat'

export const ThemeContext = createContext({ dark: true, toggle: () => {} })
export const useTheme = () => useContext(ThemeContext)

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

export default function App() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('hoopiq-theme')
    if (saved) return saved === 'dark'
    return true
  })
  const isMobile = useIsMobile()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('hoopiq-theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />

        <main style={{ paddingTop: isMobile ? 64 : 70 }}>
          <div className="page-wrapper" style={{
            paddingTop: 20,
            paddingBottom: isMobile ? 90 : 80,
          }}>
            <Routes>
              <Route path="/"                  element={<HomePage />} />
              <Route path="/upcoming"          element={<UpcomingPage />} />
              <Route path="/game/:gameId"       element={<GameDetailPage />} />
              <Route path="/teams"             element={<TeamsPage />} />
              <Route path="/teams/:teamId"     element={<TeamDetailPage />} />
              <Route path="/players/:playerId" element={<PlayerDetailPage />} />
              <Route path="/predictions"       element={<PredictionsPage />} />
              <Route path="/news"              element={<NewsPage />} />
              <Route path="/injuries"          element={<InjuriesPage />} />
              <Route path="/rankings"          element={<RankingsPage />} />
              <Route path="/standings"         element={<StandingsPage />} />
              <Route path="/leaders"           element={<StatLeadersPage />} />
            </Routes>
          </div>
        </main>

        {/* ✅ FIXED — MobileNav on mobile, FloatingChat on both */}
        {isMobile && <MobileNav />}
        <FloatingChat />
      </div>
    </ThemeContext.Provider>
  )
}