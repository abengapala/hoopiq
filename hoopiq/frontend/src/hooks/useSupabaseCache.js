import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * useSupabaseCache
 * Reads directly from Supabase cache tables on the frontend.
 * Falls back gracefully if data isn't cached yet (backend hasn't populated it).
 *
 * Usage:
 *   const { data, loading } = useSupabaseCache('standings')
 *   const { data, loading } = useSupabaseCache('games', '2025-04-03')
 *   const { data, loading } = useSupabaseCache('ai_analysis', gameId)
 */
export function useSupabaseCache(type, key = null) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      setLoading(true)
      setError(null)
      try {
        let result = null

        if (type === 'ai_analysis' && key) {
          const { data: row } = await supabase
            .from('cache_ai_analysis')
            .select('analysis')
            .eq('game_id', key)
            .maybeSingle()
          result = row?.analysis ?? null

        } else if (type === 'games' && key) {
          const { data: row } = await supabase
            .from('cache_games')
            .select('payload, updated_at, has_live')
            .eq('date', key)
            .maybeSingle()
          if (row) {
            const ttlMins = row.has_live ? 5 : 30
            const updatedAt = new Date(row.updated_at)
            const ageMs = Date.now() - updatedAt.getTime()
            if (ageMs < ttlMins * 60 * 1000) {
              result = JSON.parse(row.payload)
            }
          }

        } else {
          // misc: standings, injuries, upcoming_7, etc.
          const cacheKey = key ? `${type}_${key}` : type
          const { data: row } = await supabase
            .from('cache_misc')
            .select('payload, updated_at')
            .eq('key', cacheKey)
            .maybeSingle()

          if (row) {
            const ttlMap = { standings: 60, injuries: 30 }
            const ttlMins = ttlMap[type] ?? 30
            const updatedAt = new Date(row.updated_at)
            const ageMs = Date.now() - updatedAt.getTime()
            if (ageMs < ttlMins * 60 * 1000) {
              result = JSON.parse(row.payload)
            }
          }
        }

        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()
    return () => { cancelled = true }
  }, [type, key])

  return { data, loading, error }
}
