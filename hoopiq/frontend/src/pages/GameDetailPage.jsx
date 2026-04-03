import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { WinProbBar, SectionHeader, LoadingSpinner, ErrorState, TeamLogo, TEAM_COLORS } from '../components/UI'
import AIAnalysis from '../components/AIAnalysis'

// Mirrors the normalizer in UI.jsx so abbrs resolve correctly for logos/colors
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

function toPhilippineTime(rawText) {
  if (!rawText) return ''
  if (/final|halftime|end of|q[1-4]/i.test(rawText)) return rawText

  const match = rawText.match(/(\d{1,2})\/(\d{1,2})\s*[-–]\s*(\d{1,2}:\d{2}\s*[AP]M)\s*(\w+)?/i)
  if (match) {
    const [, month, day, time, tz] = match
    const year = new Date().getFullYear()
    const parsed = new Date(`${month}/${day}/${year} ${time} ${tz || 'ET'}`)
    if (!isNaN(parsed)) {
      const phtTime = parsed.toLocaleTimeString('en-PH', {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila',
      })
      const phtDate = parsed.toLocaleDateString('en-PH', {
        month: 'numeric', day: 'numeric', timeZone: 'Asia/Manila',
      })
      return `${phtDate} · ${phtTime} PHT`
    }
  }

  try {
    const d = new Date(rawText)
    if (!isNaN(d)) {
      return d.toLocaleString('en-PH', {
        month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
        hour12: true, timeZone: 'Asia/Manila',
      }) + ' PHT'
    }
  } catch (_) {}

  return rawText
}

