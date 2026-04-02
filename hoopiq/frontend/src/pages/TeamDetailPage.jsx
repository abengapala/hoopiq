import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, StatCard, SectionHeader } from '../components/UI'

function safe(val) {
  if (val === null || val === undefined) return ''
  if (typeof val === 'object') return val.displayValue ?? val.value ?? ''
  return String(val)
}

export default function TeamDetailPage() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useApi(() => api.getTeam(teamId), [teamId])

  if (loading) return <LoadingSpinner text="Loading team data..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return null

  const { team, stats, roster, last5, streak } = data

  return (
    <div style={{ maxWidth: 900 }}>
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text3)', cursor: 'pointer', marginBottom: 20, border: 'none', background: 'none', padding: 0 }}>
        ← Back
      </button>

      {/* Hero */}
      <div className="card" style={{ marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, fontSize: 160, fontWeight: 900, opacity: 0.03, lineHeight: 1 }}>{safe(team.abbreviation)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ fontSize: 60, fontWeight: 900, letterSpacing: '-3px', color: team.color ? `#${safe(team.color)}` : 'var(--accent)' }}>{safe(team.abbreviation)}</div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{safe(team.full_name)}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginTop: 4 }}>{safe(team.city)}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {stats.wins !== undefined && <span className="badge badge-accent">{stats.wins}-{stats.losses}</span>}
              {streak && <span className={`badge mono ${String(streak).startsWith('W') ? 'streak-w' : 'streak-l'}`}>{streak}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Season stats */}
      {stats.wins !== undefined && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          <StatCard label="Record" value={`${stats.wins}-${stats.losses}`} />
          <StatCard label="Win %" value={stats.pct?.toFixed(3)} />
          <StatCard label="+/-" value={stats.plusMinus?.toFixed(1)} color={stats.plusMinus > 0 ? 'var(--green)' : 'var(--red)'} />
        </div>
      )}

      {/* Last 5 games */}
      {last5?.length > 0 && (
        <>
          <SectionHeader title="Last 5 Games" />
          <div className="card" style={{ overflow: 'hidden', padding: 0, marginBottom: 20 }}>
            {last5.map((g, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 40px 60px', padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>{safe(g.GAME_DATE)}</span>
                <span style={{ color: 'var(--text2)' }}>{safe(g.MATCHUP)}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: g.WL === 'W' ? 'var(--green)' : 'var(--red)', fontFamily: 'DM Mono, monospace' }}>{safe(g.WL)}</span>
                <span style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>{safe(g.PTS)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Roster */}
      <SectionHeader title={`Roster · ${roster?.length || 0}`} />
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 50px 60px 80px 50px', padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
          <span>#</span><span>PLAYER</span><span>POS</span><span>HT</span><span>WT</span><span style={{ textAlign: 'right' }}>AGE</span>
        </div>
        {roster?.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No roster data available.</div>
        )}
        {(roster || []).map((p, i) => (
          <div key={i}
            style={{ display: 'grid', gridTemplateColumns: '40px 1fr 50px 60px 80px 50px', padding: '11px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, alignItems: 'center', cursor: 'pointer', transition: 'background .15s' }}
            onClick={() => navigate(`/players/${p.playerId}`)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>{safe(p.number)}</span>
            <span style={{ fontWeight: 500 }}>{safe(p.name)}</span>
            <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text3)' }}>{safe(p.position)}</span>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>{safe(p.height)}</span>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>{safe(p.weight)}</span>
            <span style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{safe(p.age)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}