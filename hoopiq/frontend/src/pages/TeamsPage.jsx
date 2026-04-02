import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState } from '../components/UI'

const TEAM_COLORS = {
  BOS: '#007A33', OKC: '#007AC1', CLE: '#860038', DEN: '#0E2240',
  MIN: '#0C2340', IND: '#002D62', LAL: '#552583', GSW: '#1D428A',
  MIL: '#00471B', DAL: '#00538C', PHX: '#1D1160', MIA: '#98002E',
  NYK: '#006BB6', BKN: '#000000', PHI: '#006BB6', ATL: '#E03A3E',
  CHI: '#CE1141', DET: '#C8102E', CHA: '#1D1160', WAS: '#002B5C',
  POR: '#E03A3E', SAC: '#5A2D81', UTA: '#002B5C', SAS: '#C4CED4',
  NOP: '#0C2340', MEM: '#5D76A9', ORL: '#0077C0', HOU: '#CE1141',
  LAC: '#C8102E', TOR: '#CE1141',
}

export default function TeamsPage() {
  const navigate = useNavigate()
  const { data, loading, error } = useApi(api.getAllTeams)

  if (loading) return <LoadingSpinner text="Loading teams..." />
  if (error) return <ErrorState message={error} />

  const teams = data?.teams || []

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {teams.map(t => {
          const color = TEAM_COLORS[t.abbreviation] || '#f7941d'
          return (
            <div key={t.id}
              className="card card-hover"
              onClick={() => navigate(`/teams/${t.id}`)}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', right: -8, top: -8, fontSize: 56, fontWeight: 900, opacity: 0.05 }}>{t.abbreviation}</div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-1px', color }}>{t.abbreviation}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{t.full_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>{t.city}</div>
              <div style={{ marginTop: 12 }}>
                <span className="badge badge-blue" style={{ fontSize: 10 }}>View Team →</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
