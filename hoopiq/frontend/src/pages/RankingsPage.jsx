import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, PageHeader, TeamLogo, TEAM_COLORS } from '../components/UI'

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
        subtitle="2025–26 season team power index"
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
        {/* Scrollable wrapper for mobile */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: 520 }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 80px 48px 56px 68px 72px',
              alignItems: 'center',
              padding: '10px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg3)',
              borderRadius: '10px 10px 0 0',
            }}>
              {['#', 'Team', 'Record', 'PCT', 'L10', 'Streak', 'Power'].map(h => (
                <span key={h} className="label" style={{ fontSize: 10 }}>{h}</span>
              ))}
            </div>

            {filtered.map((t, i) => {
              const abbr = normalizeAbbr(t.abbr || t.teamAbbr || t.abbreviation || '')
              const color = TEAM_COLORS[abbr] || 'var(--text3)'
              const isWStreak = t.streak?.startsWith('W')

              return (
                <div
                  key={t.teamId || i}
                  onClick={() => navigate(`/teams/${t.teamId}`)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 80px 48px 56px 68px 72px',
                    alignItems: 'center',
                    padding: '11px 16px',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <span style={{
                    fontFamily: 'DM Mono, monospace', fontSize: 13,
                    fontWeight: t.rank <= 3 ? 700 : 400,
                    color: medalColor(t.rank),
                  }}>{t.rank}</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <TeamLogo abbr={abbr} size={28} />
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

                  <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace' }}>{t.wins}–{t.losses}</span>
                  <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)' }}>
                    .{Math.round((t.pct || 0) * 1000).toString().padStart(3, '0')}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text2)' }}>{t.last10 || '—'}</span>
                  <span className={`streak-chip ${isWStreak ? 'streak-w' : 'streak-l'}`}>{t.streak || '—'}</span>

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
      </div>
    </div>
  )
}