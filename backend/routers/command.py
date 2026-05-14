"""
Executive Command Center routes.
  GET  /api/command/overview  — aggregate status of all agents + deployments
  GET  /api/command/alerts    — active system alerts from Supabase
  POST /api/command/task      — create a routed task
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from core.supabase_client import get_supabase
from models.schemas import (
    AgentStatus,
    AlertItem,
    AlertLevel,
    TaskCreate,
    Task,
    TaskStatus,
)
from services.render_service import RenderService
from routers.agents import AGENT_REGISTRY

logger = logging.getLogger(__name__)
router = APIRouter()


# ─────────────────────────────────────────────
# GET /api/command/overview
# ─────────────────────────────────────────────

@router.get("/overview")
async def command_overview() -> dict[str, Any]:
    """Return aggregate operational status across all agents and deployments."""
    db = get_supabase()

    # Agent statuses from Supabase (fall back to registry defaults)
    agents_status: list[dict[str, Any]] = []
    if db:
        try:
            result = db.table("agents").select("*").execute()
            agents_status = result.data or []
        except Exception as exc:
            logger.warning("Could not fetch agents from Supabase: %s", exc)

    if not agents_status:
        agents_status = [
            {"id": a.id, "name": a.name, "status": a.status.value, "domain": a.domain}
            for a in AGENT_REGISTRY.values()
        ]

    # Open task count
    open_tasks = 0
    if db:
        try:
            result = db.table("tasks").select("id", count="exact").neq("status", "done").neq("status", "cancelled").execute()
            open_tasks = result.count or 0
        except Exception as exc:
            logger.warning("Could not count tasks: %s", exc)

    # Deployment health (non-blocking — render service may lack credentials)
    render = RenderService()
    deployments: list[dict[str, Any]] = []
    try:
        deployments = [d.model_dump() for d in await render.list_services()]
    except Exception as exc:
        logger.warning("Render service unavailable: %s", exc)

    healthy = sum(1 for d in deployments if d.get("state") == "live")
    degraded = len(deployments) - healthy

    return {
        "agents": agents_status,
        "open_tasks": open_tasks,
        "deployments": {
            "total": len(deployments),
            "healthy": healthy,
            "degraded": degraded,
            "services": deployments,
        },
        "checked_at": datetime.now(tz=timezone.utc).isoformat(),
    }


# ─────────────────────────────────────────────
# GET /api/command/alerts
# ─────────────────────────────────────────────

@router.get("/alerts", response_model=list[AlertItem])
async def get_alerts() -> list[AlertItem]:
    """Return unresolved alerts from Supabase."""
    db = get_supabase()
    if not db:
        return []
    try:
        result = db.table("alerts").select("*").eq("resolved", False).order("created_at", desc=True).limit(50).execute()
        return [AlertItem(**row) for row in (result.data or [])]
    except Exception as exc:
        logger.error("Failed to fetch alerts: %s", exc)
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")


# ─────────────────────────────────────────────
# POST /api/command/task
# ─────────────────────────────────────────────

@router.post("/task", response_model=Task, status_code=201)
async def create_task(payload: TaskCreate) -> Task:
    """Create and persist a new task, routing it to the appropriate agent."""
    db = get_supabase()

    now = datetime.now(tz=timezone.utc)
    task_id = uuid4()

    task_row = {
        "id": str(task_id),
        "agent_id": payload.agent_id,
        "title": payload.title,
        "description": payload.description,
        "status": TaskStatus.pending.value,
        "priority": payload.priority.value,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    if db:
        try:
            db.table("tasks").insert(task_row).execute()
        except Exception as exc:
            logger.error("Failed to persist task: %s", exc)
            raise HTTPException(status_code=500, detail=f"Database error: {exc}")

    return Task(
        id=task_id,
        agent_id=payload.agent_id,
        title=payload.title,
        description=payload.description,
        status=TaskStatus.pending,
        priority=payload.priority,
        created_at=now,
        updated_at=now,
    )