function CompareRow({ label, homeVal, awayVal, format = v => v, higherIsBetter = true }) {
  const hv = parseFloat(homeVal) || 0
  const av = parseFloat(awayVal) || 0
  const total = hv + av || 1
  const homePct = (hv / total) * 100
  const homeWins = higherIsBetter ? hv >= av : hv <= av

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
        <span style={{
          fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 600,
          color: homeWins ? 'var(--text)' : 'var(--text3)',
        }}>
          {format(homeVal)}
        </span>
        <span className="label" style={{ fontSize: 11 }}>{label}</span>
        <span style={{
          fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 600,
          color: !homeWins ? 'var(--text)' : 'var(--text3)',
        }}>
          {format(awayVal)}
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
        <div style={{
          width: `${homePct}%`,
          background: 'var(--text)',
          borderRadius: 2,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

function RosterTable({ players, onPlayerClick, isGameLive, injuries }) {
  if (!players || players.length === 0) {
    return (
      <div style={{
        padding: '32px 0', color: 'var(--text3)', fontSize: 13,
        textAlign: 'center', fontFamily: 'DM Mono, monospace',
      }}>
        No data available.
      </div>
    )
  }

  const injuryMap = {}
  if (injuries && injuries.length > 0) {
    for (const inj of injuries) {
      if (inj.player) injuryMap[inj.player.toLowerCase()] = inj.status
    }
  }

  function getInjuryStatus(playerName) {
    if (!playerName) return null
    const key = playerName.toLowerCase()
    if (injuryMap[key]) return injuryMap[key]
    for (const [name, status] of Object.entries(injuryMap)) {
      if (key.includes(name.split(' ').pop().toLowerCase()) ||
          name.includes(key.split(' ').pop().toLowerCase())) {
        return status
      }
    }
    return null
  }

  function InjuryBadge({ name }) {
    const status = getInjuryStatus(name)
    if (!status) return null
    const color = status === 'OUT' ? 'var(--red)' : status === 'GTD' ? 'var(--gold)' : 'var(--text3)'
    const bg = status === 'OUT' ? 'var(--red-bg)' : status === 'GTD' ? 'var(--gold-bg)' : 'var(--bg3)'
    return (
      <span style={{
        fontSize: 9, fontFamily: 'DM Mono, monospace',
        padding: '1px 5px', borderRadius: 4,
        background: bg, color: color,
        border: `1px solid ${color}22`,
        marginLeft: 6, fontWeight: 600, letterSpacing: '0.04em',
      }}>
        {status}
      </span>
    )
  }

  if (isGameLive) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 45px 50px 45px 45px 45px 45px 50px',
          padding: '8px 16px',
          background: 'var(--bg3)',
          borderBottom: '1px solid var(--border)',
        }}>
          {['Player', 'POS', 'MIN', 'PTS', 'REB', 'AST', 'STL', '+/−'].map(h => (
            <span key={h} className="label" style={{
              fontSize: 10,
              textAlign: h === 'Player' || h === 'POS' ? 'left' : 'right',
            }}>{h}</span>
          ))}
        </div>
        {players.map((p, i) => (
          <div
            key={i}
            onClick={() => p.playerId && onPlayerClick(p.playerId)}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 45px 50px 45px 45px 45px 45px 50px',
              padding: '11px 16px',
              borderBottom: '1px solid var(--border)',
              cursor: p.playerId ? 'pointer' : 'default',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center' }}>
              {p.name}<InjuryBadge name={p.name} />
            </span>
            <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text3)' }}>{p.position || '—'}</span>
            <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', textAlign: 'right', color: 'var(--text2)' }}>{p.minutes || '—'}</span>
            <span style={{ fontSize: 14, fontFamily: 'DM Mono, monospace', textAlign: 'right', fontWeight: 700, color: 'var(--text)' }}>{p.points ?? '—'}</span>
            <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', textAlign: 'right', color: 'var(--text2)' }}>{p.rebounds ?? '—'}</span>
            <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', textAlign: 'right', color: 'var(--text2)' }}>{p.assists ?? '—'}</span>
            <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', textAlign: 'right', color: 'var(--text2)' }}>{p.steals ?? '—'}</span>
            <span style={{
              fontSize: 12, fontFamily: 'DM Mono, monospace', textAlign: 'right',
              color: p.plusMinus > 0 ? 'var(--green)' : p.plusMinus < 0 ? 'var(--red)' : 'var(--text2)',
            }}>
              {p.plusMinus > 0 ? '+' : ''}{p.plusMinus ?? '—'}
            </span>
          </div>
        ))}
      </div>
    )
  }

  // Scheduled roster
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 45px 40px 80px 60px',
        padding: '8px 16px',
        background: 'var(--bg3)',
        borderBottom: '1px solid var(--border)',
      }}>
        {['Player', 'POS', '#', 'HT / WT', 'STATUS'].map(h => (
          <span key={h} className="label" style={{
            fontSize: 10, textAlign: h === 'Player' ? 'left' : 'right',
          }}>{h}</span>
        ))}
      </div>
      {players.map((p, i) => {
        const injStatus = getInjuryStatus(p.name)
        const injColor = injStatus === 'OUT' ? 'var(--red)' : injStatus === 'GTD' ? 'var(--gold)' : 'var(--text3)'
        const injBg = injStatus === 'OUT' ? 'var(--red-bg)' : injStatus === 'GTD' ? 'var(--gold-bg)' : 'var(--bg3)'
        return (
          <div
            key={i}
            onClick={() => p.playerId && onPlayerClick(p.playerId)}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 45px 40px 80px 60px',
              padding: '11px 16px',
              borderBottom: '1px solid var(--border)',
              cursor: p.playerId ? 'pointer' : 'default',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{p.name}</span>
            <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text3)', textAlign: 'right' }}>{p.position || '—'}</span>
            <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)', textAlign: 'right' }}>{p.number || '—'}</span>
            <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text3)', textAlign: 'right' }}>
              {p.height && p.weight ? `${p.height} / ${p.weight}` : p.height || '—'}
            </span>
            <span style={{ textAlign: 'right' }}>
              {injStatus ? (
                <span style={{
                  fontSize: 9, fontFamily: 'DM Mono, monospace',
                  padding: '2px 6px', borderRadius: 4,
                  background: injBg, color: injColor,
                  border: `1px solid ${injColor}22`,
                  fontWeight: 600, letterSpacing: '0.04em',
                }}>
                  {injStatus}
                </span>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'DM Mono, monospace' }}>Active</span>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function GameDetailPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [rosterTab, setRosterTab] = useState('home')

  const { data, loading, error, refetch } = useApi(() => api.getGameDetail(gameId), [gameId])
  const { data: injData } = useApi(api.getInjuries)

  if (loading) return <LoadingSpinner text="Loading game data..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return null

  const home = data.homeTeam
  const away = data.awayTeam
  const prob = data.winProbability || { home: 50, away: 50 }
  const hs = home.statistics || {}
  const as_ = away.statistics || {}
  const injuries = injData?.injuries || []

  const isLive = data.status === '2' || data.status === 2
  const isFinal = data.status === '3' || data.status === 3
  const isGameLive = isLive || isFinal

  const hasStats = isGameLive && Object.values(hs).some(v => v > 0)

  const homePlayers = home.players || []
  const awayPlayers = away.players || []
  const rosterPlayers = rosterTab === 'home' ? homePlayers : awayPlayers

  const homeScore = home.score ?? 0
  const awayScore = away.score ?? 0
  const homeLeading = isGameLive ? homeScore > awayScore : prob.home > prob.away
  const awayLeading = isGameLive ? awayScore > homeScore : prob.away > prob.home

  const homeAbbr = normalizeAbbr(home.abbr || '')
  const awayAbbr = normalizeAbbr(away.abbr || '')

  const homeColor = TEAM_COLORS[homeAbbr] || '#3b82f6'
  const awayColor = TEAM_COLORS[awayAbbr] || '#888'

  // Use scoreboard path for NOP/UTA
  const getLogoUrl = (abbr) => {
    if (!abbr) return null
    const special = new Set(['NOP', 'UTA'])
    return special.has(abbr)
      ? `https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/${abbr.toLowerCase()}.png`
      : `https://a.espncdn.com/i/teamlogos/nba/500/${abbr.toLowerCase()}.png`
  }

  const homeLogo = getLogoUrl(homeAbbr)
  const awayLogo = getLogoUrl(awayAbbr)

  const tabStyle = (active) => ({
    padding: '6px 16px', borderRadius: 6,
    border: '1px solid var(--border)',
    background: active ? 'var(--text)' : 'transparent',
    color: active ? 'var(--bg)' : 'var(--text3)',
    fontSize: 12, fontFamily: 'DM Mono, monospace',
    cursor: 'pointer', fontWeight: active ? 600 : 400,
    transition: 'all 0.15s ease',
  })

  return (
    <div className="fade-up" style={{ maxWidth: 860 }}>

      <button onClick={() => navigate(-1)} className="btn" style={{ marginBottom: 24, gap: 6 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back
      </button>

      {/* ── Match Hero ── */}
      <div className="card" style={{ marginBottom: 20, padding: '28px 32px', overflow: 'hidden', position: 'relative' }}>

        {/* Aura: home = left, away = right — matches scoreboard layout */}
        {homeLogo && (
          <img src={homeLogo} alt="" aria-hidden="true" style={{
            position: 'absolute', left: -20, top: '50%',
            transform: 'translateY(-50%)',
            width: 220, height: 220,
            objectFit: 'contain', opacity: 0.055,
            pointerEvents: 'none', filter: 'blur(2px)',
          }} />
        )}
        {awayLogo && (
          <img src={awayLogo} alt="" aria-hidden="true" style={{
            position: 'absolute', right: -20, top: '50%',
            transform: 'translateY(-50%)',
            width: 220, height: 220,
            objectFit: 'contain', opacity: 0.055,
            pointerEvents: 'none', filter: 'blur(2px)',
          }} />
        )}

        {/* Status row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, position: 'relative' }}>
          <span style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
            {toPhilippineTime(data.statusText)}
          </span>
          {isLive ? (
            <span className="badge badge-live">
              Live · Q{data.period} {data.gameClock}
            </span>
          ) : isFinal ? (
            <span className="badge badge-final">Final</span>
          ) : (
            <span className="badge badge-neu">Scheduled</span>
          )}
        </div>

        {/* Scoreboard: HOME left, AWAY right */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          gap: 24, alignItems: 'center', marginBottom: 28, position: 'relative',
        }}>
          {/* Home — LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
            <TeamLogo abbr={homeAbbr} size={52} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 28,
                letterSpacing: '0.03em',
                color: homeLeading ? 'var(--text)' : 'var(--text3)',
              }}>
                {homeAbbr}
              </span>
              {!isGameLive && homeLeading && (
                <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--green)' }}>FAV</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'Inter, sans-serif' }}>
              {home.city} {home.name}
            </div>
            {isGameLive && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 56, lineHeight: 1, letterSpacing: '0.02em',
                  color: homeLeading ? 'var(--text)' : 'var(--text3)',
                  transition: 'color 0.3s',
                }}>
                  {home.score}
                </span>
                {homeLeading && isLive && (
                  <span style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'DM Mono, monospace' }}>▲</span>
                )}
              </div>
            )}
          </div>

          {/* VS */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'DM Mono, monospace', fontSize: 13,
              fontWeight: 500, color: 'var(--text3)', letterSpacing: '0.08em',
            }}>VS</div>
          </div>

          {/* Away — RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <TeamLogo abbr={awayAbbr} size={52} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              {!isGameLive && awayLeading && (
                <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--green)' }}>FAV</span>
              )}
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 28,
                letterSpacing: '0.03em', textAlign: 'right',
                color: awayLeading ? 'var(--text)' : 'var(--text3)',
              }}>
                {awayAbbr}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'Inter, sans-serif', textAlign: 'right' }}>
              {away.city} {away.name}
            </div>
            {isGameLive && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                {awayLeading && isLive && (
                  <span style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'DM Mono, monospace' }}>▲</span>
                )}
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 56, lineHeight: 1, letterSpacing: '0.02em', textAlign: 'right',
                  color: awayLeading ? 'var(--text)' : 'var(--text3)',
                  transition: 'color 0.3s',
                }}>
                  {away.score}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Win probability
            FIX: WinProbBar always renders left=away, right=home.
            Our scoreboard is home=left, away=right — the OPPOSITE.
            So we pass awayAbbr as homeAbbr and vice versa to flip the labels
            so they align with the scoreboard above.
        */}
        <div style={{ position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <span className="label" style={{ fontSize: 10 }}>Win Probability</span>
          </div>
          <WinProbBar
            homeProb={prob.away}
            homeAbbr={awayAbbr}
            awayAbbr={homeAbbr}
            size="lg"
          />
        </div>
      </div>

      {/* AI Analysis */}
      <AIAnalysis gameId={gameId} homeAbbr={homeAbbr} awayAbbr={awayAbbr} homeProb={prob.home} />

      {/* Team Comparison */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <span className="section-title">Team Comparison</span>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, fontFamily: 'DM Mono, monospace' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: homeColor }} />
            {homeAbbr}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: awayColor }} />
            {awayAbbr}
          </span>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        {hasStats ? (
          <>
            <CompareRow label="FG%"      homeVal={parseFloat(hs.fgPct).toFixed(1)}    awayVal={parseFloat(as_.fgPct).toFixed(1)}    format={v => `${v}%`} />
            <CompareRow label="3PT%"     homeVal={parseFloat(hs.threePct).toFixed(1)} awayVal={parseFloat(as_.threePct).toFixed(1)} format={v => `${v}%`} />
            <CompareRow label="FT%"      homeVal={parseFloat(hs.ftPct).toFixed(1)}    awayVal={parseFloat(as_.ftPct).toFixed(1)}    format={v => `${v}%`} />
            <CompareRow label="Rebounds" homeVal={hs.rebounds}        awayVal={as_.rebounds} />
            <CompareRow label="Assists"  homeVal={hs.assists}         awayVal={as_.assists} />
            <CompareRow label="Turnovers" homeVal={hs.turnovers}      awayVal={as_.turnovers} higherIsBetter={false} />
            <CompareRow label="Steals"   homeVal={hs.steals}          awayVal={as_.steals} />
            <CompareRow label="Blocks"   homeVal={hs.blocks}          awayVal={as_.blocks} />
            {hs.pointsInPaint > 0  && <CompareRow label="Paint Pts"  homeVal={hs.pointsInPaint}    awayVal={as_.pointsInPaint} />}
            {hs.fastBreakPoints > 0 && <CompareRow label="Fast Break" homeVal={hs.fastBreakPoints}  awayVal={as_.fastBreakPoints} />}
          </>
        ) : (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontFamily: 'DM Mono, monospace' }}>
            {isGameLive ? 'Waiting for stats...' : 'Stats available once the game tips off.'}
          </div>
        )}
      </div>

      {/* Box Score / Roster */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span className="section-title">{isGameLive ? 'Box Score' : 'Roster'}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={tabStyle(rosterTab === 'home')} onClick={() => setRosterTab('home')}>{homeAbbr}</button>
          <button style={tabStyle(rosterTab === 'away')} onClick={() => setRosterTab('away')}>{awayAbbr}</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        <RosterTable
          players={rosterPlayers}
          onPlayerClick={(id) => navigate(`/players/${id}`)}
          isGameLive={isGameLive}
          injuries={injuries}
        />
      </div>

    </div>
  )
}