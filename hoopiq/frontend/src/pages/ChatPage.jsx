import { useState, useRef, useEffect } from 'react'
import { api } from '../lib/api'

const QUICK_CHIPS = [
  "Who's the MVP favourite this season?",
  "Best team in the West right now?",
  "Top 5 players in the NBA today?",
  "Celtics vs Thunder — who wins the Finals?",
  "Explain offensive rating vs defensive rating",
  "Which rookies are standing out this year?",
]

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hey! I'm HoopIQ 🏀 — your NBA analytics assistant powered by Google Gemini. Ask me anything about today's games, team stats, player performance, predictions, or NBA history. What's on your mind?",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages, loading])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')

    const newMessages = [...messages, { role: 'user', text: msg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      // Call backend which calls Gemini server-side (no CORS issues)
      const history = newMessages.slice(1, -1) // skip greeting + latest user msg
      const data = await api.sendChatMessage(msg, history)
      setMessages(prev => [...prev, { role: 'bot', text: data.message }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `⚠️ Error: ${err.message}. Make sure the backend is running on port 8000 and GEMINI_API_KEY is set in backend/.env`,
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>

      {/* Messages */}
      <div ref={messagesRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Quick chips — only show at start */}
        {messages.length <= 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {QUICK_CHIPS.map((c, i) => (
              <button key={i} onClick={() => send(c)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12,
                border: '1px solid var(--border)', color: 'var(--text2)',
                cursor: 'pointer', background: 'none', fontFamily: 'Space Grotesk, sans-serif',
                transition: 'all .15s',
              }}
                onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text2)' }}
              >{c}</button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '78%', padding: '12px 16px', fontSize: 13, lineHeight: 1.7,
              background: m.role === 'user' ? 'rgba(247,148,29,.15)' : 'var(--bg2)',
              border: m.role === 'user' ? '1px solid rgba(247,148,29,.25)' : '1px solid var(--border)',
              borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '2px 12px 12px 12px',
            }}>
              {m.role === 'bot' && (
                <div style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'DM Mono, monospace', marginBottom: 6, fontWeight: 500 }}>
                  🤖 HOOPIQ · GEMINI
                </div>
              )}
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderRadius: '2px 12px 12px 12px', background: 'var(--bg2)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'DM Mono, monospace', marginBottom: 8, fontWeight: 500 }}>
                🤖 HOOPIQ · GEMINI
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, background: 'var(--accent)', borderRadius: '50%' }}
                    className={i === 0 ? 'bounce' : i === 1 ? 'bounce-2' : 'bounce-3'} />
                ))}
                <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 10, marginTop: 12 }}>
        <input
          ref={inputRef}
          className="input-dark"
          style={{ flex: 1 }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask anything about the NBA..."
          disabled={loading}
        />
        <button
          className="btn-primary"
          onClick={() => send()}
          disabled={loading || !input.trim()}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
        Powered by Google Gemini 2.0 Flash (via backend) · Free tier
      </div>
    </div>
  )
}
