"""
Reporting Engine routes.
  GET  /api/reports/daily       — daily briefing (OpenAI summary)
  GET  /api/reports/ecosystem   — full ecosystem status report
  POST /api/reports/generate    — trigger report generation and persist
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.supabase_client import get_supabase
from models.schemas import DailyBrief, EcosystemReport
from routers.agents import AGENT_REGISTRY
from services.openai_service import OpenAIService
from services.render_service import RenderService

logger = logging.getLogger(__name__)
router = APIRouter()


class GenerateReportRequest(BaseModel):
    report_type: str = "daily"  # "daily" | "ecosystem"


# ─────────────────────────────────────────────
# GET /api/reports/daily
# ─────────────────────────────────────────────

@router.get("/daily", response_model=DailyBrief)
async def daily_brief() -> DailyBrief:
    """Generate and return today's executive briefing via OpenAI."""
    db = get_supabase()

    # Gather context
    open_tasks = 0
    active_alerts = 0
    agent_highlights: list[dict[str, Any]] = []

    if db:
        try:
            tasks_res = db.table("tasks").select("id", count="exact").eq("status", "pending").execute()
            open_tasks = tasks_res.count or 0
        except Exception as exc:
            logger.warning("Could not count open tasks: %s", exc)

        try:
            alerts_res = db.table("alerts").select("id", count="exact").eq("resolved", False).execute()
            active_alerts = alerts_res.count or 0
        except Exception as exc:
            logger.warning("Could not count alerts: %s", exc)

        try:
            rows = db.table("agents").select("id,name,status,active_tasks").execute().data or []
            agent_highlights = rows
        except Exception as exc:
            logger.warning("Could not fetch agent highlights: %s", exc)

    if not agent_highlights:
        agent_highlights = [
            {"id": a.id, "name": a.name, "status": a.status.value, "active_tasks": a.active_tasks}
            for a in AGENT_REGISTRY.values()
        ]

    render = RenderService()
    deployments_healthy = 0
    deployments_degraded = 0
    try:
        services = await render.list_services()
        deployments_healthy = sum(1 for s in services if s.state.value == "live")
        deployments_degraded = len(services) - deployments_healthy
    except Exception as exc:
        logger.warning("Render unavailable for briefing: %s", exc)

    # Build prompt context
    context = {
        "open_tasks": open_tasks,
        "active_alerts": active_alerts,
        "agent_highlights": agent_highlights,
        "deployments_healthy": deployments_healthy,
        "deployments_degraded": deployments_degraded,
    }

    ai = OpenAIService()
    summary = await ai.generate_daily_brief(context)

    return DailyBrief(
        generated_at=datetime.now(tz=timezone.utc),
        summary=summary,
        agent_highlights=agent_highlights,
        active_alerts=active_alerts,
        open_tasks=open_tasks,
        deployments_healthy=deployments_healthy,
        deployments_degraded=deployments_degraded,
    )


# ─────────────────────────────────────────────
# GET /api/reports/ecosystem
# ─────────────────────────────────────────────

@router.get("/ecosystem", response_model=EcosystemReport)
async def ecosystem_report() -> EcosystemReport:
    """Full ecosystem status snapshot."""
    db = get_supabase()

    agents = list(AGENT_REGISTRY.values())
    if db:
        try:
            rows = db.table("agents").select("*").execute().data or []
            from models.schemas import AgentInfo, AgentStatus
            db_map = {r["id"]: r for r in rows}
            enriched = []
            for a in agents:
                row = db_map.get(a.id, {})
                enriched.append(
                    AgentInfo(
                        id=a.id,
                        name=a.name,
                        domain=a.domain,
                        description=a.description,
                        status=AgentStatus(row.get("status", a.status.value)),
                        last_activity=row.get("last_activity"),
                        active_tasks=row.get("active_tasks", 0),
                    )
                )
            agents = enriched
        except Exception:
            pass

    render = RenderService()
    deployments = []
    try:
        deployments = await render.list_services()
    except Exception:
        pass

    alerts = []
    open_tasks = 0
    if db:
        try:
            alerts_res = db.table("alerts").select("*").eq("resolved", False).limit(20).execute()
            from models.schemas import AlertItem
            alerts = [AlertItem(**r) for r in (alerts_res.data or [])]
        except Exception:
            pass
        try:
            tasks_res = db.table("tasks").select("id", count="exact").neq("status", "done").execute()
            open_tasks = tasks_res.count or 0
        except Exception:
            pass

    ai = OpenAIService()
    summary = await ai.generate_ecosystem_summary(
        {"agents": len(agents), "deployments": len(deployments), "alerts": len(alerts)}
    )

    return EcosystemReport(
        generated_at=datetime.now(tz=timezone.utc),
        agents=agents,
        deployments=deployments,
        alerts=alerts,
        open_tasks=open_tasks,
        summary=summary,
    )


# ─────────────────────────────────────────────
# POST /api/reports/generate
# ─────────────────────────────────────────────

@router.post("/generate", status_code=202)
async def trigger_report(body: GenerateReportRequest) -> dict[str, str]:
    """Queue a report generation job (persists result to Supabase)."""
    db = get_supabase()

    report_id = str(uuid4())
    now = datetime.now(tz=timezone.utc)

    # Generate the appropriate report
    if body.report_type == "daily":
        brief = await daily_brief()
        content = brief.model_dump_json()
    else:
        eco = await ecosystem_report()
        content = eco.model_dump_json()

    if db:
        try:
            db.table("reports").insert({
                "id": report_id,
                "type": body.report_type,
                "content": content,
                "generated_at": now.isoformat(),
            }).execute()
        except Exception as exc:
            logger.warning("Could not persist report: %s", exc)

    return {"report_id": report_id, "status": "generated", "type": body.report_type}
