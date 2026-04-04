import { useState } from 'react'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, StatCard, PageHeader } from '../components/UI'

function formatStatus(status) {
  const s = status?.toLowerCase()
  if (s === 'out') return 'Out'
  if (s === 'day-to-day') return 'DTD'
  if (s === 'questionable') return 'GTD'
  if (s === 'probable') return 'PRB'
  return status || '—'
}

function getStatusStyle(status) {
  const s = status?.toLowerCase()
  if (s === 'out') return { bg: '#FEE2E2', color: '#B91C1C' }
  if (s === 'day-to-day' || s === 'questionable') return { bg: '#FEF3C7', color: '#B45309' }
  if (s === 'probable') return { bg: '#DCFCE7', color: '#15803D' }
  return { bg: 'var(--bg3)', color: 'var(--text3)' }
}

function InjuryRow({ inj, i, total }) {
  const [expanded, setExpanded] = useState(false)
  const style = getStatusStyle(inj.status)

  return (
    <>
      <div
        onClick={() => inj.detail && setExpanded(e => !e)}
        style={{
          display: 'grid',
          gridTemplateColumns: '72px 1fr 48px 20px',
          padding: '11px 16px',
          borderBottom: (!expanded && i < total - 1) ? '1px solid var(--border)' : 'none',
          alignItems: 'center',
          cursor: inj.detail ? 'pointer' : 'default',
          transition: 'background 0.1s',
          gap: 8,
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {/* Status */}
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '2px 8px', borderRadius: 100,
          fontSize: 10, fontWeight: 600,
          background: style.bg, color: style.color,
          width: 'fit-content',
        }}>
          {formatStatus(inj.status)}
        </span>

        {/* Player + team + injury stacked */}
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 500, color: 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {inj.player}
            {inj.team && (
              <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginLeft: 6 }}>
                {inj.team}
              </span>
            )}
          </div>
          <div style={{
            fontSize: 11, color: 'var(--text3)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {inj.injury || '—'}
          </div>
        </div>

        {/* Updated */}
        <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', textAlign: 'right' }}>
          {inj.updated ? inj.updated.slice(5, 10) : '—'}
        </span>

        {/* Expand arrow */}
        <span style={{ color: 'var(--text3)', fontSize: 10, textAlign: 'right' }}>
          {inj.detail ? (expanded ? '▲' : '▼') : ''}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && inj.detail && (
        <div style={{
          padding: '12px 16px 16px',
          borderBottom: i < total - 1 ? '1px solid var(--border)' : 'none',
          background: 'var(--bg3)',
          fontSize: 13, color: 'var(--text2)', lineHeight: 1.6,
        }}>
          {inj.detail}
        </div>
      )}
    </>
  )
}

function InjuryTable({ items }) {
  if (!items.length) return (
    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
      No players in this category.
    </div>
  )

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '72px 1fr 48px 20px',
        padding: '9px 16px',
        borderBottom: '1px solid var(--border)',
        fontSize: 10, color: 'var(--text3)',
        fontFamily: 'DM Mono, monospace',
        background: 'var(--bg3)',
        gap: 8,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontWeight: 600,
      }}>
        <span>STATUS</span>
        <span>PLAYER</span>
        <span style={{ textAlign: 'right' }}>DATE</span>
        <span />
      </div>

      {items.map((inj, i) => (
        <InjuryRow key={i} inj={inj} i={i} total={items.length} />
      ))}
    </div>
  )
}

export default function InjuriesPage() {
  const { data, loading, error, refetch } = useApi(api.getInjuries)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('out')

  if (loading) return <LoadingSpinner text="Loading injury report..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const injuries = data?.injuries || []

  const out = injuries.filter(i => i.status?.toLowerCase() === 'out')
  const gtd = injuries.filter(i =>
    ['day-to-day', 'questionable', 'gtd'].includes(i.status?.toLowerCase())
  )
  const other = injuries.filter(i =>
    !['out', 'day-to-day', 'questionable', 'gtd'].includes(i.status?.toLowerCase())
  )

  const currentList = tab === 'out' ? out : tab === 'gtd' ? gtd : other
  const filtered = currentList.filter(i =>
    !search ||
    i.player?.toLowerCase().includes(search.toLowerCase()) ||
    i.team?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fade-in">
      <PageHeader title="Injury Report" sub="Current NBA player availability" />

      {/* Stats — 2x2 on mobile */}
      <div className="stat-grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Out" value={out.length} color="var(--red)" sub="Season / Long-term" />
        <StatCard label="Day-to-Day" value={gtd.length} color="var(--gold)" sub="Game-time decision" />
        <StatCard label="Other" value={other.length} sub="Probable / misc" />
        <StatCard label="Total" value={injuries.length} sub="Source: ESPN" />
      </div>

      {/* Tabs + Search — stack on mobile */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', background: 'var(--bg3)', borderRadius: 8, padding: 3, gap: 2 }}>
          {[
            { key: 'out', label: `Out (${out.length})` },
            { key: 'gtd', label: `DTD (${gtd.length})` },
            { key: 'other', label: `Other (${other.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
              cursor: 'pointer', border: 'none', fontFamily: 'Inter',
              background: tab === t.key ? 'var(--bg2)' : 'transparent',
              color: tab === t.key ? 'var(--text)' : 'var(--text3)',
              boxShadow: tab === t.key ? 'var(--shadow)' : 'none',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="input"
            style={{ paddingLeft: 28, fontSize: 12 }}
            placeholder="Search player or team..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <InjuryTable items={filtered} />
    </div>
  )
}