"""
Pydantic v2 models shared across the S.A. API.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ─────────────────────────────────────────────
# Enumerations
# ─────────────────────────────────────────────

class TaskStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    done = "done"
    blocked = "blocked"
    cancelled = "cancelled"


class TaskPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class AgentStatus(str, Enum):
    online = "online"
    idle = "idle"
    warning = "warning"
    offline = "offline"


class AlertLevel(str, Enum):
    info = "info"
    warning = "warning"
    critical = "critical"


class DeployState(str, Enum):
    live = "live"
    build_in_progress = "build_in_progress"
    deactivated = "deactivated"
    failed = "failed"
    unknown = "unknown"


# ─────────────────────────────────────────────
# Task
# ─────────────────────────────────────────────

class TaskCreate(BaseModel):
    agent_id: str
    title: str
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.medium


class Task(BaseModel):
    id: UUID
    agent_id: str
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.pending
    priority: TaskPriority = TaskPriority.medium
    created_at: datetime
    updated_at: datetime


# ─────────────────────────────────────────────
# Agent
# ─────────────────────────────────────────────

class AgentInfo(BaseModel):
    id: str
    name: str
    domain: str
    status: AgentStatus = AgentStatus.idle
    last_activity: Optional[datetime] = None
    active_tasks: int = 0
    description: str = ""


class AgentReport(BaseModel):
    id: Optional[UUID] = None
    agent_id: str
    period: str  # e.g. "2024-05-14"
    summary: str
    metrics: dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None


# ─────────────────────────────────────────────
# Memory
# ─────────────────────────────────────────────

class MemoryEntryCreate(BaseModel):
    category: str
    content: str
    tags: list[str] = Field(default_factory=list)


class MemoryEntry(BaseModel):
    id: UUID
    category: str
    content: str
    tags: list[str] = Field(default_factory=list)
    created_at: datetime


# ─────────────────────────────────────────────
# Deployment
# ─────────────────────────────────────────────

class DeploymentStatus(BaseModel):
    service_id: str
    service_name: str
    state: DeployState
    url: Optional[str] = None
    last_deploy_at: Optional[datetime] = None
    checked_at: datetime = Field(default_factory=datetime.utcnow)


# ─────────────────────────────────────────────
# Alerts
# ─────────────────────────────────────────────

class AlertItem(BaseModel):
    id: Optional[UUID] = None
    level: AlertLevel
    message: str
    source: str
    resolved: bool = False
    created_at: Optional[datetime] = None


# ─────────────────────────────────────────────
# Reports
# ─────────────────────────────────────────────

class DailyBrief(BaseModel):
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    summary: str
    agent_highlights: list[dict[str, Any]] = Field(default_factory=list)
    active_alerts: int = 0
    open_tasks: int = 0
    deployments_healthy: int = 0
    deployments_degraded: int = 0


class EcosystemReport(BaseModel):
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    agents: list[AgentInfo] = Field(default_factory=list)
    deployments: list[DeploymentStatus] = Field(default_factory=list)
    alerts: list[AlertItem] = Field(default_factory=list)
    open_tasks: int = 0
    summary: Optional[str] = None


# ─────────────────────────────────────────────
# Generic API response wrapper
# ─────────────────────────────────────────────

class APIError(BaseModel):
    error: str
    detail: Optional[str] = None
    code: int = 500
