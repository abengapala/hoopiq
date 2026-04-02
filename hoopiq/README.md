# 🏀 HoopIQ — NBA Analytics Platform

Full-stack NBA analytics and game prediction website using **real NBA.com data**.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Python FastAPI |
| NBA Data | `nba_api` (free, scrapes NBA.com) |
| AI Chat | Google Gemini 2.0 Flash (**FREE**) |
| Database | Supabase (PostgreSQL) |
| Deploy | Vercel (frontend) + Railway (backend) |

## Project Structure
```
hoopiq/
├── frontend/               ← React + Vite app
│   ├── src/
│   │   ├── pages/          ← All 12 page components
│   │   ├── components/     ← Sidebar, Topbar, UI kit, AIAnalysis
│   │   ├── hooks/          ← useApi hook
│   │   └── lib/            ← api.js (all backend calls)
│   ├── .env.example
│   └── package.json
├── backend/                ← Python FastAPI server
│   ├── routers/
│   │   ├── games.py        ← /games/today, /games/upcoming, /game/:id
│   │   ├── teams.py        ← /teams/, /teams/:id
│   │   ├── players.py      ← /players/, /players/:id, /players/stats/leaders
│   │   ├── injuries.py     ← /injuries/
│   │   ├── news.py         ← /news/
│   │   ├── predictions.py  ← /predictions/, /predictions/:id/analysis
│   │   ├── rankings.py     ← /power-rankings/
│   │   ├── standings.py    ← /standings/
│   │   └── chat.py         ← /ai-chat/ (Gemini)
│   ├── main.py
│   ├── config.py
│   ├── requirements.txt
│   └── .env.example
└── supabase/
    └── schema.sql          ← Run this in Supabase SQL Editor

```

---

## 🚀 Quick Start (Local Development)

### Step 1 — Get a FREE Gemini API Key
1. Go to https://aistudio.google.com/app/apikey
2. Click **Create API Key**
3. Copy it — you'll need it below

### Step 2 — Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate          # Mac/Linux
venv\Scripts\activate             # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and fill in your keys:
#   GEMINI_API_KEY=your-gemini-key
#   SUPABASE_URL=https://xxxx.supabase.co   (optional, for caching)
#   SUPABASE_KEY=your-supabase-key          (optional)

# Start the server
uvicorn main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### Step 3 — Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create env file
cp .env.example .env.local
# Edit .env.local:
#   VITE_API_URL=http://localhost:8000
#   VITE_GEMINI_API_KEY=your-gemini-key

# Start dev server
npm run dev
# App: http://localhost:3000
```

### Step 4 — Supabase (Optional — for data caching)
1. Create a free project at https://supabase.com
2. Go to **SQL Editor** in the dashboard
3. Paste the contents of `supabase/schema.sql`
4. Click **Run**
5. Copy your Project URL and anon key into `backend/.env`

---

## 🌐 Deployment

### Frontend → Vercel (free)
```bash
cd frontend
npm run build

# Option A: Vercel CLI
npm i -g vercel
vercel --prod

# Option B: Push to GitHub → import at vercel.com
# Set these env vars in Vercel dashboard:
#   VITE_API_URL = https://your-railway-backend.up.railway.app
#   VITE_GEMINI_API_KEY = your-gemini-key
```

### Backend → Railway (free tier)
1. Push this whole folder to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Select your repo, point to `/backend` folder
4. Add env vars in Railway dashboard:
   ```
   GEMINI_API_KEY=your-gemini-key
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_KEY=your-key
   ```
5. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/games/today` | Live + scheduled games today |
| GET | `/games/upcoming?days=7` | Next N days of games |
| GET | `/games/{game_id}` | Full box score + player stats |
| GET | `/teams/` | All 30 NBA teams |
| GET | `/teams/{team_id}` | Team detail + roster + last 5 |
| GET | `/players/` | Active players (search by name) |
| GET | `/players/{player_id}` | Player profile + stats |
| GET | `/players/stats/leaders?stat=PTS` | Stat leaders (PTS/REB/AST/etc) |
| GET | `/injuries/` | Current injury report |
| GET | `/news/` | Latest NBA news (ESPN) |
| GET | `/predictions/` | AI win predictions for today |
| GET | `/predictions/{id}/analysis` | Gemini AI game breakdown |
| GET | `/power-rankings/` | Power rankings with scores |
| GET | `/standings/` | Conference standings |
| POST | `/ai-chat/` | Gemini NBA chatbot |

**Interactive API docs:** http://localhost:8000/docs

---

## Pages
| Page | Route | Description |
|------|-------|-------------|
| Today's Games | `/` | Live scores + win probability |
| Upcoming | `/upcoming` | Next 7 days schedule |
| Game Detail | `/game/:id` | Full matchup stats + AI analysis |
| Predictions | `/predictions` | AI-powered picks |
| Standings | `/standings` | East/West conference tables |
| Power Rankings | `/rankings` | Computed team rankings |
| Stat Leaders | `/leaders` | PTS/REB/AST/etc leaders |
| Teams | `/teams` | All 30 teams |
| Team Detail | `/teams/:id` | Roster + stats + last 5 |
| Player Detail | `/players/:id` | Full player profile |
| Injuries | `/injuries` | OUT/GTD report |
| News | `/news` | Latest stories |
| AI Chat | `/chat` | Gemini NBA chatbot |

---

## Notes on nba_api
- `nba_api` scrapes **NBA.com** — it's free but has rate limits
- The backend adds **0.6s delays** between calls to avoid getting blocked
- If you see timeouts, increase the sleep delay in each router file
- NBA.com occasionally changes their API — update `nba_api` with `pip install --upgrade nba_api`
