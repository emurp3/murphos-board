"""
Render API client.
Docs: https://api-docs.render.com/reference/introduction
Falls back gracefully if RENDER_API_KEY is not configured.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import httpx

from core.config import settings
from models.schemas import DeploymentStatus, DeployState

logger = logging.getLogger(__name__)

_BASE_URL = "https://api.render.com/v1"
_TIMEOUT = 10.0


def _map_state(raw: str) -> DeployState:
    mapping: dict[str, DeployState] = {
        "live": DeployState.live,
        "build_in_progress": DeployState.build_in_progress,
        "deactivated": DeployState.deactivated,
        "failed": DeployState.failed,
    }
    return mapping.get(raw, DeployState.unknown)


class RenderService:
    def __init__(self) -> None:
        self._api_key = settings.render_api_key

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self._api_key}", "Accept": "application/json"}

    def _available(self) -> bool:
        if not self._api_key:
            logger.warning("RENDER_API_KEY not set — deployment status unavailable.")
            return False
        return True

    async def list_services(self) -> list[DeploymentStatus]:
        if not self._available():
            return []
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(f"{_BASE_URL}/services", headers=self._headers())
            resp.raise_for_status()
            data: list[dict[str, Any]] = resp.json()
            return [self._parse_service(item.get("service", item)) for item in data]

    async def get_service(self, service_id: str) -> DeploymentStatus:
        if not self._available():
            return DeploymentStatus(
                service_id=service_id,
                service_name="unknown",
                state=DeployState.unknown,
                checked_at=datetime.now(tz=timezone.utc),
            )
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(f"{_BASE_URL}/services/{service_id}", headers=self._headers())
            resp.raise_for_status()
            return self._parse_service(resp.json())

    async def trigger_deploy(self, service_id: str) -> dict[str, Any]:
        if not self._available():
            raise RuntimeError("RENDER_API_KEY not configured.")
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.post(
                f"{_BASE_URL}/services/{service_id}/deploys",
                headers=self._headers(),
                json={"clearCache": "do_not_clear"},
            )
            resp.raise_for_status()
            return resp.json()

    @staticmethod
    def _parse_service(data: dict[str, Any]) -> DeploymentStatus:
        return DeploymentStatus(
            service_id=data.get("id", ""),
            service_name=data.get("name", ""),
            state=_map_state(data.get("serviceDetails", {}).get("env", data.get("state", "unknown"))),
            url=data.get("serviceDetails", {}).get("url") or data.get("url"),
            last_deploy_at=data.get("updatedAt"),
            checked_at=datetime.now(tz=timezone.utc),
        )
