import { api } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { useEffect, useRef } from 'react'
import { GameCard, StatCard, SectionHeader, NewsItem, LoadingSpinner, ErrorState, SkeletonCard } from '../components/UI'
import HeroSection from '../components/HeroSection'

export default function HomePage() {
  const { data: gamesData, loading: gamesLoading, error: gamesError, refetch } = useApi(api.getTodayGames)
  const { data: newsData, loading: newsLoading, error: newsError } = useApi(api.getNews)
  const { data: injData } = useApi(api.getInjuries)

  const games = gamesData?.games || []

  const refetchRef = useRef(refetch)
  refetchRef.current = refetch
  useEffect(() => {
    const hasLive = games.some(g => g.status === 2 || g.isLive)
    const interval = hasLive ? 30_000 : 60_000
    const timer = setInterval(() => refetchRef.current(), interval)
    return () => clearInterval(timer)
  }, [games.length, games.some(g => g.isLive)])

  const news = Array.isArray(newsData)
    ? newsData
    : newsData?.news || newsData?.articles || newsData?.results || []

  const injuries = injData?.injuries || []
  const outCount = injuries.filter(i => i.status?.toLowerCase() === 'out').length
  const gtdCount = injuries.filter(i =>
    i.status?.toLowerCase() === 'day-to-day' ||
    i.status?.toLowerCase() === 'questionable' ||
    i.status?.toLowerCase() === 'gtd'
  ).length

  const liveCount = games.filter(g => g.status === 2 || g.isLive).length

  const today = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Manila',
  })

  return (
    <div className="fade-up">

      {/* Cinematic hero */}
      <HeroSection
        gamesCount={games.length}
        liveCount={liveCount}
        outCount={outCount}
        loading={gamesLoading}
      />

      {/* Dashboard section — scroll target from hero CTA */}
      <div id="games-section">

        {/* Page header */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          marginBottom: 24,
        }}>
          <div>
            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 36, letterSpacing: '0.03em',
              lineHeight: 1, color: 'var(--text)', marginBottom: 6,
            }}>
              Today's Games
            </h2>
            <p style={{
              fontFamily: 'DM Mono, monospace', fontSize: 11,
              color: 'var(--text3)', letterSpacing: '0.04em',
            }}>
              {today} · PHT
            </p>
          </div>
          <span className="badge badge-live" style={{ fontSize: 10, marginBottom: 4 }}>
            Live Data
          </span>
        </div>

        {/* Summary stat cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12, marginBottom: 32,
        }}>
          <StatCard label="Games Today" value={gamesLoading ? '—' : games.length} sub="NBA Regular Season" />
          <StatCard label="Live Now" value={gamesLoading ? '—' : liveCount} color="var(--green)" sub="In progress" />
          <StatCard label="Players Out" value={outCount || '—'} color="var(--red)" sub={`${gtdCount} GTD`} />
          <StatCard label="Data Source" value="Live" sub="ESPN · BallDontLie" />
        </div>

        {/* Loading skeletons */}
        {gamesLoading && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: 12, marginBottom: 40,
          }}>
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error */}
        {gamesError && (
          <div style={{ marginBottom: 40 }}>
            <ErrorState message={gamesError} onRetry={refetch} />
          </div>
        )}

        {/* Empty state */}
        {!gamesLoading && !gamesError && games.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '64px 20px',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 12, marginBottom: 40,
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🏀</div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 22, letterSpacing: '0.05em',
              color: 'var(--text2)', marginBottom: 6,
            }}>No Games Today</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
              Check upcoming games for the next schedule
            </div>
          </div>
        )}

        {/* Games grid */}
        {!gamesLoading && games.length > 0 && (
          <>
            {liveCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div className="live-dot" />
                <span style={{
                  fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 500,
                  letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--green)',
                }}>
                  {liveCount} game{liveCount > 1 ? 's' : ''} in progress
                </span>
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: 12, marginBottom: 44,
            }}>
              {games.map((g, i) => (
                <div key={g.gameId} className={`stagger-${Math.min(i + 1, 6)}`}>
                  <GameCard game={g} />
                </div>
              ))}
            </div>
          </>
        )}

      </div>

      {/* Top Stories */}
      <SectionHeader title="Top Stories" right="NBA News" />

      {newsLoading && <LoadingSpinner text="Fetching news..." />}

      {!newsLoading && newsError && (
        <div style={{ padding: '16px 0', color: 'var(--text3)', fontSize: 12, fontFamily: 'DM Mono, monospace' }}>
          Could not load news — check your backend connection.
        </div>
      )}

      {!newsLoading && !newsError && news.length > 0 && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '0 20px', overflow: 'hidden',
        }}>
          {news.slice(0, 8).map((n, i) => <NewsItem key={n.id ?? i} article={n} />)}
        </div>
      )}

      {!newsLoading && !newsError && news.length === 0 && (
        <div style={{ padding: '20px 0', color: 'var(--text3)', fontSize: 12, fontFamily: 'DM Mono, monospace' }}>
          No news articles available.
        </div>
      )}

    </div>
  )
}
