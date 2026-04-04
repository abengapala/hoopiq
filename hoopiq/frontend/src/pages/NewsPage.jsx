import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorState, NewsItem, StatCard, PageHeader } from '../components/UI'

export default function NewsPage() {
  const { data, loading, error, refetch } = useApi(() => api.getNews(30))
  const news = data?.news || []

  if (loading) return <LoadingSpinner text="Fetching latest NBA news..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div className="fade-up">
      <PageHeader
        title="NBA News"
        subtitle="Latest stories from around the league"
        right={
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>{news.length} stories</span>
        }
      />

      {/* 2x2 on mobile, 4-col on desktop */}
      <div className="stat-grid-4" style={{ marginBottom: 28 }}>
        <StatCard label="Total Stories" value={news.length} />
        <StatCard label="Injury Updates" value={news.filter(n => n.category === 'Injury Update').length} color="var(--red)" />
        <StatCard label="Game Recaps" value={news.filter(n => n.category === 'Game Recap').length} />
        <StatCard label="Source" value={data?.source === 'espn' ? 'ESPN' : 'Live'} sub="Updated continuously" />
      </div>

      <div className="card" style={{ padding: '0 16px' }}>
        {news.map((n, i) => <NewsItem key={i} article={n} />)}
      </div>
    </div>
  )
}