import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, PageHeader, TeamLogo, TEAM_COLORS } from '../components/UI'

// Mirrors the normalizer in UI.jsx
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

const medalColor = (rank) => {
  if (rank === 1) return '#CA8A04'
  if (rank === 2) return '#9CA3AF'
  if (rank === 3) return '#92400E'
  return 'var(--text3)'
}

export default function RankingsPage() {
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useApi(api.getPowerRankings)
  const [conf, setConf] = useState('All')

  if (loading) return <LoadingSpinner text="Computing power rankings..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const all = data?.rankings || []
  const filtered = conf === 'All' ? all : all.filter(t => t.conference === conf)

  return (
    <div className="fade-up">
      <PageHeader
        title="Power Rankings"
        subtitle="2024–25 season team power index"
        right={
          <div className="tabs">
            {['All', 'East', 'West'].map(c => (
              <button key={c} className={`tab ${conf === c ? 'active' : ''}`} onClick={() => setConf(c)}>
                {c === 'All' ? 'All' : c + 'ern'}
              </button>
            ))}
          </div>
        }
      />

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '44px 1fr 88px 52px 60px 72px 80px',
          alignItems: 'center',
          padding: '10px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg3)',
          borderRadius: '10px 10px 0 0',
        }}>
          {['#', 'Team', 'Record', 'PCT', 'L10', 'Streak', 'Power'].map(h => (
            <span key={h} className="label" style={{ fontSize: 10 }}>{h}</span>
          ))}
        </div>

        {filtered.map((t, i) => {
          // FIX: API returns "abbr" field; normalize so NO → NOP etc.
          const abbr = normalizeAbbr(t.abbr || t.teamAbbr || t.abbreviation || '')
          const color = TEAM_COLORS[abbr] || 'var(--text3)'
          const isWStreak = t.streak?.startsWith('W')

          return (
            <div
              key={t.teamId || i}
              onClick={() => navigate(`/teams/${t.teamId}`)}
              style={{
                display: 'grid',
                gridTemplateColumns: '44px 1fr 88px 52px 60px 72px 80px',
                alignItems: 'center',
                padding: '12px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}
            >
              {/* Rank */}
              <span style={{
                fontFamily: 'DM Mono, monospace', fontSize: 14,
                fontWeight: t.rank <= 3 ? 700 : 400,
                color: medalColor(t.rank),
              }}>{t.rank}</span>

              {/* Team */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                <TeamLogo abbr={abbr} size={30} />
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500, color: 'var(--text)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {t.teamCity || ''} {t.teamName || abbr}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
                    {t.conference}
                  </div>
                </div>
              </div>

              {/* Record */}
              <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace' }}>{t.wins}–{t.losses}</span>

              {/* PCT */}
              <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)' }}>
                .{Math.round((t.pct || 0) * 1000).toString().padStart(3, '0')}
              </span>

              {/* L10 */}
              <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)' }}>{t.last10 || '—'}</span>

              {/* Streak */}
              <span className={`streak-chip ${isWStreak ? 'streak-w' : 'streak-l'}`}>{t.streak || '—'}</span>

              {/* Power score */}
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 700, color }}>
                  {t.powerScore?.toFixed(0) ?? '—'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
