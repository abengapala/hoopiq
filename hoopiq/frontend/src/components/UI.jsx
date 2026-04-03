import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

/* ─────────────────────────────────────────
   NBA Team Primary Colors
───────────────────────────────────────── */
export const TEAM_COLORS = {
  ATL: '#E03A3E', BOS: '#007A33', BKN: '#AAAAAA', CHA: '#1D1160',
  CHI: '#CE1141', CLE: '#860038', DAL: '#00538C', DEN: '#FEC524',
  DET: '#C8102E', GSW: '#1D428A', HOU: '#CE1141', IND: '#FDBB30',
  LAC: '#C8102E', LAL: '#FDB927', MEM: '#5D76A9', MIA: '#98002E',
  MIL: '#00471B', MIN: '#236192', NOP: '#0C2340', NYK: '#006BB6',
  OKC: '#007AC1', ORL: '#0077C0', PHI: '#006BB6', PHX: '#E56020',
  POR: '#E03A3E', SAC: '#5A2D81', SAS: '#C4CED4', TOR: '#CE1141',
  UTA: '#F9A01B', WAS: '#002B5C',
}

/* ─────────────────────────────────────────
   Abbreviation normalizer
   ESPN API sometimes returns alternate abbrs
   (NO, NOH, GS, SA, NY, UTAH, etc.)
   This maps them to the canonical ESPN CDN abbr
───────────────────────────────────────── */
const ABBR_NORMALIZE = {
  // New Orleans
  NO: 'NOP', NOH: 'NOP', NOK: 'NOP',
  // Golden State
  GS: 'GSW',
  // San Antonio
  SA: 'SAS',
  // New York
  NY: 'NYK',
  // Oklahoma City
  OK: 'OKC',
  // Utah
  UTAH: 'UTA',
  // Portland
  PORT: 'POR',
  // Memphis
  MEM: 'MEM',
  // Charlotte (old Bobcats abbr)
  CHA: 'CHA', CHO: 'CHA', BOB: 'CHA',
  // Brooklyn (old NJ Nets)
  NJ: 'BKN', BK: 'BKN',
  // Philadelphia
  PHI: 'PHI',
  // Cleveland
  CLE: 'CLE',
  // Detroit
  DET: 'DET',
  // Indiana
  IND: 'IND',
  // Milwaukee
  MIL: 'MIL',
  // Chicago
  CHI: 'CHI',
  // Toronto
  TOR: 'TOR',
  // Atlanta
  ATL: 'ATL',
  // Boston
  BOS: 'BOS',
  // Miami
  MIA: 'MIA',
  // Washington
  WAS: 'WAS', WSH: 'WAS',
  // Orlando
  ORL: 'ORL',
  // Minnesota
  MIN: 'MIN',
  // Denver
  DEN: 'DEN',
  // Dallas
  DAL: 'DAL',
  // Houston
  HOU: 'HOU',
  // Sacramento
  SAC: 'SAC',
  // LA Clippers
  LAC: 'LAC',
  // LA Lakers
  LAL: 'LAL',
  // Phoenix
  PHX: 'PHX',
}

function normalizeAbbr(raw) {
  if (!raw) return ''
  const upper = raw.toUpperCase().trim()
  return ABBR_NORMALIZE[upper] || upper
}

/* ─────────────────────────────────────────
   NBA Team Logo helper (ESPN CDN)
───────────────────────────────────────── */
const TEAM_ESPN_ID = {
  ATL: 1, BOS: 2, BKN: 17, CHA: 30, CHI: 4, CLE: 5, DAL: 6, DEN: 7,
  DET: 8, GSW: 9, HOU: 10, IND: 11, LAC: 12, LAL: 13, MEM: 29, MIA: 14,
  MIL: 15, MIN: 16, NOP: 3, NYK: 18, OKC: 25, ORL: 19, PHI: 20, PHX: 21,
  POR: 22, SAC: 23, SAS: 24, TOR: 28, UTA: 26, WAS: 27,
}

// FIX: NOP and UTA don't exist at /500/abbr.png — they're served under /500/scoreboard/
const LOGO_SCOREBOARD_PATH = new Set(['NOP', 'UTA'])

function getLogoUrl(canonical) {
  if (!canonical) return null
  if (LOGO_SCOREBOARD_PATH.has(canonical)) {
    return `https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/${canonical.toLowerCase()}.png`
  }
  return `https://a.espncdn.com/i/teamlogos/nba/500/${canonical.toLowerCase()}.png`
}

