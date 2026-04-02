import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { WinProbBar, StatsRow, SectionHeader, LoadingSpinner, ErrorState } from '../components/UI'
import AIAnalysis from '../components/AIAnalysis'

export default function GameDetailPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useApi(() => api.getGameDetail(gameId), [gameId])

  if (loading) return <LoadingSpinner text="Loading game data..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return null

  const home = data.homeTeam
  const away = data.awayTeam
  const prob = data.winProbability || { home: 50, away: 50 }
  const hs = home.statistics || {}
  const as_ = away.statistics || {}

  const allPlayers = [
    ...((home.players || []).map(p => ({ ...p, teamAbbr: home.abbr, side: 'home' }))),
    ...((away.players || []).map(p => ({ ...p, teamAbbr: away.abbr, side: 'away' }))),
  ].filter(p => p.status === 'ACTIVE' || p.minutes !== '0:00')

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Back button */}
      <button onClick={() => navigate(-1)} style={{
        display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
        color: 'var(--text3)', cursor: 'pointer', marginBottom: 20,
        border: 'none', background: 'none', padding: 0, transition: 'color .15s',
      }}
        onMouseEnter={e => e.target.style.color = 'var(--text)'}
        onMouseLeave={e => e.target.style.color = 'var(--text3)'}
      >
        ← Back to games
      </button>

      {/* Match header */}
      <div className="card" style={{ marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="badge badge-accent">{data.statusText}</span>
          {data.isLive && <span className="badge badge-live">● LIVE · Q{data.period}</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginBottom: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-3px' }}>{home.abbr}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{home.city} {home.name}</div>
            {data.isLive && <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--text)', marginTop: 8 }}>{home.score}</div>}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text3)' }}>VS</div>
            {data.isLive && <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginTop: 4 }}>{data.gameClock}</div>}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-3px' }}>{away.abbr}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{away.city} {away.name}</div>
            {data.isLive && <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--text)', marginTop: 8 }}>{away.score}</div>}
          </div>
        </div>

        <WinProbBar homeProb={prob.home} awayProb={prob.away} homeAbbr={home.abbr} awayAbbr={away.abbr} size="lg" />
      </div>

      {/* AI Analysis */}
      <AIAnalysis gameId={gameId} homeAbbr={home.abbr} awayAbbr={away.abbr} homeProb={prob.home} />

      {/* Team Comparison */}
      <SectionHeader title="Team Comparison" right={
        <div style={{ display: 'flex', gap: 14, fontSize: 12, fontFamily: 'DM Mono, monospace' }}>
          <span style={{ color: 'var(--accent)' }}>■ {home.abbr}</span>
          <span style={{ color: 'var(--blue)' }}>■ {away.abbr}</span>
        </div>
      } />
      <div className="card" style={{ marginBottom: 20 }}>
        {hs.fgPct !== undefined && <StatsRow label="FG%" homeVal={hs.fgPct} awayVal={as_.fgPct} format={v => `${v}%`} />}
        {hs.threePct !== undefined && <StatsRow label="3PT%" homeVal={hs.threePct} awayVal={as_.threePct} format={v => `${v}%`} />}
        {hs.rebounds !== undefined && <StatsRow label="Rebounds" homeVal={hs.rebounds} awayVal={as_.rebounds} />}
        {hs.assists !== undefined && <StatsRow label="Assists" homeVal={hs.assists} awayVal={as_.assists} />}
        {hs.turnovers !== undefined && <StatsRow label="Turnovers" homeVal={hs.turnovers} awayVal={as_.turnovers} higherBetter={false} />}
        {hs.steals !== undefined && <StatsRow label="Steals" homeVal={hs.steals} awayVal={as_.steals} />}
        {hs.blocks !== undefined && <StatsRow label="Blocks" homeVal={hs.blocks} awayVal={as_.blocks} />}
        {hs.pointsInPaint !== undefined && <StatsRow label="Paint Pts" homeVal={hs.pointsInPaint} awayVal={as_.pointsInPaint} />}
        {hs.fastBreakPoints !== undefined && <StatsRow label="Fast Break" homeVal={hs.fastBreakPoints} awayVal={as_.fastBreakPoints} />}
      </div>

      {/* Player Stats */}
      <SectionHeader title="Player Stats" />
      <div className="card" style={{ overflow: 'hidden', padding: 0, marginBottom: 20 }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 45px 45px 45px 50px 55px',
          padding: '10px 16px', borderBottom: '1px solid var(--border)',
          fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace',
        }}>
          <span>PLAYER</span><span style={{ textAlign: 'right' }}>PTS</span>
          <span style={{ textAlign: 'right' }}>REB</span><span style={{ textAlign: 'right' }}>AST</span>
          <span style={{ textAlign: 'right' }}>FG%</span><span style={{ textAlign: 'right' }}>+/-</span>
        </div>

        {allPlayers.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
            Player stats available once the game tips off.
          </div>
        )}

        {allPlayers.map((p, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr 45px 45px 45px 50px 55px',
            padding: '11px 16px', borderBottom: '1px solid var(--border)',
            alignItems: 'center', fontSize: 13,
            background: 'transparent', transition: 'background .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.side === 'home' ? 'var(--accent)' : 'var(--blue)', flexShrink: 0 }} />
              <span style={{ fontWeight: 500 }}>{p.name}</span>
              <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--text3)', background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3 }}>{p.position}</span>
            </div>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--text2)', textAlign: 'right' }}>{p.points}</span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--text2)', textAlign: 'right' }}>{p.rebounds}</span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--text2)', textAlign: 'right' }}>{p.assists}</span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--text2)', textAlign: 'right' }}>{p.fgPct}%</span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, textAlign: 'right', color: p.plusMinus > 0 ? 'var(--green)' : p.plusMinus < 0 ? 'var(--red)' : 'var(--text3)' }}>
              {p.plusMinus > 0 ? `+${p.plusMinus}` : p.plusMinus}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
