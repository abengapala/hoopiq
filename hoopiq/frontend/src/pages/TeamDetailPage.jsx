import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, SectionHeader, StatCard, TeamLogo } from '../components/UI'

const CHAMPIONSHIPS = {
  BOS: { titles: 17, years: [1957,1959,1960,1961,1962,1963,1964,1965,1966,1968,1969,1974,1976,1981,1984,1986,2008] },
  LAL: { titles: 17, years: [1949,1950,1952,1953,1954,1972,1980,1982,1985,1987,1988,2000,2001,2002,2009,2010,2020] },
  GSW: { titles: 7,  years: [1947,1956,1975,2015,2017,2018,2022] },
  CHI: { titles: 6,  years: [1991,1992,1993,1996,1997,1998] },
  SAS: { titles: 5,  years: [1999,2003,2005,2007,2014] },
  MIA: { titles: 3,  years: [2006,2012,2013] },
  DET: { titles: 3,  years: [1989,1990,2004] },
  PHI: { titles: 3,  years: [1955,1967,1983] },
  NYK: { titles: 2,  years: [1970,1973] },
  HOU: { titles: 2,  years: [1994,1995] },
  CLE: { titles: 1,  years: [2016] },
  MIL: { titles: 2,  years: [1971,2021] },
  TOR: { titles: 1,  years: [2019] },
  DAL: { titles: 1,  years: [2011] },
  DEN: { titles: 1,  years: [2023] },
  OKC: { titles: 1,  years: [1979] },
  SAC: { titles: 1,  years: [1951] },
  ATL: { titles: 1,  years: [1958] },
  BAL: { titles: 1,  years: [1948] },
  POR: { titles: 1,  years: [1977] },
  SEA: { titles: 1,  years: [1979] },
  WAS: { titles: 1,  years: [1978] },
}

const TEAM_COLORS = {
  ATL: '#E03A3E', BOS: '#007A33', BKN: '#AAAAAA', CHA: '#1D1160',
  CHI: '#CE1141', CLE: '#860038', DAL: '#00538C', DEN: '#FEC524',
  DET: '#C8102E', GSW: '#1D428A', HOU: '#CE1141', IND: '#FDBB30',
  LAC: '#C8102E', LAL: '#FDB927', MEM: '#5D76A9', MIA: '#98002E',
  MIL: '#00471B', MIN: '#236192', NOP: '#0C2340', NYK: '#006BB6',
  OKC: '#007AC1', ORL: '#0077C0', PHI: '#006BB6', PHX: '#E56020',
  POR: '#E03A3E', SAC: '#5A2D81', SAS: '#C4CED4', TOR: '#CE1141',
  UTA: '#F9A01B', WAS: '#002B5C',
}