export function TeamLogo({ abbr, size = 36, style = {} }) {
  const [err, setErr] = useState(false)
  const canonical = normalizeAbbr(abbr)
  const id = TEAM_ESPN_ID[canonical]
  const src = id ? getLogoUrl(canonical) : null

  if (!canonical || !src || err) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'var(--bg4)', border: '1px solid var(--border2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.32, fontWeight: 700, color: 'var(--text2)',
        fontFamily: 'Inter, sans-serif', flexShrink: 0, ...style,
      }}>
        {canonical?.slice(0, 3) || '?'}
      </div>
    )
  }

  return (
    <img src={src} alt={canonical} width={size} height={size}
      onError={() => setErr(true)}
      style={{ objectFit: 'contain', flexShrink: 0, ...style }}
    />
  )
}

/* ─────────────────────────────────────────
   Loading Spinner
───────────────────────────────────────── */
export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '72px 20px' }}>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%', opacity: 0.7 }}
            className={i === 0 ? 'bounce' : i === 1 ? 'bounce-2' : 'bounce-3'} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{text}</div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="shimmer" style={{ height: 10, width: '35%', borderRadius: 4 }} />
        <div className="shimmer" style={{ height: 20, width: '22%', borderRadius: 4 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[0, 1].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="shimmer" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div className="shimmer" style={{ height: 12, width: '60%', borderRadius: 4 }} />
              <div className="shimmer" style={{ height: 9, width: '25%', borderRadius: 4 }} />
            </div>
            <div className="shimmer" style={{ height: 26, width: 40, borderRadius: 4 }} />
          </div>
        ))}
      </div>
      <div className="shimmer" style={{ height: 3, borderRadius: 2 }} />
    </div>
  )
}

/* ─────────────────────────────────────────
   Error
───────────────────────────────────────── */
export function ErrorState({ message, onRetry }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 20px' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 40, height: 40, borderRadius: '50%',
        background: 'var(--red-bg)', border: '1px solid var(--red-border)', marginBottom: 12,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Error</div>
      <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 16, maxWidth: 320, margin: '0 auto 16px' }}>{message}</div>
      {onRetry && (
        <button className="btn" onClick={onRetry} style={{ margin: '0 auto' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
          </svg>
          Try Again
        </button>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   Page Header
───────────────────────────────────────── */
export function PageHeader({ title, subtitle, right }) {
  return (
    <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 36,
          letterSpacing: '0.03em', color: 'var(--text)', lineHeight: 1,
          marginBottom: subtitle ? 5 : 0,
        }}>{title}</h1>
        {subtitle && (
          <p style={{
            fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.02em' }}>
            {subtitle}
          </p>
        )}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  )
}

/* ─────────────────────────────────────────
   Section Header
───────────────────────────────────────── */
export function SectionHeader({ title, right }) {
  return (
    <div className="section-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 3, height: 16, borderRadius: 2,
          background: 'var(--accent)', flexShrink: 0,
        }} />
        <span style={{
          fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 15,
          letterSpacing: '-0.02em', color: 'var(--text)',
        }}>{title}</span>
      </div>
      {right && (
        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em' }}>
          {right}
        </span>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   Stat Card
───────────────────────────────────────── */
export function StatCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ padding: '16px 20px', position: 'relative', overflow: 'hidden' }}>
      {color && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: color, borderRadius: '8px 0 0 8px', opacity: 0.8,
        }} />
      )}
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginBottom: 10,
      }}>{label}</div>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, lineHeight: 1,
        color: color || 'var(--text)', letterSpacing: '0.02em', marginBottom: sub ? 6 : 0,
      }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>{sub}</div>}
    </div>
  )
}

