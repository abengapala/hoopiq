import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, StatCard, SectionHeader, EmptyState } from '../components/UI'
import { useNavigate } from 'react-router-dom'

export default function PredictionsPage() {
  const { data, loading, error, refetch } = useApi(api.getPredictions)

  if (loading) return <LoadingSpinner text="Running AI predictions..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const predictions = data?.predictions || []

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Games Analyzed" value={predictions.length} />
        <StatCard label="High Confidence" value={predictions.filter(p => p.confidence === 'High').length} color="var(--green)" />
        <StatCard label="Medium Conf." value={predictions.filter(p => p.confidence === 'Medium').length} color="var(--gold)" />
        <StatCard label="Data Source" value="Live" color="var(--accent)" sub="nba_api + Claude AI" />
      </div>

      <SectionHeader title="Today's AI Predictions" />

      {predictions.length === 0 && <EmptyState emoji="🤖" title="No games today to predict" sub="Check back on a game day." />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
        {predictions.map((p, i) => (
          <div key={i} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: p.confidence === 'High' ? 'var(--green)' : p.confidence === 'Medium' ? 'var(--gold)' : 'var(--red)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{p.game}</div>
              <span className={`badge ${p.confidence === 'High' ? 'badge-live' : p.confidence === 'Medium' ? 'badge-gold' : 'badge-red'}`}>{p.confidence}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{p.pick}</span>
              <span style={{ fontSize: 13, color: 'var(--text3)' }}>to win</span>
              <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: 'var(--accent)', marginLeft: 'auto' }}>{p.pickProbability}%</span>
            </div>
            <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
              <div style={{ width: `${p.pickProbability}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent2))', borderRadius: 2 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(p.factors || []).map((f, fi) => (
                <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text2)' }}>
                  <div style={{ width: 4, height: 4, background: 'var(--accent)', borderRadius: '50%', flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>
            {p.homeTeam?.stats?.recent10 && (
              <div style={{ marginTop: 12, display: 'flex', gap: 12, fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text3)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <span>{p.homeTeam.abbr}: {p.homeTeam.stats.recent10} L10</span>
                <span>{p.awayTeam.abbr}: {p.awayTeam.stats.recent10} L10</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
