import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, SectionHeader } from '../components/UI'

export default function RankingsPage() {
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useApi(api.getPowerRankings)
  const [conf, setConf] = useState('All')

  if (loading) return <LoadingSpinner text="Computing power rankings..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const all = data?.rankings || []
  const filtered = conf === 'All' ? all : all.filter(t => t.conference === conf)

  const RANK_COLORS = { 1: 'var(--gold)', 2: '#aaa', 3: '#cd7f32' }

  return (
    <div>
      {/* Conference filter */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, maxWidth: 280 }}>
        {['All', 'East', 'West'].map(c => (
          <button key={c} onClick={() => setConf(c)} style={{
            flex: 1, padding: '8px', borderRadius: 7, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', border: 'none', fontFamily: 'Space Grotesk, sans-serif',
            background: conf === c ? 'var(--bg4)' : 'transparent',
            color: conf === c ? 'var(--text)' : 'var(--text2)',
            transition: 'all .15s',
          }}>{c === 'All' ? 'All Teams' : `${c}ern`}</button>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '40px 1fr 80px 60px 60px 70px 80px',
          padding: '10px 16px', borderBottom: '1px solid var(--border)',
          fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace',
        }}>
          <span>#</span><span>TEAM</span><span>RECORD</span><span>PCT</span><span>L10</span><span>STREAK</span><span style={{ textAlign: 'right' }}>PWR SCR</span>
        </div>

        {filtered.map((t, i) => (
          <div key={t.teamId}
            style={{
              display: 'grid', gridTemplateColumns: '40px 1fr 80px 60px 60px 70px 80px',
              padding: '13px 16px', borderBottom: '1px solid var(--border)',
              alignItems: 'center', cursor: 'pointer', transition: 'background .15s',
            }}
            onClick={() => navigate(`/teams/${t.teamId}`)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 700, color: RANK_COLORS[t.rank] || 'var(--text3)' }}>
              {t.rank}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ fontWeight: 500, fontSize: 13 }}>{t.teamCity} {t.teamName}</span>
              <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>{t.conference}</span>
            </div>
            <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace' }}>{t.wins}-{t.losses}</span>
            <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)' }}>.{Math.round(t.pct * 1000)}</span>
            <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text2)' }}>{t.last10}</span>
            <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', padding: '2px 6px', borderRadius: 4, display: 'inline-block',
              background: t.streak?.startsWith('W') ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)',
              color: t.streak?.startsWith('W') ? 'var(--green)' : 'var(--red)',
            }}>{t.streak}</span>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: 'var(--accent)' }}>
                {t.powerScore?.toFixed(0)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
