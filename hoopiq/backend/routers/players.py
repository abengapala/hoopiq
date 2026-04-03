from fastapi import APIRouter, HTTPException, Query
import httpx
import asyncio

router = APIRouter()

ESPN_BASE       = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba"
ESPN_STATS_BASE = "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba"

STAT_SORT_MAP = {
    "PTS":     "offensive.avgPoints",
    "REB":     "offensive.avgRebounds",
    "AST":     "offensive.avgAssists",
    "STL":     "defensive.avgSteals",
    "BLK":     "defensive.avgBlocks",
    "FG_PCT":  "offensive.fieldGoalPct",
    "FG3_PCT": "offensive.threePointFieldGoalPct",
    "pts":     "offensive.avgPoints",
    "reb":     "offensive.avgRebounds",
    "ast":     "offensive.avgAssists",
    "stl":     "defensive.avgSteals",
    "blk":     "defensive.avgBlocks",
    "fgPct":   "offensive.fieldGoalPct",
    "fg3Pct":  "offensive.threePointFieldGoalPct",
}

OFFENSIVE_KEYS = [
    "avgPoints", "avgRebounds", "avgFgAttempts", "fieldGoalPct",
    "avgThreePtAttempts", "avgThreePtMade", "threePointFieldGoalPct",
    "avgFtAttempts", "avgFtMade", "freeThrowPct",
    "avgAssists", "avgTurnovers",
]
DEFENSIVE_KEYS = ["avgSteals", "avgBlocks"]
GENERAL_KEYS   = ["gamesPlayed", "avgMinutes"]


def parse_categories(categories: list) -> dict:
    result = {}
    for cat in categories:
        name   = cat.get("name", "")
        values = cat.get("values", [])
        if name == "offensive":
            for i, key in enumerate(OFFENSIVE_KEYS):
                if i < len(values): result[key] = values[i]
        elif name == "defensive":
            for i, key in enumerate(DEFENSIVE_KEYS):
                if i < len(values): result[key] = values[i]
        elif name == "general":
            for i, key in enumerate(GENERAL_KEYS):
                if i < len(values): result[key] = values[i]
    return result


def safe_float(val, decimals=1):
    try:
        return round(float(val), decimals)
    except (TypeError, ValueError):
        return 0.0


def extract_athlete(data: dict) -> dict:
    """Walk all known ESPN response shapes and return the athlete dict."""
    candidates = [
        data.get("athlete"),
        (data.get("playerCard") or {}).get("athlete"),
        data if data.get("displayName") else None,
        data if data.get("firstName") else None,
    ]
    for c in candidates:
        if c and isinstance(c, dict) and (c.get("displayName") or c.get("firstName")):
            return c
    return {}


# 1. Stat leaders
@router.get("/stats/leaders")
async def get_stat_leaders(stat: str = Query("PTS")):
    espn_sort = STAT_SORT_MAP.get(stat, "offensive.avgPoints")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{ESPN_STATS_BASE}/statistics/byathlete",
                params={
                    "region": "us", "lang": "en",
                    "contentorigin": "espn", "isqualified": "true",
                    "limit": 25, "sort": f"{espn_sort}:desc",
                }
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"ESPN error: {resp.status_code}")
            data = resp.json()

        leaders = []
        for entry in data.get("athletes", []):
            athlete = entry.get("athlete", {})
            stats   = parse_categories(entry.get("categories", []))
            leaders.append({
                "playerId":   str(athlete.get("id", "")),
                "playerName": athlete.get("displayName", ""),
                "teamAbbr":   athlete.get("teamShortName", ""),
                "teamId":     str(athlete.get("teamId", "")),
                "gp":    int(safe_float(stats.get("gamesPlayed", 0), 0)),
                "pts":   safe_float(stats.get("avgPoints", 0)),
                "reb":   safe_float(stats.get("avgRebounds", 0)),
                "ast":   safe_float(stats.get("avgAssists", 0)),
                "stl":   safe_float(stats.get("avgSteals", 0)),
                "blk":   safe_float(stats.get("avgBlocks", 0)),
                "fgPct": safe_float(stats.get("fieldGoalPct", 0)),
                "fg3Pct":safe_float(stats.get("threePointFieldGoalPct", 0)),
                "ftPct": safe_float(stats.get("freeThrowPct", 0)),
                "mins":  safe_float(stats.get("avgMinutes", 0)),
            })
        return {"leaders": leaders, "stat": stat}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 2. Fast search
@router.get("/search")
async def search_players(q: str = "", limit: int = 4):
    if not q or len(q.strip()) < 2:
        return {"players": []}
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://site.api.espn.com/apis/common/v3/search",
                params={
                    "query": q.strip(), "limit": limit,
                    "type": "player", "sport": "basketball", "league": "nba",
                }
            )
            if resp.status_code != 200:
                return {"players": []}
            data = resp.json()

        players = []
        for item in data.get("items", []):
            uid  = item.get("id", "")
            name = item.get("displayName", item.get("name", ""))
            desc = item.get("description", "")
            position, team = "", ""
            if desc:
                parts = [p.strip() for p in desc.split(",")]
                if parts: position = parts[0]
                if len(parts) >= 2: team = parts[1]
            if uid and name:
                players.append({"id": uid, "full_name": name, "position": position, "team": team})
        return {"players": players[:limit]}
    except Exception:
        return {"players": []}