/* ─────────────────────────────────────────
   Win Probability Bar
   FIX: left = away (challenger), right = home
   The LEADING team's color fills the LARGER side
───────────────────────────────────────── */
export function WinProbBar({ homeProb, homeAbbr, awayAbbr, size = 'sm' }) {
  const safeHome = Math.round(homeProb ?? 50)
  const awayProb = 100 - safeHome
  const isLg = size === 'lg'

  const homeCanonical = normalizeAbbr(homeAbbr)
  const awayCanonical = normalizeAbbr(awayAbbr)

  const homeColor = TEAM_COLORS[homeCanonical] || '#3b82f6'
  const awayColor = TEAM_COLORS[awayCanonical] || '#888'

  const homeLeads = safeHome >= awayProb

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        {/* Away side — left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: 7, height: 7, borderRadius: 2, background: awayColor,
            opacity: homeLeads ? 0.45 : 1, flexShrink: 0,
          }} />
          <span style={{
            fontSize: 10, fontFamily: 'DM Mono, monospace',
            color: homeLeads ? 'var(--text3)' : 'var(--text2)',
            fontWeight: homeLeads ? 400 : 600,
          }}>
            {awayAbbr ? `${awayAbbr} ` : ''}{awayProb}%
          </span>
        </div>
        {/* Home side — right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            fontSize: 10, fontFamily: 'DM Mono, monospace',
            color: homeLeads ? 'var(--text2)' : 'var(--text3)',
            fontWeight: homeLeads ? 600 : 400,
          }}>
            {safeHome}%{homeAbbr ? ` ${homeAbbr}` : ''}
          </span>
          <div style={{
            width: 7, height: 7, borderRadius: 2, background: homeColor,
            opacity: homeLeads ? 1 : 0.45, flexShrink: 0,
          }} />
        </div>
      </div>

      {/* Bar: away fills left proportionally, home fills right */}
      <div style={{ height: isLg ? 4 : 3, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
        <div style={{
          width: `${awayProb}%`, height: '100%',
          background: awayColor,
          opacity: homeLeads ? 0.35 : 0.9,
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
        <div style={{
          width: `${safeHome}%`, height: '100%',
          background: homeColor,
          opacity: homeLeads ? 0.9 : 0.35,
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   PHT Time Formatter
───────────────────────────────────────── */
function formatGameTimePHT(rawTime) {
  if (!rawTime || rawTime === 'TBD') return 'TBD'
  try {
    const date = new Date(rawTime)
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-PH', {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila',
      }) + ' PHT'
    }
  } catch (_) {}
  return rawTime
}

/* ─────────────────────────────────────────
   Game Card
   FIX 1: scores show at halftime (status=2 covers it)
   FIX 2: big logo aura background
   FIX 3: prob bar — leading team color is dominant
   FIX 4: abbr normalized before logo/color lookup
   FIX 5: NOP/UTA logos use scoreboard CDN path
───────────────────────────────────────── */
export function GameCard({ game }) {
  const navigate = useNavigate()

  const home = game.homeTeam || {}
  const away = game.awayTeam || {}

  // Normalize abbrs so logos always resolve
  const homeAbbr = normalizeAbbr(
    home.teamTricode || home.abbr || home.abbreviation || home.teamAbbr || ''
  )
  const awayAbbr = normalizeAbbr(
    away.teamTricode || away.abbr || away.abbreviation || away.teamAbbr || ''
  )

  const homeName = home.teamName || home.name || home.full_name || homeAbbr || '—'
  const awayName = away.teamName || away.name || away.full_name || awayAbbr || '—'
  const homeCity = home.teamCity || home.city || ''
  const awayCity = away.teamCity || away.city || ''

  const prob = game.winProbability || { home: 50 }

  // status 2 = live (includes halftime), status 3 = final
  const isLive = game.status === 2 || game.status === '2'
  const isFinal = game.status === 3 || game.status === '3'
  const showScore = isLive || isFinal

  const homeScore = showScore && home.score != null ? home.score : null
  const awayScore = showScore && away.score != null ? away.score : null
  const homeLeading = homeScore != null && awayScore != null && homeScore > awayScore
  const awayLeading = homeScore != null && awayScore != null && awayScore > homeScore

  const homeColor = TEAM_COLORS[homeAbbr] || '#3b82f6'
  const awayColor = TEAM_COLORS[awayAbbr] || '#888'

  // FIX: use getLogoUrl so NOP/UTA resolve correctly in aura backgrounds too
  const homeLogo = getLogoUrl(homeAbbr)
  const awayLogo = getLogoUrl(awayAbbr)

  const displayTime = formatGameTimePHT(game.gameTime)

  const teams = [
    { abbr: awayAbbr, city: awayCity, name: awayName, score: awayScore, leading: awayLeading, color: awayColor },
    { abbr: homeAbbr, city: homeCity, name: homeName, score: homeScore, leading: homeLeading, color: homeColor },
  ]

  return (
    <div
      className={`card card-hover fade-up${isLive ? ' card-glow-green' : ''}`}
      onClick={() => game?.gameId && navigate(`/game/${game.gameId}`)}
      style={{
        padding: '16px 18px',
        borderColor: isLive ? 'var(--green-border)' : undefined,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* ── Big logo aura background ── */}
      {awayLogo && (
        <img src={awayLogo} alt="" aria-hidden="true"
          style={{
            position: 'absolute', left: -18, top: '50%', transform: 'translateY(-50%)',
            width: 110, height: 110, objectFit: 'contain',
            opacity: 0.06, pointerEvents: 'none', filter: 'blur(1px)',
          }}
        />
      )}
      {homeLogo && (
        <img src={homeLogo} alt="" aria-hidden="true"
          style={{
            position: 'absolute', right: -18, top: '50%', transform: 'translateY(-50%)',
            width: 110, height: 110, objectFit: 'contain',
            opacity: 0.06, pointerEvents: 'none', filter: 'blur(1px)',
          }}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, position: 'relative' }}>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.02em' }}>
          {isLive
            ? (game.period ? `Q${game.period}  ${game.gameClock || ''}` : 'Live')
            : isFinal ? 'Final' : displayTime}
        </span>
        {isLive ? (
          <span className="badge badge-live">Live</span>
        ) : isFinal ? (
          <span className="badge badge-final">Final</span>
        ) : (
          <span className="badge badge-neu">Scheduled</span>
        )}
      </div>

      {/* Teams */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14, position: 'relative' }}>
        {teams.map((team, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 3, alignSelf: 'stretch', borderRadius: 2,
              background: team.color,
              opacity: showScore ? (team.leading ? 1 : 0.18) : 0.45,
              flexShrink: 0, transition: 'opacity 0.3s',
            }} />

            <TeamLogo abbr={team.abbr} size={34} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
                letterSpacing: '-0.01em',
                color: showScore
                  ? (team.leading ? 'var(--text)' : 'var(--text3)')
                  : 'var(--text)',
                lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                transition: 'color 0.2s',
              }}>
                {team.city ? `${team.city} ` : ''}{team.name}
              </div>
              {team.abbr && (
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginTop: 1 }}>
                  {team.abbr}
                </div>
              )}
            </div>

            {/* Score — always show when live/final (covers halftime) */}
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 26, fontWeight: 800,
              letterSpacing: '-0.03em', lineHeight: 1,
              color: showScore
                ? (team.leading ? 'var(--text)' : 'var(--text3)')
                : 'var(--text3)',
              minWidth: 44, textAlign: 'right', transition: 'color 0.2s',
            }}>
              {team.score != null ? team.score : '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Prob bar */}
      <div style={{ position: 'relative' }}>
        <WinProbBar homeProb={prob.home} homeAbbr={homeAbbr} awayAbbr={awayAbbr} />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   News Item
───────────────────────────────────────── */
export function NewsItem({ article }) {
  const title = article.headline || article.title || 'Untitled'
  const summary = article.summary || article.description || ''
  const source = article.source || 'ESPN'
  const published = article.published || ''
  const category = article.category || ''

  return (
    <a href={article.url || '#'} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '14px 0', borderBottom: '1px solid var(--border)',
        textDecoration: 'none', gap: 16, transition: 'padding-left 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.paddingLeft = '4px'}
      onMouseLeave={e => e.currentTarget.style.paddingLeft = '0'}
    >
      <div style={{ flex: 1 }}>
        {category && (
          <span style={{
            display: 'inline-block', fontSize: 9, fontFamily: 'DM Mono, monospace', fontWeight: 500,
            color: 'var(--accent)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
            borderRadius: 3, padding: '2px 6px', marginBottom: 6,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>{category}</span>
        )}
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600,
          color: 'var(--text)', marginBottom: 4, lineHeight: 1.4, letterSpacing: '-0.01em',
        }}>{title}</div>
        {summary && (
          <div style={{
            fontSize: 12, color: 'var(--text3)', lineHeight: 1.55, marginBottom: 6,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{summary}</div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>{source}</span>
          {published && <>
            <span style={{ fontSize: 10, color: 'var(--border2)' }}>·</span>
            <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>{published}</span>
          </>}
        </div>
      </div>
      <div style={{
        color: 'var(--text3)', fontSize: 13, marginTop: 2, flexShrink: 0,
        width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 6, background: 'var(--bg3)', border: '1px solid var(--border)',
      }}>→</div>
    </a>
  )
}

/* ─────────────────────────────────────────
   Color Swatch
───────────────────────────────────────── */
export function ColorSwatch({ hex }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(hex)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div onClick={copy} style={{ width: 24, height: 24, background: hex, cursor: 'pointer', borderRadius: 4 }}
      title={copied ? 'Copied!' : hex} />
  )
}