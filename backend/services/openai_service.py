"""
OpenAI wrapper for report generation and task routing.
Falls back gracefully if OPENAI_API_KEY is not configured.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from core.config import settings

logger = logging.getLogger(__name__)

_AGENTS = ["hunter", "leon", "sapp", "ao", "optix", "ninja"]


class OpenAIService:
    def __init__(self) -> None:
        self._client: Any = None
        if settings.openai_api_key:
            try:
                from openai import AsyncOpenAI
                self._client = AsyncOpenAI(api_key=settings.openai_api_key)
            except Exception as exc:
                logger.error("Failed to init OpenAI client: %s", exc)

    async def _chat(self, system: str, user: str, max_tokens: int = 500) -> str:
        if not self._client:
            logger.warning("OpenAI not configured — returning fallback text.")
            return "[OpenAI not configured — add OPENAI_API_KEY to enable AI summaries]"
        try:
            response = await self._client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                max_tokens=max_tokens,
                temperature=0.4,
            )
            return response.choices[0].message.content or ""
        except Exception as exc:
            logger.error("OpenAI chat completion failed: %s", exc)
            return f"[AI summary unavailable: {exc}]"

    async def generate_daily_brief(self, context: dict[str, Any]) -> str:
        system = (
            "You are S.A., the Executive AI Chief of Staff for the MurphBoard ecosystem. "
            "Write a concise, punchy daily briefing in 3-5 sentences covering operational health, "
            "open priorities, and any risks. Tone: confident, direct, executive-level."
        )
        user = (
            f"Today's status:\n"
            f"- Open tasks: {context.get('open_tasks', 0)}\n"
            f"- Active alerts: {context.get('active_alerts', 0)}\n"
            f"- Deployments healthy: {context.get('deployments_healthy', 0)}, "
            f"degraded: {context.get('deployments_degraded', 0)}\n"
            f"- Agent highlights: {json.dumps(context.get('agent_highlights', []))}\n"
            "Generate the daily executive briefing."
        )
        return await self._chat(system, user, max_tokens=300)

    async def generate_ecosystem_summary(self, context: dict[str, Any]) -> str:
        system = (
            "You are S.A., Executive AI Chief of Staff. "
            "Write a 2-3 sentence ecosystem health summary for the MurphBoard platform."
        )
        user = (
            f"Ecosystem snapshot: {context.get('agents', 0)} agents, "
            f"{context.get('deployments', 0)} deployments, "
            f"{context.get('alerts', 0)} active alerts. Summarise health."
        )
        return await self._chat(system, user, max_tokens=200)

    async def route_task(self, task_title: str, task_description: str) -> str:
        """Suggest the best agent to handle a given task."""
        system = (
            "You are S.A. routing tasks to the correct agent. "
            f"Available agents: {', '.join(_AGENTS)}. "
            "Respond with ONLY the agent id (e.g. 'hunter'), no explanation."
        )
        user = f"Task: {task_title}\nDescription: {task_description or 'N/A'}"
        result = await self._chat(system, user, max_tokens=10)
        result = result.strip().lower()
        return result if result in _AGENTS else "ao"
