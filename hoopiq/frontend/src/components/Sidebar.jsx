import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import logo from '../assets/logo.png'

const NAV = [
  {
    section: 'Games',
    items: [
      { path: '/', label: "Today's Games", icon: '⏱' },
      { path: '/upcoming', label: 'Upcoming Games', icon: '📅' },
      { path: '/predictions', label: 'Predictions', icon: '📊' },
    ],
  },
  {
    section: 'League',
    items: [
      { path: '/standings', label: 'Standings', icon: '🏆' },
      { path: '/rankings', label: 'Power Rankings', icon: '📈' },
      { path: '/leaders', label: 'Stat Leaders', icon: '⭐' },
      { path: '/injuries', label: 'Injury Report', icon: '🩹' },
    ],
  },
  {
    section: 'Explore',
    items: [
      { path: '/teams', label: 'Teams', icon: '🛡' },
      { path: '/news', label: 'NBA News', icon: '📰' },
    ],
  },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Close sidebar when navigating on mobile
  const handleNavClick = () => { if (isMobile) setOpen(false) }

  const sidebarContent = (
    <div style={{
      width: 220, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <NavLink to="/" onClick={handleNavClick} style={{ textDecoration: 'none' }}>
          <img src={logo} alt="HoopIQ" style={{ width: 160, height: 'auto', objectFit: 'contain' }} />
        </NavLink>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '12px 8px' }}>
        {NAV.map(({ section, items }) => (
          <div key={section} style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 10, color: 'var(--text3)', letterSpacing: '1.5px',
              textTransform: 'uppercase', fontFamily: 'DM Mono, monospace',
              padding: '0 8px 8px',
            }}>{section}</div>
            {items.map(({ path, label, icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                onClick={handleNavClick}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 8,
                  fontSize: 13, fontWeight: 500,
                  color: isActive ? 'var(--accent)' : 'var(--text2)',
                  background: isActive ? 'rgba(247,148,29,0.12)' : 'transparent',
                  textDecoration: 'none', marginBottom: 2,
                  transition: 'all 0.15s',
                })}
              >
                <span style={{ fontSize: 14 }}>{icon}</span>
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--green)', fontFamily: 'DM Mono, monospace' }}>
          <div style={{ width: 6, height: 6, background: 'var(--green)', borderRadius: '50%' }} className="pulse-dot" />
          NBA Season Live
        </div>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4, fontFamily: 'DM Mono, monospace' }}>2025-26 Season</div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        {/* Hamburger button */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            position: 'fixed', top: 14, left: 14, zIndex: 300,
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 8, width: 40, height: 40,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 5, cursor: 'pointer', padding: 0,
          }}
        >
          <span style={{ display: 'block', width: 18, height: 2, background: 'var(--text)', borderRadius: 2, transition: 'all 0.2s', transform: open ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
          <span style={{ display: 'block', width: 18, height: 2, background: 'var(--text)', borderRadius: 2, transition: 'all 0.2s', opacity: open ? 0 : 1 }} />
          <span style={{ display: 'block', width: 18, height: 2, background: 'var(--text)', borderRadius: 2, transition: 'all 0.2s', transform: open ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
        </button>

        {/* Backdrop */}
        {open && (
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              zIndex: 199, backdropFilter: 'blur(2px)',
            }}
          />
        )}

        {/* Slide-in sidebar */}
        <div style={{
          position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 200,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        }}>
          {sidebarContent}
        </div>
      </>
    )
  }

  // Desktop — fixed sidebar as before
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100 }}>
      {sidebarContent}
    </div>
  )
}