import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, StatCard, SectionHeader, TeamLogo } from '../components/UI'

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(str) {
  if (!str) return '—'
  try {
    return new Date(str).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return str }
}

// ── Achievement icon mapping ──────────────────────────────────────────────────

function getAchievementIcon(name = '') {
  const n = name.toLowerCase()
  if (n.includes('champion'))          return '🏆'
  if (n.includes('mvp'))               return '🥇'
  if (n.includes('all-star') || n.includes('allstar')) return '⭐'
  if (n.includes('olympic') || n.includes('gold medal')) return '🥇'
  if (n.includes('scoring title'))     return '🔥'
  if (n.includes('defensive'))         return '🛡️'
  if (n.includes('rookie'))            return '🌱'
  if (n.includes('hall of fame'))      return '🏛️'
  if (n.includes('all-nba') || n.includes('allnba')) return '📋'
  if (n.includes('record'))            return '📈'
  if (n.includes('assist'))            return '🎯'
  if (n.includes('rebound'))           return '💪'
  return '🏅'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ShootingBar({ label, value, max = 100, color = 'var(--accent)' }) {
  const pctVal = Math.min((value / max) * 100, 100)
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'DM Mono, monospace' }}>{value}%</span>
      </div>
      <div style={{ height: 7, background: 'var(--bg4)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pctVal}%`, background: color,
          borderRadius: 4, transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
        }} />
      </div>
    </div>
  )
}

function AchievementBadge({ name, year }) {
  const icon = getAchievementIcon(name)
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '10px 14px',
      background: 'var(--bg3)',
      border: '1px solid var(--border)',
      borderRadius: 10, marginBottom: 7,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.2 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35 }}>{name}</div>
        {year && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{year}</div>}
      </div>
    </div>
  )
}

function NewsCard({ item }) {
  return (
    <a
      href={item.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', gap: 12, alignItems: 'flex-start',
        padding: '12px 0', borderBottom: '1px solid var(--border)',
        textDecoration: 'none',
      }}
    >
      {item.image && (
        <img
          src={item.image} alt=""
          style={{ width: 64, height: 46, objectFit: 'cover', borderRadius: 6, flexShrink: 0, background: 'var(--bg4)' }}
          onError={e => { e.target.style.display = 'none' }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 3 }}>
          {item.headline}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{item.source} · {formatDate(item.date)}</div>
      </div>
    </a>
  )
}

