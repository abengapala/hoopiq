import { useNavigate } from 'react-router-dom'

/* ── Loading ── */
export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '60px 20px' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%' }}
            className={`bounce${i > 0 ? `-${i + 1}` : ''}`} />
        ))}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>{text}</div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="shimmer" style={{ height: 12, borderRadius: 6, width: '60%' }} />
      <div className="shimmer" style={{ height: 32, borderRadius: 6 }} />
      <div className="shimmer" style={{ height: 8, borderRadius: 4 }} />
    </div>
  )
}

/* ── Error ── */
export function ErrorState({ message, onRetry }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 14, color: 'var(--red)', marginBottom: 8 }}>{message}</div>
      {onRetry && (
        <button className="btn-primary" onClick={onRetry} style={{ marginTop: 8 }}>
          Try Again
        </button>
      )}
    </div>
  )
}

/* ── Stat Card ── */
export function StatCard({ label, value, sub, color, trend }) {
  return (
    <div className="stat-card">
      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-1px', color: color || 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{sub}</div>}
      {trend && <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', marginTop: 4, color: trend > 0 ? 'var(--green)' : 'var(--red)' }}>{trend > 0 ? '▲' : '▼'} {Math.abs(trend)}</div>}
    </div>
  )
}

/* ── Win Probability Bar ── */
export function WinProbBar({ homeProb, homeAbbr, awayAbbr, size = 'sm' }) {
  const awayProb = 100 - homeProb
  const isLg = size === 'lg'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: isLg ? 8 : 5 }}>
        <span style={{ fontSize: isLg ? 14 : 11, color: 'var(--accent)', fontFamily: 'DM Mono, monospace', fontWeight: 700 }}>{homeProb}%{isLg ? ` ${homeAbbr}` : ''}</span>
        {isLg && <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>WIN PROBABILITY</span>}
        <span style={{ fontSize: isLg ? 14 : 11, color: 'var(--blue)', fontFamily: 'DM Mono, monospace', fontWeight: 700 }}>{isLg ? `${awayAbbr} ` : ''}{awayProb}%</span>
      </div>
      <div className="prob-bar" style={{ height: isLg ? 8 : 4 }}>
        <div className="prob-fill" style={{ width: `${homeProb}%`, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

/* ── Last 5 Dots ── */
export function Last5({ results = [], align = 'left' }) {
  return (
    <div style={{ display: 'flex', gap: 3, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
      {results.map((w, i) => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: w ? 'var(--green)' : 'var(--bg4)',
        }} title={w ? 'Win' : 'Loss'} />
      ))}
    </div>
  )
}

/* ── Game Card ── */
export function GameCard({ game }) {
  const navigate = useNavigate()
  const home = game.homeTeam
  const away = game.awayTeam
  const prob = game.winProbability || { home: 50, away: 50 }
  const isLive = game.isLive === true || game.status === 2 || game.status === '2' || /^Q[1-4]|^H[1-2]|^OT/i.test(game.statusText || '')

  return (
    <div
      className="card card-hover"
      onClick={() => navigate(`/game/${game.gameId}`)}
      style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--accent), transparent)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'DM Mono, monospace', fontWeight: 500 }}>
          {game.statusText || game.time || 'TBD'}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg3)', padding: '2px 7px', borderRadius: 4 }}>
          {isLive ? '🔴 LIVE' : 'NBA'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        {/* Home */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-1px' }}>{home.abbr}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>{home.record}</div>
          {isLive && <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{home.score}</div>}
          {home.last5 && home.last5.length > 0 && <Last5 results={home.last5} />}
        </div>

        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', textAlign: 'center', padding: '0 8px' }}>VS</div>

        {/* Away */}
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-1px' }}>{away.abbr}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>{away.record}</div>
          {isLive && <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{away.score}</div>}
          {away.last5 && away.last5.length > 0 && <Last5 results={away.last5} align="right" />}
        </div>
      </div>

      <WinProbBar homeProb={prob.home} homeAbbr={home.abbr} awayAbbr={away.abbr} />
    </div>
  )
}

/* ── Section Header ── */
export function SectionHeader({ title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div className="section-title">{title}</div>
      {right}
    </div>
  )
}

/* ── Stats Comparison Row ── */
export function StatsRow({ label, homeVal, awayVal, higherBetter = true, format = (v) => v }) {
  const homeWins = higherBetter ? homeVal >= awayVal : homeVal <= awayVal
  const max = Math.max(Math.abs(homeVal), Math.abs(awayVal)) || 1
  const homePct = (Math.abs(homeVal) / max) * 100
  const awayPct = (Math.abs(awayVal) / max) * 100

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: 'var(--text3)', width: 100, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', width: 40, color: homeWins ? 'var(--accent)' : 'var(--text3)' }}>{format(homeVal)}</span>
      <div style={{ flex: 1, display: 'flex', gap: 3 }}>
        <div style={{ flex: 1, height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${homePct}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
        </div>
        <div style={{ flex: 1, height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: `${awayPct}%`, height: '100%', background: 'var(--blue)', borderRadius: 2 }} />
        </div>
      </div>
      <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', width: 40, textAlign: 'right', color: !homeWins ? 'var(--blue)' : 'var(--text3)' }}>{format(awayVal)}</span>
    </div>
  )
}

/* ── News Item ── */
const CAT_STYLES = {
  'Game Recap':     { bg: 'rgba(59,130,246,.12)', color: 'var(--blue)' },
  'Injury Update':  { bg: 'rgba(239,68,68,.12)',  color: 'var(--red)' },
  'Performance':    { bg: 'rgba(247,148,29,.12)', color: 'var(--accent)' },
  'Milestone':      { bg: 'rgba(168,85,247,.12)', color: 'var(--purple)' },
  'Standings':      { bg: 'rgba(34,197,94,.12)',  color: 'var(--green)' },
  'Awards':         { bg: 'rgba(245,158,11,.12)', color: 'var(--gold)' },
  'Transactions':   { bg: 'rgba(99,102,241,.12)', color: '#818cf8' },
}

export function NewsItem({ article }) {
  const style = CAT_STYLES[article.category] || { bg: 'rgba(255,255,255,.07)', color: 'var(--text3)' }
  return (
    <div className="card card-hover" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontFamily: 'DM Mono, monospace', fontWeight: 500, whiteSpace: 'nowrap', marginTop: 2, background: style.bg, color: style.color }}>
        {article.category}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>{article.headline}</div>
        {article.summary && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, lineHeight: 1.5 }}>{article.summary}</div>}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>{article.published}</span>
          {article.source && <span style={{ fontSize: 11, color: 'var(--text3)' }}>· {article.source}</span>}
          {article.team && <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>#{article.team}</span>}
        </div>
      </div>
    </div>
  )
}

/* ── Empty State ── */
export function EmptyState({ emoji = '🏀', title = 'No data', sub = '' }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{emoji}</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>{title}</div>
      {sub && <div style={{ fontSize: 13 }}>{sub}</div>}
    </div>
  )
}
