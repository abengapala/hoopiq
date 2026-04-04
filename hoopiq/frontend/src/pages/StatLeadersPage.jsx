import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, PageHeader, TeamLogo } from "../components/UI"

const ABBR_NORMALIZE = {
  NO: 'NOP', NOH: 'NOP', NOK: 'NOP',
  GS: 'GSW', SA: 'SAS', NY: 'NYK', OK: 'OKC',
  UTAH: 'UTA', PORT: 'POR', NJ: 'BKN', BK: 'BKN',
  WSH: 'WAS', CHO: 'CHA', BOB: 'CHA',
}
function normalizeAbbr(raw) {
  if (!raw) return ''
  const upper = raw.toUpperCase().trim()
  return ABBR_NORMALIZE[upper] || upper
}

const STATS = ['PTS', 'REB', 'AST', 'STL', 'BLK', 'FG_PCT', 'FG3_PCT']
const STAT_LABELS = {
  PTS: 'Points', REB: 'Rebounds', AST: 'Assists',
  STL: 'Steals', BLK: 'Blocks', FG_PCT: 'FG%', FG3_PCT: '3PT%',
}
const STAT_KEY = {
  PTS: 'pts', REB: 'reb', AST: 'ast',
  STL: 'stl', BLK: 'blk', FG_PCT: 'fgPct', FG3_PCT: 'fg3Pct',
}
function formatStat(val, statTab) {
  if (val == null || val === 0) return '—'
  if (statTab === 'FG_PCT' || statTab === 'FG3_PCT') {
    return `${parseFloat(val).toFixed(1)}%`
  }
  return parseFloat(val).toFixed(1)
}

export default function StatLeadersPage() {
  const navigate = useNavigate()
  const [stat, setStat] = useState('PTS')
  const { data, loading, error, refetch } = useApi(() => api.getStatLeaders(stat), [stat])

  const leaders = data?.leaders || []
  const statKey = STAT_KEY[stat]

  return (
    <div className="fade-up">
      <PageHeader title="Stat Leaders" subtitle="2025–26 NBA season averages" />

      {/* Stat selector — wraps naturally on mobile */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {STATS.map(s => (
          <button
            key={s}
            onClick={() => setStat(s)}
            className="btn"
            style={{
              background: stat === s ? 'var(--text)' : 'var(--bg2)',
              color: stat === s ? 'var(--bg)' : 'var(--text2)',
              borderColor: stat === s ? 'var(--text)' : 'var(--border)',
              padding: '7px 12px',
              fontSize: 12,
            }}
          >
            {STAT_LABELS[s]}
          </button>
        ))}
      </div>

      {loading && <LoadingSpinner text={`Loading ${STAT_LABELS[stat]} leaders...`} />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && leaders.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 16px',
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 20,
            letterSpacing: '0.05em', color: 'var(--text2)',
          }}>No data available</div>
        </div>
      )}

      {!loading && !error && leaders.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Scrollable on mobile */}
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ minWidth: 480 }}>
              {/* Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 80px 72px 52px 52px 52px',
                alignItems: 'center',
                padding: '10px 16px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg3)',
                borderRadius: '10px 10px 0 0',
              }}>
                {['#', 'Player', 'Team', STAT_LABELS[stat], 'PTS', 'REB', 'AST'].map((h, idx) => (
                  <span key={h + idx} className="label" style={{
                    fontSize: 10,
                    textAlign: idx < 3 ? 'left' : 'right',
                  }}>{h}</span>
                ))}
              </div>

              {leaders.map((p, i) => {
                const abbr = normalizeAbbr(p.teamAbbr || '')
                return (
                  <div
                    key={p.playerId || i}
                    onClick={() => navigate(`/players/${p.playerId}`)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 1fr 80px 72px 52px 52px 52px',
                      alignItems: 'center',
                      padding: '11px 16px',
                      borderBottom: i < leaders.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <span style={{
                      fontFamily: 'DM Mono, monospace', fontSize: 13,
                      fontWeight: i < 3 ? 700 : 400,
                      color: i === 0 ? '#CA8A04' : i === 1 ? '#9CA3AF' : i === 2 ? '#92400E' : 'var(--text3)',
                    }}>{i + 1}</span>

                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{p.playerName}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginTop: 1 }}>
                        {p.gp > 0 ? `${p.gp} GP` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <TeamLogo abbr={abbr} size={20} />
                      <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text3)' }}>
                        {abbr}
                      </span>
                    </div>

                    <span style={{
                      fontFamily: 'DM Mono, monospace', fontSize: 15,
                      fontWeight: 700, color: 'var(--text)', textAlign: 'right',
                    }}>
                      {formatStat(p[statKey], stat)}
                    </span>

                    <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)', textAlign: 'right' }}>
                      {p.pts > 0 ? p.pts : '—'}
                    </span>
                    <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)', textAlign: 'right' }}>
                      {p.reb > 0 ? p.reb : '—'}
                    </span>
                    <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)', textAlign: 'right' }}>
                      {p.ast > 0 ? p.ast : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}