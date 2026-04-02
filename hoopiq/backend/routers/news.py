from fastapi import APIRouter
import httpx
from datetime import datetime

router = APIRouter()

ESPN_NEWS_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news"

MOCK_NEWS = [
    {"id": 1, "headline": "Shai Gilgeous-Alexander drops 42 as Thunder extend win streak to 8", "summary": "SGA was masterful in OKC's dominant victory, shooting 65% from the field while adding 7 assists and 6 rebounds.", "category": "Game Recap", "team": "OKC", "published": "2h ago", "url": "#", "source": "ESPN"},
    {"id": 2, "headline": "Celtics rolling as Tatum posts 31-point triple-double", "summary": "Jayson Tatum was unstoppable, leading Boston to their fifth straight win with an efficient all-around performance.", "category": "Performance", "team": "BOS", "published": "3h ago", "url": "#", "source": "ESPN"},
    {"id": 3, "headline": "Nikola Jokic posts 28-14-11 triple-double in Nuggets victory", "summary": "The three-time MVP continued his historic season with another dominant all-around performance.", "category": "Performance", "team": "DEN", "published": "5h ago", "url": "#", "source": "ESPN"},
    {"id": 4, "headline": "LeBron James passes 40,000 career points — first player in NBA history", "summary": "The Los Angeles Lakers star made history once again, etching his name at the top of the all-time scoring list.", "category": "Milestone", "team": "LAL", "published": "6h ago", "url": "#", "source": "NBA.com"},
    {"id": 5, "headline": "Western Conference playoff picture tightening with 12 games remaining", "summary": "The battle for the 5th through 10th seeds has never been closer. Here is where every team stands.", "category": "Standings", "team": None, "published": "8h ago", "url": "#", "source": "The Athletic"},
    {"id": 6, "headline": "Anthony Edwards named All-NBA First Team for second consecutive season", "summary": "Ant-Man has firmly established himself as one of the three best players in the NBA.", "category": "Awards", "team": "MIN", "published": "1d ago", "url": "#", "source": "NBA.com"},
    {"id": 7, "headline": "Victor Wembanyama blocks 8 shots in dominant Spurs win", "summary": "The French phenom continues to rewrite the record books for a player his age.", "category": "Performance", "team": "SAS", "published": "1d ago", "url": "#", "source": "ESPN"},
    {"id": 8, "headline": "Giannis Antetokounmpo listed as GTD with knee soreness", "summary": "The Bucks star is considered a game-time decision ahead of tonight's crucial matchup.", "category": "Injury Update", "team": "MIL", "published": "2h ago", "url": "#", "source": "NBA.com"},
]

def categorize(headline: str, desc: str) -> str:
    text = (headline + " " + desc).lower()
    if any(w in text for w in ["injur", "out", "questionable", "gtd", "knee", "ankle", "hamstring", "listed"]):
        return "Injury Update"
    if any(w in text for w in ["trade", "sign", "signed", "waived", "contract", "free agent"]):
        return "Transactions"
    if any(w in text for w in ["record", "milestone", "history", "first", "career", "passes"]):
        return "Milestone"
    if any(w in text for w in ["wins", "defeats", "beats", "victory", "recap", "drops"]):
        return "Game Recap"
    if any(w in text for w in ["all-nba", "mvp", "award", "all-star", "named"]):
        return "Awards"
    if any(w in text for w in ["standings", "playoff", "seeding", "race"]):
        return "Standings"
    return "Performance"

def fmt_time(iso_str: str) -> str:
    if not iso_str:
        return "Recently"
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        now = datetime.now(dt.tzinfo)
        hours = int((now - dt).total_seconds() / 3600)
        if hours < 1: return "Just now"
        if hours < 24: return f"{hours}h ago"
        return f"{hours // 24}d ago"
    except Exception:
        return "Recently"

@router.get("/")
async def get_news(limit: int = 20):
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(ESPN_NEWS_URL, params={"limit": limit})
            if resp.status_code != 200:
                return {"news": MOCK_NEWS, "source": "mock"}
            data = resp.json()
            articles = data.get("articles", [])
            if not articles:
                return {"news": MOCK_NEWS, "source": "mock"}
            news = []
            for i, a in enumerate(articles):
                headline = a.get("headline", "")
                news.append({
                    "id": i + 1,
                    "headline": headline,
                    "summary": a.get("description", ""),
                    "category": categorize(headline, a.get("description", "")),
                    "team": None,
                    "published": fmt_time(a.get("published", "")),
                    "url": a.get("links", {}).get("web", {}).get("href", "#"),
                    "source": "ESPN",
                    "imageUrl": a.get("images", [{}])[0].get("url") if a.get("images") else None,
                })
            return {"news": news, "count": len(news), "source": "espn"}
    except Exception:
        return {"news": MOCK_NEWS, "count": len(MOCK_NEWS), "source": "mock"}
