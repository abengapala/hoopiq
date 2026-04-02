import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, StatCard, SectionHeader } from '../components/UI'

export default function InjuriesPage() {
  const { data, loading, error, refetch } = useApi(api.getInjuries)
  const injuries = data?.injuries || []

  if (loading) return <LoadingSpinner text="Fetching injury report..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const out = injuries.filter(i => i.status === 'OUT')
  const gtd = injuries.filter(i => i.status === 'GTD')
  const other = injuries.filter(i => i.status !== 'OUT' && i.status !== 'GTD')

  const Section = ({ title, items, color }) => {
    if (!items.length) return null
    return (
      <>
        <SectionHeader title={title} right={<span className="badge" style={{ background: color + '20', color }}>{items.length} players</span>} />
        <div className="card" style={{ overflow: 'hidden', padding: 0, marginBottom: 20 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 70px 1fr 90px',
            padding: '10px 16px', borderBottom: '1px solid var(--border)',
            fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace',
          }}>
            <span>PLAYER</span><span>TEAM</span><span>INJURY</span><span style={{ textAlign: 'right' }}>UPDATED</span>
          </div>
          {items.map((inj, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 70px 1fr 90px',
              padding: '13px 16px', borderBottom: '1px solid var(--border)',
              alignItems: 'center', fontSize: 13,
              transition: 'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '2px 6px', borderRadius: 4, fontSize: 10,
                  fontFamily: 'DM Mono, monospace', fontWeight: 600,
                  background: inj.status === 'OUT' ? 'rgba(239,68,68,.15)' : 'rgba(245,158,11,.15)',
                  color: inj.status === 'OUT' ? 'var(--red)' : 'var(--gold)',
                }}>{inj.status}</span>
                <span style={{ fontWeight: 500 }}>{inj.player}</span>
              </div>
              <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text3)' }}>{inj.team}</span>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>{inj.injury}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', textAlign: 'right' }}>{inj.updated}</span>
            </div>
          ))}
        </div>
      </>
    )
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="OUT" value={out.length} color="var(--red)" sub="Season / Long-term" />
        <StatCard label="GTD" value={gtd.length} color="var(--gold)" sub="Game-time decision" />
        <StatCard label="Other" value={other.length} color="var(--blue)" sub="Day-to-day" />
        <StatCard label="Total" value={injuries.length} sub={`Source: ${data?.source || 'live'}`} />
      </div>

      <Section title="OUT" items={out} color="var(--red)" />
      <Section title="Game-Time Decision" items={gtd} color="var(--gold)" />
      <Section title="Other" items={other} color="var(--blue)" />
    </div>
  )
}
