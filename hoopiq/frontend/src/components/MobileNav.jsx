import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'

/* ─────────────────────────────────────────
   Bottom tab bar — primary 5 tabs + "More" drawer
───────────────────────────────────────── */

const PRIMARY_TABS = [
  {
    path: '/',
    end: true,
    label: 'Games',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    ),
  },
  {
    path: '/standings',
    label: 'Standings',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path d="M18 20V10M12 20V4M6 20v-6"/>
      </svg>
    ),
  },
  {
    path: '/teams',
    label: 'Teams',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    path: '/news',
    label: 'News',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
        <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
      </svg>
    ),
  },
  {
    path: null,
    label: 'More',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
      </svg>
    ),
  },
]

const MORE_ITEMS = [
  { path: '/upcoming',    label: 'Upcoming Games',  icon: '📅' },
  { path: '/predictions', label: 'Predictions',     icon: '📊' },
  { path: '/rankings',    label: 'Power Rankings',  icon: '📈' },
  { path: '/leaders',     label: 'Stat Leaders',    icon: '⭐' },
  { path: '/injuries',    label: 'Injury Report',   icon: '🩹' },
]

export default function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()

  const isMoreActive = MORE_ITEMS.some(item => location.pathname === item.path)

  return (
    <>
      {/* More drawer backdrop */}
      {moreOpen && (
        <div
          onClick={() => setMoreOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 290,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
          }}
        />
      )}

      {/* More drawer */}
      <div style={{
        position: 'fixed',
        bottom: moreOpen ? 70 : '-100%',
        left: 0, right: 0,
        zIndex: 295,
        background: 'var(--bg2)',
        borderTop: '1px solid var(--border)',
        borderRadius: '16px 16px 0 0',
        padding: '12px 0 8px',
        transition: 'bottom 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border2)' }} />
        </div>

        <div style={{ padding: '0 8px' }}>
          {MORE_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMoreOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '13px 16px',
                borderRadius: 10,
                textDecoration: 'none',
                color: isActive ? 'var(--accent)' : 'var(--text2)',
                background: isActive ? 'rgba(247,148,29,0.1)' : 'transparent',
                marginBottom: 2,
                fontSize: 15,
                fontWeight: 500,
              })}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 300,
        height: 70,
        background: 'rgba(18,22,28,0.97)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {PRIMARY_TABS.map((tab) => {
          if (tab.path === null) {
            // "More" button
            return (
              <button
                key="more"
                onClick={() => setMoreOpen(o => !o)}
                style={{
                  flex: 1, height: '100%',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 4, border: 'none', background: 'transparent',
                  cursor: 'pointer',
                  color: moreOpen || isMoreActive ? 'var(--accent)' : 'var(--text3)',
                  transition: 'color 0.15s',
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 28, borderRadius: 8,
                  background: moreOpen || isMoreActive ? 'rgba(247,148,29,0.12)' : 'transparent',
                  transition: 'background 0.15s',
                }}>
                  {tab.icon(moreOpen || isMoreActive)}
                </div>
                <span style={{ fontSize: 10, fontWeight: moreOpen || isMoreActive ? 600 : 400, letterSpacing: '0.02em' }}>
                  {tab.label}
                </span>
              </button>
            )
          }

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              style={{ flex: 1, textDecoration: 'none', height: '100%', display: 'flex' }}
            >
              {({ isActive }) => (
                <div style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 4,
                  color: isActive ? 'var(--accent)' : 'var(--text3)',
                  transition: 'color 0.15s',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 40, height: 28, borderRadius: 8,
                    background: isActive ? 'rgba(247,148,29,0.12)' : 'transparent',
                    transition: 'background 0.15s',
                  }}>
                    {tab.icon(isActive)}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, letterSpacing: '0.02em' }}>
                    {tab.label}
                  </span>
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}