export default function TeamDetailPage() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useApi(() => api.getTeam(parseInt(teamId)), [teamId])

  if (loading) return <LoadingSpinner text="Loading team..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return null

  const { team, stats, roster, last5, streak } = data
  const abbr = team.abbreviation || ''
  const primaryColor = TEAM_COLORS[abbr] || '#888'
  const champ = CHAMPIONSHIPS[abbr]

  return (
    <div className="fade-up">

      {/* Back */}
      <button onClick={() => navigate(-1)} className="btn" style={{ marginBottom: 20, gap: 6 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back
      </button>

      {/* ── Hero ── */}
      <div className="card" style={{ marginBottom: 20, position: 'relative', overflow: 'hidden', padding: 'clamp(20px, 4vw, 32px)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: primaryColor }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <TeamLogo abbr={abbr} size={64} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <h1 className="display" style={{ fontSize: 'clamp(22px, 5vw, 28px)', color: 'var(--text)', marginBottom: 4 }}>
              {team.full_name}
            </h1>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
              {team.city} · NBA
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {stats?.wins !== undefined && (
                <span className="badge badge-neu" style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
                  {stats.wins}–{stats.losses}
                </span>
              )}
              {streak && (
                <span className={`streak-chip ${streak.startsWith('W') ? 'streak-w' : 'streak-l'}`}>
                  {streak}
                </span>
              )}
              {champ && (
                <span className="badge" style={{
                  background: 'rgba(253,185,39,0.12)', border: '1px solid rgba(253,185,39,0.3)',
                  color: '#FDB927', fontFamily: 'DM Mono, monospace', fontSize: 11,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  🏆 {champ.titles}× Champion
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Championships / History ── */}
      {champ ? (
        <>
          <SectionHeader title="Championships" />
          <div className="card" style={{ marginBottom: 20, padding: 'clamp(16px, 4vw, 24px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(40px, 10vw, 56px)',
                lineHeight: 1,
                color: '#FDB927',
                letterSpacing: '0.02em',
              }}>
                {champ.titles}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                  NBA Championship{champ.titles > 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
                  Most recent: {champ.years[champ.years.length - 1]}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {champ.years.map(yr => (
                <span key={yr} style={{
                  fontSize: 11, fontFamily: 'DM Mono, monospace',
                  background: 'rgba(253,185,39,0.1)', border: '1px solid rgba(253,185,39,0.25)',
                  color: '#FDB927', borderRadius: 4, padding: '3px 8px',
                }}>
                  {yr}
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <SectionHeader title="Championships" />
          <div className="card" style={{
            marginBottom: 20, padding: 'clamp(16px, 4vw, 24px)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>🔍</span>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>No Championships Yet</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Still hunting for that ring.</div>
            </div>
          </div>
        </>
      )}

      {/* ── Season Stats — 3 cols on mobile, 6 on desktop ── */}
      {stats?.pts != null && stats.pts > 0 && (
        <>
          <SectionHeader title="Season Averages" />
          <div className="stat-grid-6" style={{ marginBottom: 20 }}>
            <StatCard label="PPG" value={stats.pts?.toFixed(1)} color={primaryColor} />
            <StatCard label="RPG" value={stats.reb?.toFixed(1)} />
            <StatCard label="APG" value={stats.ast?.toFixed(1)} />
            <StatCard label="FG%"  value={`${stats.fgPct?.toFixed(1)}%`} />
            <StatCard label="3P%"  value={`${stats.fg3Pct?.toFixed(1)}%`} />
            <StatCard
              label="+/−"
              value={(stats.plusMinus > 0 ? '+' : '') + stats.plusMinus?.toFixed(1)}
              color={stats.plusMinus > 0 ? 'var(--green)' : 'var(--red)'}
            />
          </div>
        </>
      )}

      {/* ── Last 5 Games ── */}
      {last5?.length > 0 && (
        <>
          <SectionHeader title="Last 5 Games" />
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ minWidth: 320 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 1fr 44px',
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--bg3)',
                }}>
                  {['Date', 'Matchup', 'W/L'].map((h, idx) => (
                    <span key={h} className="label" style={{
                      fontSize: 10,
                      textAlign: idx === 2 ? 'center' : 'left',
                    }}>{h}</span>
                  ))}
                </div>
                {last5.map((g, i) => (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 44px',
                    padding: '12px 16px',
                    borderBottom: i < last5.length - 1 ? '1px solid var(--border)' : 'none',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
                      {g.GAME_DATE}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>
                      {g.MATCHUP}
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 700, fontFamily: 'DM Mono, monospace',
                      color: g.WL === 'W' ? 'var(--green)' : 'var(--red)',
                      textAlign: 'center',
                    }}>
                      {g.WL}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Roster ── */}
      <SectionHeader title="Roster" />
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: 360 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr 48px 60px 64px 44px',
              padding: '10px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg3)',
            }}>
              {['#', 'Player', 'Pos', 'Ht', 'Wt', 'Age'].map((h, idx) => (
                <span key={h} style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--text3)',
                  fontFamily: 'DM Mono, monospace',
                  textAlign: idx === 5 ? 'right' : 'left',
                }}>{h}</span>
              ))}
            </div>
            {(roster || []).length === 0 ? (
              <div style={{ padding: '24px', color: 'var(--text3)', fontSize: 13, textAlign: 'center' }}>
                No roster data available.
              </div>
            ) : (
              (roster || []).map((p, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/players/${p.playerId}`)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '36px 1fr 48px 60px 64px 44px',
                    padding: '11px 16px',
                    borderBottom: i < roster.length - 1 ? '1px solid var(--border)' : 'none',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>{p.number}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>{p.position}</span>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{p.height}</span>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{p.weight} lbs</span>
                  <span style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{p.age}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Upcoming Games ── */}
      <SectionHeader title="Upcoming Games" />
      <div className="card" style={{ padding: 'clamp(16px, 4vw, 24px)' }}>
        <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '12px 0' }}>
          Upcoming schedule coming soon.
        </div>
      </div>

    </div>
  )
}