import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, StatCard, SectionHeader, TeamLogo } from '../components/UI'

export default function PlayerDetailPage() {
  const { playerId } = useParams()
  const navigate = useNavigate()

  // Pass playerId as string — ESPN IDs are strings, parseInt can corrupt large IDs
  const { data, loading, error, refetch } = useApi(
    () => api.getPlayer(playerId),
    [playerId]
  )

  if (loading) return <LoadingSpinner text="Loading player data..." />
  if (error)   return <ErrorState message={error} onRetry={refetch} />
  if (!data)   return null

  const { player, seasonStats, last5 } = data
  const s = seasonStats || {}
  const hasStats = s.gp > 0

  return (
    <div className="fade-up" style={{ maxWidth: 860 }}>
      {/* Back */}
      <button onClick={() => navigate(-1)} className="btn" style={{ marginBottom: 24, gap: 6 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back
      </button>

      {/* Hero Card */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 24, alignItems: 'center', padding: '28px 32px' }}>
        {/* Headshot */}
        <div style={{ flexShrink: 0, position: 'relative' }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            overflow: 'hidden',
            background: 'var(--bg4)',
            border: '2px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {player.headshot ? (
              <img
                src={player.headshot}
                alt={player.fullName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <div style={{
              display: player.headshot ? 'none' : 'flex',
              alignItems: 'center', justifyContent: 'center',
              width: '100%', height: '100%',
              fontSize: 26, fontFamily: 'Syne, sans-serif', fontWeight: 700,
              color: 'var(--text2)',
            }}>
              {player.firstName?.[0]}{player.lastName?.[0]}
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="display" style={{ fontSize: 26, color: 'var(--text)', marginBottom: 4, lineHeight: 1.2 }}>
            {player.fullName}
          </h1>

          {/* Team + position row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {player.teamAbbr && (
              <TeamLogo abbr={player.teamAbbr} size={20} />
            )}
            <span style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>
              {player.teamName}
            </span>
            {player.position && (
              <>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span style={{ fontSize: 13, color: 'var(--text3)' }}>{player.position}</span>
              </>
            )}
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {player.jersey   && <span className="badge badge-neu">#{player.jersey}</span>}
            {player.height   && <span className="badge badge-neu">{player.height}</span>}
            {player.weight   && <span className="badge badge-neu">{player.weight}</span>}
            {player.age      && <span className="badge badge-neu">Age {player.age}</span>}
            {player.country  && <span className="badge badge-neu">{player.country}</span>}
            {player.experience !== '' && player.experience !== undefined &&
              <span className="badge badge-neu">Yr {player.experience}</span>}
          </div>
        </div>

        {/* Draft + College */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {player.draftYear && (
            <div style={{ marginBottom: 8 }}>
              <div className="label" style={{ marginBottom: 4 }}>Draft</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                {player.draftYear}
              </div>
              {player.draftRound && (
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                  Rd {player.draftRound} · Pick #{player.draftNumber}
                </div>
              )}
            </div>
          )}
          {player.college && (
            <div>
              <div className="label" style={{ marginBottom: 2 }}>College</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{player.college}</div>
            </div>
          )}
        </div>
      </div>

      {/* Season Stats */}
      {hasStats ? (
        <>
          <SectionHeader title="Season Averages" subtitle={`${s.gp} GP`} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
            <StatCard label="PPG"  value={s.pts}  />
            <StatCard label="RPG"  value={s.reb}  />
            <StatCard label="APG"  value={s.ast}  />
            <StatCard label="MPG"  value={s.mins} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
            <StatCard label="FG%"  value={`${s.fgPct}%`}  />
            <StatCard label="3P%"  value={`${s.fg3Pct}%`} />
            <StatCard label="FT%"  value={`${s.ftPct}%`}  />
            <StatCard label="TOV"  value={s.tov}  />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 28 }}>
            <StatCard label="STL"  value={s.stl} />
            <StatCard label="BLK"  value={s.blk} />
          </div>
        </>
      ) : (
        <div className="card" style={{ marginBottom: 24, padding: '20px 24px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
          Season stats not available for this player
        </div>
      )}

      {/* Last 5 Games */}
      {last5?.length > 0 && (
        <>
          <SectionHeader title="Last 5 Games" />
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 28 }}>
            <div className="table-head" style={{ gridTemplateColumns: '100px 1fr 44px 52px 52px 52px 52px' }}>
              {['Date', 'Matchup', 'W/L', 'PTS', 'REB', 'AST', '+/−'].map(h => (
                <span key={h} className="label" style={{
                  fontSize: 10,
                  textAlign: h === 'Date' || h === 'Matchup' ? 'left' : 'right'
                }}>{h}</span>
              ))}
            </div>
            {last5.map((g, i) => (
              <div key={i} className="table-row" style={{
                gridTemplateColumns: '100px 1fr 44px 52px 52px 52px 52px',
                cursor: 'default'
              }}>
                <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>{g.GAME_DATE}</span>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{g.MATCHUP}</span>
                <span style={{
                  fontSize: 12, fontWeight: 600, fontFamily: 'DM Mono, monospace',
                  color: g.WL === 'W' ? 'var(--green)' : 'var(--red)', textAlign: 'right'
                }}>{g.WL}</span>
                <span style={{ fontSize: 13, fontFamily: 'DM Mono, monospace', fontWeight: 600, textAlign: 'right' }}>{g.PTS}</span>
                <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)', textAlign: 'right' }}>{g.REB}</span>
                <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)', textAlign: 'right' }}>{g.AST}</span>
                <span style={{
                  fontSize: 12, fontFamily: 'DM Mono, monospace', textAlign: 'right',
                  color: parseFloat(g.PLUS_MINUS) > 0 ? 'var(--green)' : 'var(--red)'
                }}>
                  {g.PLUS_MINUS > 0 ? '+' : ''}{g.PLUS_MINUS}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}