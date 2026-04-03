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
  return (
    <div style={{
      width: 220, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 100, overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <NavLink to="/" style={{ textDecoration: 'none' }}>
          <img
            src={logo}
            alt="HoopIQ"
            style={{ width: 300, height: 'auto', objectFit: 'contain' }}
          />
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
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 8,
                  fontSize: 13, fontWeight: 500,
                  color: isActive ? 'var(--accent)' : 'var(--text2)',
                  background: isActive ? 'rgba(247,148,29,0.12)' : 'transparent',
                  textDecoration: 'none', marginBottom: 2,
                  transition: 'all 0.15s',
                })}
                onMouseEnter={e => { if (!e.currentTarget.style.color.includes('accent')) { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text)' }}}
                onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) { e.currentTarget.style.background = ''; e.currentTarget.style.color = '' }}}
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
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4, fontFamily: 'DM Mono, monospace' }}>2024-25 Season</div>
      </div>
    </div>
  )
}