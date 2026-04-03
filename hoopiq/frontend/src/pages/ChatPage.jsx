import { useState, useRef, useEffect } from 'react'
import { PageHeader } from '../components/UI'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

const NBA_SYSTEM = `You are HoopIQ, an expert NBA analytics assistant. You have deep knowledge of:
- All NBA teams, players, statistics, and history
- Current season standings, stats, and trends
- Advanced analytics (PER, BPM, VORP, TS%, eFG%, Ortg, Drtg, Net Rtg)
- Game predictions and win probability analysis
- Historical comparisons and records
- Injury impacts and lineup analysis
- Playoff seeding and championship odds

Guidelines:
- Give expert, data-driven analysis
- Use specific stats and numbers when relevant
- Be conversational but authoritative
- Keep responses concise (under 200 words)
- Reference specific players, teams, and matchups confidently`

const QUICK_CHIPS = [
  "Who's the MVP favourite this season?",
  "Best team in the West right now?",
  "Top 5 players in the NBA today?",
  "Celtics vs Thunder — who wins the Finals?",
  "Explain offensive vs defensive rating",
  "Which rookies are standing out this year?",
]

async function askGemini(userMessage, history) {
  const contents = []
  for (const msg of history) {
    contents.push({
      role: msg.role === 'bot' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    })
  }
  contents.push({ role: 'user', parts: [{ text: userMessage }] })

  const body = {
    system_instruction: { parts: [{ text: NBA_SYSTEM }] },
    contents,
    generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
  }

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Gemini API error ${res.status}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.'
}

export default function ChatPage() {
  const [messages, setMessages] = useState([{
    role: 'bot',
    text: "Hey, I'm HoopIQ — your NBA analytics assistant. Ask me anything about today's games, team stats, player performance, predictions, or NBA history.",
  }])
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
      const history = newMessages.slice(1, -1)
      const reply = await askGemini(msg, history)
      setMessages(prev => [...prev, { role: 'bot', text: reply }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: "Couldn't reach Gemini API. Make sure your VITE_GEMINI_API_KEY is set in frontend/.env.local",
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const noApiKey = !GEMINI_API_KEY

  return (
    <div className="fade-up" style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
      <PageHeader
        title="AI Chat"
        subtitle="NBA analytics powered by Gemini"
      />

      {noApiKey && (
        <div style={{
          background: 'var(--red-bg)', border: '1px solid rgba(220,38,38,0.15)',
          borderRadius: 8, padding: '12px 16px', marginBottom: 16,
          fontSize: 13, color: 'var(--red)',
        }}>
          Add <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>VITE_GEMINI_API_KEY=your_key</code> to{' '}
          <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>frontend/.env.local</code> —{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--red)', textDecoration: 'underline' }}>
            get a free key here
          </a>
        </div>
      )}

      {/* Messages */}
      <div ref={messagesRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }}>
        {/* Quick chips */}
        {messages.length <= 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
            {QUICK_CHIPS.map((c, i) => (
              <button
                key={i}
                onClick={() => send(c)}
                className="btn"
                style={{ fontSize: 12, padding: '5px 12px', borderRadius: 100 }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '76%',
              padding: '12px 16px',
              fontSize: 14,
              lineHeight: 1.65,
              background: m.role === 'user' ? 'var(--text)' : 'var(--bg2)',
              color: m.role === 'user' ? 'var(--bg)' : 'var(--text)',
              border: m.role === 'user' ? 'none' : '1px solid var(--border)',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
            }}>
              {m.role === 'bot' && (
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginBottom: 6, letterSpacing: '0.06em' }}>
                  HOOPIQ · GEMINI
                </div>
              )}
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '4px 16px 16px 16px',
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginBottom: 8, letterSpacing: '0.06em' }}>
                HOOPIQ · GEMINI
              </div>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, background: 'var(--text3)', borderRadius: '50%' }}
                    className={i === 0 ? 'bounce' : i === 1 ? 'bounce-2' : 'bounce-3'} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        paddingTop: 14,
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: 8,
        marginTop: 12,
      }}>
        <input
          ref={inputRef}
          className="input"
          style={{ flex: 1 }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask anything about the NBA..."
          disabled={loading}
        />
        <button
          className="btn btn-primary"
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{ flexShrink: 0 }}
        >
          {loading ? '···' : 'Send'}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
        Powered by Google Gemini 2.0 Flash
      </div>
    </div>
  )
}