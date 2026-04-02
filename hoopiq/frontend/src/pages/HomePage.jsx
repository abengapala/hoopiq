import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { GameCard, StatCard, SectionHeader, NewsItem, LoadingSpinner, ErrorState, SkeletonCard } from '../components/UI'

export default function HomePage() {
  const { data: gamesData, loading: gamesLoading, error: gamesError, refetch } = useApi(api.getTodayGames)
  const { data: newsData, loading: newsLoading } = useApi(api.getNews)
  const { data: injData } = useApi(api.getInjuries)

  const games = gamesData?.games || []
  const news = newsData?.news || []
  const injuries = injData?.injuries || []
  const outCount = injuries.filter(i => i.status === 'OUT').length
  const gtdCount = injuries.filter(i => i.status === 'GTD').length

  const liveCount = games.filter(g =>
    g.isLive === true || g.status === 2 || g.status === '2'
  ).length

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Games Today" value={gamesLoading ? '—' : games.length} sub="NBA Regular Season" />
        <StatCard label="Live Now" value={gamesLoading ? '—' : liveCount} color="var(--green)" sub="In progress" />
        <StatCard label="Players Out" value={outCount || '—'} color="var(--red)" sub={`${gtdCount} GTD`} />
        <StatCard label="API Source" value="Live" color="var(--accent)" sub="NBA.com via ESPN" />
      </div>

      <SectionHeader
        title="Today's Games"
        right={<span className="badge badge-live">● Live Odds</span>}
      />

      {gamesLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, marginBottom: 32 }}>
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      )}
      {gamesError && <ErrorState message={gamesError} onRetry={refetch} />}
      {!gamesLoading && !gamesError && games.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)', fontSize: 14, marginBottom: 32 }}>
          🏀 No games scheduled today. Check upcoming games.
        </div>
      )}
      {!gamesLoading && games.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, marginBottom: 32 }}>
          {games.map(g => <GameCard key={g.gameId} game={g} />)}
        </div>
      )}

      <SectionHeader title="Top Stories" />
      {newsLoading && <LoadingSpinner text="Fetching news..." />}
      {!newsLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {news.slice(0, 5).map((n, i) => <NewsItem key={i} article={n} />)}
        </div>
      )}
    </div>
  )
}