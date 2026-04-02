import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, StatCard, SectionHeader } from '../components/UI'

export default function PlayerDetailPage() {
  const { playerId } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useApi(() => api.getPlayer(parseInt(playerId)), [playerId])

  if (loading) return <LoadingSpinner text="Loading player data..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return null

  const { player, seasonStats, last5 } = data
  const s = seasonStats || {}

  return (
    <div style={{ maxWidth: 800 }}>
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text3)', cursor: 'pointer', marginBottom: 20, border: 'none', background: 'none', padding: 0 }}>
        ← Back
      </button>

      {/* Hero */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, flexShrink: 0 }}>
          {player.firstName?.[0]}{player.lastName?.[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{player.fullName}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{player.teamName} · {player.position}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {player.jersey && <span className="badge badge-accent">#{player.jersey}</span>}
            {player.height && <span className="badge badge-blue">{player.height}</span>}
            {player.country && <span className="badge" style={{ background: 'var(--bg3)', color: 'var(--text3)' }}>{player.country}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>DRAFT</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{player.draftYear} Rd{player.draftRound} #{player.draftNumber}</div>
          {player.school && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{player.school}</div>}
        </div>
      </div>

      {/* Season stats */}
      {s.pts !== undefined && (
        <>
          <SectionHeader title="2024-25 Season Averages" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
            <StatCard label="PPG" value={s.pts} color="var(--accent)" />
            <StatCard label="RPG" value={s.reb} />
            <StatCard label="APG" value={s.ast} />
            <StatCard label="FG%" value={`${s.fgPct}%`} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
            <StatCard label="3P%" value={`${s.fg3Pct}%`} />
            <StatCard label="FT%" value={`${s.ftPct}%`} />
            <StatCard label="STL" value={s.stl} />
            <StatCard label="+/-" value={s.plusMinus} color={s.plusMinus > 0 ? 'var(--green)' : 'var(--red)'} />
          </div>
        </>
      )}

      {/* Last 5 games */}
      {last5?.length > 0 && (
        <>
          <SectionHeader title="Last 5 Games" />
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 40px 45px 45px 45px', padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
              <span>DATE</span><span>MATCHUP</span><span>W/L</span><span style={{ textAlign: 'right' }}>PTS</span><span style={{ textAlign: 'right' }}>REB</span><span style={{ textAlign: 'right' }}>AST</span>
            </div>
            {last5.map((g, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 40px 45px 45px 45px', padding: '11px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>{g.GAME_DATE}</span>
                <span style={{ color: 'var(--text2)', fontSize: 12 }}>{g.MATCHUP}</span>
                <span style={{ fontWeight: 600, fontFamily: 'DM Mono, monospace', color: g.WL === 'W' ? 'var(--green)' : 'var(--red)' }}>{g.WL}</span>
                <span style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>{g.PTS}</span>
                <span style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', color: 'var(--text2)' }}>{g.REB}</span>
                <span style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', color: 'var(--text2)' }}>{g.AST}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
