from fastapi import APIRouter, HTTPException
import httpx
from cache import get_cached_standings, set_cached_standings

router = APIRouter()

ESPN_BASE = "https://site.api.espn.com/apis/v2/sports/basketball/nba"


@router.get("/")
async def get_standings():
    cached = get_cached_standings()
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(f"{ESPN_BASE}/standings")
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"ESPN API error: {resp.status_code}")
            data = resp.json()

        east, west = [], []

        for group in data.get("children", []):
            conference = group.get("name", "")
            for team_entry in group.get("standings", {}).get("entries", []):
                team = team_entry.get("team", {})

                # Key by name — ESPN uses exact strings including spaces
                stats = {
                    s["name"]: s.get("displayValue", "")
                    for s in team_entry.get("stats", [])
                }

                wins   = int(float(stats.get("wins", 0)))
                losses = int(float(stats.get("losses", 0)))
                total  = wins + losses
                pct    = round(wins / total, 3) if total > 0 else 0.0

                entry = {
                    "teamId":     team.get("id"),
                    "teamName":   team.get("shortDisplayName", team.get("displayName", "")),
                    "teamCity":   team.get("location", ""),
                    "abbr":       team.get("abbreviation", ""),
                    "conference": "East" if "east" in conference.lower() else "West",
                    "wins":       wins,
                    "losses":     losses,
                    "pct":        pct,
                    "gb":         stats.get("gamesBehind", "—") or "—",
                    # Correct ESPN key names confirmed from debug output:
                    "homeRecord": stats.get("Home", "—") or "—",
                    "awayRecord": stats.get("Road", "—") or "—",
                    "last10":     stats.get("Last Ten Games", "—") or "—",
                    # streak displayValue is already formatted: "W3", "L1"
                    "streak":     stats.get("streak", "—") or "—",
                    "playoffSeed": int(float(stats.get("playoffSeed", 0))) if stats.get("playoffSeed") else None,
                }

                if "east" in conference.lower():
                    east.append(entry)
                else:
                    west.append(entry)

        east.sort(key=lambda x: (-x["wins"], x["losses"]))
        west.sort(key=lambda x: (-x["wins"], x["losses"]))

        payload = {"east": east, "west": west}
        set_cached_standings(payload)
        return payload

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))