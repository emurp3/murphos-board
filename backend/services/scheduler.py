"""
APScheduler setup.
  - Health check: every 5 minutes
  - Daily report: 6 AM ET every day
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


# ─────────────────────────────────────────────
# Job functions
# ─────────────────────────────────────────────

async def _health_check_job() -> None:
    """Ping all Render services and persist status to Supabase."""
    from services.render_service import RenderService
    from core.supabase_client import get_supabase

    logger.info("[scheduler] Running health check at %s", datetime.now(tz=timezone.utc).isoformat())
    render = RenderService()
    db = get_supabase()

    try:
        services = await render.list_services()
        if db:
            rows = [
                {
                    "service_name": s.service_name,
                    "status": s.state.value,
                    "checked_at": s.checked_at.isoformat(),
                    "details": {"service_id": s.service_id, "url": s.url},
                }
                for s in services
            ]
            for row in rows:
                db.table("deployment_logs").insert(row).execute()
            logger.info("[scheduler] Logged %d deployment statuses.", len(rows))
    except Exception as exc:
        logger.error("[scheduler] Health check failed: %s", exc)


async def _daily_report_job() -> None:
    """Generate and persist the daily briefing at 6 AM ET."""
    from routers.reports import daily_brief
    from core.supabase_client import get_supabase
    from uuid import uuid4
    from datetime import datetime, timezone

    logger.info("[scheduler] Generating daily report…")
    try:
        brief = await daily_brief()
        db = get_supabase()
        if db:
            db.table("reports").insert({
                "id": str(uuid4()),
                "type": "daily",
                "content": brief.model_dump_json(),
                "generated_at": brief.generated_at.isoformat(),
            }).execute()
        logger.info("[scheduler] Daily report persisted.")
    except Exception as exc:
        logger.error("[scheduler] Daily report job failed: %s", exc)


# ─────────────────────────────────────────────
# Lifecycle
# ─────────────────────────────────────────────

def start_scheduler() -> None:
    global _scheduler
    _scheduler = AsyncIOScheduler(timezone="America/New_York")

    _scheduler.add_job(
        _health_check_job,
        trigger=IntervalTrigger(minutes=5),
        id="health_check",
        name="Deployment Health Check",
        replace_existing=True,
    )

    _scheduler.add_job(
        _daily_report_job,
        trigger=CronTrigger(hour=6, minute=0, timezone="America/New_York"),
        id="daily_report",
        name="Daily Executive Briefing",
        replace_existing=True,
    )

    _scheduler.start()
    logger.info("APScheduler started with %d jobs.", len(_scheduler.get_jobs()))


def shutdown_scheduler() -> None:
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("APScheduler shut down.")