function CareerTable({ seasons }) {
  if (!seasons || seasons.length === 0) return null
  const cols = [
    { key: 'season', label: 'Season', align: 'left',  mono: false },
    { key: 'gp',     label: 'GP',     align: 'right', mono: true },
    { key: 'pts',    label: 'PTS',    align: 'right', mono: true },
    { key: 'reb',    label: 'REB',    align: 'right', mono: true },
    { key: 'ast',    label: 'AST',    align: 'right', mono: true },
    { key: 'fgPct',  label: 'FG%',    align: 'right', mono: true },
    { key: 'fg3Pct', label: '3P%',    align: 'right', mono: true },
    { key: 'ftPct',  label: 'FT%',    align: 'right', mono: true },
  ]
  const grid = '90px 32px repeat(6, 1fr)'

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ minWidth: 480 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: grid,
          padding: '8px 14px', background: 'var(--bg3)',
          borderBottom: '1px solid var(--border)',
        }}>
          {cols.map(c => (
            <span key={c.key} className="label" style={{ fontSize: 10, textAlign: c.align }}>{c.label}</span>
          ))}
        </div>
        {[...seasons].reverse().map((row, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: grid,
            padding: '9px 14px',
            borderBottom: i < seasons.length - 1 ? '1px solid var(--border)' : 'none',
            background: i === 0 ? 'rgba(59,130,246,0.04)' : 'transparent',
          }}>
            {cols.map(c => (
              <span key={c.key} style={{
                fontSize: 12,
                color: c.key === 'pts' ? 'var(--text)' : 'var(--text2)',
                fontFamily: c.mono ? 'DM Mono, monospace' : 'inherit',
                fontWeight: c.key === 'pts' ? 700 : c.key === 'season' ? 500 : 400,
                textAlign: c.align,
              }}>
                {c.key.endsWith('Pct') ? `${row[c.key]}%` : row[c.key]}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PlayerDetailPage() {
  const { playerId } = useParams()
  const navigate     = useNavigate()

  const { data, loading, error, refetch } = useApi(
    () => api.getPlayer(playerId),
    [playerId]
  )

  if (loading) return <LoadingSpinner text="Loading player data..." />
  if (error)   return <ErrorState message={error} onRetry={refetch} />
  if (!data)   return null

  const { player, seasonStats, careerSeasons, last5, recentNews } = data
  const s             = seasonStats || {}
  const hasStats      = s.gp > 0
  const hasCareer     = careerSeasons && careerSeasons.length > 0
  const hasNews       = recentNews   && recentNews.length > 0
  const hasAchieve    = player.achievements && player.achievements.length > 0
  const hasLast5      = last5 && last5.length > 0

  const careerPtsHigh = hasCareer ? Math.max(...careerSeasons.map(r => r.pts)) : 0
  const careerRebHigh = hasCareer ? Math.max(...careerSeasons.map(r => r.reb)) : 0
  const careerAstHigh = hasCareer ? Math.max(...careerSeasons.map(r => r.ast)) : 0

  return (
    <>
      {/* Responsive styles injected once */}
      <style>{`
        .pdp-hero-inner { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; }
        .pdp-bio-grid   { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px 16px; }
        .pdp-highs      { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .pdp-two-col    { display: grid; grid-template-columns: minmax(0,1fr) 300px; gap: 16px; align-items: start; }
        .pdp-achieve-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
        @media (max-width: 640px) {
          .pdp-bio-grid   { grid-template-columns: repeat(2, 1fr); }
          .pdp-highs      { grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .pdp-two-col    { grid-template-columns: 1fr; }
          .pdp-achieve-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 400px) {
          .pdp-highs      { grid-template-columns: 1fr 1fr; }
          .pdp-bio-grid   { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="fade-up" style={{ maxWidth: 960 }}>

        {/* Back */}
        <button onClick={() => navigate(-1)} className="btn" style={{ marginBottom: 20, gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back
        </button>

        {/* ── Hero Card ──────────────────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: 16, padding: 'clamp(16px,4vw,28px)', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 200, height: 200,
            background: 'radial-gradient(circle at top right, rgba(59,130,246,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div className="pdp-hero-inner" style={{ position: 'relative' }}>
            {/* Headshot */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                width: 84, height: 84, borderRadius: '50%',
                overflow: 'hidden', background: 'var(--bg4)',
                border: '2px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {player.headshot && (
                  <img
                    src={player.headshot} alt={player.fullName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                )}
                {!player.headshot && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '100%', height: '100%',
                    fontSize: 26, fontFamily: 'Syne, sans-serif', fontWeight: 700,
                    color: 'var(--text2)',
                  }}>
                    {player.firstName?.[0]}{player.lastName?.[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Name + team + badges */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(24px, 6vw, 34px)',
                color: 'var(--text)', marginBottom: 4, lineHeight: 1.1,
                letterSpacing: '0.03em',
              }}>
                {player.fullName}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, flexWrap: 'wrap' }}>
                {player.teamAbbr && <TeamLogo abbr={player.teamAbbr} size={17} />}
                <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>{player.teamName}</span>
                {player.position && (
                  <>
                    <span style={{ color: 'var(--border)' }}>·</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>{player.positionFull || player.position}</span>
                  </>
                )}
                {player.status && player.status !== 'Active' && (
                  <>
                    <span style={{ color: 'var(--border)' }}>·</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                      color: player.status.toLowerCase().includes('injur') ? 'var(--red)' : '#f59e0b',
                    }}>{player.status}</span>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {player.jersey    && <span className="badge badge-neu">#{player.jersey}</span>}
                {player.height    && <span className="badge badge-neu">{player.height}</span>}
                {player.weight    && <span className="badge badge-neu">{player.weight}</span>}
                {player.age       && <span className="badge badge-neu">Age {player.age}</span>}
                {player.country   && <span className="badge badge-neu">🌍 {player.country}</span>}
                {player.experience !== '' && player.experience !== undefined &&
                  <span className="badge badge-neu">Yr {Number(player.experience) + 1}</span>}
              </div>
            </div>
          </div>

          {/* Bio details */}
          {(player.birthDate || player.birthplace || player.draftYear || player.college || player.debut) && (
            <div className="pdp-bio-grid" style={{ paddingTop: 16, marginTop: 14, borderTop: '1px solid var(--border)' }}>
              {player.birthDate && (
                <div>
                  <div className="label" style={{ marginBottom: 3 }}>Born</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{formatDate(player.birthDate)}</div>
                  {player.birthplace && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{player.birthplace}</div>}
                </div>
              )}
              {player.draftYear && (
                <div>
                  <div className="label" style={{ marginBottom: 3 }}>Draft</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>{player.draftYear}</div>
                  {player.draftRound && (
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Rd {player.draftRound} · Pick #{player.draftNumber}</div>
                  )}
                </div>
              )}
              {player.college && (
                <div>
                  <div className="label" style={{ marginBottom: 3 }}>College</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{player.college}</div>
                </div>
              )}
              {player.debut && (
                <div>
                  <div className="label" style={{ marginBottom: 3 }}>Debut</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{player.debut}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Career Highs Banner ────────────────────────────────────────────── */}
        {hasCareer && (
          <div className="pdp-highs" style={{ marginBottom: 16 }}>
            {[
              { label: 'Best PPG', val: careerPtsHigh },
              { label: 'Best RPG', val: careerRebHigh },
              { label: 'Best APG', val: careerAstHigh },
            ].map(item => (
              <div key={item.label} className="card" style={{
                padding: 'clamp(10px,3vw,16px)',
                textAlign: 'center',
                borderTop: '3px solid var(--accent)',
              }}>
                <div className="label" style={{ marginBottom: 5, fontSize: 10 }}>{item.label}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(22px,5vw,30px)', color: 'var(--text)', lineHeight: 1 }}>
                  {item.val}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>season avg</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Season Averages + Shooting + Achievements (two-col on desktop) ── */}
        <div className="pdp-two-col" style={{ marginBottom: 16 }}>

          {/* LEFT */}
          <div>
            {hasStats ? (
              <>
                <SectionHeader title="Season Averages" subtitle={`${s.gp} GP · 2025–26`} />
                <div className="stat-grid-4" style={{ marginBottom: 10 }}>
                  <StatCard label="PPG" value={s.pts} />
                  <StatCard label="RPG" value={s.reb} />
                  <StatCard label="APG" value={s.ast} />
                  <StatCard label="MPG" value={s.mins} />
                </div>
                <div className="stat-grid-4" style={{ marginBottom: 10 }}>
                  <StatCard label="FG%"  value={`${s.fgPct}%`}  />
                  <StatCard label="3P%"  value={`${s.fg3Pct}%`} />
                  <StatCard label="FT%"  value={`${s.ftPct}%`}  />
                  <StatCard label="TOV"  value={s.tov}           />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <StatCard label="STL" value={s.stl} />
                  <StatCard label="BLK" value={s.blk} />
                </div>
              </>
            ) : (
              <div className="card" style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                Season stats not available for this player
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div>
            {/* Shooting splits */}
            {hasStats && (s.fgPct > 0 || s.fg3Pct > 0 || s.ftPct > 0) && (
              <>
                <SectionHeader title="Shooting Splits" />
                <div className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
                  <ShootingBar label="Field Goal %" value={s.fgPct}  max={70}  color="var(--accent)" />
                  <ShootingBar label="3-Point %"    value={s.fg3Pct} max={55}  color="#8b5cf6" />
                  <ShootingBar label="Free Throw %"  value={s.ftPct}  max={100} color="var(--green)" />
                </div>
              </>
            )}

            {/* Achievements */}
            {hasAchieve && (
              <>
                <SectionHeader title="Achievements" />
                <div className="pdp-achieve-grid">
                  {player.achievements.map((aw, i) => (
                    <AchievementBadge key={i} name={aw.name} year={aw.year} />
                  ))}
                </div>
              </>
            )}

            {/* Fallback career info if no achievements */}
            {!hasAchieve && (player.experience !== '' && player.experience !== undefined) && (
              <>
                <SectionHeader title="Career Info" />
                <div className="card" style={{ padding: '14px 16px' }}>
                  {[
                    { label: 'NBA Experience', val: `${Number(player.experience) + 1} seasons` },
                    { label: 'Draft Class',    val: player.draftYear ? `${player.draftYear} Draft` : null },
                    { label: 'Position',       val: player.positionFull || player.position },
                  ].filter(r => r.val).map((row, i, arr) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <span className="label" style={{ fontSize: 11 }}>{row.label}</span>
                      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Career Stats table ────────────────────────────────────────────── */}
        {hasCareer && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader title="Career Stats" subtitle="Regular Season" />
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <CareerTable seasons={careerSeasons} />
            </div>
          </div>
        )}

        {/* ── Last 5 Games ──────────────────────────────────────────────────── */}
        {hasLast5 && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader title="Last 5 Games" />
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ minWidth: 380 }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr 36px 44px 44px 44px 46px',
                    padding: '8px 14px',
                    background: 'var(--bg3)',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    {['Date','Matchup','W/L','PTS','REB','AST','+/−'].map(h => (
                      <span key={h} className="label" style={{ fontSize: 10, textAlign: h === 'Date' || h === 'Matchup' ? 'left' : 'right' }}>{h}</span>
                    ))}
                  </div>
                  {last5.map((g, i) => (
                    <div key={i} style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr 36px 44px 44px 44px 46px',
                      padding: '10px 14px',
                      borderBottom: i < last5.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>{g.GAME_DATE}</span>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{g.MATCHUP}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: g.WL === 'W' ? 'var(--green)' : 'var(--red)', textAlign: 'right' }}>{g.WL}</span>
                      <span style={{ fontSize: 13, fontFamily: 'DM Mono, monospace', fontWeight: 700, textAlign: 'right' }}>{g.PTS}</span>
                      <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)', textAlign: 'right' }}>{g.REB}</span>
                      <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)', textAlign: 'right' }}>{g.AST}</span>
                      <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', textAlign: 'right', color: parseFloat(g.PLUS_MINUS) > 0 ? 'var(--green)' : 'var(--red)' }}>
                        {g.PLUS_MINUS > 0 ? '+' : ''}{g.PLUS_MINUS}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Recent News ───────────────────────────────────────────────────── */}
        {hasNews && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title="Recent News" />
            <div className="card" style={{ padding: '4px 18px' }}>
              {recentNews.map((item, i) => (
                <NewsCard key={i} item={item} />
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  )
}