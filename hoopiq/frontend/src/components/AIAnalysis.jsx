import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function AIAnalysis({ gameId, homeAbbr, awayAbbr, homeProb }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setText('')
    setError(null)

    api.getGameAnalysis(gameId, homeAbbr, awayAbbr, homeProb)
      .then(data => {
        setLoading(false)
        // Typewriter effect
        const full = data.analysis || ''
        let i = 0
        const interval = setInterval(() => {
          setText(full.slice(0, i))
          i++
          if (i > full.length) clearInterval(interval)
        }, 14)
        return () => clearInterval(interval)
      })
      .catch(err => {
        setLoading(false)
        setError(err.message)
        setText(`${homeAbbr} holds a ${homeProb}% win probability advantage tonight. The home court factor and recent form make this the projected winner, though ${awayAbbr} will look to push the pace.`)
      })
  }, [gameId, homeAbbr, awayAbbr, homeProb])

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid rgba(247,148,29,0.2)',
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse at top left, rgba(247,148,29,0.05), transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 30, height: 30,
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0,
        }}>🤖</div>
        <div>
          <div style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--accent)', fontWeight: 500 }}>AI ANALYSIS</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Powered by Claude</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%' }}
                className={i === 0 ? 'bounce' : i === 1 ? 'bounce-2' : 'bounce-3'} />
            ))}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Analyzing matchup...</span>
        </div>
      ) : (
        <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text2)' }}>
          {text}
          {text.length > 0 && <span style={{ opacity: 0.4, animation: 'pulse-dot 1s infinite' }}>|</span>}
        </div>
      )}
    </div>
  )
}
