from fastapi import APIRouter, HTTPException
from nba_api.stats.endpoints import leaguedashptteamdefend
import httpx
import time

router = APIRouter()

# nba_api doesn't have a direct injury endpoint — we scrape the official NBA injury report PDF
# or use the ESPN/CBS injury API. Here we use the NBA's official injury report endpoint.
NBA_INJURY_URL = "https://stats.nba.com/js/data/leaders/00_player_movement.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://www.nba.com/",
    "Origin": "https://www.nba.com",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Host": "stats.nba.com",
    "Connection": "keep-alive",
    "x-nba-stats-origin": "stats",
    "x-nba-stats-token": "true",
}

# Fallback mock data when API is unavailable
MOCK_INJURIES = [
    {"player": "Joel Embiid", "team": "PHI", "status": "OUT", "injury": "Left Knee (Season-Ending)", "updated": "Today"},
    {"player": "Kawhi Leonard", "team": "LAC", "status": "OUT", "injury": "Right Knee", "updated": "Today"},
    {"player": "Damian Lillard", "team": "MIL", "status": "OUT", "injury": "Left Achilles", "updated": "Today"},
    {"player": "Giannis Antetokounmpo", "team": "MIL", "status": "GTD", "injury": "Left Knee Soreness", "updated": "2h ago"},
    {"player": "De'Aaron Fox", "team": "SAC", "status": "GTD", "injury": "Ankle Sprain", "updated": "4h ago"},
    {"player": "Chris Paul", "team": "GSW", "status": "GTD", "injury": "Right Hand Contusion", "updated": "1h ago"},
    {"player": "Zion Williamson", "team": "NOP", "status": "OUT", "injury": "Hamstring", "updated": "Today"},
    {"player": "Ben Simmons", "team": "BKN", "status": "OUT", "injury": "Back (Season)", "updated": "Today"},
]


@router.get("/")
async def get_injuries():
    """Get current NBA injury report."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://cdn.nba.com/static/json/liveData/injuryReport/injuryreport.json",
                headers=HEADERS,
            )
            if resp.status_code != 200:
                return {"injuries": MOCK_INJURIES, "source": "mock"}

            data = resp.json()
            injuries = []

            for team_data in data.get("injuryReport", []):
                team_abbr = team_data.get("teamAbbreviation", "")
                for p in team_data.get("injuredPlayers", []):
                    injuries.append({
                        "player": p.get("playerName", ""),
                        "playerId": p.get("personId", ""),
                        "team": team_abbr,
                        "teamId": team_data.get("teamId", ""),
                        "status": p.get("playerStatus", ""),
                        "injury": p.get("returnedToGame", p.get("comment", "Unknown")),
                        "updated": p.get("injuryDate", ""),
                    })

            return {"injuries": injuries, "count": len(injuries), "source": "live"}
    except Exception:
        # Return mock data as fallback
        return {"injuries": MOCK_INJURIES, "count": len(MOCK_INJURIES), "source": "mock"}
