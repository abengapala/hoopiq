const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `API error ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Games
  getTodayGames:    ()              => apiFetch('/games/today'),
  getUpcomingGames: (days = 7)     => apiFetch(`/games/upcoming?days=${days}`),
  getGameDetail:    (gameId)       => apiFetch(`/games/${gameId}`),

  // Teams
  getAllTeams:  ()       => apiFetch('/teams/'),
  getTeam:     (teamId) => apiFetch(`/teams/${teamId}`),
  getStandings: ()      => apiFetch('/standings/'),

  // Players
  getPlayers: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return apiFetch(`/players/?${q}`)
  },
  // Keep playerId as string — ESPN IDs are large numbers, parseInt is safe
  // but string avoids any edge cases with routing
  getPlayer:      (playerId) => apiFetch(`/players/${playerId}`),
  searchPlayers:  (q, limit = 4) => apiFetch(`/players/search?q=${encodeURIComponent(q)}&limit=${limit}`),
  getStatLeaders: (stat = 'PTS') => apiFetch(`/players/stats/leaders?stat=${stat}`),

  // Injuries
  getInjuries: () => apiFetch('/injuries/'),

  // News
  getNews: (limit = 20) => apiFetch(`/news/?limit=${limit}`),

  // Predictions
  getPredictions: () => apiFetch('/predictions/'),
  getGameAnalysis: (gameId, homeAbbr, awayAbbr, homeProb) =>
    apiFetch(`/predictions/${gameId}/analysis?home_abbr=${homeAbbr}&away_abbr=${awayAbbr}&home_prob=${homeProb}`),

  // Rankings
  getPowerRankings: () => apiFetch('/power-rankings/'),

  // AI Chat
  sendChatMessage: (message, history = []) =>
    apiFetch('/ai-chat/', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
}