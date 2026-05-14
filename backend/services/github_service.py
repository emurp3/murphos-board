"""
GitHub API client.
Docs: https://docs.github.com/en/rest
Falls back gracefully if GITHUB_TOKEN is not configured.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from core.config import settings

logger = logging.getLogger(__name__)

_BASE_URL = "https://api.github.com"
_TIMEOUT = 10.0

# Repos monitored by S.A. — update as new projects are added
_MONITORED_REPOS: list[str] = [
    "emurp3/murphos-board",
    "emurp3/Hunter-AutoTrader",
    "emurp3/SAPP",
    "emurp3/leon-commerce",
    "emurp3/optix",
]


class GitHubService:
    def __init__(self) -> None:
        self._token = settings.github_token

    def _headers(self) -> dict[str, str]:
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if self._token:
            headers["Authorization"] = f"Bearer {self._token}"
        else:
            logger.warning("GITHUB_TOKEN not set — using unauthenticated requests (rate-limited).")
        return headers

    def monitored_repos(self) -> list[str]:
        return _MONITORED_REPOS

    async def get_recent_commits(self, repo: str, per_page: int = 10) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(
                f"{_BASE_URL}/repos/{repo}/commits",
                headers=self._headers(),
                params={"per_page": per_page},
            )
            resp.raise_for_status()
            raw: list[dict[str, Any]] = resp.json()
            return [
                {
                    "sha": c.get("sha", "")[:7],
                    "message": c.get("commit", {}).get("message", "").split("\n")[0],
                    "author": c.get("commit", {}).get("author", {}).get("name", ""),
                    "date": c.get("commit", {}).get("author", {}).get("date", ""),
                    "url": c.get("html_url", ""),
                }
                for c in raw
            ]

    async def get_issues(
        self, repo: str, state: str = "open", per_page: int = 20
    ) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(
                f"{_BASE_URL}/repos/{repo}/issues",
                headers=self._headers(),
                params={"state": state, "per_page": per_page, "pulls": False},
            )
            resp.raise_for_status()
            raw: list[dict[str, Any]] = resp.json()
            return [
                {
                    "number": i.get("number"),
                    "title": i.get("title", ""),
                    "state": i.get("state", ""),
                    "labels": [lb.get("name") for lb in i.get("labels", [])],
                    "created_at": i.get("created_at", ""),
                    "url": i.get("html_url", ""),
                }
                for i in raw
                if "pull_request" not in i  # exclude PRs
            ]

    async def get_repo_info(self, repo: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(
                f"{_BASE_URL}/repos/{repo}",
                headers=self._headers(),
            )
            resp.raise_for_status()
            data = resp.json()
            return {
                "name": data.get("name", ""),
                "full_name": data.get("full_name", ""),
                "description": data.get("description", ""),
                "default_branch": data.get("default_branch", "main"),
                "stars": data.get("stargazers_count", 0),
                "open_issues": data.get("open_issues_count", 0),
                "updated_at": data.get("updated_at", ""),
                "url": data.get("html_url", ""),
            }
