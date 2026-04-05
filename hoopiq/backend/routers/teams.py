from fastapi import APIRouter, HTTPException
import httpx
import asyncio

router = APIRouter()

ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba"
ESPN_V2 = "https://site.api.espn.com/apis/v2/sports/basketball/nba"


@router.get("/")
async def get_all_teams():
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(f"{ESPN_BASE}/teams", params={"limit": 32})
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"ESPN error: {resp.status_code}")
            data = resp.json()

        teams = []
        for item in data.get("sports", [{}])[0].get("leagues", [{}])[0].get("teams", []):
            t = item.get("team", {})
            teams.append({
                "id": t.get("id", ""),
                "full_name": t.get("displayName", ""),
                "abbreviation": t.get("abbreviation", ""),
                "nickname": t.get("name", ""),
                "city": t.get("location", ""),
                "color": t.get("color", ""),
                "alternateColor": t.get("alternateColor", ""),
            })

        teams.sort(key=lambda x: x["full_name"])
        return {"teams": teams, "count": len(teams)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{team_id}")
async def get_team(team_id: str):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            team_resp = await client.get(f"{ESPN_BASE}/teams/{team_id}")

            if team_resp.status_code != 200:
                raise HTTPException(status_code=404, detail="Team not found")

            team_data = team_resp.json().get("team", {})

            schedule_resp, standings_resp, athletes_resp = await asyncio.gather(
                client.get(f"{ESPN_BASE}/teams/{team_id}/schedule", params={"season": "2026", "seasontype": "2"}),
                client.get(f"{ESPN_V2}/standings"),
                client.get(f"{ESPN_BASE}/teams/{team_id}/roster"),
            )

        team_abbr = team_data.get("abbreviation", "")

        # Roster
        roster_list = []
        if athletes_resp.status_code == 200:
            for player in athletes_resp.json().get("athletes", []):
                pos = player.get("position", {})
                pos_abbr = pos.get("abbreviation", "") if isinstance(pos, dict) else ""
                exp = player.get("experience", {})
                exp_years = str(exp.get("years", "")) if isinstance(exp, dict) else str(exp)
                roster_list.append({
                    "playerId":   str(player.get("id", "")),
                    "name":       str(player.get("displayName", "")),
                    "number":     str(player.get("jersey", "")),
                    "position":   str(pos_abbr),
                    "height":     str(player.get("displayHeight", "")),
                    "weight":     str(player.get("displayWeight", "")),
                    "age":        str(player.get("age", "")),
                    "experience": exp_years,
                })

        # Last 5 completed + upcoming from schedule
        last5    = []
        upcoming = []

        if schedule_resp.status_code == 200:
            events = schedule_resp.json().get("events", [])

            completed = [
                e for e in events
                if e.get("competitions", [{}])[0].get("status", {}).get("type", {}).get("completed", False)
            ]
            for event in completed[-5:]:
                comp        = event.get("competitions", [{}])[0]
                competitors = comp.get("competitors", [])
                my_team = next((c for c in competitors if c.get("team", {}).get("id") == team_id), {})
                opp     = next((c for c in competitors if c.get("team", {}).get("id") != team_id), {})
                home_away = "vs" if my_team.get("homeAway") == "home" else "@"
                wl        = "W" if my_team.get("winner") else "L"

                my_score  = my_team.get("score", {})
                opp_score = opp.get("score", {})
                my_pts    = my_score.get("displayValue", "") if isinstance(my_score, dict) else str(my_score or "")
                opp_pts   = opp_score.get("displayValue", "") if isinstance(opp_score, dict) else str(opp_score or "")

                last5.append({
                    "GAME_DATE": event.get("date", "")[:10],
                    "MATCHUP":   f"{home_away} {opp.get('team', {}).get('abbreviation', '')}",
                    "WL":        wl,
                    "PTS":       my_pts,
                    "OPP_PTS":   opp_pts,
                })
            last5 = last5[-5:]

            # Next 5 upcoming (not completed, not in progress)
            not_started = [
                e for e in events
                if not e.get("competitions", [{}])[0].get("status", {}).get("type", {}).get("completed", False)
                and e.get("competitions", [{}])[0].get("status", {}).get("type", {}).get("state", "") == "pre"
            ]
            for event in not_started[:5]:
                comp        = event.get("competitions", [{}])[0]
                competitors = comp.get("competitors", [])
                my_team = next((c for c in competitors if c.get("team", {}).get("id") == team_id), {})
                opp     = next((c for c in competitors if c.get("team", {}).get("id") != team_id), {})
                home_away    = "vs" if my_team.get("homeAway") == "home" else "@"
                opp_abbr     = opp.get("team", {}).get("abbreviation", "")
                opp_full     = opp.get("team", {}).get("displayName", opp_abbr)
                opp_id       = opp.get("team", {}).get("id", "")
                game_date    = event.get("date", "")
                venue        = comp.get("venue", {}).get("fullName", "")

                upcoming.append({
                    "GAME_DATE": game_date[:10],
                    "GAME_TIME": game_date,   # full ISO string — let frontend format to PHT
                    "MATCHUP":   f"{home_away} {opp_abbr}",
                    "OPP_FULL":  opp_full,
                    "OPP_ID":    opp_id,
                    "OPP_ABBR":  opp_abbr,
                    "HOME_AWAY": home_away,
                    "VENUE":     venue,
                })

        # Streak
        streak = "—"
        if last5:
            streak_char = last5[-1]["WL"]
            count = sum(1 for g in reversed(last5) if g["WL"] == streak_char)
            streak = f"{streak_char}{count}"

        # Stats from standings
        stats = {}
        if standings_resp.status_code == 200:
            for group in standings_resp.json().get("children", []):
                for entry in group.get("standings", {}).get("entries", []):
                    if entry.get("team", {}).get("id") == team_id:
                        s = {}
                        for st in entry.get("stats", []):
                            name = st.get("name", "")
                            val  = st.get("displayValue", "") or str(st.get("value", "0"))
                            s[name] = val
                        wins   = int(float(s.get("wins",   0)))
                        losses = int(float(s.get("losses", 0)))
                        stats  = {
                            "wins":       wins,
                            "losses":     losses,
                            "pct":        round(wins / max(wins + losses, 1), 3),
                            "pts":        float(s.get("avgPoints", 0) or 0),
                            "fgPct":      0, "fg3Pct": 0, "ftPct": 0,
                            "reb":        0, "ast":    0, "stl":   0, "blk": 0,
                            "tov":        0,
                            "plusMinus":  float(s.get("pointDifferential", 0) or 0),
                        }

        return {
            "team": {
                "id":           team_data.get("id"),
                "full_name":    team_data.get("displayName", ""),
                "abbreviation": team_abbr,
                "city":         team_data.get("location", ""),
                "color":        team_data.get("color", ""),
            },
            "stats":    stats,
            "roster":   roster_list,
            "last5":    last5,
            "upcoming": upcoming,
            "streak":   streak,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))