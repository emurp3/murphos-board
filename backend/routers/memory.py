"""
Memory Engine routes.
  GET  /api/memory            — list entries
  POST /api/memory            — create entry
  GET  /api/memory/search?q=  — text search
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query

from core.supabase_client import get_supabase
from models.schemas import MemoryEntry, MemoryEntryCreate

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=list[MemoryEntry])
async def list_memory(
    category: str | None = Query(default=None),
    limit: int = Query(default=50, le=200),
) -> list[MemoryEntry]:
    """List memory entries, optionally filtered by category."""
    db = get_supabase()
    if not db:
        return []
    try:
        q = db.table("memory_entries").select("*").order("created_at", desc=True).limit(limit)
        if category:
            q = q.eq("category", category)
        result = q.execute()
        return [MemoryEntry(**row) for row in (result.data or [])]
    except Exception as exc:
        logger.error("Failed to list memory entries: %s", exc)
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")


@router.post("", response_model=MemoryEntry, status_code=201)
async def create_memory(payload: MemoryEntryCreate) -> MemoryEntry:
    """Persist a new memory entry."""
    db = get_supabase()
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    now = datetime.now(tz=timezone.utc)
    entry_id = uuid4()

    row = {
        "id": str(entry_id),
        "category": payload.category,
        "content": payload.content,
        "tags": payload.tags,
        "created_at": now.isoformat(),
    }

    try:
        db.table("memory_entries").insert(row).execute()
    except Exception as exc:
        logger.error("Failed to create memory entry: %s", exc)
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")

    return MemoryEntry(id=entry_id, category=payload.category, content=payload.content, tags=payload.tags, created_at=now)


@router.get("/search", response_model=list[MemoryEntry])
async def search_memory(
    q: str = Query(..., min_length=1),
    limit: int = Query(default=20, le=100),
) -> list[MemoryEntry]:
    """Full-text search over memory entry content."""
    db = get_supabase()
    if not db:
        return []
    try:
        result = (
            db.table("memory_entries")
            .select("*")
            .ilike("content", f"%{q}%")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return [MemoryEntry(**row) for row in (result.data or [])]
    except Exception as exc:
        logger.error("Memory search failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")
