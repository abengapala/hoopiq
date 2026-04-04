import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, StatCard, PageHeader } from '../components/UI'

export default function PredictionsPage() {
  const { data, loading, error, refetch } = useApi(api.getPredictions)

  if (loading) return <LoadingSpinner text="Running predictions..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const predictions = data?.predictions || []

  return (
    <div className="fade-up">
      <PageHeader
        title="AI Predictions"
        subtitle="Win probability powered by machine learning"
      />

      {/* 2x2 on mobile, 4-col on desktop */}
      <div className="stat-grid-4" style={{ marginBottom: 28 }}>
        <StatCard label="Games Analyzed" value={predictions.length} />
        <StatCard label="High Confidence" value={predictions.filter(p => p.confidence === 'High').length} color="var(--green)" />
        <StatCard label="Medium" value={predictions.filter(p => p.confidence === 'Medium').length} color="var(--gold)" />
        <StatCard label="Data Source" value="Live" sub="ESPN · Claude AI" />
      </div>

      {predictions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '56px 16px', color: 'var(--text3)', fontSize: 14 }}>
          No games scheduled today — check back on a game day.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {predictions.map((p, i) => {
          const confColor = p.confidence === 'High' ? 'var(--green)' : p.confidence === 'Medium' ? 'var(--gold)' : 'var(--red)'
          return (
            <div key={i} className="card fade-up" style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Side accent */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: confColor }} />

              <div style={{ paddingLeft: 12 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 14,
                  gap: 8,
                  flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 'clamp(16px, 4vw, 18px)',
                      color: 'var(--text)', marginBottom: 2,
                      letterSpacing: '0.02em',
                    }}>{p.game}</div>
                    {p.homeTeam?.stats?.recent10 && (
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
                        {p.homeTeam.abbr} L10: {p.homeTeam.stats.recent10} · {p.awayTeam.abbr} L10: {p.awayTeam.stats.recent10}
                      </div>
                    )}
                  </div>
                  <span className={`badge ${p.confidence === 'High' ? 'badge-live' : p.confidence === 'Medium' ? 'badge-gold' : 'badge-red'}`}
                    style={{ flexShrink: 0 }}>
                    {p.confidence}
                  </span>
                </div>

                {/* Pick + prob */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text3)' }}>Pick:</span>
                    <span style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 'clamp(17px, 4vw, 20px)',
                      color: 'var(--text)',
                      letterSpacing: '0.02em',
                    }}>{p.pick}</span>
                  </div>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
                    {p.pickProbability}%
                  </span>
                </div>

                {/* Prob bar */}
                <div className="prob-bar" style={{ marginBottom: 12, height: 4 }}>
                  <div className="prob-fill" style={{ width: `${p.pickProbability}%`, background: confColor }} />
                </div>

                {/* Factors */}
                {p.factors?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {p.factors.map((f, fi) => (
                      <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text2)' }}>
                        <span style={{ color: 'var(--text3)', marginTop: 1, flexShrink: 0 }}>·</span>
                        {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}