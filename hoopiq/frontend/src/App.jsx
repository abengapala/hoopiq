import { Routes, Route, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
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
import ChatPage from './pages/ChatPage'
import StandingsPage from './pages/StandingsPage'
import StatLeadersPage from './pages/StatLeadersPage'

const PAGE_TITLES = {
  '/': "Today's Games",
  '/upcoming': 'Upcoming Games',
  '/predictions': 'Predictions',
  '/rankings': 'Power Rankings',
  '/teams': 'Teams',
  '/news': 'NBA News',
  '/injuries': 'Injury Report',
  '/chat': 'AI Chatbot',
  '/standings': 'Standings',
  '/leaders': 'Stat Leaders',
}

export default function App() {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'HoopIQ'

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 220, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Topbar title={title} />
        <main style={{ flex: 1, padding: 24 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/upcoming" element={<UpcomingPage />} />
            <Route path="/game/:gameId" element={<GameDetailPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
            <Route path="/players/:playerId" element={<PlayerDetailPage />} />
            <Route path="/predictions" element={<PredictionsPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/injuries" element={<InjuriesPage />} />
            <Route path="/rankings" element={<RankingsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/standings" element={<StandingsPage />} />
            <Route path="/leaders" element={<StatLeadersPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
