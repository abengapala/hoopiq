from fastapi import APIRouter, HTTPException
import httpx
from datetime import datetime, timezone, timedelta

router = APIRouter()

ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba"
ESPN_STANDINGS = "https://site.api.espn.com/apis/v2/sports/basketball/nba"
PH_TZ = timezone(timedelta(hours=8))


def calc_win_prob(home_wins, home_losses, away_wins, away_losses):
    home_pct = home_wins / max(home_wins + home_losses, 1)
    away_pct = away_wins / max(away_wins + away_losses, 1)
    total = home_pct + away_pct
    if total == 0:
        return 52, 48
    hp = min(97, max(3, round((home_pct / total * 100) + 3)))
    return hp, 100 - hp


async def get_standings_map(client):
    try:
        resp = await client.get(f"{ESPN_STANDINGS}/standings")
        if resp.status_code != 200:
            return {}
        standings_map = {}
        for group in resp.json().get("children", []):
            for entry in group.get("standings", {}).get("entries", []):
                team = entry.get("team", {})
                stats = {s["name"]: s.get("displayValue", s.get("value", "")) for s in entry.get("stats", [])}
                abbr = team.get("abbreviation", "")
                standings_map[abbr] = {
                    "wins": int(float(stats.get("wins", 0))),
                    "losses": int(float(stats.get("losses", 0))),
                }
        return standings_map
    except Exception:
        return {}


