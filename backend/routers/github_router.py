"""
GitHub Integration routes.
  GET /api/github/repos              — list monitored repos
  GET /api/github/commits/{repo}     — recent commits
  GET /api/github/issues/{repo}      — open issues
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from services.github_service import GitHubService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/repos")
async def list_repos() -> dict[str, Any]:
    """Return the list of monitored repositories."""
    gh = GitHubService()
    return {"repos": gh.monitored_repos()}


@router.get("/commits/{repo:path}")
async def repo_commits(
    repo: str,
    per_page: int = Query(default=10, le=50),
) -> dict[str, Any]:
    """Recent commits for a given owner/repo slug."""
    gh = GitHubService()
    try:
        commits = await gh.get_recent_commits(repo, per_page=per_page)
        return {"repo": repo, "commits": commits}
    except Exception as exc:
        logger.error("Failed to fetch commits for %s: %s", repo, exc)
        raise HTTPException(status_code=502, detail=f"GitHub API error: {exc}")


@router.get("/issues/{repo:path}")
async def repo_issues(
    repo: str,
    state: str = Query(default="open"),
    per_page: int = Query(default=20, le=50),
) -> dict[str, Any]:
    """Open issues for a given owner/repo slug."""
    gh = GitHubService()
    try:
        issues = await gh.get_issues(repo, state=state, per_page=per_page)
        return {"repo": repo, "issues": issues}
    except Exception as exc:
        logger.error("Failed to fetch issues for %s: %s", repo, exc)
        raise HTTPException(status_code=502, detail=f"GitHub API error: {exc}")