# 3. All players
@router.get("/")
async def get_players(search: str = Query(None)):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{ESPN_BASE}/athletes",
                params={"limit": 1000, "active": True}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"ESPN error: {resp.status_code}")
            data = resp.json()

        players = []
        for item in data.get("items", []):
            name = item.get("displayName", "")
            if search and search.lower() not in name.lower():
                continue
            players.append({
                "id":         item.get("id", ""),
                "full_name":  name,
                "first_name": item.get("firstName", ""),
                "last_name":  item.get("lastName", ""),
                "position":   item.get("position", {}).get("abbreviation", "") if isinstance(item.get("position"), dict) else "",
                "team":       item.get("team", {}).get("abbreviation", "") if isinstance(item.get("team"), dict) else "",
                "teamId":     item.get("team", {}).get("id", "") if isinstance(item.get("team"), dict) else "",
            })
        return {"players": players[:50], "count": len(players)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 4. Single player
@router.get("/{player_id}")
async def get_player(player_id: str):
    bio_url_a = f"https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{player_id}"
    bio_url_b = f"{ESPN_BASE}/athletes/{player_id}"
    stats_url = f"{ESPN_STATS_BASE}/statistics/byathlete"

    async with httpx.AsyncClient(timeout=30.0) as client:
        bio_a_task = client.get(bio_url_a, params={"region": "us", "lang": "en", "contentorigin": "espn"})
        bio_b_task = client.get(bio_url_b)
        stats_task = client.get(stats_url, params={
            "region": "us", "lang": "en", "contentorigin": "espn",
            "isqualified": "false", "limit": 600,
            "sort": "offensive.avgPoints:desc",
        })

        results = await asyncio.gather(bio_a_task, bio_b_task, stats_task, return_exceptions=True)
        bio_a_resp, bio_b_resp, stats_resp = results

    # Bio: try both endpoints, use first valid one
    a = {}
    for resp in [bio_a_resp, bio_b_resp]:
        if isinstance(resp, Exception):
            continue
        if resp.status_code != 200:
            continue
        try:
            candidate = extract_athlete(resp.json())
            if candidate:
                a = candidate
                break
        except Exception:
            continue

    if not a:
        raise HTTPException(status_code=404, detail="Player not found")

    # Stats: scan all returned athletes for matching id
    season_stats = {
        "gp": 0, "pts": 0.0, "reb": 0.0, "ast": 0.0,
        "stl": 0.0, "blk": 0.0, "tov": 0.0,
        "fgPct": 0.0, "fg3Pct": 0.0, "ftPct": 0.0, "mins": 0.0,
    }
    if not isinstance(stats_resp, Exception) and stats_resp.status_code == 200:
        try:
            for entry in stats_resp.json().get("athletes", []):
                ath = entry.get("athlete", {})
                if str(ath.get("id", "")) == str(player_id):
                    parsed = parse_categories(entry.get("categories", []))
                    season_stats = {
                        "gp":     int(safe_float(parsed.get("gamesPlayed", 0), 0)),
                        "pts":    safe_float(parsed.get("avgPoints", 0)),
                        "reb":    safe_float(parsed.get("avgRebounds", 0)),
                        "ast":    safe_float(parsed.get("avgAssists", 0)),
                        "stl":    safe_float(parsed.get("avgSteals", 0)),
                        "blk":    safe_float(parsed.get("avgBlocks", 0)),
                        "tov":    safe_float(parsed.get("avgTurnovers", 0)),
                        "fgPct":  safe_float(parsed.get("fieldGoalPct", 0)),
                        "fg3Pct": safe_float(parsed.get("threePointFieldGoalPct", 0)),
                        "ftPct":  safe_float(parsed.get("freeThrowPct", 0)),
                        "mins":   safe_float(parsed.get("avgMinutes", 0)),
                    }
                    break
        except Exception:
            pass

    # Safely extract nested fields
    team    = a.get("team", {})       if isinstance(a.get("team"), dict)        else {}
    pos     = a.get("position", {})   if isinstance(a.get("position"), dict)    else {}
    draft   = a.get("draft", {})      if isinstance(a.get("draft"), dict)        else {}
    birth   = a.get("birthPlace", {}) if isinstance(a.get("birthPlace"), dict)  else {}
    college = a.get("college", {})    if isinstance(a.get("college"), dict)      else {}
    exp     = a.get("experience", {}) if isinstance(a.get("experience"), dict)   else {}

    hs = a.get("headshot")
    if isinstance(hs, dict):
        headshot = hs.get("href") or f"https://a.espncdn.com/i/headshots/nba/players/full/{player_id}.png"
    elif isinstance(hs, str) and hs:
        headshot = hs
    else:
        headshot = f"https://a.espncdn.com/i/headshots/nba/players/full/{player_id}.png"

    return {
        "player": {
            "playerId":    str(a.get("id", player_id)),
            "firstName":   a.get("firstName", ""),
            "lastName":    a.get("lastName", ""),
            "fullName":    a.get("displayName", ""),
            "jersey":      a.get("jersey", ""),
            "teamId":      team.get("id", ""),
            "teamName":    team.get("displayName", ""),
            "teamAbbr":    team.get("abbreviation", ""),
            "position":    pos.get("abbreviation", ""),
            "height":      a.get("displayHeight", ""),
            "weight":      a.get("displayWeight", ""),
            "country":     birth.get("country", ""),
            "draftYear":   draft.get("year", ""),
            "draftRound":  draft.get("round", ""),
            "draftNumber": draft.get("selection", ""),
            "college":     college.get("name", ""),
            "headshot":    headshot,
            "age":         a.get("age", ""),
            "experience":  exp.get("years", ""),
        },
        "seasonStats": season_stats,
        "last5": [],
    }
