from fastapi import APIRouter, HTTPException
import httpx
from datetime import datetime, timezone, timedelta
from cache import get_cached_games, set_cached_games, get_cached_upcoming, set_cached_upcoming
from supabase_client import get_supabase

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


def calc_live_win_prob(home_wins, home_losses, away_wins, away_losses,
                       home_score, away_score, period, is_halftime=False):
    base_hp, _ = calc_win_prob(home_wins, home_losses, away_wins, away_losses)
    score_diff = home_score - away_score
    if is_halftime:
        weight = 0.30
    else:
        period_weights = {1: 0.15, 2: 0.30, 3: 0.50, 4: 0.75}
        weight = period_weights.get(period, 0.85)
    score_adjustment = score_diff * 1.5 * weight
    hp = min(97, max(3, round(base_hp + score_adjustment)))
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


async def get_team_roster(client, team_id: str) -> list:
    try:
        resp = await client.get(f"{ESPN_BASE}/teams/{team_id}/roster")
        if resp.status_code != 200:
            return []
        players = []
        for player in resp.json().get("athletes", []):
            pos = player.get("position", {})
            pos_abbr = pos.get("abbreviation", "") if isinstance(pos, dict) else ""
            players.append({
                "playerId": str(player.get("id", "")),
                "name": player.get("shortName", player.get("displayName", "")),
                "position": pos_abbr,
                "number": str(player.get("jersey", "")),
                "height": str(player.get("displayHeight", "")),
                "weight": str(player.get("displayWeight", "")),
                "minutes": None, "points": None, "rebounds": None,
                "assists": None, "steals": None, "blocks": None,
                "plusMinus": None, "status": "ROSTER",
            })
        return players
    except Exception:
        return []


def safe_score(raw) -> int:
    try:
        return int(float(raw)) if raw not in (None, "", "--") else 0
    except (TypeError, ValueError):
        return 0


