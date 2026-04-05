import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { WinProbBar, SectionHeader, LoadingSpinner, ErrorState, TeamLogo, TEAM_COLORS } from '../components/UI'
import AIAnalysis from '../components/AIAnalysis'

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
      const phtTime = parsed.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' })
      const phtDate = parsed.toLocaleDateString('en-PH', { month: 'numeric', day: 'numeric', timeZone: 'Asia/Manila' })
      return `${phtDate} · ${phtTime} PHT`
    }
  }
  try {
    const d = new Date(rawText)
    if (!isNaN(d)) {
      return d.toLocaleString('en-PH', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' }) + ' PHT'
    }
  } catch (_) {}
  return rawText
}

// ── Countdown ─────────────────────────────────────────────────
function getTimeLeft(isoTime) {
  if (!isoTime) return null
  const diff = new Date(isoTime) - Date.now()
  if (diff <= 0) return null
  const totalSecs = Math.floor(diff / 1000)
  return {
    days:    Math.floor(totalSecs / 86400),
    hours:   Math.floor((totalSecs % 86400) / 3600),
    minutes: Math.floor((totalSecs % 3600) / 60),
    seconds: totalSecs % 60,
    total:   diff,
  }
}

function useCountdown(isoTime) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(isoTime))
  useEffect(() => {
    if (!isoTime) return
    const id = setInterval(() => setTimeLeft(getTimeLeft(isoTime)), 1000)
    return () => clearInterval(id)
  }, [isoTime])
  return timeLeft
}

function BouncingBall({ color = '#f97316', size = 16 }) {
  return (
    <>
      <span style={{ display: 'inline-block', animation: 'bbBounce 0.6s ease-in-out infinite alternate', lineHeight: 1 }}>
        <svg width={size} height={size} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill={color} />
          <path d="M12 2 Q16 6 16 12 Q16 18 12 22" stroke="rgba(0,0,0,0.25)" strokeWidth="1.2" fill="none"/>
          <path d="M12 2 Q8 6 8 12 Q8 18 12 22"  stroke="rgba(0,0,0,0.25)" strokeWidth="1.2" fill="none"/>
          <line x1="2" y1="12" x2="22" y2="12" stroke="rgba(0,0,0,0.25)" strokeWidth="1.2"/>
        </svg>
      </span>
      <style>{`
        @keyframes bbBounce {
          from { transform: translateY(0px); }
          to   { transform: translateY(-5px); }
        }
        @keyframes colonBlink {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 0.1; }
        }
      `}</style>
    </>
  )
}

function GameCountdown({ isoTime, awayColor, homeColor }) {
  const t = useCountdown(isoTime)
  const pad = n => String(n).padStart(2, '0')

  if (!t) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 0 4px' }}>
        <BouncingBall color="#22c55e" size={16} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', letterSpacing: '0.1em' }}>
          STARTING SOON
        </span>
      </div>
    )
  }

  const isImminent = t.total < 3600000

  // Check if tipoff is actually today in PHT
  const nowPHT     = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
  const tipoffPHT  = new Date(new Date(isoTime).toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
  const isToday    = nowPHT.getFullYear() === tipoffPHT.getFullYear() &&
                     nowPHT.getMonth()    === tipoffPHT.getMonth() &&
                     nowPHT.getDate()     === tipoffPHT.getDate()
  
  const accent     = isImminent ? '#22c55e' : isToday ? '#f97316' : 'var(--accent)'
  const ballColor  = isImminent ? '#22c55e' : '#f97316'

  const segments = t.days > 0
    ? [
        { val: t.days,    label: t.days === 1 ? 'DAY' : 'DAYS' },
        { val: t.hours,   label: 'HRS' },
        { val: t.minutes, label: 'MIN' },
      ]
    : [
        { val: t.hours,   label: 'HRS' },
        { val: t.minutes, label: 'MIN' },
        { val: t.seconds, label: 'SEC' },
      ]

  return (
    <div style={{ padding: '16px 0 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <BouncingBall color={ballColor} size={14} />
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
          color: accent, textTransform: 'uppercase',
        }}>
          {isImminent ? 'Tip-off soon!' : isToday ? 'Tip-off today' : 'Tip-off in'}
        </span>
      </div>

      {/* Digit blocks */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {segments.map((seg, i) => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: `${accent}14`,
              border: `1px solid ${accent}30`,
              borderRadius: 10,
              padding: '8px 14px',
              minWidth: 52,
              boxShadow: `0 2px 12px ${accent}18`,
            }}>
              <span style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: 28, fontWeight: 700,
                color: accent,
                lineHeight: 1,
                letterSpacing: '0.02em',
              }}>
                {pad(seg.val)}
              </span>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                color: accent, opacity: 0.65, marginTop: 4,
              }}>
                {seg.label}
              </span>
            </div>
            {i < segments.length - 1 && (
              <span style={{
                fontSize: 22, fontWeight: 800,
                color: accent, opacity: 0.4,
                animation: 'colonBlink 1s step-start infinite',
                marginBottom: 14,
              }}>:</span>
            )}
          </div>
        ))}
      </div>

      {/* Dual-color thin bar under countdown */}
      <div style={{
        width: '60%', height: 2, borderRadius: 2, marginTop: 4,
        background: `linear-gradient(90deg, ${awayColor}, ${homeColor})`,
        opacity: 0.4,
      }} />
    </div>
  )
}

