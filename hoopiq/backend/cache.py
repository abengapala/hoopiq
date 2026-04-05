"""
cache.py — Supabase-backed cache helpers for HoopIQ

TTLs:
  - games (live)      →  5 minutes
  - games (scheduled) → 30 minutes
  - standings         → 60 minutes
  - injuries          → 30 minutes
  - ai_analysis       → forever (keyed by game_id)
  - achievements      → forever (keyed by player_id)
"""

from datetime import datetime, timezone, timedelta
from supabase_client import get_supabase
import json

TTL = {
    "games_live":      5,
    "games_scheduled": 30,
    "standings":       60,
    "injuries":        30,
}

def _now() -> datetime:
    return datetime.now(timezone.utc)

def _is_expired(updated_at_str: str, ttl_minutes: int) -> bool:
    if not updated_at_str:
        return True
    try:
        updated_at = datetime.fromisoformat(updated_at_str.replace("Z", "+00:00"))
        return _now() - updated_at > timedelta(minutes=ttl_minutes)
    except Exception:
        return True


# ══════════════════════════════════════════════════════════════
#  GAMES CACHE
# ══════════════════════════════════════════════════════════════

def get_cached_games(date_str: str) -> dict | None:
    try:
        sb = get_supabase()
        res = sb.table("cache_games").select("*").eq("date", date_str).maybe_single().execute()
        if not res.data:
            return None
        row = res.data
        has_live = row.get("has_live", False)
        ttl = TTL["games_live"] if has_live else TTL["games_scheduled"]
        if _is_expired(row.get("updated_at"), ttl):
            return None
        return json.loads(row["payload"])
    except Exception:
        return None

def set_cached_games(date_str: str, payload: dict, has_live: bool = False):
    try:
        sb = get_supabase()
        sb.table("cache_games").upsert({
            "date": date_str,
            "payload": json.dumps(payload),
            "has_live": has_live,
            "updated_at": _now().isoformat(),
        }, on_conflict="date").execute()
    except Exception:
        pass


# ══════════════════════════════════════════════════════════════
#  UPCOMING GAMES CACHE
# ══════════════════════════════════════════════════════════════

def get_cached_upcoming(days: int) -> dict | None:
    try:
        sb = get_supabase()
        key = f"upcoming_{days}"
        res = sb.table("cache_misc").select("*").eq("key", key).maybe_single().execute()
        if not res.data:
            return None
        if _is_expired(res.data.get("updated_at"), TTL["games_scheduled"]):
            return None
        return json.loads(res.data["payload"])
    except Exception:
        return None

def set_cached_upcoming(days: int, payload: dict):
    try:
        sb = get_supabase()
        key = f"upcoming_{days}"
        sb.table("cache_misc").upsert({
            "key": key,
            "payload": json.dumps(payload),
            "updated_at": _now().isoformat(),
        }, on_conflict="key").execute()
    except Exception:
        pass


# ══════════════════════════════════════════════════════════════
#  STANDINGS CACHE
# ══════════════════════════════════════════════════════════════

def get_cached_standings() -> dict | None:
    try:
        sb = get_supabase()
        res = sb.table("cache_misc").select("*").eq("key", "standings").maybe_single().execute()
        if not res.data:
            return None
        if _is_expired(res.data.get("updated_at"), TTL["standings"]):
            return None
        return json.loads(res.data["payload"])
    except Exception:
        return None

def set_cached_standings(payload: dict):
    try:
        sb = get_supabase()
        sb.table("cache_misc").upsert({
            "key": "standings",
            "payload": json.dumps(payload),
            "updated_at": _now().isoformat(),
        }, on_conflict="key").execute()
    except Exception:
        pass


# ══════════════════════════════════════════════════════════════
#  INJURIES CACHE
# ══════════════════════════════════════════════════════════════

def get_cached_injuries() -> dict | None:
    try:
        sb = get_supabase()
        res = sb.table("cache_misc").select("*").eq("key", "injuries").maybe_single().execute()
        if not res.data:
            return None
        if _is_expired(res.data.get("updated_at"), TTL["injuries"]):
            return None
        return json.loads(res.data["payload"])
    except Exception:
        return None

def set_cached_injuries(payload: dict):
    try:
        sb = get_supabase()
        sb.table("cache_misc").upsert({
            "key": "injuries",
            "payload": json.dumps(payload),
            "updated_at": _now().isoformat(),
        }, on_conflict="key").execute()
    except Exception:
        pass


# ══════════════════════════════════════════════════════════════
#  AI ANALYSIS CACHE  (permanent — keyed by game_id)
# ══════════════════════════════════════════════════════════════

def get_cached_analysis(game_id: str) -> str | None:
    try:
        sb = get_supabase()
        res = sb.table("cache_ai_analysis").select("analysis").eq("game_id", game_id).maybe_single().execute()
        if res.data:
            return res.data["analysis"]
        return None
    except Exception:
        return None

def set_cached_analysis(game_id: str, analysis: str):
    try:
        sb = get_supabase()
        sb.table("cache_ai_analysis").upsert({
            "game_id": game_id,
            "analysis": analysis,
            "created_at": _now().isoformat(),
        }, on_conflict="game_id").execute()
    except Exception:
        pass


# ══════════════════════════════════════════════════════════════
#  ACHIEVEMENTS CACHE  (permanent — keyed by player_id)
# ══════════════════════════════════════════════════════════════

def get_cached_achievements(player_id: str) -> list | None:
    """Returns cached achievements list or None if not cached yet."""
    try:
        sb = get_supabase()
        res = sb.table("cache_achievements").select("achievements").eq("player_id", player_id).maybe_single().execute()
        if res.data:
            return json.loads(res.data["achievements"])
        return None
    except Exception:
        return None

def set_cached_achievements(player_id: str, achievements: list):
    """Permanently stores achievements for a player — never expires."""
    try:
        sb = get_supabase()
        sb.table("cache_achievements").upsert({
            "player_id": player_id,
            "achievements": json.dumps(achievements),
            "created_at": _now().isoformat(),
        }, on_conflict="player_id").execute()
    except Exception:
        pass