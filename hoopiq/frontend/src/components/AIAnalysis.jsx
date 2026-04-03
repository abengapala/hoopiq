import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AIAnalysis({ gameId, homeAbbr, awayAbbr, homeProb }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [wasCached, setWasCached] = useState(false)

  const awayProb = 100 - homeProb
  const favoredTeam = homeProb >= awayProb ? homeAbbr : awayAbbr
  const favoredProb = Math.max(homeProb, awayProb)
  const underdog = homeProb >= awayProb ? awayAbbr : homeAbbr

  useEffect(() => {
    setLoading(true)
    setText('')
    setWasCached(false)

    const prompt =
      `You are analyzing a LIVE NBA game using only the data provided below. Do NOT use any memorized stats or fabricate records.

Live data:
- Matchup: ${awayAbbr} (away) vs ${homeAbbr} (home)
- Current win probability: ${homeAbbr} ${homeProb}%, ${awayAbbr} ${awayProb}%

Based only on this live win probability, give a sharp 2-3 sentence tactical breakdown of what this result could mean for both teams' playoff positioning and momentum. Do not cite any specific season stats or records you are not certain about.`

    fetch(`${API_BASE}/ai-chat/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        game_id: gameId,   // ← enables Supabase cache lookup + write
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        setLoading(false)
        const full = data.analysis || ''
        const cached = data.cached === true
        setWasCached(cached)

        if (cached) {
          // Cached — show instantly, no typewriter needed
          setText(full)
        } else {
          // Fresh from Groq — typewriter effect
          let i = 0
          const interval = setInterval(() => {
            setText(full.slice(0, i))
            i++
            if (i > full.length) clearInterval(interval)
          }, 12)
          return () => clearInterval(interval)
        }
      })
      .catch(() => {
        setLoading(false)
        setText(
          `${favoredTeam} holds a ${favoredProb}% win probability advantage tonight. ` +
          `They are the projected winner, though ${underdog} will look to push the pace.`
        )
      })
  }, [gameId, homeAbbr, awayAbbr, homeProb])

  return (
    <div className="card" style={{ marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--border2)' }} />
      <div style={{ paddingLeft: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span className="label">AI Analysis</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>· Powered by Groq</span>
          {wasCached && (
            <span style={{
              fontSize: 10,
              color: 'var(--text3)',
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '1px 6px',
              fontFamily: 'DM Mono, monospace',
              letterSpacing: '0.05em',
            }}>
              cached
            </span>
          )}
        </div>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 5, height: 5, background: 'var(--text3)', borderRadius: '50%' }}
                  className={i === 0 ? 'bounce' : i === 1 ? 'bounce-2' : 'bounce-3'} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>Analyzing matchup...</span>
          </div>
        ) : (
          <div style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text2)' }}>
            {text}
            {text.length > 0 && !wasCached && <span style={{ opacity: 0.4 }}>|</span>}
          </div>
        )}
      </div>
    </div>
  )
}