import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, PageHeader, TeamLogo } from "../components/UI"

const TEAM_COLORS = {
  ATL: { primary: '#E03A3E', secondary: '#C1D32F' },
  BOS: { primary: '#007A33', secondary: '#BA9653' },
  BKN: { primary: '#000000', secondary: '#FFFFFF' },
  CHA: { primary: '#1D1160', secondary: '#00788C' },
  CHI: { primary: '#CE1141', secondary: '#000000' },
  CLE: { primary: '#860038', secondary: '#041E42' },
  DAL: { primary: '#00538C', secondary: '#002B5E' },
  DEN: { primary: '#0E2240', secondary: '#FEC524' },
  DET: { primary: '#C8102E', secondary: '#1D42BA' },
  GSW: { primary: '#1D428A', secondary: '#FFC72C' },
  HOU: { primary: '#CE1141', secondary: '#000000' },
  IND: { primary: '#002D62', secondary: '#FDBB30' },
  LAC: { primary: '#C8102E', secondary: '#1D428A' },
  LAL: { primary: '#552583', secondary: '#FDB927' },
  MEM: { primary: '#5D76A9', secondary: '#12173F' },
  MIA: { primary: '#98002E', secondary: '#F9A01B' },
  MIL: { primary: '#00471B', secondary: '#EEE1C6' },
  MIN: { primary: '#0C2340', secondary: '#236192' },
  NOP: { primary: '#0C2340', secondary: '#C8102E' },
  NYK: { primary: '#006BB6', secondary: '#F58426' },
  OKC: { primary: '#007AC1', secondary: '#EF3B24' },
  ORL: { primary: '#0077C0', secondary: '#C4CED4' },
  PHI: { primary: '#006BB6', secondary: '#ED174C' },
  PHX: { primary: '#1D1160', secondary: '#E56020' },
  POR: { primary: '#E03A3E', secondary: '#000000' },
  SAC: { primary: '#5A2D81', secondary: '#63727A' },
  SAS: { primary: '#C4CED4', secondary: '#000000' },
  TOR: { primary: '#CE1141', secondary: '#000000' },
  UTA: { primary: '#002B5C', secondary: '#00471B' },
  WAS: { primary: '#002B5C', secondary: '#E31837' },
}

// ✅ FIXED: ColorSwatch component added
const ColorSwatch = ({ hex }) => (
  <div
    style={{
      width: 12,
      height: 12,
      borderRadius: 4,
      background: hex,
      border: '1px solid var(--border)'
    }}
  />
)

export default function TeamsPage() {
  const navigate = useNavigate()
  const { data, loading, error } = useApi(api.getAllTeams)
  const [search, setSearch] = useState('')

  if (loading) return <LoadingSpinner text="Loading teams..." />
  if (error) return <ErrorState message={error} />

  const teams = (data?.teams || []).filter(t =>
    !search ||
    t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.abbreviation?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fade-up">
      <PageHeader
        title="NBA Teams"
        subtitle="Explore team identities and color palettes"
        right={
          <div style={{ position: 'relative' }}>
            <svg
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text3)',
                pointerEvents: 'none'
              }}
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>

            <input
              className="input"
              style={{ width: 220, paddingLeft: 30 }}
              placeholder="Filter teams..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        }
      />

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {teams.map((t, i) => {
          const abbr = t.abbreviation || ''
          const colors = TEAM_COLORS[abbr] || { primary: '#888', secondary: '#ccc' }

          return (
            <div
              key={t.id || i}
              onClick={() => navigate(`/teams/${t.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 20px',
                borderBottom: i < teams.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Team Logo */}
              <TeamLogo abbr={abbr} size={40} />

              {/* Abbreviation */}
              <div
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: '-0.02em',
                  color: colors.primary,
                  width: 36,
                  flexShrink: 0,
                }}
              >
                {abbr}
              </div>

              {/* Name */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                  {t.full_name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>
                  {t.city}
                </div>
              </div>

              {/* Color Swatches */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <ColorSwatch hex={colors.primary} />
                <ColorSwatch hex={colors.secondary} />
              </div>

              {/* Arrow */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          )
        })}
      </div>
    </div>
  )
} 