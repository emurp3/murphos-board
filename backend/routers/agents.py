"""
Agent Coordination routes.
  GET  /api/agents                       — list all agents with status
  POST /api/agents/{agent_id}/task       — delegate task to agent
  GET  /api/agents/{agent_id}/report     — get latest report for agent
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.supabase_client import get_supabase
from models.schemas import (
    AgentInfo,
    AgentReport,
    AgentStatus,
    Task,
    TaskCreate,
    TaskPriority,
    TaskStatus,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ─────────────────────────────────────────────
# Static registry — updated from Supabase at runtime
# ─────────────────────────────────────────────

AGENT_REGISTRY: dict[str, AgentInfo] = {
    "hunter": AgentInfo(
        id="hunter",
        name="Hunter",
        domain="Automated Trading",
        description="Stock & crypto trading engine, congressional signals, revenue tracking.",
        status=AgentStatus.idle,
    ),
    "leon": AgentInfo(
        id="leon",
        name="Leon",
        domain="E-Commerce",
        description="Etsy / Gumroad / Printful product pipeline, shirt drops.",
        status=AgentStatus.idle,
    ),
    "sapp": AgentInfo(
        id="sapp",
        name="SAPP",
        domain="Creative",
        description="Music album (June 19 deadline), Gabe's Return movie production.",
        status=AgentStatus.idle,
    ),
    "ao": AgentInfo(
        id="ao",
        name="AO",
        domain="Career",
        description="Job application pipeline, resume tracking, interview prep.",
        status=AgentStatus.idle,
    ),
    "optix": AgentInfo(
        id="optix",
        name="Optix",
        domain="Research",
        description="Dissertation progress, Murphy Optics R&D, academic milestones.",
        status=AgentStatus.idle,
    ),
    "ninja": AgentInfo(
        id="ninja",
        name="Ninja Squad",
        domain="Investigations",
        description="Active investigation cases, research ops, intelligence log.",
        status=AgentStatus.idle,
    ),
}


class TaskDelegateRequest(BaseModel):
    title: str
    description: str | None = None
    priority: TaskPriority = TaskPriority.medium


# ─────────────────────────────────────────────
# GET /api/agents
# ─────────────────────────────────────────────

@router.get("", response_model=list[AgentInfo])
async def list_agents() -> list[AgentInfo]:
    """Return all agents enriched with live status from Supabase."""
    db = get_supabase()
    agents = list(AGENT_REGISTRY.values())

    if not db:
        return agents

    try:
        rows = db.table("agents").select("*").execute().data or []
        db_map: dict[str, dict[str, Any]] = {r["id"]: r for r in rows}

        enriched: list[AgentInfo] = []
        for agent in agents:
            row = db_map.get(agent.id, {})
            enriched.append(
                AgentInfo(
                    id=agent.id,
                    name=agent.name,
                    domain=agent.domain,
                    description=agent.description,
                    status=AgentStatus(row.get("status", agent.status.value)),
                    last_activity=row.get("last_activity"),
                    active_tasks=row.get("active_tasks", 0),
                )
            )
        return enriched
    except Exception as exc:
        logger.warning("Could not enrich agent list from Supabase: %s", exc)
        return agents


# ─────────────────────────────────────────────
# POST /api/agents/{agent_id}/task
# ─────────────────────────────────────────────

@router.post("/{agent_id}/task", response_model=Task, status_code=201)
async def delegate_task(agent_id: str, body: TaskDelegateRequest) -> Task:
    """Delegate a task directly to a named agent and persist it."""
    if agent_id not in AGENT_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found.")

    db = get_supabase()
    now = datetime.now(tz=timezone.utc)
    task_id = uuid4()

    task_row = {
        "id": str(task_id),
        "agent_id": agent_id,
        "title": body.title,
        "description": body.description,
        "status": TaskStatus.pending.value,
        "priority": body.priority.value,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    if db:
        try:
            db.table("tasks").insert(task_row).execute()
        except Exception as exc:
            logger.error("Failed to persist task for agent %s: %s", agent_id, exc)
            raise HTTPException(status_code=500, detail=f"Database error: {exc}")

    return Task(
        id=task_id,
        agent_id=agent_id,
        title=body.title,
        description=body.description,
        status=TaskStatus.pending,
        priority=body.priority,
        created_at=now,
        updated_at=now,
    )


# ─────────────────────────────────────────────
# GET /api/agents/{agent_id}/report
# ─────────────────────────────────────────────

@router.get("/{agent_id}/report", response_model=AgentReport | None)
async def agent_report(agent_id: str) -> AgentReport | None:
    """Return the most recent report for a given agent."""
    if agent_id not in AGENT_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found.")

    db = get_supabase()
    if not db:
        return None

    try:
        result = (
            db.table("agent_reports")
            .select("*")
            .eq("agent_id", agent_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        rows = result.data or []
        if not rows:
            return None
        return AgentReport(**rows[0])
    except Exception as exc:
        logger.error("Failed to fetch report for agent %s: %s", agent_id, exc)
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")
