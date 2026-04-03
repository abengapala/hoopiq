import { useState } from 'react'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, PageHeader, TeamLogo, TEAM_COLORS } from '../components/UI'
import { useNavigate } from 'react-router-dom'

// Local abbr normalizer (mirrors UI.jsx internal — getLogoUrl/normalizeAbbr are not exported)
const ABBR_MAP = {
  NO: 'NOP', NOH: 'NOP', NOK: 'NOP',
  GS: 'GSW', SA: 'SAS', NY: 'NYK',
  OK: 'OKC', UTAH: 'UTA', PORT: 'POR',
  CHO: 'CHA', BOB: 'CHA', NJ: 'BKN', BK: 'BKN',
  WSH: 'WAS',
}
function norm(abbr) {
  if (!abbr) return ''
  const u = abbr.toUpperCase().trim()
  return ABBR_MAP[u] || u
}

const TEAM_NAMES = {
  ATL: 'Hawks',     BOS: 'Celtics',       BKN: 'Nets',          CHA: 'Hornets',
  CHI: 'Bulls',     CLE: 'Cavaliers',     DAL: 'Mavericks',     DEN: 'Nuggets',
  DET: 'Pistons',   GSW: 'Warriors',      HOU: 'Rockets',       IND: 'Pacers',
  LAC: 'Clippers',  LAL: 'Lakers',        MEM: 'Grizzlies',     MIA: 'Heat',
  MIL: 'Bucks',     MIN: 'Timberwolves',  NOP: 'Pelicans',      NYK: 'Knicks',
  OKC: 'Thunder',   ORL: 'Magic',         PHI: '76ers',         PHX: 'Suns',
  POR: 'Trail Blazers', SAC: 'Kings',     SAS: 'Spurs',         TOR: 'Raptors',
  UTA: 'Jazz',      WAS: 'Wizards',
}

function parseMatchup(matchup) {
  if (!matchup) return { away: '', home: '' }
  const parts = matchup.split('@')
  return {
    away: parts[0]?.trim() || '',
    home: parts[1]?.trim() || '',
  }
}

function TeamSide({ abbr, side }) {
  const canonical = norm(abbr)
  const color = TEAM_COLORS[canonical] || '#3b82f6'
  const fullName = TEAM_NAMES[canonical] || canonical
  const isHome = side === 'home'

  return (
    <div style={{
      display: 'flex',
      flexDirection: isHome ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    }}>
      {/* Logo bubble with team color tint */}
      <div style={{
        width: 54,
        height: 54,
        borderRadius: 14,
        background: `${color}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: `1.5px solid ${color}30`,
      }}>
        <TeamLogo abbr={abbr} size={38} />
      </div>

      {/* Names */}
      <div style={{ textAlign: isHome ? 'right' : 'left' }}>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: color,
          textTransform: 'uppercase',
          lineHeight: 1,
          marginBottom: 3,
        }}>
          {canonical}
        </div>
        <div style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text2)',
          lineHeight: 1.2,
        }}>
          {fullName}
        </div>
        <div style={{
          fontSize: 11,
          color: 'var(--text3)',
          marginTop: 2,
        }}>
          {isHome ? 'Home' : 'Away'}
        </div>
      </div>
    </div>
  )
}

function UpcomingGameCard({ game, onClick }) {
  const [hovered, setHovered] = useState(false)
  const { away, home } = parseMatchup(game.matchup)

  const awayCanonical = norm(away)
  const homeCanonical = norm(home)
  const awayColor = TEAM_COLORS[awayCanonical] || '#3b82f6'
  const homeColor = TEAM_COLORS[homeCanonical] || '#ef4444'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: 'var(--card)',
        border: `1px solid ${hovered ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 14,
        padding: '18px 20px',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}
    >
      {/* Dual-color top accent bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 3,
        background: `linear-gradient(90deg, ${awayColor} 0%, ${awayColor}80 49%, ${homeColor}80 51%, ${homeColor} 100%)`,
        borderRadius: '14px 14px 0 0',
      }} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 80px 1fr',
        alignItems: 'center',
        gap: 12,
      }}>
        {/* Away team */}
        <TeamSide abbr={away} side="away" />

        {/* Center info */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: 'var(--text3)',
            textTransform: 'uppercase',
          }}>
            {game.gameTime || 'TBD'}
          </div>
          <div style={{
            fontSize: 16,
            fontWeight: 800,
            color: 'var(--text3)',
            letterSpacing: '0.06em',
          }}>
            VS
          </div>
          {game.venue && (
            <div style={{
              fontSize: 10,
              color: 'var(--text3)',
              textAlign: 'center',
              lineHeight: 1.3,
              maxWidth: 76,
            }}>
              {game.venue}
            </div>
          )}
        </div>

        {/* Home team */}
        <TeamSide abbr={home} side="home" />
      </div>
    </div>
  )
}

export default function UpcomingPage() {
  const { data, loading, error, refetch } = useApi(() => api.getUpcomingGames(7))
  const navigate = useNavigate()

  if (loading) return <LoadingSpinner text="Fetching schedule..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const games = data?.games || []

  if (games.length === 0) {
    return (
      <div>
        <PageHeader title="Upcoming Games" subtitle="Next 7 days" />
        <div style={{ textAlign: 'center', padding: '72px 20px', color: 'var(--text3)', fontSize: 14 }}>
          No upcoming games found.
        </div>
      </div>
    )
  }

  // Group by date label
  const grouped = games.reduce((acc, g) => {
    const key = g.dateLabel || g.date
    if (!acc[key]) acc[key] = []
    acc[key].push(g)
    return acc
  }, {})

  return (
    <div className="fade-up">
      <PageHeader title="Upcoming Games" subtitle="Next 7 days" />

      {Object.entries(grouped).map(([date, dayGames]) => (
        <div key={date} style={{ marginBottom: 32 }}>

          {/* Day header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 3, height: 18, borderRadius: 4, background: 'var(--accent)' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.01em' }}>
                {date}
              </span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
              {dayGames.length} game{dayGames.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Cards grid — 2 per row on wide screens, 1 on mobile */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 12,
          }}>
            {dayGames.map((g, i) => (
              <UpcomingGameCard
                key={i}
                game={g}
                onClick={() => navigate(`/game/${g.gameId}`)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