// ── Compare Row ───────────────────────────────────────────────
function CompareRow({ label, homeVal, awayVal, format = v => v, higherIsBetter = true }) {
  const hv = parseFloat(homeVal) || 0
  const av = parseFloat(awayVal) || 0
  const total = hv + av || 1
  const homePct = (hv / total) * 100
  const homeWins = higherIsBetter ? hv >= av : hv <= av
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 600, color: homeWins ? 'var(--text)' : 'var(--text3)', minWidth: 40 }}>
          {format(homeVal)}
        </span>
        <span className="label" style={{ fontSize: 10, textAlign: 'center', flex: 1 }}>{label}</span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 600, color: !homeWins ? 'var(--text)' : 'var(--text3)', minWidth: 40, textAlign: 'right' }}>
          {format(awayVal)}
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: `${homePct}%`, background: 'var(--text)', borderRadius: 2, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

// ── Roster Table ──────────────────────────────────────────────
function RosterTable({ players, onPlayerClick, isGameLive, injuries }) {
  if (!players || players.length === 0) {
    return (
      <div style={{ padding: '32px 0', color: 'var(--text3)', fontSize: 13, textAlign: 'center', fontFamily: 'DM Mono, monospace' }}>
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
      if (key.includes(name.split(' ').pop().toLowerCase()) || name.includes(key.split(' ').pop().toLowerCase())) {
        return status
      }
    }
    return null
  }

  function InjuryBadge({ name }) {
    const status = getInjuryStatus(name)
    if (!status) return null
    const color = status === 'OUT' ? 'var(--red)' : status === 'GTD' ? 'var(--gold)' : 'var(--text3)'
    const bg    = status === 'OUT' ? 'var(--red-bg)' : status === 'GTD' ? 'var(--gold-bg)' : 'var(--bg3)'
    return (
      <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', padding: '1px 5px', borderRadius: 4, background: bg, color, border: `1px solid ${color}22`, marginLeft: 6, fontWeight: 600, letterSpacing: '0.04em', flexShrink: 0 }}>
        {status}
      </span>
    )
  }

  if (isGameLive) {
    return (
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: 520 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 48px 40px 40px 40px 40px 48px', padding: '8px 14px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
            {['Player', 'POS', 'MIN', 'PTS', 'REB', 'AST', 'STL', '+/−'].map(h => (
              <span key={h} className="label" style={{ fontSize: 10, textAlign: h === 'Player' || h === 'POS' ? 'left' : 'right' }}>{h}</span>
            ))}
          </div>
          {players.map((p, i) => (
            <div key={i} onClick={() => p.playerId && onPlayerClick(p.playerId)}
              style={{ display: 'grid', gridTemplateColumns: '1fr 40px 48px 40px 40px 40px 40px 48px', padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: p.playerId ? 'pointer' : 'default', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center' }}>{p.name}<InjuryBadge name={p.name} /></span>
              <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text3)' }}>{p.position || '—'}</span>
              <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', textAlign: 'right', color: 'var(--text2)' }}>{p.minutes || '—'}</span>
              <span style={{ fontSize: 13, fontFamily: 'DM Mono, monospace', textAlign: 'right', fontWeight: 700, color: 'var(--text)' }}>{p.points ?? '—'}</span>
              <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', textAlign: 'right', color: 'var(--text2)' }}>{p.rebounds ?? '—'}</span>
              <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', textAlign: 'right', color: 'var(--text2)' }}>{p.assists ?? '—'}</span>
              <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', textAlign: 'right', color: 'var(--text2)' }}>{p.steals ?? '—'}</span>
              <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', textAlign: 'right', color: p.plusMinus > 0 ? 'var(--green)' : p.plusMinus < 0 ? 'var(--red)' : 'var(--text2)' }}>
                {p.plusMinus > 0 ? '+' : ''}{p.plusMinus ?? '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ minWidth: 360 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 36px 72px 56px', padding: '8px 14px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
          {['Player', 'POS', '#', 'HT / WT', 'STATUS'].map(h => (
            <span key={h} className="label" style={{ fontSize: 10, textAlign: h === 'Player' ? 'left' : 'right' }}>{h}</span>
          ))}
        </div>
        {players.map((p, i) => {
          const injStatus = getInjuryStatus(p.name)
          const injColor  = injStatus === 'OUT' ? 'var(--red)' : injStatus === 'GTD' ? 'var(--gold)' : 'var(--text3)'
          const injBg     = injStatus === 'OUT' ? 'var(--red-bg)' : injStatus === 'GTD' ? 'var(--gold-bg)' : 'var(--bg3)'
          return (
            <div key={i} onClick={() => p.playerId && onPlayerClick(p.playerId)}
              style={{ display: 'grid', gridTemplateColumns: '1fr 40px 36px 72px 56px', padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: p.playerId ? 'pointer' : 'default', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{p.name}</span>
              <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text3)', textAlign: 'right' }}>{p.position || '—'}</span>
              <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text2)', textAlign: 'right' }}>{p.number || '—'}</span>
              <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text3)', textAlign: 'right' }}>
                {p.height && p.weight ? `${p.height}/${p.weight}` : p.height || '—'}
              </span>
              <span style={{ textAlign: 'right' }}>
                {injStatus ? (
                  <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', padding: '2px 6px', borderRadius: 4, background: injBg, color: injColor, border: `1px solid ${injColor}22`, fontWeight: 600, letterSpacing: '0.04em' }}>
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
    </div>
  )
}

// ── YouTube Highlights ────────────────────────────────────────
function YouTubeHighlights({ gameId, homeTeam, awayTeam, homeScore, awayScore, dateText, isLive }) {
  const [videoUrl, setVideoUrl]         = useState(null)
  const [input, setInput]               = useState('')
  const [editing, setEditing]           = useState(false)
  const [saving, setSaving]             = useState(false)
  const [loaded, setLoaded]             = useState(false)
  const [adminVisible, setAdminVisible] = useState(false)
  const clickCount = useRef(0)
  const clickTimer = useRef(null)

  function handleTitleClick() {
    clickCount.current += 1
    clearTimeout(clickTimer.current)
    if (clickCount.current >= 5) {
      setAdminVisible(v => !v)
      clickCount.current = 0
    } else {
      clickTimer.current = setTimeout(() => { clickCount.current = 0 }, 1500)
    }
  }

  let date = new Date()
  if (dateText) {
    const parsed = new Date(dateText + 'T12:00:00')
    if (!isNaN(parsed)) date = parsed
  }
  const month = date.toLocaleString('en-US', { month: 'long' })
  const day   = date.getDate()
  const year  = date.getFullYear()

  function extractVideoId(url) {
    if (!url) return null
    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtu\.be\/([^?&]+)/,
      /youtube\.com\/embed\/([^?&]+)/,
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const videoId  = extractVideoId(videoUrl)
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null

  useEffect(() => {
    api.getHighlights(gameId)
      .then(d => { if (d.youtube_url) setVideoUrl(d.youtube_url) })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [gameId])

  async function handleSave() {
    if (!input.trim()) return
    setSaving(true)
    try {
      await api.saveHighlights(gameId, input.trim())
      setVideoUrl(input.trim())
      setEditing(false)
      setInput('')
    } catch (_) {}
    setSaving(false)
  }

  if (!loaded) return null

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div onClick={handleTitleClick} style={{ cursor: 'default', userSelect: 'none' }}>
          <SectionHeader title={isLive ? '🔴 Live Stream' : 'Game Highlights'} />
        </div>
        {adminVisible && (
          <button
            onClick={() => { setEditing(v => !v); setInput(videoUrl || '') }}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text3)', fontSize: 11, fontFamily: 'DM Mono, monospace', cursor: 'pointer' }}
          >
            {videoUrl ? '✏️ Change link' : '+ Add link'}
          </button>
        )}
      </div>

      {adminVisible && editing && (
        <div className="card" style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', padding: '12px 16px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder={isLive ? 'Paste YouTube live stream URL...' : 'Paste YouTube highlights URL...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 12, fontFamily: 'DM Mono, monospace', outline: 'none' }}
          />
          <button onClick={handleSave} disabled={saving || !input.trim()} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#ff0000', color: '#fff', fontSize: 12, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: (!input.trim() || saving) ? 0.5 : 1 }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={() => setEditing(false)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', fontSize: 12, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      )}

      {embedUrl ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {isLive && (
            <div style={{ padding: '8px 16px', background: '#ff000018', borderBottom: '1px solid #ff000030', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff0000', display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: '#ff0000', fontFamily: 'DM Mono, monospace', fontWeight: 700, letterSpacing: '0.06em' }}>LIVE NOW</span>
            </div>
          )}
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={embedUrl}
              title={`${awayTeam} vs ${homeTeam} ${isLive ? 'live stream' : 'highlights'} ${month} ${day} ${year}`}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="12" height="9" viewBox="0 0 24 17" fill="#ff0000">
              <path d="M23.5 2.6S23.2.6 22.4.1C21.4-.5 20.3-.5 19.8-.4 16.5-.2 12 0 12 0S7.5-.2 4.2-.4C3.7-.5 2.6-.5 1.6.1.8.6.5 2.6.5 2.6S.2 4.9.2 7.2v2.1c0 2.3.3 4.6.3 4.6s.3 2 1.1 2.5c1 .6 2.4.6 3 .6.4 0 5.4.3 7.4.3s7-.3 7.4-.3c.6 0 2 0 3-.6.8-.5 1.1-2.5 1.1-2.5s.3-2.3.3-4.6V7.2c0-2.3-.3-4.6-.3-4.6zM9.7 11.5V5l6.5 3.3-6.5 3.2z"/>
            </svg>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
              {awayTeam} vs {homeTeam} · {month} {day}, {year}
            </span>
          </div>
        </div>
      ) : (
        !editing && (
          <div className="card" style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontFamily: 'DM Mono, monospace' }}>
            {isLive ? 'Live stream coming soon.' : 'Highlights coming soon.'}
          </div>
        )
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function GameDetailPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [rosterTab, setRosterTab] = useState('home')

  const { data, loading, error, refetch } = useApi(() => api.getGameDetail(gameId), [gameId])
  const { data: injData } = useApi(api.getInjuries)

  if (loading) return <LoadingSpinner text="Loading game data..." />
  if (error)   return <ErrorState message={error} onRetry={refetch} />
  if (!data)   return null

  const home = data.homeTeam
  const away = data.awayTeam
  const prob = data.winProbability || { home: 50, away: 50 }
  const hs   = home.statistics || {}
  const as_  = away.statistics || {}
  const injuries = injData?.injuries || []

  const isLive     = data.status === '2' || data.status === 2
  const isFinal    = data.status === '3' || data.status === 3
  const isScheduled = !isLive && !isFinal
  const isGameLive = isLive || isFinal

  const hasStats = isGameLive && Object.values(hs).some(v => v > 0)

  const homePlayers   = home.players || []
  const awayPlayers   = away.players || []
  const rosterPlayers = rosterTab === 'home' ? homePlayers : awayPlayers

  const homeScore   = home.score ?? 0
  const awayScore   = away.score ?? 0
  const homeLeading = isGameLive ? homeScore > awayScore : prob.home > prob.away
  const awayLeading = isGameLive ? awayScore > homeScore : prob.away > prob.home

  const homeAbbr = normalizeAbbr(home.abbr || '')
  const awayAbbr = normalizeAbbr(away.abbr || '')

  const homeColor = TEAM_COLORS[homeAbbr] || '#3b82f6'
  const awayColor = TEAM_COLORS[awayAbbr] || '#888'

  const getLogoUrl = (abbr) => {
    if (!abbr) return null
    const special = new Set(['NOP', 'UTA'])
    return special.has(abbr)
      ? `https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/${abbr.toLowerCase()}.png`
      : `https://a.espncdn.com/i/teamlogos/nba/500/${abbr.toLowerCase()}.png`
  }

  const homeLogo = getLogoUrl(homeAbbr)
  const awayLogo = getLogoUrl(awayAbbr)

  // ISO tip-off time for countdown — backend may send data.startTime or data.isoDate
  function parseTipoffIso(statusText) {
    if (!statusText) return null
    try {
      // statusText format: "4/5 - 3:30 PM EDT"
      const match = statusText.match(/(\d{1,2})\/(\d{1,2})\s*[-–]\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*(EDT|EST|ET)/i)
      if (!match) return null
      const [, month, day, hourStr, min, ampm, tz] = match
      let h = parseInt(hourStr)
      if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12
      if (ampm.toUpperCase() === 'AM' && h === 12) h = 0
      const offsetHrs = tz.toUpperCase() === 'EST' ? 5 : 4  // EDT=UTC-4, EST=UTC-5
      const year = new Date().getFullYear()
      // Build UTC time directly
      let utcH = h + offsetHrs
      let utcDay = parseInt(day)
      let utcMonth = parseInt(month)
      if (utcH >= 24) { utcH -= 24; utcDay += 1 }
      const iso = `${year}-${String(utcMonth).padStart(2,'0')}-${String(utcDay).padStart(2,'0')}T${String(utcH).padStart(2,'0')}:${min}:00.000Z`
      const d = new Date(iso)
      return isNaN(d) ? null : d.toISOString()
    } catch { return null }
  }
  
  const tipoffIso = parseTipoffIso(data.statusText) || null
  const tabStyle = (active) => ({
    padding: '6px 12px', borderRadius: 6,
    border: '1px solid var(--border)',
    background: active ? 'var(--text)' : 'transparent',
    color: active ? 'var(--bg)' : 'var(--text3)',
    fontSize: 12, fontFamily: 'DM Mono, monospace',
    cursor: 'pointer', fontWeight: active ? 600 : 400,
    transition: 'all 0.15s ease',
  })

  return (
    <div className="fade-up" style={{ maxWidth: 860 }}>

      <button onClick={() => navigate(-1)} className="btn" style={{ marginBottom: 20, gap: 6 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back
      </button>

      {/* ── Match Hero ─────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 16, padding: 'clamp(16px, 4vw, 28px) clamp(16px, 4vw, 32px)', overflow: 'hidden', position: 'relative' }}>

        {/* Aura logos */}
        {homeLogo && (
          <img src={homeLogo} alt="" aria-hidden="true" style={{ position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)', width: 180, height: 180, objectFit: 'contain', opacity: 0.055, pointerEvents: 'none', filter: 'blur(2px)' }} />
        )}
        {awayLogo && (
          <img src={awayLogo} alt="" aria-hidden="true" style={{ position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)', width: 180, height: 180, objectFit: 'contain', opacity: 0.055, pointerEvents: 'none', filter: 'blur(2px)' }} />
        )}

        {/* Status row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
            {toPhilippineTime(data.statusText)}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isLive ? (
              <span className="badge badge-live">Live · Q{data.period} {data.gameClock}</span>
            ) : isFinal ? (
              <span className="badge badge-final">Final</span>
            ) : (
              <span className="badge badge-neu">Scheduled</span>
            )}
          </div>
        </div>

        {/* Scoreboard */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 'clamp(8px, 3vw, 24px)', alignItems: 'center', marginBottom: 20, position: 'relative' }}>
          {/* Home — LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <TeamLogo abbr={homeAbbr} size={44} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(20px, 5vw, 28px)', letterSpacing: '0.03em', color: homeLeading ? 'var(--text)' : 'var(--text3)' }}>
                {homeAbbr}
              </span>
              {!isGameLive && homeLeading && <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--green)' }}>FAV</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'Inter, sans-serif' }}>{home.city} {home.name}</div>
            {isGameLive && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(40px, 10vw, 56px)', lineHeight: 1, letterSpacing: '0.02em', color: homeLeading ? 'var(--text)' : 'var(--text3)', transition: 'color 0.3s' }}>
                  {home.score}
                </span>
                {homeLeading && isLive && <span style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'DM Mono, monospace' }}>▲</span>}
              </div>
            )}
          </div>

          {/* VS / Score center */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 500, color: 'var(--text3)', letterSpacing: '0.08em' }}>VS</div>
          </div>

          {/* Away — RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <TeamLogo abbr={awayAbbr} size={44} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              {!isGameLive && awayLeading && <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--green)' }}>FAV</span>}
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(20px, 5vw, 28px)', letterSpacing: '0.03em', textAlign: 'right', color: awayLeading ? 'var(--text)' : 'var(--text3)' }}>
                {awayAbbr}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'Inter, sans-serif', textAlign: 'right' }}>{away.city} {away.name}</div>
            {isGameLive && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                {awayLeading && isLive && <span style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'DM Mono, monospace' }}>▲</span>}
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(40px, 10vw, 56px)', lineHeight: 1, letterSpacing: '0.02em', textAlign: 'right', color: awayLeading ? 'var(--text)' : 'var(--text3)', transition: 'color 0.3s' }}>
                  {away.score}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Countdown — only for scheduled games ── */}
        {isScheduled && tipoffIso && (
          <>
            <div style={{ borderTop: '1px solid var(--border)', marginBottom: 0 }} />
            <GameCountdown
              isoTime={tipoffIso}
              awayColor={awayColor}
              homeColor={homeColor}
            />
          </>
        )}

        {/* Win probability */}
        <div style={{ position: 'relative', marginTop: isScheduled ? 16 : 0 }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <span className="label" style={{ fontSize: 10 }}>Win Probability</span>
          </div>
          <WinProbBar homeProb={prob.away} homeAbbr={awayAbbr} awayAbbr={homeAbbr} size="lg" />
        </div>
      </div>

      {/* YouTube Highlights — live and final only */}
      {(isLive || isFinal) && (
        <YouTubeHighlights
          gameId={gameId}
          homeTeam={`${home.city} ${home.name}`}
          awayTeam={`${away.city} ${away.name}`}
          homeScore={homeScore}
          awayScore={awayScore}
          dateText={data.date || ''}
          isLive={isLive}
        />
      )}

      {/* AI Analysis */}
      <AIAnalysis gameId={gameId} homeAbbr={homeAbbr} awayAbbr={awayAbbr} homeProb={prob.home} />

      {/* Team Comparison */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
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
      <div className="card" style={{ marginBottom: 20 }}>
        {hasStats ? (
          <>
            <CompareRow label="FG%"       homeVal={parseFloat(hs.fgPct).toFixed(1)}    awayVal={parseFloat(as_.fgPct).toFixed(1)}    format={v => `${v}%`} />
            <CompareRow label="3PT%"      homeVal={parseFloat(hs.threePct).toFixed(1)} awayVal={parseFloat(as_.threePct).toFixed(1)} format={v => `${v}%`} />
            <CompareRow label="FT%"       homeVal={parseFloat(hs.ftPct).toFixed(1)}    awayVal={parseFloat(as_.ftPct).toFixed(1)}    format={v => `${v}%`} />
            <CompareRow label="Rebounds"  homeVal={hs.rebounds}       awayVal={as_.rebounds} />
            <CompareRow label="Assists"   homeVal={hs.assists}        awayVal={as_.assists} />
            <CompareRow label="Turnovers" homeVal={hs.turnovers}      awayVal={as_.turnovers} higherIsBetter={false} />
            <CompareRow label="Steals"    homeVal={hs.steals}         awayVal={as_.steals} />
            <CompareRow label="Blocks"    homeVal={hs.blocks}         awayVal={as_.blocks} />
            {hs.pointsInPaint   > 0 && <CompareRow label="Paint Pts"  homeVal={hs.pointsInPaint}   awayVal={as_.pointsInPaint} />}
            {hs.fastBreakPoints > 0 && <CompareRow label="Fast Break" homeVal={hs.fastBreakPoints} awayVal={as_.fastBreakPoints} />}
          </>
        ) : (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontFamily: 'DM Mono, monospace' }}>
            {isGameLive ? 'Waiting for stats...' : 'Stats available once the game tips off.'}
          </div>
        )}
      </div>

      {/* Box Score / Roster */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
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