@router.get("/today")
async def get_today_games():
    today_str = datetime.now(PH_TZ).strftime("%Y-%m-%d")

    # ── Cache check ──────────────────────────────────────────
    cached = get_cached_games(today_str)
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(f"{ESPN_BASE}/scoreboard")
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"ESPN error: {resp.status_code}")
            data = resp.json()
            standings_map = await get_standings_map(client)

        result = []
        has_live = False

        for event in data.get("events", []):
            competition = event.get("competitions", [{}])[0]
            competitors = competition.get("competitors", [])
            home = next((c for c in competitors if c.get("homeAway") == "home"), {})
            away = next((c for c in competitors if c.get("homeAway") == "away"), {})
            home_team = home.get("team", {})
            away_team = away.get("team", {})
            status = event.get("status", {})
            status_type = status.get("type", {})
            status_id = int(status_type.get("id", 1))
            status_detail = status_type.get("shortDetail", "")
            is_live = status_id == 2
            is_final = status_id == 3
            is_halftime = is_live and "halftime" in status_detail.lower()

            if is_live:
                has_live = True

            game_time = "TBD"
            if is_live or is_final:
                game_time = status_detail or ("Live" if is_live else "Final")
            else:
                raw_date = event.get("date", "")
                if raw_date:
                    try:
                        utc_dt = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
                        pht_dt = utc_dt.astimezone(PH_TZ)
                        game_time = pht_dt.strftime("%-m/%-d · %-I:%M %p PHT")
                    except Exception:
                        game_time = status_detail or "TBD"
                else:
                    game_time = status_detail or "TBD"

            home_abbr = home_team.get("abbreviation", "")
            away_abbr = away_team.get("abbreviation", "")
            hs = standings_map.get(home_abbr, {"wins": 0, "losses": 0})
            as_ = standings_map.get(away_abbr, {"wins": 0, "losses": 0})

            if is_live or is_final:
                home_score_val = safe_score(home.get("score"))
                away_score_val = safe_score(away.get("score"))
                period_val = status.get("period", 4) if is_final else status.get("period", 1)
                hp, ap = calc_live_win_prob(
                    hs["wins"], hs["losses"], as_["wins"], as_["losses"],
                    home_score_val, away_score_val, period_val, is_halftime=is_halftime
                )
            else:
                hp, ap = calc_win_prob(hs["wins"], hs["losses"], as_["wins"], as_["losses"])

            result.append({
                "gameId": event.get("id"),
                "status": status_id,
                "isLive": is_live,
                "isHalftime": is_halftime,
                "statusText": status_detail,
                "gameTime": game_time,
                "time": game_time,
                "period": status.get("period", 0),
                "gameClock": status.get("displayClock", ""),
                "arena": competition.get("venue", {}).get("fullName", ""),
                "homeTeam": {
                    "teamId": home_team.get("id"),
                    "name": home_team.get("shortDisplayName", home_team.get("displayName", "")),
                    "city": home_team.get("location", ""),
                    "abbr": home_abbr,
                    "score": safe_score(home.get("score")) if (is_live or is_final) else None,
                    "record": home.get("records", [{}])[0].get("summary", "") if home.get("records") else "",
                    "last5": [],
                },
                "awayTeam": {
                    "teamId": away_team.get("id"),
                    "name": away_team.get("shortDisplayName", away_team.get("displayName", "")),
                    "city": away_team.get("location", ""),
                    "abbr": away_abbr,
                    "score": safe_score(away.get("score")) if (is_live or is_final) else None,
                    "record": away.get("records", [{}])[0].get("summary", "") if away.get("records") else "",
                    "last5": [],
                },
                "winProbability": {"home": hp, "away": ap},
            })

        espn_date = data.get("day", {}).get("date", today_str)
        payload = {"date": espn_date, "games": result, "count": len(result)}

        # ── Write to cache ────────────────────────────────────
        set_cached_games(today_str, payload, has_live=has_live)

        return payload
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/upcoming")
async def get_upcoming_games(days: int = 7):
    # ── Cache check ──────────────────────────────────────────
    cached = get_cached_upcoming(days)
    if cached:
        return cached

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

                    # PHT game time
                    raw_date = event.get("date", "")
                    game_time = "TBD"
                    if raw_date:
                        try:
                            utc_dt = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
                            pht_dt = utc_dt.astimezone(PH_TZ)
                            game_time = pht_dt.strftime("%-I:%M %p PHT")
                        except Exception:
                            pass

                    upcoming.append({
                        "gameId": event.get("id"),
                        "date": target.strftime("%Y-%m-%d"),
                        "dateLabel": target.strftime("%A, %b %d"),
                        "matchup": f"{away_team.get('abbreviation','')} @ {home_team.get('abbreviation','')}",
                        "homeTeam": home_team.get("abbreviation", ""),
                        "awayTeam": away_team.get("abbreviation", ""),
                        "homeTeamId": home_team.get("id"),
                        "awayTeamId": away_team.get("id"),
                        "gameTime": game_time,
                        "venue": competition.get("venue", {}).get("fullName", ""),
                    })

        payload = {"games": upcoming, "count": len(upcoming)}

        # ── Write to cache ────────────────────────────────────
        set_cached_upcoming(days, payload)

        return payload
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
        status_id = int(status.get("type", {}).get("id", 1))
        status_detail = status.get("type", {}).get("shortDetail", "")

        is_live = status_id == 2
        is_final = status_id == 3
        is_live_or_final = is_live or is_final
        is_halftime = is_live and "halftime" in status_detail.lower()

        # ✅ Extract game date (PHT)
        raw_event_date = header.get("competitions", [{}])[0].get("date", "")
        game_date_str = ""

        if raw_event_date:
            try:
                utc_dt = datetime.fromisoformat(raw_event_date.replace("Z", "+00:00"))
                pht_dt = utc_dt.astimezone(PH_TZ)
                game_date_str = pht_dt.strftime("%Y-%m-%d")
            except Exception:
                game_date_str = ""

        home_team_id = str(home_comp.get("team", {}).get("id", ""))
        away_team_id = str(away_comp.get("team", {}).get("id", ""))
        home_abbr = home_comp.get("team", {}).get("abbreviation", "")
        away_abbr = away_comp.get("team", {}).get("abbreviation", "")

        boxscore = data.get("boxscore", {})
        bs_teams = boxscore.get("teams", [])

        def find_bs_team(team_id):
            for t in bs_teams:
                if str(t.get("team", {}).get("id", "")) == str(team_id):
                    return t
            return {}

        def parse_team_stats(team_id):
            bs_team = find_bs_team(team_id)
            stats = {}
            for s in bs_team.get("statistics", []):
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
                "rebounds": int(stats.get("totalRebounds", stats.get("rebounds", 0))),
                "assists": int(stats.get("assists", 0)),
                "turnovers": int(stats.get("turnovers", 0)),
                "steals": int(stats.get("steals", 0)),
                "blocks": int(stats.get("blocks", 0)),
                "pointsInPaint": int(stats.get("pointsInPaint", 0)),
                "fastBreakPoints": int(stats.get("fastBreakPoints", 0)),
            }

        def parse_live_players(team_id):
            players_data = boxscore.get("players", [])
            team_entry = next(
                (p for p in players_data if str(p.get("team", {}).get("id", "")) == str(team_id)), {}
            )
            players = []
            for stat_group in team_entry.get("statistics", []):
                keys = stat_group.get("keys", [])
                for entry in stat_group.get("athletes", []):
                    athlete = entry.get("athlete", {})
                    if entry.get("didNotPlay", False):
                        continue
                    stats_list = entry.get("stats", [])

                    def get_stat(key, default=0):
                        try:
                            idx = keys.index(key)
                            val = stats_list[idx]
                            if val in ("--", "", None):
                                return default
                            val = str(val)
                            if "-" in val and not val.startswith("-"):
                                val = val.split("-")[0]
                            return float(val.replace("+", ""))
                        except (ValueError, IndexError):
                            return default

                    pos = athlete.get("position", {})
                    pos_abbr = pos.get("abbreviation", "") if isinstance(pos, dict) else ""
                    minutes = stats_list[keys.index("minutes")] if "minutes" in keys else "0"

                    players.append({
                        "playerId": str(athlete.get("id", "")),
                        "name": athlete.get("shortName", athlete.get("displayName", "")),
                        "position": pos_abbr,
                        "status": "ACTIVE",
                        "minutes": minutes,
                        "points": int(get_stat("points")),
                        "rebounds": int(get_stat("rebounds")),
                        "assists": int(get_stat("assists")),
                        "steals": int(get_stat("steals")),
                        "blocks": int(get_stat("blocks")),
                        "plusMinus": int(get_stat("plusMinus")),
                    })
            return players

        def parse_scheduled_roster(team_id):
            roster_list = data.get("rosters", [])
            team_roster = next(
                (r for r in roster_list if str(r.get("team", {}).get("id", "")) == str(team_id)), {}
            )
            players = []
            for entry in team_roster.get("entries", []):
                athlete = entry.get("athlete", {})
                if not athlete:
                    continue
                pos = athlete.get("position", {})
                pos_abbr = pos.get("abbreviation", "") if isinstance(pos, dict) else ""
                players.append({
                    "playerId": str(athlete.get("id", "")),
                    "name": athlete.get("shortName", athlete.get("displayName", "")),
                    "position": pos_abbr,
                    "number": str(athlete.get("jersey", "")),
                    "height": str(athlete.get("displayHeight", "")),
                    "weight": str(athlete.get("displayWeight", "")),
                    "minutes": None, "points": None, "rebounds": None,
                    "assists": None, "steals": None, "blocks": None,
                    "plusMinus": None, "status": "ROSTER",
                })
            return players

        home_stats = parse_team_stats(home_team_id)
        away_stats = parse_team_stats(away_team_id)

        if is_live_or_final:
            home_players = parse_live_players(home_team_id)
            away_players = parse_live_players(away_team_id)
        else:
            home_players = parse_scheduled_roster(home_team_id)
            away_players = parse_scheduled_roster(away_team_id)

        async with httpx.AsyncClient(timeout=20.0) as client:
            if not home_players and not is_live_or_final:
                home_players = await get_team_roster(client, home_team_id)
            if not away_players and not is_live_or_final:
                away_players = await get_team_roster(client, away_team_id)

        async with httpx.AsyncClient(timeout=15.0) as client:
            standings_map = await get_standings_map(client)

        hs_rec = standings_map.get(home_abbr, {"wins": 0, "losses": 0})
        as_rec = standings_map.get(away_abbr, {"wins": 0, "losses": 0})

        if is_live or is_final:
            home_score_val = safe_score(home_comp.get("score"))
            away_score_val = safe_score(away_comp.get("score"))
            period_val = status.get("period", 4) if is_final else status.get("period", 1)
            hp, ap = calc_live_win_prob(
                hs_rec["wins"], hs_rec["losses"], as_rec["wins"], as_rec["losses"],
                home_score_val, away_score_val, period_val, is_halftime=is_halftime
            )
        else:
            hp, ap = calc_win_prob(hs_rec["wins"], hs_rec["losses"], as_rec["wins"], as_rec["losses"])

        return {
            "gameId": game_id,
            "status": status_id,
            "isLive": is_live,
            "isHalftime": is_halftime,
            "statusText": status_detail,
            "date": game_date_str,  # ✅ ADDED
            "period": status.get("period", 0),
            "gameClock": status.get("displayClock", ""),
            "homeTeam": {
                "teamId": home_team_id,
                "name": home_comp.get("team", {}).get("shortDisplayName", ""),
                "city": home_comp.get("team", {}).get("location", ""),
                "abbr": home_abbr,
                "score": safe_score(home_comp.get("score")) if is_live_or_final else 0,
                "statistics": home_stats,
                "players": home_players,
            },
            "awayTeam": {
                "teamId": away_team_id,
                "name": away_comp.get("team", {}).get("shortDisplayName", ""),
                "city": away_comp.get("team", {}).get("location", ""),
                "abbr": away_abbr,
                "score": safe_score(away_comp.get("score")) if is_live_or_final else 0,
                "statistics": away_stats,
                "players": away_players,
            },
            "winProbability": {"home": hp, "away": ap},
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    # ── Game Highlights (Supabase) ───────────────────────────────

@router.get("/{game_id}/highlights")
async def get_highlights(game_id: str):
    try:
        sb = get_supabase()
        res = (
            sb.table("game_highlights")
            .select("youtube_url")
            .eq("game_id", game_id)
            .single()
            .execute()
        )
        return {"youtube_url": res.data["youtube_url"] if res.data else None}
    except Exception:
        return {"youtube_url": None}


@router.post("/{game_id}/highlights")
async def save_highlights(game_id: str, body: dict):
    try:
        sb = get_supabase()
        sb.table("game_highlights").upsert({
            "game_id": game_id,
            "youtube_url": body.get("youtube_url")
        }).execute()

        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}