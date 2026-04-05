import { useState, useRef, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const QUICK_CHIPS = [
  "Today's games?",
  "Current standings?",
  "Top scorers?",
  "Who's injured?",
]

function detectIntent(msg) {
  const m = msg.toLowerCase()
  const intents = []

  if (/standing|record|rank|conference|division|seed|win|loss|best team|worst team/.test(m))
    intents.push('standings')

  if (/today|tonight|game|score|playing|tip.?off|matchup|schedule|who.*play|what.*game/.test(m))
    intents.push('games')

  if (/injur|injured|out|hurt|missing|unavailable|status|day.to.day|gtd|sit|health/.test(m))
    intents.push('injuries')

  if (/leader|top|scoring|averaging|stats|points|rebounds|assists|blocks|steals|ppg|rpg|apg|best player|who leads/.test(m))
    intents.push('leaders')

  // Short messages or follow-ups → fetch everything for full context
  if (intents.length === 0 || msg.trim().split(' ').length <= 6)
    return ['standings', 'games', 'leaders', 'injuries']

  return intents
}

async function fetchStandings() {
  try {
    const res = await fetch(`${API_BASE}/standings`)
    if (!res.ok) return null
    const data = await res.json()
    const east = data.east || data.Eastern || []
    const west = data.west || data.Western || []
    const format = (conf, teams) =>
      `${conf}:\n` + teams.map((t, i) =>
        `  ${i + 1}. ${t.name} (${t.abbr}) — ${t.wins}W ${t.losses}L`
      ).join('\n')
    return format('Eastern Conference', east) + '\n\n' + format('Western Conference', west)
  } catch { return null }
}

async function fetchTodayGames() {
  try {
    const res = await fetch(`${API_BASE}/games/today`)
    if (!res.ok) return null
    const data = await res.json()
    const games = Array.isArray(data) ? data : data.games || []
    if (!games.length) return 'No games scheduled today.'
    return games.map(g => {
      const home = g.homeTeam || {}
      const away = g.awayTeam || {}
      const homeAbbr  = home.abbr || g.homeAbbr || ''
      const awayAbbr  = away.abbr || g.awayAbbr || ''
      const homeScore = home.score ?? g.homeScore ?? ''
      const awayScore = away.score ?? g.awayScore ?? ''
      const status = g.status === 2 || g.isLive
        ? `LIVE — ${awayScore}-${homeScore}`
        : g.status === 3
        ? `Final — ${awayScore}-${homeScore}`
        : g.gameTime || g.time || 'Upcoming'
      return `${awayAbbr} @ ${homeAbbr} — ${status}`
    }).join('\n')
  } catch { return null }
}

// playerQuery: if set, searches the full list for that player specifically
async function fetchInjuries(playerQuery = '') {
  try {
    const res = await fetch(`${API_BASE}/injuries`)
    if (!res.ok) return null
    const data = await res.json()
    const list = Array.isArray(data) ? data : data.injuries || []
    if (!list.length) return 'No major injuries reported.'

    const format = (p) =>
      `${p.name || p.player} (${p.team || p.abbr || ''}) — ${p.status}: ${p.injury || p.description || 'undisclosed'}`

    if (playerQuery) {
      // Search the ENTIRE list for the player (not just top 20)
      const q = playerQuery.toLowerCase()
      const matches = list.filter(p => {
        const name = (p.name || p.player || '').toLowerCase()
        // Match any word in the query that's longer than 2 chars (handles "Luka", "Doncic", etc.)
        return q.split(' ').some(word => word.length > 2 && name.includes(word))
      })
      if (matches.length > 0) return matches.map(format).join('\n')
      // Explicitly tell the AI the player is NOT injured
      return `${playerQuery} is NOT listed in the injury report — they are healthy and available.`
    }

    // General injury query — return top 50 (plenty for "who's injured?" without token bloat)
    return list.slice(0, 50).map(format).join('\n')
  } catch { return null }
}

async function fetchLeaders() {
  try {
    const res = await fetch(`${API_BASE}/players/stats/leaders?stat=PTS&limit=10`)
    if (!res.ok) return null
    const data = await res.json()
    const list = data.leaders || []
    if (!list.length) return null
    return 'Points Leaders (PPG):\n' + list.map((p, i) =>
      `  ${i + 1}. ${p.playerName} (${p.teamAbbr}) — ${p.pts} PPG`
    ).join('\n')
  } catch { return null }
}

// Extract a likely player name from messages like "is luka injured?" or "is he hurt?"
function extractPlayerName(msg) {
  return msg
    .replace(/\b(is|are|was|were|will|injured|hurt|out|healthy|playing|available|status|he|she|they|still|right now|today|tonight)\b/gi, '')
    .replace(/[?!.,]/g, '')
    .trim()
}

async function buildContext(intents, originalMsg) {
  const msg = originalMsg.toLowerCase()
  const words = originalMsg.trim().split(/\s+/)

  // Detect if user is asking about a specific player's injury status
  const isPlayerInjuryQuery = intents.includes('injuries') &&
    words.length <= 10 &&
    /injur|hurt|out|status|healthy|playing|available|gtd/.test(msg)

  const playerQuery = isPlayerInjuryQuery ? extractPlayerName(originalMsg) : ''

  const fetchers = {
    standings: ['CURRENT NBA STANDINGS',                              () => fetchStandings()],
    games:     ["TODAY'S NBA GAMES AND SCORES",                       () => fetchTodayGames()],
    injuries:  ['NBA INJURY REPORT (players currently injured/out)',  () => fetchInjuries(playerQuery)],
    leaders:   ['NBA SCORING LEADERS',                                () => fetchLeaders()],
  }

  const sections = []
  await Promise.all(intents.map(async intent => {
    const [label, fn] = fetchers[intent]
    const result = await fn()
    if (result) sections.push(`--- ${label} ---\n${result}`)
  }))

  return sections.length ? sections.join('\n\n') : ''
}

async function askGroq(userMessage, history, context) {
  const res = await fetch(`${API_BASE}/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: userMessage,
      history: history.map(m => ({ role: m.role, text: m.text })),
      context: context || null,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail || `Server error ${res.status}`)
  }
  const data = await res.json()
  return data.message || 'No response.'
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

export default function FloatingChat() {
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState([{
    role: 'bot',
    text: "Hey! Ask me anything about the NBA — I have live access to today's scores, standings, injuries, and stat leaders.",
  }])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const messagesRef = useRef(null)
  const inputRef    = useRef(null)
  const isMobile    = useIsMobile()

  const BOTTOM_NAV_H = 70
  const FAB_SIZE     = 52
  const FAB_GAP      = 12

  const fabBottom  = isMobile
    ? `calc(${BOTTOM_NAV_H}px + env(safe-area-inset-bottom, 0px) + ${FAB_GAP}px)`
    : '24px'
  const chatBottom = isMobile
    ? `calc(${BOTTOM_NAV_H}px + env(safe-area-inset-bottom, 0px) + ${FAB_GAP}px + ${FAB_SIZE}px + 8px)`
    : '88px'
  const fabRight  = isMobile ? '16px' : '28px'
  const chatRight = isMobile ? '16px' : '28px'

  useEffect(() => {
    if (messagesRef.current)
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    const newMessages = [...messages, { role: 'user', text: msg }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const history = newMessages.slice(1, -1)
      const intents = detectIntent(msg)
      const context = await buildContext(intents, msg)
      const reply   = await askGroq(msg, history, context)
      setMessages(prev => [...prev, { role: 'bot', text: reply }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `⚠️ ${err.message || "Couldn't reach the server."}`,
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <>
      {open && (
        <div style={{
          position: 'fixed',
          bottom: chatBottom,
          right: chatRight,
          width: isMobile ? 'calc(100vw - 32px)' : '360px',
          height: isMobile ? 'min(420px, calc(100dvh - 220px))' : '480px',
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
          zIndex: 9998, overflow: 'hidden',
          animation: 'fade-up 0.18s ease forwards',
        }}>

          {/* Header */}
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg2)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} className="pulse-dot" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em' }}>HoopIQ</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em' }}>
                NBA ANALYTICS · LIVE DATA + GROQ
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18, lineHeight: 1, padding: '4px 6px', borderRadius: 6 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text3)' }}
            >✕</button>
          </div>

          {/* Messages */}
          <div ref={messagesRef} style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {QUICK_CHIPS.map((c, i) => (
                  <button key={i} onClick={() => send(c)} style={{ padding: '4px 10px', borderRadius: 100, border: '1px solid var(--border)', background: 'var(--bg3)', fontSize: 11, cursor: 'pointer', color: 'var(--text2)', fontFamily: 'inherit' }}>{c}</button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '82%', padding: '9px 13px', fontSize: 13, lineHeight: 1.55, background: m.role === 'user' ? 'var(--text)' : 'var(--bg3)', color: m.role === 'user' ? 'var(--bg)' : 'var(--text)', border: m.role === 'user' ? 'none' : '1px solid var(--border)', borderRadius: m.role === 'user' ? '14px 14px 3px 14px' : '3px 14px 14px 14px' }}>
                  {m.role === 'bot' && (
                    <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginBottom: 4, letterSpacing: '0.06em' }}>HOOPIQ · LIVE + GROQ</div>
                  )}
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex' }}>
                <div style={{ padding: '9px 13px', borderRadius: '3px 14px 14px 14px', background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginBottom: 6, letterSpacing: '0.06em' }}>HOOPIQ · FETCHING LIVE DATA...</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 5, height: 5, background: 'var(--text3)', borderRadius: '50%' }} className={['bounce', 'bounce-2', 'bounce-3'][i]} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--bg2)' }}>
            <input
              ref={inputRef}
              className="input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask about the NBA..."
              disabled={loading}
            />
            <button className="btn btn-primary" onClick={() => send()} disabled={loading || !input.trim()} style={{ flexShrink: 0 }}>
              {loading ? '···' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Ask HoopIQ"
        style={{
          position: 'fixed',
          bottom: fabBottom, right: fabRight,
          width: FAB_SIZE, height: FAB_SIZE,
          borderRadius: '50%',
          background: 'var(--text)', color: 'var(--bg)',
          border: 'none', cursor: 'pointer',
          fontSize: open ? 18 : 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          zIndex: 9999,
          transition: 'transform 0.2s, box-shadow 0.2s, font-size 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {open ? '✕' : '🏀'}
      </button>
    </>
  )
}