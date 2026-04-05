from fastapi import APIRouter, HTTPException, Query
import httpx
import asyncio
import os
import json

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


def get_groq_key() -> str:
    return os.getenv("GROQ_API_KEY", "")


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


async def fetch_achievements_from_groq(player_name: str, team: str, position: str, experience: str) -> list:
    """Use Groq to return real NBA achievements for a player as structured JSON."""
    key = get_groq_key()
    if not key or not player_name:
        return []
    prompt = (
        f"List the real NBA career achievements and awards for {player_name} "
        f"({position}, {team}, {experience} years experience). "
        f"Include: NBA Championships, MVP awards, All-Star selections (total count), "
        f"All-NBA teams, scoring/assist/rebound titles, defensive awards, Olympic medals, "
        f"Hall of Fame, all-time records, rookie awards, etc. "
        f"Only include REAL verified achievements. If the player is not well known, return only confirmed facts. "
        f"Respond ONLY with a raw JSON array. No markdown, no backticks, no explanation. "
        f'Example: [{{"name": "4x NBA Champion", "year": "2015, 2017, 2018, 2022"}}, {{"name": "2x NBA MVP", "year": "2015, 2016"}}]'
    )
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "max_tokens": 800,
                    "temperature": 0.1,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are an NBA historian. Return only a valid raw JSON array of achievements. "
                                "No markdown fences, no backticks, no extra text. Just the JSON array."
                            )
                        },
                        {"role": "user", "content": prompt}
                    ],
                }
            )
        if resp.status_code != 200:
            return []
        content = resp.json()["choices"][0]["message"]["content"].strip()
        # Strip any accidental markdown fences
        if "```" in content:
            parts = content.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("["):
                    content = part
                    break
        # Find JSON array boundaries
        start = content.find("[")
        end   = content.rfind("]")
        if start != -1 and end != -1:
            content = content[start:end+1]
        achievements = json.loads(content)
        if isinstance(achievements, list):
            return achievements[:14]
        return []
    except Exception:
        return []


# ── 1. Stat leaders ──────────────────────────────────────────────────────────

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


# ── 2. Fast search ───────────────────────────────────────────────────────────

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


# ── 3. All players ───────────────────────────────────────────────────────────

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


# ── 4. Single player ─────────────────────────────────────────────────────────

