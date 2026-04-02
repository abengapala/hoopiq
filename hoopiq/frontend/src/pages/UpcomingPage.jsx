// UpcomingPage.jsx
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, EmptyState, SectionHeader } from '../components/UI'
import { useNavigate } from 'react-router-dom'

export default function UpcomingPage() {
  const { data, loading, error, refetch } = useApi(() => api.getUpcomingGames(7))
  const navigate = useNavigate()

  if (loading) return <LoadingSpinner text="Fetching upcoming schedule..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const games = data?.games || []
  if (games.length === 0) return <EmptyState emoji="📅" title="No upcoming games found" sub="Check back later for the schedule." />

  // Group by date
  const grouped = games.reduce((acc, g) => {
    const key = g.dateLabel || g.date
    if (!acc[key]) acc[key] = []
    acc[key].push(g)
    return acc
  }, {})

  return (
    <div>
      {Object.entries(grouped).map(([date, dayGames]) => (
        <div key={date} style={{ marginBottom: 28 }}>
          <SectionHeader title={date} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dayGames.map((g, i) => (
              <div key={i}
                className="card card-hover"
                onClick={() => navigate(`/game/${g.gameId}`)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ fontSize: 15, fontWeight: 600 }}>{g.matchup}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>{g.teamAbbr}</span>
                  <span className="badge badge-accent">View →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
