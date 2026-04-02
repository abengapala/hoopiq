import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, SectionHeader } from '../components/UI'

const STATS = ['PTS', 'REB', 'AST', 'STL', 'BLK', 'FG_PCT', 'FG3_PCT']
const STAT_LABELS = { PTS: 'Points', REB: 'Rebounds', AST: 'Assists', STL: 'Steals', BLK: 'Blocks', FG_PCT: 'FG%', FG3_PCT: '3PT%' }

export default function StatLeadersPage() {
  const navigate = useNavigate()
  const [stat, setStat] = useState('PTS')
  const { data, loading, error, refetch } = useApi(() => api.getStatLeaders(stat), [stat])

  const leaders = data?.leaders || []
  const statKey = { PTS: 'pts', REB: 'reb', AST: 'ast', STL: 'stl', BLK: 'blk', FG_PCT: 'fgPct', FG3_PCT: 'fg3Pct' }[stat]

  return (
    <div>
      {/* Stat selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {STATS.map(s => (
          <button key={s} onClick={() => setStat(s)} style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', border: '1px solid var(--border)',
            fontFamily: 'Space Grotesk, sans-serif',
            background: stat === s ? 'var(--accent)' : 'var(--bg2)',
            color: stat === s ? 'white' : 'var(--text2)',
            transition: 'all .15s',
          }}>{STAT_LABELS[s]}</button>
        ))}
      </div>

      <SectionHeader title={`${STAT_LABELS[stat]} Leaders — 2024-25 Season`} />

      {loading && <LoadingSpinner text={`Loading ${STAT_LABELS[stat]} leaders...`} />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '40px 1fr 70px 55px 55px 55px 55px',
            padding: '10px 16px', borderBottom: '1px solid var(--border)',
            fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace',
          }}>
            <span>RK</span><span>PLAYER</span><span>TEAM</span>
            <span style={{ textAlign: 'right' }}>{STAT_LABELS[stat]}</span>
            <span style={{ textAlign: 'right' }}>PTS</span>
            <span style={{ textAlign: 'right' }}>REB</span>
            <span style={{ textAlign: 'right' }}>AST</span>
          </div>

          {leaders.map((p, i) => (
            <div key={p.playerId}
              style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 70px 55px 55px 55px 55px',
                padding: '13px 16px', borderBottom: '1px solid var(--border)',
                alignItems: 'center', cursor: 'pointer', transition: 'background .15s',
              }}
              onClick={() => navigate(`/players/${p.playerId}`)}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: i < 3 ? 'var(--gold)' : 'var(--text3)', fontWeight: i < 3 ? 700 : 400 }}>{i + 1}</span>
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{p.playerName}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: 'DM Mono, monospace' }}>{p.gp} GP</div>
              </div>
              <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)' }}>{p.teamAbbr}</span>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: 'var(--accent)', textAlign: 'right' }}>
                {p[statKey]}
              </span>
              <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)', textAlign: 'right' }}>{p.pts}</span>
              <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)', textAlign: 'right' }}>{p.reb}</span>
              <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)', textAlign: 'right' }}>{p.ast}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
