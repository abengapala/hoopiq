from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from routers import games, teams, players, injuries, news, predictions, rankings, chat, standings

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🏀 HoopIQ API starting up...")
    yield
    print("HoopIQ API shutting down.")

app = FastAPI(
    title="HoopIQ NBA Analytics API",
    description="Real-time NBA data powered by nba_api + Claude AI",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: set to your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(games.router,       prefix="/games",          tags=["Games"])
app.include_router(teams.router,       prefix="/teams",          tags=["Teams"])
app.include_router(players.router,     prefix="/players",        tags=["Players"])
app.include_router(injuries.router,    prefix="/injuries",       tags=["Injuries"])
app.include_router(news.router,        prefix="/news",           tags=["News"])
app.include_router(predictions.router, prefix="/predictions",    tags=["Predictions"])
app.include_router(rankings.router,    prefix="/power-rankings", tags=["Rankings"])
app.include_router(chat.router,        prefix="/ai-chat",        tags=["AI Chat"])
app.include_router(standings.router,   prefix="/standings",      tags=["Standings"])

@app.get("/")
async def root():
    return {"message": "🏀 HoopIQ NBA Analytics API", "status": "running", "docs": "/docs"}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
