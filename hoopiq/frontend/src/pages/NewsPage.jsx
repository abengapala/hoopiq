import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, NewsItem, StatCard, SectionHeader } from '../components/UI'

export default function NewsPage() {
  const { data, loading, error, refetch } = useApi(() => api.getNews(30))
  const news = data?.news || []

  if (loading) return <LoadingSpinner text="Fetching latest NBA news..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const categories = [...new Set(news.map(n => n.category))]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Stories" value={news.length} />
        <StatCard label="Injury Updates" value={news.filter(n => n.category === 'Injury Update').length} color="var(--red)" />
        <StatCard label="Game Recaps" value={news.filter(n => n.category === 'Game Recap').length} color="var(--blue)" />
        <StatCard label="Source" value={data?.source === 'espn' ? 'ESPN' : 'Mock'} color="var(--accent)" />
      </div>

      <SectionHeader title="Latest NBA News" right={
        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
          {news.length} stories
        </span>
      } />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {news.map((n, i) => <NewsItem key={i} article={n} />)}
      </div>
    </div>
  )
}
