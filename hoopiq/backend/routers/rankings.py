from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()

ESPN_BASE = "https://site.api.espn.com/apis/v2/sports/basketball/nba"


def compute_power_score(wins, losses, last10_wins, streak_str) -> float:
    total = wins + losses
    win_pct = (wins / total * 40) if total > 0 else 20
    l10_score = last10_wins * 2
    try:
        streak_val = int(streak_str) if streak_str and streak_str.lstrip('-').isdigit() else 0
    except Exception:
        streak_val = 0
    streak_score = min(10, max(-10, streak_val)) + 10
    return round(win_pct + l10_score + streak_score, 2)


@router.get("/")
async def get_power_rankings():
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(f"{ESPN_BASE}/standings")
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"ESPN API error: {resp.status_code}")
            data = resp.json()

        rankings = []
        for group in data.get("children", []):
            conference = group.get("name", "")
            for team_entry in group.get("standings", {}).get("entries", []):
                team = team_entry.get("team", {})
                stats = {s["name"]: s.get("displayValue", s.get("value", "")) for s in team_entry.get("stats", [])}

                wins = int(float(stats.get("wins", 0)))
                losses = int(float(stats.get("losses", 0)))
                last10_str = str(stats.get("lastTen", "5-5"))
                try:
                    last10_wins = int(last10_str.split("-")[0])
                except Exception:
                    last10_wins = 5
                streak = str(stats.get("streak", "0"))
                power_score = compute_power_score(wins, losses, last10_wins, streak)

                rankings.append({
                    "teamId": team.get("id"),
                    "teamName": team.get("shortDisplayName", team.get("displayName", "")),
                    "teamCity": team.get("location", ""),
                    "abbr": team.get("abbreviation", ""),
                    "conference": "East" if "east" in conference.lower() else "West",
                    "wins": wins,
                    "losses": losses,
                    "pct": round(wins / max(wins + losses, 1), 3),
                    "gb": str(stats.get("gamesBehind", "—")),
                    "homeRecord": str(stats.get("homeRecord", "")),
                    "awayRecord": str(stats.get("awayRecord", "")),
                    "last10": last10_str,
                    "last10Wins": last10_wins,
                    "streak": streak,
                    "pointDiff": 0,
                    "powerScore": power_score,
                })

        rankings.sort(key=lambda x: x["powerScore"], reverse=True)
        for i, r in enumerate(rankings):
            r["rank"] = i + 1

        return {"rankings": rankings, "count": len(rankings)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
