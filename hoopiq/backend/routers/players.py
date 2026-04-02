from fastapi import APIRouter, HTTPException, Query
import httpx

router = APIRouter()

ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba"


@router.get("/stats/leaders")
async def get_stat_leaders(stat: str = Query("pts")):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(f"{ESPN_BASE}/leaders")
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"ESPN error: {resp.status_code}")
            data = resp.json()

        stat_map = {
            "pts": "points", "reb": "rebounds", "ast": "assists",
            "stl": "steals", "blk": "blockShots",
        }
        espn_stat = stat_map.get(stat.lower(), "points")

        leaders = []
        for category in data.get("categories", []):
            if category.get("name", "").lower() == espn_stat.lower():
                for i, leader in enumerate(category.get("leaders", [])[:25]):
                    athlete = leader.get("athlete", {})
                    team = leader.get("team", {})
                    leaders.append({
                        "playerId": athlete.get("id", ""),
                        "playerName": athlete.get("displayName", ""),
                        "teamAbbr": team.get("abbreviation", ""),
                        "teamId": team.get("id", ""),
                        "gp": 0,
                        "pts": round(float(leader.get("value", 0)), 1) if espn_stat == "points" else 0,
                        "reb": round(float(leader.get("value", 0)), 1) if espn_stat == "rebounds" else 0,
                        "ast": round(float(leader.get("value", 0)), 1) if espn_stat == "assists" else 0,
                        "stl": round(float(leader.get("value", 0)), 1) if espn_stat == "steals" else 0,
                        "blk": round(float(leader.get("value", 0)), 1) if espn_stat == "blockShots" else 0,
                        "fgPct": 0, "fg3Pct": 0, "ftPct": 0, "mins": 0,
                    })
                break

        return {"leaders": leaders, "stat": stat}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def get_players(search: str = Query(None)):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(f"{ESPN_BASE}/athletes", params={"limit": 1000, "active": True})
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"ESPN error: {resp.status_code}")
            data = resp.json()

        players = []
        for item in data.get("items", []):
            name = item.get("displayName", "")
            if search and search.lower() not in name.lower():
                continue
            players.append({
                "id": item.get("id", ""),
                "full_name": name,
                "first_name": item.get("firstName", ""),
                "last_name": item.get("lastName", ""),
                "position": item.get("position", {}).get("abbreviation", "") if isinstance(item.get("position"), dict) else "",
                "team": item.get("team", {}).get("abbreviation", "") if isinstance(item.get("team"), dict) else "",
                "teamId": item.get("team", {}).get("id", "") if isinstance(item.get("team"), dict) else "",
            })

        return {"players": players[:50], "count": len(players)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{player_id}")
async def get_player(player_id: str):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(f"{ESPN_BASE}/athletes/{player_id}")
            if resp.status_code != 200:
                raise HTTPException(status_code=404, detail="Player not found")
            data = resp.json()

        a = data.get("athlete", data)
        team = a.get("team", {}) if isinstance(a.get("team"), dict) else {}
        pos = a.get("position", {}) if isinstance(a.get("position"), dict) else {}

        return {
            "player": {
                "playerId": a.get("id", ""),
                "firstName": a.get("firstName", ""),
                "lastName": a.get("lastName", ""),
                "fullName": a.get("displayName", ""),
                "teamId": team.get("id", ""),
                "teamName": team.get("displayName", ""),
                "teamAbbr": team.get("abbreviation", ""),
                "position": pos.get("abbreviation", ""),
                "height": a.get("displayHeight", ""),
                "weight": a.get("displayWeight", ""),
                "country": a.get("birthPlace", {}).get("country", "") if isinstance(a.get("birthPlace"), dict) else "",
                "draftYear": a.get("draft", {}).get("year", "") if isinstance(a.get("draft"), dict) else "",
                "college": a.get("college", {}).get("name", "") if isinstance(a.get("college"), dict) else "",
            },
            "seasonStats": {
                "gp": 0, "pts": 0, "reb": 0, "ast": 0,
                "stl": 0, "blk": 0, "tov": 0,
                "fgPct": 0, "fg3Pct": 0, "ftPct": 0, "mins": 0,
            },
            "last5": [],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))