@router.get("/today")
async def get_today_games():
    try:
        today = datetime.now(PH_TZ).strftime("%Y%m%d")
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(f"{ESPN_BASE}/scoreboard", params={"dates": today})
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"ESPN error: {resp.status_code}")
            data = resp.json()
            standings_map = await get_standings_map(client)

        result = []
        for event in data.get("events", []):
            competition = event.get("competitions", [{}])[0]
            competitors = competition.get("competitors", [])
            home = next((c for c in competitors if c.get("homeAway") == "home"), {})
            away = next((c for c in competitors if c.get("homeAway") == "away"), {})
            home_team = home.get("team", {})
            away_team = away.get("team", {})
            status = event.get("status", {})
            status_type = status.get("type", {})
            status_id = str(status_type.get("id", "1"))
            status_detail = status_type.get("shortDetail", "TBD")
            is_live = status_id == "2"

            home_abbr = home_team.get("abbreviation", "")
            away_abbr = away_team.get("abbreviation", "")
            hs = standings_map.get(home_abbr, {"wins": 0, "losses": 0})
            as_ = standings_map.get(away_abbr, {"wins": 0, "losses": 0})
            hp, ap = calc_win_prob(hs["wins"], hs["losses"], as_["wins"], as_["losses"])

            result.append({
                "gameId": event.get("id"),
                "status": status_id,
                "isLive": is_live,
                "statusText": status_detail,
                "time": status_detail,
                "arena": competition.get("venue", {}).get("fullName", ""),
                "homeTeam": {
                    "teamId": home_team.get("id"),
                    "name": home_team.get("shortDisplayName", home_team.get("displayName", "")),
                    "city": home_team.get("location", ""),
                    "abbr": home_abbr,
                    "score": int(home.get("score", 0) or 0),
                    "record": home.get("records", [{}])[0].get("summary", "") if home.get("records") else "",
                    "last5": [],
                },
                "awayTeam": {
                    "teamId": away_team.get("id"),
                    "name": away_team.get("shortDisplayName", away_team.get("displayName", "")),
                    "city": away_team.get("location", ""),
                    "abbr": away_abbr,
                    "score": int(away.get("score", 0) or 0),
                    "record": away.get("records", [{}])[0].get("summary", "") if away.get("records") else "",
                    "last5": [],
                },
                "winProbability": {"home": hp, "away": ap},
            })

        return {"date": datetime.now(PH_TZ).strftime("%Y-%m-%d"), "games": result, "count": len(result)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/upcoming")
async def get_upcoming_games(days: int = 7):
    try:
        upcoming = []
        async with httpx.AsyncClient(timeout=30.0) as client:
            for i in range(1, days + 1):
                target = datetime.now(PH_TZ) + timedelta(days=i)
                date_str = target.strftime("%Y%m%d")
                resp = await client.get(f"{ESPN_BASE}/scoreboard", params={"dates": date_str})
                if resp.status_code != 200:
                    continue
                for event in resp.json().get("events", []):
                    competition = event.get("competitions", [{}])[0]
                    competitors = competition.get("competitors", [])
                    home = next((c for c in competitors if c.get("homeAway") == "home"), {})
                    away = next((c for c in competitors if c.get("homeAway") == "away"), {})
                    home_team = home.get("team", {})
                    away_team = away.get("team", {})
                    upcoming.append({
                        "gameId": event.get("id"),
                        "date": target.strftime("%Y-%m-%d"),
                        "dateLabel": target.strftime("%A, %b %d"),
                        "matchup": f"{away_team.get('abbreviation','')} @ {home_team.get('abbreviation','')}",
                        "homeTeam": home_team.get("abbreviation", ""),
                        "awayTeam": away_team.get("abbreviation", ""),
                        "homeTeamId": home_team.get("id"),
                        "awayTeamId": away_team.get("id"),
                    })
        return {"games": upcoming, "count": len(upcoming)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{game_id}")
async def get_game_detail(game_id: str):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(f"{ESPN_BASE}/summary", params={"event": game_id})
            if resp.status_code != 200:
                raise HTTPException(status_code=404, detail="Game not found")
            data = resp.json()

        header = data.get("header", {})
        competitions = header.get("competitions", [{}])[0]
        competitors = competitions.get("competitors", [])
        home_comp = next((c for c in competitors if c.get("homeAway") == "home"), {})
        away_comp = next((c for c in competitors if c.get("homeAway") == "away"), {})
        status = competitions.get("status", {})
        status_id = str(status.get("type", {}).get("id", "1"))

        # Parse box score from ESPN summary
        def parse_team_stats(competitor):
            stats = {}
            for s in competitor.get("statistics", []):
                name = s.get("name", "")
                val = s.get("displayValue", "0")
                try:
                    stats[name] = float(val.replace("%", ""))
                except Exception:
                    stats[name] = 0
            return {
                "fgPct": stats.get("fieldGoalPct", 0),
                "threePct": stats.get("threePointFieldGoalPct", 0),
                "ftPct": stats.get("freeThrowPct", 0),
                "rebounds": int(stats.get("totalRebounds", 0)),
                "assists": int(stats.get("assists", 0)),
                "turnovers": int(stats.get("turnovers", 0)),
                "steals": int(stats.get("steals", 0)),
                "blocks": int(stats.get("blocks", 0)),
                "pointsInPaint": int(stats.get("pointsInPaint", 0)),
                "fastBreakPoints": int(stats.get("fastBreakPoints", 0)),
            }

        def parse_players(competitor):
            players = []
            roster = data.get("rosters", [])
            team_id = competitor.get("team", {}).get("id", "")
            team_roster = next((r for r in roster if r.get("team", {}).get("id") == team_id), {})
            for entry in team_roster.get("entries", []):
                athlete = entry.get("athlete", {})
                stats_list = entry.get("stats", [])
                # ESPN roster stats order: MIN, FG, 3PT, FT, OREB, DREB, REB, AST, STL, BLK, TO, PF, +/-, PTS
                def gs(idx):
                    try:
                        return stats_list[idx].get("displayValue", "0")
                    except Exception:
                        return "0"
                def gn(idx):
                    try:
                        v = gs(idx)
                        return float(v.replace("%", "")) if v not in ("--", "") else 0
                    except Exception:
                        return 0

                did_not_play = entry.get("didNotPlay", False)
                if did_not_play:
                    continue

                players.append({
                    "name": athlete.get("shortName", athlete.get("displayName", "")),
                    "position": athlete.get("position", {}).get("abbreviation", ""),
                    "status": "ACTIVE",
                    "minutes": gs(0),
                    "points": int(gn(13)),
                    "rebounds": int(gn(6)),
                    "assists": int(gn(7)),
                    "steals": int(gn(8)),
                    "blocks": int(gn(9)),
                    "fgPct": round(gn(1) if "/" not in gs(1) else 0, 1),
                    "threePct": 0,
                    "ftPct": 0,
                    "plusMinus": int(gn(12)),
                })
            return players

        home_stats = parse_team_stats(home_comp)
        away_stats = parse_team_stats(away_comp)
        home_players = parse_players(home_comp)
        away_players = parse_players(away_comp)

        # Win probability from standings
        async with httpx.AsyncClient(timeout=15.0) as client:
            standings_map = await get_standings_map(client)
        home_abbr = home_comp.get("team", {}).get("abbreviation", "")
        away_abbr = away_comp.get("team", {}).get("abbreviation", "")
        hs = standings_map.get(home_abbr, {"wins": 0, "losses": 0})
        as_ = standings_map.get(away_abbr, {"wins": 0, "losses": 0})
        hp, ap = calc_win_prob(hs["wins"], hs["losses"], as_["wins"], as_["losses"])

        return {
            "gameId": game_id,
            "status": status_id,
            "isLive": status_id == "2",
            "statusText": status.get("type", {}).get("shortDetail", ""),
            "period": status.get("period", 0),
            "gameClock": status.get("displayClock", ""),
            "homeTeam": {
                "teamId": home_comp.get("team", {}).get("id"),
                "name": home_comp.get("team", {}).get("shortDisplayName", ""),
                "city": home_comp.get("team", {}).get("location", ""),
                "abbr": home_abbr,
                "score": int(home_comp.get("score", 0) or 0),
                "statistics": home_stats,
                "players": home_players,
            },
            "awayTeam": {
                "teamId": away_comp.get("team", {}).get("id"),
                "name": away_comp.get("team", {}).get("shortDisplayName", ""),
                "city": away_comp.get("team", {}).get("location", ""),
                "abbr": away_abbr,
                "score": int(away_comp.get("score", 0) or 0),
                "statistics": away_stats,
                "players": away_players,
            },
            "winProbability": {"home": hp, "away": ap},
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))