from fastapi import APIRouter, HTTPException
import httpx
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba"
ESPN_STANDINGS = "https://site.api.espn.com/apis/v2/sports/basketball/nba"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"


def calc_win_prob(home_wins, home_losses, away_wins, away_losses):
    home_pct = home_wins / max(home_wins + home_losses, 1)
    away_pct = away_wins / max(away_wins + away_losses, 1)
    total = home_pct + away_pct
    if total == 0:
        return 52, 48
    hp = min(97, max(3, round((home_pct / total * 100) + 3)))
    return hp, 100 - hp


@router.get("/")
async def get_predictions():
    try:
        today = datetime.now().strftime("%Y%m%d")
        async with httpx.AsyncClient(timeout=30.0) as client:
            games_resp = await client.get(f"{ESPN_BASE}/scoreboard", params={"dates": today})
            standings_resp = await client.get(f"{ESPN_STANDINGS}/standings")

        games = games_resp.json().get("events", []) if games_resp.status_code == 200 else []

        # Build standings map by team abbreviation
        standings_map = {}
        if standings_resp.status_code == 200:
            for group in standings_resp.json().get("children", []):
                for entry in group.get("standings", {}).get("entries", []):
                    team = entry.get("team", {})
                    stats = {s["name"]: s.get("displayValue", s.get("value", "")) for s in entry.get("stats", [])}
                    abbr = team.get("abbreviation", "")
                    standings_map[abbr] = {
                        "wins": int(float(stats.get("wins", 0))),
                        "losses": int(float(stats.get("losses", 0))),
                        "last10": str(stats.get("lastTen", "5-5")),
                    }

        predictions = []
        for event in games[:6]:
            competition = event.get("competitions", [{}])[0]
            competitors = competition.get("competitors", [])
            home = next((c for c in competitors if c.get("homeAway") == "home"), {})
            away = next((c for c in competitors if c.get("homeAway") == "away"), {})
            home_team = home.get("team", {})
            away_team = away.get("team", {})

            home_abbr = home_team.get("abbreviation", "")
            away_abbr = away_team.get("abbreviation", "")

            hs = standings_map.get(home_abbr, {"wins": 0, "losses": 0, "last10": "5-5"})
            as_ = standings_map.get(away_abbr, {"wins": 0, "losses": 0, "last10": "5-5"})

            hp, ap = calc_win_prob(hs["wins"], hs["losses"], as_["wins"], as_["losses"])
            pick = home_abbr if hp >= ap else away_abbr
            pick_prob = max(hp, ap)
            confidence = "High" if pick_prob >= 68 else "Medium" if pick_prob >= 58 else "Low"

            predictions.append({
                "gameId": event.get("id"),
                "game": f"{home_abbr} vs {away_abbr}",
                "homeTeam": {"abbr": home_abbr, "id": home_team.get("id"), "stats": hs},
                "awayTeam": {"abbr": away_abbr, "id": away_team.get("id"), "stats": as_},
                "pick": pick,
                "pickProbability": pick_prob,
                "homeWinProbability": hp,
                "awayWinProbability": ap,
                "confidence": confidence,
                "factors": [
                    "Home court advantage (+3%)",
                    f"{home_abbr} record: {hs['wins']}-{hs['losses']}",
                    f"{away_abbr} record: {as_['wins']}-{as_['losses']}",
                    f"L10: {hs['last10']} vs {as_['last10']}",
                ],
                "time": event.get("status", {}).get("type", {}).get("shortDetail", ""),
            })

        return {"predictions": predictions, "count": len(predictions)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{game_id}/analysis")
async def get_game_analysis(game_id: str, home_abbr: str, away_abbr: str, home_prob: int = 50):
    away_prob = 100 - home_prob
    pick = home_abbr if home_prob >= away_prob else away_abbr
    pick_prob = max(home_prob, away_prob)
    underdog = away_abbr if home_prob >= away_prob else home_abbr

    fallback = (
        f"{pick} holds a {pick_prob}% win probability advantage tonight. "
        f"They are the projected winner based on season record and home court, "
        f"though {underdog} will look to change the game with momentum."
    )

    if not GEMINI_API_KEY:
        return {"gameId": game_id, "analysis": fallback}

    prompt = f"""You are an expert NBA analyst. Give a concise 3-4 sentence analysis of tonight's {home_abbr} (home) vs {away_abbr} (away) matchup.
Win probability: {home_abbr} {home_prob}%, {away_abbr} {away_prob}%.
The favored team is {pick} with {pick_prob}% win probability.
Explain why {pick} is favored, mention a key matchup factor, and name one thing that could flip the result in {underdog}'s favor."""

    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": 200, "temperature": 0.6},
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(GEMINI_URL, json=body)
            data = resp.json()
            analysis = (
                data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", fallback)
            )
            return {"gameId": game_id, "analysis": analysis}
    except Exception:
        return {"gameId": game_id, "analysis": fallback}