import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, PageHeader, TeamLogo } from "../components/UI"

// Mirrors the normalizer in UI.jsx so abbrs resolve correctly
// (e.g. ESPN standings API returns "NO" not "NOP" for New Orleans)
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

function StandingsTable({ teams, navigate }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '32px 2fr 80px 52px 80px 80px 56px 80px',
        alignItems: 'center',
        padding: '10px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg3)',
        borderRadius: '10px 10px 0 0',
      }}>
        {['#', 'Team', 'W–L', 'PCT', 'Home', 'Away', 'L10', 'Streak'].map(h => (
          <span key={h} className="label" style={{ fontSize: 10 }}>{h}</span>
        ))}
      </div>

      {teams.map((t, i) => {
        const isPlayoff = i < 6
        const isPlayin = i >= 6 && i < 10
        const isWStreak = t.streak?.startsWith('W')

        // FIX: API returns "abbr" field; normalize for ESPN CDN (NO → NOP etc.)
        const abbr = normalizeAbbr(t.abbr || t.teamAbbr || t.abbreviation || t.teamTricode || '')

        return (
          <div
            key={t.teamId || i}
            onClick={() => navigate(`/teams/${t.teamId}`)}
            style={{
              display: 'grid',
              gridTemplateColumns: '32px 2fr 80px 52px 80px 80px 56px 80px',
              alignItems: 'center',
              padding: '12px 20px',
              borderBottom: i < teams.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: 'pointer',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
          >
            {/* Rank */}
            <span style={{
              fontFamily: 'DM Mono, monospace', fontSize: 12,
              color: isPlayoff ? 'var(--green)' : isPlayin ? 'var(--gold)' : 'var(--text3)',
              fontWeight: i < 6 ? 600 : 400,
            }}>{i + 1}</span>

            {/* Team name + logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
              <TeamLogo abbr={abbr} size={28} />
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 500, color: 'var(--text)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {t.teamCity || ''} {t.teamName || abbr}
                </div>
                {i === 5 && (
                  <span style={{
                    fontSize: 9, padding: '1px 5px', borderRadius: 3,
                    background: 'var(--gold-bg)', color: 'var(--gold)',
                    fontFamily: 'DM Mono, monospace',
                    border: '1px solid rgba(202,138,4,.15)',
                  }}>PLAY-IN</span>
                )}
              </div>
            </div>

            {/* W-L */}
            <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace' }}>{t.wins}–{t.losses}</span>

            {/* PCT */}
            <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)' }}>
              .{Math.round((t.pct || 0) * 1000).toString().padStart(3, '0')}
            </span>

            {/* Home */}
            <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)' }}>{t.homeRecord || '—'}</span>

            {/* Away */}
            <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)' }}>{t.awayRecord || '—'}</span>

            {/* L10 */}
            <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)' }}>{t.last10 || '—'}</span>

            {/* Streak */}
            <span className={`streak-chip ${isWStreak ? 'streak-w' : 'streak-l'}`}>
              {t.streak || '—'}
            </span>
          </div>
        )
      })}
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
    <div className="fade-up">
      <PageHeader
        title="Standings"
        subtitle="2025–26 NBA Regular Season"
        right={
          <div className="tabs">
            <button className={`tab ${tab === 'East' ? 'active' : ''}`} onClick={() => setTab('East')}>Eastern</button>
            <button className={`tab ${tab === 'West' ? 'active' : ''}`} onClick={() => setTab('West')}>Western</button>
          </div>
        }
      />

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
        {[
          { color: 'var(--green)', label: 'Playoff seeded (1–6)' },
          { color: 'var(--gold)', label: 'Play-in eligible (7–10)' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{label}</span>
          </div>
        ))}
      </div>

      <StandingsTable teams={tab === 'East' ? east : west} navigate={navigate} />
    </div>
  )
}