@router.get("/{player_id}")
async def get_player(player_id: str):
    bio_url_a   = f"https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{player_id}"
    bio_url_b   = f"{ESPN_BASE}/athletes/{player_id}"
    stats_url   = f"{ESPN_STATS_BASE}/statistics/byathlete"
    career_url  = f"https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{player_id}/statisticslog"
    gamelog_url = f"https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{player_id}/gamelog"
    news_url    = f"{ESPN_BASE}/athletes/{player_id}/news"

    async with httpx.AsyncClient(timeout=30.0) as client:
        results = await asyncio.gather(
            client.get(bio_url_a, params={"region": "us", "lang": "en", "contentorigin": "espn"}),
            client.get(bio_url_b),
            client.get(stats_url, params={"region": "us", "lang": "en", "contentorigin": "espn", "isqualified": "false", "limit": 600, "sort": "offensive.avgPoints:desc"}),
            client.get(career_url, params={"region": "us", "lang": "en", "contentorigin": "espn"}),
            client.get(gamelog_url, params={"region": "us", "lang": "en", "contentorigin": "espn"}),
            client.get(news_url, params={"limit": 5}),
            return_exceptions=True
        )
    bio_a_resp, bio_b_resp, stats_resp, career_resp, gamelog_resp, news_resp = results

    # ── Bio ──────────────────────────────────────────────────────────────────
    a = {}
    for resp in [bio_a_resp, bio_b_resp]:
        if isinstance(resp, Exception): continue
        if resp.status_code != 200: continue
        try:
            candidate = extract_athlete(resp.json())
            if candidate:
                a = candidate
                break
        except Exception:
            continue

    if not a:
        raise HTTPException(status_code=404, detail="Player not found")

    # ── Season stats ─────────────────────────────────────────────────────────
    season_stats = {"gp": 0, "pts": 0.0, "reb": 0.0, "ast": 0.0, "stl": 0.0, "blk": 0.0, "tov": 0.0, "fgPct": 0.0, "fg3Pct": 0.0, "ftPct": 0.0, "mins": 0.0}
    if not isinstance(stats_resp, Exception) and stats_resp.status_code == 200:
        try:
            for entry in stats_resp.json().get("athletes", []):
                ath = entry.get("athlete", {})
                if str(ath.get("id", "")) == str(player_id):
                    parsed = parse_categories(entry.get("categories", []))
                    season_stats = {
                        "gp": int(safe_float(parsed.get("gamesPlayed", 0), 0)),
                        "pts": safe_float(parsed.get("avgPoints", 0)),
                        "reb": safe_float(parsed.get("avgRebounds", 0)),
                        "ast": safe_float(parsed.get("avgAssists", 0)),
                        "stl": safe_float(parsed.get("avgSteals", 0)),
                        "blk": safe_float(parsed.get("avgBlocks", 0)),
                        "tov": safe_float(parsed.get("avgTurnovers", 0)),
                        "fgPct": safe_float(parsed.get("fieldGoalPct", 0)),
                        "fg3Pct": safe_float(parsed.get("threePointFieldGoalPct", 0)),
                        "ftPct": safe_float(parsed.get("freeThrowPct", 0)),
                        "mins": safe_float(parsed.get("avgMinutes", 0)),
                    }
                    break
        except Exception:
            pass

    # ── Career season-by-season ───────────────────────────────────────────────
    career_seasons = []
    if not isinstance(career_resp, Exception) and career_resp.status_code == 200:
        try:
            for st in career_resp.json().get("seasonTypes", []):
                if st.get("abbreviation", "").upper() not in ("", "REG", "2"):
                    continue
                for entry in st.get("entries", []):
                    parsed = parse_categories(entry.get("categories", []))
                    gp = int(safe_float(parsed.get("gamesPlayed", 0), 0))
                    if gp == 0: continue
                    career_seasons.append({
                        "season": entry.get("displayName", ""),
                        "gp": gp,
                        "pts": safe_float(parsed.get("avgPoints", 0)),
                        "reb": safe_float(parsed.get("avgRebounds", 0)),
                        "ast": safe_float(parsed.get("avgAssists", 0)),
                        "stl": safe_float(parsed.get("avgSteals", 0)),
                        "blk": safe_float(parsed.get("avgBlocks", 0)),
                        "fgPct": safe_float(parsed.get("fieldGoalPct", 0)),
                        "fg3Pct": safe_float(parsed.get("threePointFieldGoalPct", 0)),
                        "ftPct": safe_float(parsed.get("freeThrowPct", 0)),
                        "mins": safe_float(parsed.get("avgMinutes", 0)),
                    })
            career_seasons = career_seasons[-10:]
        except Exception:
            pass

    # ── Last 5 games ─────────────────────────────────────────────────────────
    last5 = []
    if not isinstance(gamelog_resp, Exception) and gamelog_resp.status_code == 200:
        try:
            events = gamelog_resp.json().get("events", {})
            items  = list(events.values()) if isinstance(events, dict) else events
            for ev in items[:5]:
                game     = ev.get("game", ev)
                opp      = ev.get("opponent", {})
                at_vs    = "@" if ev.get("atVs") == "at" else "vs"
                opp_abbr = opp.get("abbreviation", opp.get("displayName", ""))
                stats    = {}
                for cat in ev.get("categories", []):
                    for label, val in zip(cat.get("labels", []), cat.get("values", [])):
                        stats[label] = val
                if not stats:
                    stats = ev.get("stats", {})
                last5.append({
                    "GAME_DATE":  (game.get("date") or ev.get("gameDate", ""))[:10],
                    "MATCHUP":    f"{at_vs} {opp_abbr}",
                    "WL":         ev.get("gameResult", ""),
                    "PTS":        stats.get("PTS", stats.get("points", "")),
                    "REB":        stats.get("REB", stats.get("rebounds", "")),
                    "AST":        stats.get("AST", stats.get("assists", "")),
                    "PLUS_MINUS": stats.get("+/-", stats.get("plusMinus", "")),
                })
        except Exception:
            pass

    # ── Recent news ───────────────────────────────────────────────────────────
    recent_news = []
    if not isinstance(news_resp, Exception) and news_resp.status_code == 200:
        try:
            for art in news_resp.json().get("articles", [])[:4]:
                img = next((i["url"] for i in art.get("images", []) if i.get("url")), "")
                recent_news.append({
                    "headline": art.get("headline", ""),
                    "date":     art.get("published", "")[:10],
                    "url":      art.get("links", {}).get("web", {}).get("href", ""),
                    "image":    img,
                    "source":   art.get("source", "ESPN"),
                })
        except Exception:
            pass

    # ── Nested field extraction ───────────────────────────────────────────────
    team    = a.get("team", {})       if isinstance(a.get("team"), dict)       else {}
    pos     = a.get("position", {})   if isinstance(a.get("position"), dict)   else {}
    draft   = a.get("draft", {})      if isinstance(a.get("draft"), dict)      else {}
    birth   = a.get("birthPlace", {}) if isinstance(a.get("birthPlace"), dict) else {}
    college = a.get("college", {})    if isinstance(a.get("college"), dict)    else {}
    exp     = a.get("experience", {}) if isinstance(a.get("experience"), dict) else {}

    hs = a.get("headshot")
    if isinstance(hs, dict):
        headshot = hs.get("href") or f"https://a.espncdn.com/i/headshots/nba/players/full/{player_id}.png"
    elif isinstance(hs, str) and hs:
        headshot = hs
    else:
        headshot = f"https://a.espncdn.com/i/headshots/nba/players/full/{player_id}.png"

    birth_parts  = [birth.get("city", ""), birth.get("state", ""), birth.get("country", "")]
    birthplace   = ", ".join(p for p in birth_parts if p)
    player_name  = a.get("displayName", "")
    team_name    = team.get("displayName", "")
    position_str = pos.get("displayName", pos.get("abbreviation", ""))
    exp_years    = str(exp.get("years", ""))

    # ── Groq achievements ─────────────────────────────────────────────────────
    achievements = await fetch_achievements_from_groq(player_name, team_name, position_str, exp_years)

    return {
        "player": {
            "playerId":     str(a.get("id", player_id)),
            "firstName":    a.get("firstName", ""),
            "lastName":     a.get("lastName", ""),
            "fullName":     player_name,
            "jersey":       a.get("jersey", ""),
            "teamId":       team.get("id", ""),
            "teamName":     team_name,
            "teamAbbr":     team.get("abbreviation", ""),
            "position":     pos.get("abbreviation", ""),
            "positionFull": position_str,
            "height":       a.get("displayHeight", ""),
            "weight":       a.get("displayWeight", ""),
            "country":      birth.get("country", ""),
            "birthplace":   birthplace,
            "birthDate":    a.get("dateOfBirth", "")[:10] if a.get("dateOfBirth") else "",
            "draftYear":    draft.get("year", ""),
            "draftRound":   draft.get("round", ""),
            "draftNumber":  draft.get("selection", ""),
            "college":      college.get("name", ""),
            "headshot":     headshot,
            "age":          a.get("age", ""),
            "experience":   exp_years,
            "status":       a.get("status", {}).get("name", "") if isinstance(a.get("status"), dict) else "",
            "debut":        a.get("debutYear", ""),
            "achievements": achievements,
        },
        "seasonStats":   season_stats,
        "careerSeasons": career_seasons,
        "last5":         last5,
        "recentNews":    recent_news,
    }