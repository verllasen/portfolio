from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml
from dotenv import load_dotenv


@dataclass(slots=True)
class ContractTemplate:
    key: str
    title: str
    payout: int
    category: str
    tier: str
    description: str


@dataclass(slots=True)
class BotConfig:
    token: str
    guild_id: int
    contracts_channel_id: int
    review_channel_id: int
    payouts_channel_id: int
    # Аудит и уведомления (разные каналы)
    audit_roles_channel_id: int
    audit_messages_channel_id: int
    audit_join_channel_id: int
    member_welcome_channel_id: int
    member_leave_channel_id: int
    voice_activity_log_channel_id: int
    server_audit_channel_id: int
    # Повышение: команда только в «staff» канале, панель — в публичном, заявки — в ревью
    promotion_setup_command_channel_id: int
    promotion_public_channel_id: int
    promotion_review_channel_id: int
    # Заявки в семью: ревью с кнопками (панель — !setup_family в любом текстовом канале)
    family_application_review_channel_id: int
    # ID голосовых каналов — ссылки в ЛС при «Взять на рассмотрение» по заявке в семью
    family_review_voice_channel_ids: list[int]
    staff_role_ids: list[int]
    # Доп. роли с правами команд (!setup_*, кнопки модерации заявок и т.д.)
    operator_role_ids: list[int]
    contractor_role_ids: list[int]
    max_active_contracts_per_user: int
    timezone_label: str
    currency_name: str
    database_path: Path
    contracts: dict[str, ContractTemplate]


def _require_int(raw: Any, key: str) -> int:
    try:
        value = int(raw)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Config value `{key}` must be an integer.") from exc
    return value


def load_config(base_path: Path | None = None) -> BotConfig:
    root = base_path or Path(__file__).resolve().parent.parent
    env_path = root / ".env"
    load_dotenv(env_path if env_path.exists() else None)

    token = os.getenv("DISCORD_TOKEN", "").strip()
    if not token:
        raise ValueError("Missing DISCORD_TOKEN in .env file.")

    config_path = root / "config.yml"
    if not config_path.exists():
        raise FileNotFoundError("config.yml not found in project root.")

    with config_path.open("r", encoding="utf-8") as file:
        data = yaml.safe_load(file) or {}

    raw_contracts = data.get("contracts", {})
    contracts: dict[str, ContractTemplate] = {}
    for key, payload in raw_contracts.items():
        contracts[key] = ContractTemplate(
            key=key,
            title=str(payload.get("title", key)),
            payout=int(payload.get("payout", 0)),
            category=str(payload.get("category", "Контракт")),
            tier=str(payload.get("tier", "-")),
            description=str(payload.get("description", "Без описания.")),
        )

    staff_ids = [_require_int(role_id, "staff_role_ids[]") for role_id in data.get("staff_role_ids", [])]
    operator_ids = [_require_int(role_id, "operator_role_ids[]") for role_id in data.get("operator_role_ids", [])]
    contractor_ids = [_require_int(role_id, "contractor_role_ids[]") for role_id in data.get("contractor_role_ids", [])]

    promotion_public = _require_int(data.get("promotion_public_channel_id", 0), "promotion_public_channel_id")
    if promotion_public == 0 and data.get("promotion_channel_id") is not None:
        promotion_public = _require_int(data.get("promotion_channel_id", 0), "promotion_channel_id")

    return BotConfig(
        token=token,
        guild_id=_require_int(data.get("guild_id"), "guild_id"),
        contracts_channel_id=_require_int(data.get("contracts_channel_id"), "contracts_channel_id"),
        review_channel_id=_require_int(data.get("review_channel_id"), "review_channel_id"),
        payouts_channel_id=_require_int(data.get("payouts_channel_id"), "payouts_channel_id"),
        audit_roles_channel_id=_require_int(data.get("audit_roles_channel_id", 0), "audit_roles_channel_id"),
        audit_messages_channel_id=_require_int(data.get("audit_messages_channel_id", 0), "audit_messages_channel_id"),
        audit_join_channel_id=_require_int(data.get("audit_join_channel_id", 0), "audit_join_channel_id"),
        member_welcome_channel_id=_require_int(data.get("member_welcome_channel_id", 0), "member_welcome_channel_id"),
        member_leave_channel_id=_require_int(data.get("member_leave_channel_id", 0), "member_leave_channel_id"),
        voice_activity_log_channel_id=_require_int(data.get("voice_activity_log_channel_id", 0), "voice_activity_log_channel_id"),
        server_audit_channel_id=_require_int(data.get("server_audit_channel_id", 0), "server_audit_channel_id"),
        promotion_setup_command_channel_id=_require_int(
            data.get("promotion_setup_command_channel_id", 0),
            "promotion_setup_command_channel_id",
        ),
        promotion_public_channel_id=promotion_public,
        promotion_review_channel_id=_require_int(data.get("promotion_review_channel_id", 0), "promotion_review_channel_id"),
        family_application_review_channel_id=_require_int(
            data.get("family_application_review_channel_id", 0),
            "family_application_review_channel_id",
        ),
        family_review_voice_channel_ids=[
            _require_int(cid, "family_review_voice_channel_ids[]")
            for cid in data.get("family_review_voice_channel_ids", [])
        ],
        staff_role_ids=staff_ids,
        operator_role_ids=operator_ids,
        contractor_role_ids=contractor_ids,
        max_active_contracts_per_user=max(
            1, _require_int(data.get("max_active_contracts_per_user", 1), "max_active_contracts_per_user")
        ),
        timezone_label=str(data.get("timezone_label", "Europe/Moscow")),
        currency_name=str(data.get("currency_name", "$")),
        database_path=root / "contracts.db",
        contracts=contracts,
    )
