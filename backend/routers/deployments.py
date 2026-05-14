"""
Deployment Auditor routes.
  GET  /api/deployments/status      — check all Render services
  GET  /api/deployments/github      — recent commits across registered repos
  POST /api/deployments/check       — trigger health check on a specific service
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from models.schemas import DeploymentStatus
from services.render_service import RenderService
from services.github_service import GitHubService

logger = logging.getLogger(__name__)
router = APIRouter()


class ServiceCheckRequest(BaseModel):
    service_id: str


# ─────────────────────────────────────────────
# GET /api/deployments/status
# ─────────────────────────────────────────────

@router.get("/status", response_model=list[DeploymentStatus])
async def deployment_status() -> list[DeploymentStatus]:
    """Fetch live status of all Render services."""
    render = RenderService()
    try:
        return await render.list_services()
    except Exception as exc:
        logger.error("Render service error: %s", exc)
        raise HTTPException(status_code=502, detail=f"Render API error: {exc}")


# ─────────────────────────────────────────────
# GET /api/deployments/github
# ─────────────────────────────────────────────

@router.get("/github")
async def github_deployment_summary() -> dict[str, Any]:
    """Recent commits across all monitored repositories."""
    gh = GitHubService()
    repos = gh.monitored_repos()
    summaries: list[dict[str, Any]] = []

    for repo in repos:
        try:
            commits = await gh.get_recent_commits(repo, per_page=5)
            summaries.append({"repo": repo, "commits": commits})
        except Exception as exc:
            logger.warning("Could not fetch commits for %s: %s", repo, exc)
            summaries.append({"repo": repo, "commits": [], "error": str(exc)})

    return {"repos": summaries}


# ─────────────────────────────────────────────
# POST /api/deployments/check
# ─────────────────────────────────────────────

@router.post("/check", response_model=DeploymentStatus)
async def check_service(body: ServiceCheckRequest) -> DeploymentStatus:
    """Trigger a live health check on a single Render service."""
    render = RenderService()
    try:
        return await render.get_service(body.service_id)
    except Exception as exc:
        logger.error("Failed to check service %s: %s", body.service_id, exc)
        raise HTTPException(status_code=502, detail=f"Render API error: {exc}")
