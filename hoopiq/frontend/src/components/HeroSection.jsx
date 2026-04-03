import { useNavigate } from 'react-router-dom'

/**
 * HeroSection — cinematic NBA/Nike-style hero
 * Drop this at the TOP of HomePage.jsx, just inside the fade-up div.
 * Props (all optional, passed down from HomePage):
 *   gamesCount, liveCount, outCount
 */
export default function HeroSection({ gamesCount = 0, liveCount = 0, outCount = 0, loading = false }) {
  const navigate = useNavigate()

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      marginLeft: 'calc(-50vw + 50%)',
      marginTop: '-56px',
      height: '100vh',
      minHeight: 600,
      maxHeight: 840,
      overflow: 'hidden',
      marginBottom: 52,
    }}>

      {/* ── Background image ── */}
      <img
        src="https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1800&q=80&auto=format&fit=crop"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 20%',
          transform: 'scale(1.03)',
        }}
      />

      {/* ── Layered dark overlays ── */}
      {/* Base black overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.52)',
      }} />
      {/* Bottom fade — blends into page bg */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, transparent 30%, rgba(11,15,20,0.85) 75%, #0b0f14 100%)',
      }} />
      {/* Left vignette — draws eye to text */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 55%)',
      }} />
      {/* Top fade */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 30%)',
      }} />

      {/* ── Blue accent line at top ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, #3b82f6, rgba(59,130,246,0.2) 60%, transparent)',
      }} />

      {/* ── Main content ── */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', paddingBottom: 64,
        maxWidth: 1200, margin: '0 auto', left: 0, right: 0,
        padding: '0 24px 64px',
      }}>

        {/* Season label */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
        }}>
          <div style={{
            width: 28, height: 2,
            background: '#3b82f6',
          }} />
          <span style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: 11, fontWeight: 500,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
          }}>
            2025–26 NBA Regular Season
          </span>
        </div>

        {/* Main headline */}
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(64px, 9vw, 108px)',
          lineHeight: 0.92,
          letterSpacing: '0.02em',
          color: '#ffffff',
          marginBottom: 10,
          maxWidth: 700,
        }}>
          Rule<br />
          <span style={{ color: '#3b82f6' }}>The</span>{' '}
          Court
        </h1>

        {/* Sub-headline */}
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 15, fontWeight: 400,
          color: 'rgba(255,255,255,0.52)',
          letterSpacing: '0.01em',
          marginBottom: 36,
          maxWidth: 400, lineHeight: 1.6,
        }}>
          Live scores, stats, predictions & injury reports — all in one place.
        </p>

        {/* CTA row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 52 }}>
          <button
            onClick={() => {
              document.getElementById('games-section')?.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: 8,
              fontFamily: 'Inter, sans-serif',
              fontSize: 14, fontWeight: 600,
              color: '#ffffff',
              cursor: 'pointer',
              letterSpacing: '0.01em',
              transition: 'background 0.15s, transform 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            View Today's Games
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>

          <button
            onClick={() => navigate('/standings')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 24px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: 8,
              fontFamily: 'Inter, sans-serif',
              fontSize: 14, fontWeight: 500,
              color: 'rgba(255,255,255,0.75)',
              cursor: 'pointer',
              letterSpacing: '0.01em',
              transition: 'border-color 0.15s, color 0.15s, transform 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Standings
          </button>
        </div>

        {/* ── Glass stats strip ── */}
        <div style={{
          display: 'flex', alignItems: 'stretch', gap: 0,
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 12,
          overflow: 'hidden',
          maxWidth: 560,
        }}>
          {[
            {
              label: 'Games Today',
              value: loading ? '—' : gamesCount,
              unit: null,
              accent: null,
            },
            {
              label: 'Live Now',
              value: loading ? '—' : liveCount,
              unit: null,
              accent: liveCount > 0 ? '#22c55e' : null,
              live: liveCount > 0,
            },
            {
              label: 'Players Out',
              value: loading ? '—' : outCount || '—',
              unit: null,
              accent: outCount > 0 ? '#ef4444' : null,
            },
            {
              label: 'Data',
              value: 'Live',
              unit: 'ESPN',
              accent: '#3b82f6',
            },
          ].map((stat, i, arr) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                padding: '18px 20px',
                borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}
            >
              <span style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: 9, fontWeight: 500,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)',
              }}>
                {stat.label}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                {stat.live && (
                  <span style={{
                    display: 'inline-block',
                    width: 6, height: 6,
                    borderRadius: '50%',
                    background: '#22c55e',
                    flexShrink: 0,
                    marginBottom: 2,
                    animation: 'pulse-live 1.6s ease-in-out infinite',
                  }} />
                )}
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 28, lineHeight: 1,
                  color: stat.accent || '#ffffff',
                  letterSpacing: '0.02em',
                }}>
                  {stat.value}
                </span>
                {stat.unit && (
                  <span style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: 9, color: 'rgba(255,255,255,0.3)',
                    letterSpacing: '0.06em',
                  }}>
                    {stat.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scroll hint ── */}
      <div style={{
        position: 'absolute', bottom: 20, right: 28,
        display: 'flex', alignItems: 'center', gap: 8,
        opacity: 0.35,
      }}>
        <span style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: '#ffffff',
        }}>
          Scroll
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M12 5v14M5 12l7 7 7-7"/>
        </svg>
      </div>
    </div>
  )
}
