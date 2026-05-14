"""
Supabase client singleton.
Returns None if credentials are not configured so the app stays bootable.
"""

from __future__ import annotations

import logging
from typing import Optional

from supabase import Client, create_client

from core.config import settings

logger = logging.getLogger(__name__)

_client: Optional[Client] = None


def get_supabase() -> Optional[Client]:
    global _client
    if _client is not None:
        return _client
    if not settings.supabase_url or not settings.supabase_key:
        logger.warning("Supabase credentials missing — DB operations unavailable.")
        return None
    try:
        _client = create_client(settings.supabase_url, settings.supabase_key)
        logger.info("Supabase client initialised.")
    except Exception as exc:
        logger.error("Failed to initialise Supabase client: %s", exc)
        return None
    return _client
