import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../App'
import logo from '../assets/logo.png'

const NAV_ITEMS = [
  { path: '/', label: 'Games', end: true },
  { path: '/upcoming', label: 'Upcoming' },
  { path: '/standings', label: 'Standings' },
  { path: '/teams', label: 'Teams' },
  { path: '/predictions', label: 'Predictions' },
  { path: '/rankings', label: 'Rankings' },
  { path: '/leaders', label: 'Stat Leaders' },
  { path: '/injuries', label: 'Injuries' },
  { path: '/news', label: 'News' },
]

function TeamLogoSmall({ abbr }) {
  return (
    <img
      src={`https://a.espncdn.com/i/teamlogos/nba/500/${abbr.toLowerCase()}.png`}
      alt={abbr}
      style={{ width: 24, height: 24, objectFit: 'contain' }}
      onError={e => { e.target.style.opacity = 0 }}
    />
  )
}

export default function Navbar() {
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  const [search, setSearch]           = useState('')
  const [searchFocus, setSearchFocus] = useState(false)
  const [allTeams, setAllTeams]       = useState([])
  const [players, setPlayers]         = useState([])
  const [playerLoading, setPlayerLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const inputRef    = useRef(null)
  const dropdownRef = useRef(null)
  const debounceRef = useRef(null)

  // Fetch real team IDs from backend once on mount
  useEffect(() => {
    fetch('http://localhost:8000/teams/')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        setAllTeams((data.teams || []).map(t => ({
          id:   String(t.id),
          abbr: t.abbreviation,
          name: t.full_name,
        })))
      })
      .catch(() => {})
  }, [])

  // Filter teams locally — instant
  const teamResults = search.trim().length >= 1 && allTeams.length > 0
    ? allTeams.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.abbr.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 4)
    : []

  // Fast player search via ESPN suggest API
  useEffect(() => {
    if (search.trim().length < 2) { setPlayers([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setPlayerLoading(true)
      try {
        const res = await fetch(
          `http://localhost:8000/players/search?q=${encodeURIComponent(search.trim())}&limit=4`
        )
        if (res.ok) {
          const data = await res.json()
          setPlayers((data.players || []).map(p => ({
            id:       String(p.id),
            name:     p.full_name,
            team:     p.team,
            position: p.position,
          })))
        }
      } catch { setPlayers([]) }
      finally  { setPlayerLoading(false) }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  useEffect(() => { setActiveIndex(-1) }, [search])

  useEffect(() => {
    const handler = (e) => {
      if (
        inputRef.current    && !inputRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) setSearchFocus(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const showDropdown = searchFocus && search.trim().length >= 1
  const allResults = [
    ...teamResults.map(t => ({ type: 'team',   ...t })),
    ...players.map(p =>     ({ type: 'player', ...p })),
  ]

  const handleSelect = (item) => {
    navigate(item.type === 'team' ? `/teams/${item.id}` : `/players/${item.id}`)
    setSearch('')
    setSearchFocus(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e) => {
    if (!showDropdown) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, allResults.length - 1)) }
    else if (e.key === 'ArrowUp')  { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter')    { e.preventDefault(); if (allResults[activeIndex] ?? allResults[0]) handleSelect(allResults[activeIndex] ?? allResults[0]) }
    else if (e.key === 'Escape')   { setSearchFocus(false); inputRef.current?.blur() }
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(18,22,28,0.92)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      height: 70, display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, var(--accent), rgba(59,130,246,0.3) 60%, transparent)',
        opacity: 0.8,
      }} />

      <div className="page-wrapper" style={{ width: '100%', display: 'flex', alignItems: 'center', paddingTop: 0, paddingBottom: 0 }}>

        {/* Logo */}
        <NavLink to="/" style={{ textDecoration: 'none', marginRight: 28, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="HoopIQ" style={{ height: 150, width: 'auto', objectFit: 'contain' }} />
        </NavLink>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, overflow: 'hidden' }}>
          {NAV_ITEMS.map(({ path, label, end }) => (
            <NavLink key={path} to={path} end={end} style={{ textDecoration: 'none' }}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              {label}
            </NavLink>
          ))}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: searchFocus ? 'var(--accent)' : 'var(--text3)',
              pointerEvents: 'none', transition: 'color 0.15s', zIndex: 1,
            }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              className="input"
              style={{ width: searchFocus ? 220 : 160, fontSize: 13, height: 34, padding: '0 12px 0 32px', transition: 'width 0.2s' }}
              placeholder="Search teams & players..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />

            {/* Dropdown */}
            {showDropdown && (
              <div ref={dropdownRef} style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 290,
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                overflow: 'hidden', zIndex: 200,
              }}>

                {/* Teams */}
                {teamResults.length > 0 && (
                  <div>
                    <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text3)', textTransform: 'uppercase' }}>
                      Teams
                    </div>
                    {teamResults.map((team, i) => (
                      <div key={team.id} onMouseDown={() => handleSelect({ type: 'team', ...team })} onMouseEnter={() => setActiveIndex(i)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', background: activeIndex === i ? 'var(--bg3)' : 'transparent', transition: 'background 0.1s' }}>
                        <TeamLogoSmall abbr={team.abbr} />
                        <div>
                          <div style={{ fontSize: 13, color: 'var(--text1)', fontWeight: 500 }}>{team.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{team.abbr}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--accent)', background: 'rgba(59,130,246,0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>TEAM</div>
                      </div>
                    ))}
                  </div>
                )}

                {teamResults.length > 0 && players.length > 0 && (
                  <div style={{ height: 1, background: 'var(--border)', margin: '2px 0' }} />
                )}

                {/* Players */}
                {players.length > 0 && (
                  <div>
                    <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text3)', textTransform: 'uppercase' }}>
                      Players
                    </div>
                    {players.map((player, i) => {
                      const gi = teamResults.length + i
                      return (
                        <div key={player.id} onMouseDown={() => handleSelect({ type: 'player', ...player })} onMouseEnter={() => setActiveIndex(gi)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', background: activeIndex === gi ? 'var(--bg3)' : 'transparent', transition: 'background 0.1s' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                            {(player.name || '?')[0].toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: 'var(--text1)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{player.team}{player.position ? ` · ${player.position}` : ''}</div>
                          </div>
                          <div style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(34,197,94,0.9)', background: 'rgba(34,197,94,0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 600, flexShrink: 0 }}>PLAYER</div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Loading */}
                {playerLoading && players.length === 0 && (
                  <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text3)', fontSize: 13 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    Searching players...
                  </div>
                )}

                {/* No results */}
                {!playerLoading && allResults.length === 0 && search.trim().length >= 2 && (
                  <div style={{ padding: '16px 12px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                    No results for "<span style={{ color: 'var(--text2)' }}>{search}</span>"
                  </div>
                )}

                {/* 1-char hint */}
                {search.trim().length === 1 && teamResults.length === 0 && (
                  <div style={{ padding: '12px', color: 'var(--text3)', fontSize: 12, textAlign: 'center' }}>Keep typing to search players...</div>
                )}

                {/* Keyboard hint */}
                {allResults.length > 0 && (
                  <div style={{ padding: '6px 12px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text3)', fontSize: 11 }}>
                    {[['↑↓','navigate'],['Enter','select'],['Esc','close']].map(([k,l]) => (
                      <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 3, marginRight: 4 }}>
                        <kbd style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 4px', fontSize: 10 }}>{k}</kbd>{l}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button onClick={toggle}
            style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', transition: 'all 0.15s', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text2)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.color = 'var(--text3)' }}
            title={dark ? 'Light mode' : 'Dark mode'}
          >
            {dark ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </nav>
  )
}
