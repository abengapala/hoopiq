from fastapi import APIRouter, HTTPException
import httpx
from cache import get_cached_injuries, set_cached_injuries

router = APIRouter()

ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba"


@router.get("/")
async def get_injuries():
    # ── Cache check ──────────────────────────────────────────
    cached = get_cached_injuries()
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(f"{ESPN_BASE}/injuries")
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"ESPN error: {resp.status_code}")
            data = resp.json()

        injuries = []
        for team_entry in data.get("injuries", []):
            for inj in team_entry.get("injuries", []):
                athlete = inj.get("athlete", {})
                team = athlete.get("team", {})
                # safe player id extraction
                player_id = str(athlete.get("id", ""))
                if not player_id and athlete.get("links"):
                    try:
                        player_id = athlete["links"][0]["href"].split("/id/")[1].split("/")[0]
                    except Exception:
                        player_id = ""
                injuries.append({
                    "player": athlete.get("displayName", ""),
                    "playerId": player_id,
                    "team": team.get("abbreviation", ""),
                    "teamId": str(team.get("id", "")),
                    "status": inj.get("status", ""),
                    "injury": inj.get("shortComment", ""),
                    "detail": inj.get("longComment", ""),
                    "updated": inj.get("date", ""),
                })

        payload = {"injuries": injuries, "count": len(injuries), "source": "espn"}

        # ── Write to cache ────────────────────────────────────
        set_cached_injuries(payload)

        return payload
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))