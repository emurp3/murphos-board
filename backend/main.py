"""
S.A. — Super Assistant Executive AI Chief of Staff
FastAPI application entry point.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from routers import health, command, deployments, agents, memory, reports, github_router
from services.scheduler import start_scheduler, shutdown_scheduler

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# WebSocket connection manager
# ─────────────────────────────────────────────

class ConnectionManager:
    def __init__(self) -> None:
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.active.append(ws)
        logger.info("WS client connected. Total: %d", len(self.active))

    def disconnect(self, ws: WebSocket) -> None:
        self.active.remove(ws)
        logger.info("WS client disconnected. Total: %d", len(self.active))

    async def broadcast(self, message: str) -> None:
        for ws in list(self.active):
            try:
                await ws.send_text(message)
            except Exception:
                self.disconnect(ws)


manager = ConnectionManager()


# ─────────────────────────────────────────────
# Lifespan: start/stop scheduler
# ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("S.A. backend starting up…")
    start_scheduler()
    yield
    logger.info("S.A. backend shutting down…")
    shutdown_scheduler()


# ─────────────────────────────────────────────
# App factory
# ─────────────────────────────────────────────

app = FastAPI(
    title="S.A. Executive Command API",
    description="MurphBoard Super Assistant — backend API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Routers
# ─────────────────────────────────────────────

app.include_router(health.router, tags=["health"])
app.include_router(command.router, prefix="/api/command", tags=["command"])
app.include_router(deployments.router, prefix="/api/deployments", tags=["deployments"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(github_router.router, prefix="/api/github", tags=["github"])


# ─────────────────────────────────────────────
# WebSocket endpoint
# ─────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"[broadcast] {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
