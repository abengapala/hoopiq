from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()

ESPN_BASE = "https://site.api.espn.com/apis/v2/sports/basketball/nba"


@router.get("/")
async def get_standings():
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
                stats = {s["name"]: s.get("displayValue", s.get("value", "")) for s in team_entry.get("stats", [])}

                wins = int(float(stats.get("wins", 0)))
                losses = int(float(stats.get("losses", 0)))
                total = wins + losses
                pct = round(wins / total, 3) if total > 0 else 0.0

                entry = {
                    "teamId": team.get("id"),
                    "teamName": team.get("shortDisplayName", team.get("displayName", "")),
                    "teamCity": team.get("location", ""),
                    "abbr": team.get("abbreviation", ""),
                    "conference": "East" if "east" in conference.lower() else "West",
                    "wins": wins,
                    "losses": losses,
                    "pct": pct,
                    "gb": str(stats.get("gamesBehind", "—")),
                    "homeRecord": str(stats.get("homeRecord", "")),
                    "awayRecord": str(stats.get("awayRecord", "")),
                    "last10": str(stats.get("lastTen", "")),
                    "streak": str(stats.get("streak", "—")),
                    "playoffSeed": int(float(stats.get("playoffSeed", 0))) if stats.get("playoffSeed") else None,
                }

                if "east" in conference.lower():
                    east.append(entry)
                else:
                    west.append(entry)

        east.sort(key=lambda x: (-x["wins"], x["losses"]))
        west.sort(key=lambda x: (-x["wins"], x["losses"]))

        return {"east": east, "west": west}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
