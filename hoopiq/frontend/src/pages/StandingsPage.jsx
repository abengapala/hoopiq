import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState } from '../components/UI'

function StandingsTable({ teams, navigate }) {
  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0, marginBottom: 24 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '36px 1fr 80px 50px 70px 70px 60px 70px',
        padding: '10px 16px', borderBottom: '1px solid var(--border)',
        fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace',
      }}>
        <span>#</span><span>TEAM</span><span>W-L</span><span>PCT</span><span>HOME</span><span>AWAY</span><span>L10</span><span>STREAK</span>
      </div>
      {teams.map((t, i) => (
        <div key={t.teamId}
          style={{
            display: 'grid', gridTemplateColumns: '36px 1fr 80px 50px 70px 70px 60px 70px',
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
            alignItems: 'center', cursor: 'pointer', transition: 'background .15s',
            background: i === 5 ? 'rgba(247,148,29,0.03)' : 'transparent',
          }}
          onClick={() => navigate(`/teams/${t.teamId}`)}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
          onMouseLeave={e => e.currentTarget.style.background = i === 5 ? 'rgba(247,148,29,0.03)' : 'transparent'}
        >
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: i < 6 ? 'var(--green)' : i < 10 ? 'var(--gold)' : 'var(--text3)' }}>{i + 1}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 500, fontSize: 13 }}>{t.teamCity} {t.teamName}</span>
            {i === 5 && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(247,148,29,.15)', color: 'var(--accent)', fontFamily: 'DM Mono, monospace' }}>PLAY-IN</span>}
          </div>
          <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace' }}>{t.wins}-{t.losses}</span>
          <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)' }}>.{Math.round(t.pct * 1000)}</span>
          <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text2)' }}>{t.homeRecord}</span>
          <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text2)' }}>{t.awayRecord}</span>
          <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text2)' }}>{t.last10}</span>
          <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', padding: '2px 6px', borderRadius: 4, display: 'inline-block',
            background: t.streak?.startsWith('W') ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)',
            color: t.streak?.startsWith('W') ? 'var(--green)' : 'var(--red)',
          }}>{t.streak}</span>
        </div>
      ))}
    </div>
  )
}

export default function StandingsPage() {
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useApi(api.getStandings)
  const [tab, setTab] = useState('East')

  if (loading) return <LoadingSpinner text="Loading standings..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const east = data?.east || []
  const west = data?.west || []

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, maxWidth: 240 }}>
        {['East', 'West'].map(c => (
          <button key={c} onClick={() => setTab(c)} style={{
            flex: 1, padding: '8px', borderRadius: 7, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', border: 'none', fontFamily: 'Space Grotesk, sans-serif',
            background: tab === c ? 'var(--bg4)' : 'transparent',
            color: tab === c ? 'var(--text)' : 'var(--text2)',
            transition: 'all .15s',
          }}>
            {c}ern Conference
          </button>
        ))}
      </div>

      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginBottom: 10, display: 'flex', gap: 16 }}>
        <span style={{ color: 'var(--green)' }}>■ Playoff seeded</span>
        <span style={{ color: 'var(--gold)' }}>■ Play-in eligible</span>
      </div>

      <StandingsTable teams={tab === 'East' ? east : west} navigate={navigate} />
    </div>
  )
}
