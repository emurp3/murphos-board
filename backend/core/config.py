"""
Application settings loaded from environment variables.
Missing optional vars emit a warning but never crash the process.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Supabase
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None

    # OpenAI
    openai_api_key: Optional[str] = None

    # GitHub
    github_token: Optional[str] = None

    # Render
    render_api_key: Optional[str] = None

    # Gmail (future phase)
    gmail_client_id: Optional[str] = None
    gmail_client_secret: Optional[str] = None

    # CORS — comma-separated list or wildcard
    cors_origins_raw: str = "*"

    @property
    def cors_origins(self) -> list[str]:
        if self.cors_origins_raw == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins_raw.split(",")]

    def warn_missing(self) -> None:
        required_for_full_operation = {
            "SUPABASE_URL": self.supabase_url,
            "SUPABASE_KEY": self.supabase_key,
            "OPENAI_API_KEY": self.openai_api_key,
            "GITHUB_TOKEN": self.github_token,
            "RENDER_API_KEY": self.render_api_key,
        }
        for name, val in required_for_full_operation.items():
            if not val:
                logger.warning("⚠️  %s is not set — related features will be degraded.", name)


settings = Settings()
settings.warn_missing()
