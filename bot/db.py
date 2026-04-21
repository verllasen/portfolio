from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import aiosqlite

from bot.config import ContractTemplate


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass(slots=True)
class ActiveContractRecord:
    id: int
    contract_key: str
    contract_title: str
    user_id: int
    status: str
    taken_at: str
    submitted_at: str | None
    approved_at: str | None
    payout_amount: int


@dataclass(slots=True)
class PendingReviewRecord:
    active_contract_id: int
    report_id: int
    review_message_id: int
    review_channel_id: int
    contract_title: str
    author_id: int
    participants: str
    executed_at: str
    comment: str
    attachments_json: str
    payout_amount: int


class Database:
    def __init__(self, path: Path) -> None:
        self.path = path

    async def connect(self) -> aiosqlite.Connection:
        conn = await aiosqlite.connect(self.path)
        conn.row_factory = sqlite3.Row
        await conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    async def initialize(self, contracts: dict[str, ContractTemplate]) -> None:
        db = await self.connect()
        try:
            await db.executescript(
                """
                CREATE TABLE IF NOT EXISTS contracts (
                    contract_key TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    payout INTEGER NOT NULL DEFAULT 0,
                    category TEXT NOT NULL,
                    tier TEXT NOT NULL,
                    description TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS active_contracts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    contract_key TEXT NOT NULL REFERENCES contracts(contract_key),
                    user_id INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    taken_at TEXT NOT NULL,
                    submitted_at TEXT,
                    approved_at TEXT,
                    cancelled_at TEXT,
                    review_message_id INTEGER,
                    review_channel_id INTEGER,
                    payout_amount INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS reports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    active_contract_id INTEGER NOT NULL UNIQUE REFERENCES active_contracts(id) ON DELETE CASCADE,
                    author_id INTEGER NOT NULL,
                    participants TEXT NOT NULL,
                    executed_at TEXT NOT NULL,
                    comment TEXT NOT NULL,
                    attachments_json TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS review_actions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    active_contract_id INTEGER NOT NULL REFERENCES active_contracts(id) ON DELETE CASCADE,
                    reviewer_id INTEGER NOT NULL,
                    action TEXT NOT NULL,
                    reason TEXT,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS payouts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    active_contract_id INTEGER NOT NULL UNIQUE REFERENCES active_contracts(id) ON DELETE CASCADE,
                    recipient_id INTEGER NOT NULL,
                    amount INTEGER NOT NULL,
                    reviewer_id INTEGER NOT NULL,
                    created_at TEXT NOT NULL
                );
                """
            )

            await db.executemany(
                """
                INSERT INTO contracts (contract_key, title, payout, category, tier, description)
                VALUES (:contract_key, :title, :payout, :category, :tier, :description)
                ON CONFLICT(contract_key) DO UPDATE SET
                    title = excluded.title,
                    payout = excluded.payout,
                    category = excluded.category,
                    tier = excluded.tier,
                    description = excluded.description
                """,
                [
                    {
                        "contract_key": item.key,
                        "title": item.title,
                        "payout": item.payout,
                        "category": item.category,
                        "tier": item.tier,
                        "description": item.description,
                    }
                    for item in contracts.values()
                ],
            )
            await db.commit()
        finally:
            await db.close()

    async def get_active_count(self, user_id: int) -> int:
        db = await self.connect()
        try:
            cursor = await db.execute(
                "SELECT COUNT(*) AS amount FROM active_contracts WHERE user_id = ? AND status = 'ACTIVE'",
                (user_id,),
            )
            row = await cursor.fetchone()
            return int(row["amount"])
        finally:
            await db.close()

    async def create_active_contract(self, user_id: int, contract: ContractTemplate) -> int:
        db = await self.connect()
        try:
            cursor = await db.execute(
                """
                INSERT INTO active_contracts (contract_key, user_id, status, taken_at, payout_amount)
                VALUES (?, ?, 'ACTIVE', ?, ?)
                """,
                (contract.key, user_id, utc_now_iso(), contract.payout),
            )
            await db.commit()
            return int(cursor.lastrowid)
        finally:
            await db.close()

    async def get_active_contracts_for_user(self, user_id: int) -> list[ActiveContractRecord]:
        db = await self.connect()
        try:
            cursor = await db.execute(
                """
                SELECT ac.id, ac.contract_key, c.title AS contract_title, ac.user_id, ac.status,
                       ac.taken_at, ac.submitted_at, ac.approved_at, ac.payout_amount
                FROM active_contracts ac
                JOIN contracts c ON c.contract_key = ac.contract_key
                WHERE ac.user_id = ?
                ORDER BY ac.id DESC
                """,
                (user_id,),
            )
            rows = await cursor.fetchall()
            return [ActiveContractRecord(**dict(row)) for row in rows]
        finally:
            await db.close()

    async def get_open_contracts_for_user(self, user_id: int) -> list[ActiveContractRecord]:
        db = await self.connect()
        try:
            cursor = await db.execute(
                """
                SELECT ac.id, ac.contract_key, c.title AS contract_title, ac.user_id, ac.status,
                       ac.taken_at, ac.submitted_at, ac.approved_at, ac.payout_amount
                FROM active_contracts ac
                JOIN contracts c ON c.contract_key = ac.contract_key
                WHERE ac.user_id = ? AND ac.status = 'ACTIVE'
                ORDER BY ac.id DESC
                """,
                (user_id,),
            )
            rows = await cursor.fetchall()
            return [ActiveContractRecord(**dict(row)) for row in rows]
        finally:
            await db.close()

    async def create_report(
        self,
        active_contract_id: int,
        author_id: int,
        participants: str,
        executed_at: str,
        comment: str,
        attachments: list[str],
    ) -> int:
        now = utc_now_iso()
        db = await self.connect()
        try:
            cursor = await db.execute(
                """
                INSERT INTO reports (active_contract_id, author_id, participants, executed_at, comment, attachments_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (active_contract_id, author_id, participants, executed_at, comment, json.dumps(attachments), now),
            )
            await db.execute(
                "UPDATE active_contracts SET status = 'SUBMITTED', submitted_at = ? WHERE id = ?",
                (now, active_contract_id),
            )
            await db.commit()
            return int(cursor.lastrowid)
        finally:
            await db.close()

    async def link_review_message(self, active_contract_id: int, review_message_id: int, review_channel_id: int) -> None:
        db = await self.connect()
        try:
            await db.execute(
                """
                UPDATE active_contracts
                SET review_message_id = ?, review_channel_id = ?
                WHERE id = ?
                """,
                (review_message_id, review_channel_id, active_contract_id),
            )
            await db.commit()
        finally:
            await db.close()

    async def get_pending_review_by_message(self, review_message_id: int) -> PendingReviewRecord | None:
        db = await self.connect()
        try:
            cursor = await db.execute(
                """
                SELECT ac.id AS active_contract_id,
                       r.id AS report_id,
                       ac.review_message_id,
                       ac.review_channel_id,
                       c.title AS contract_title,
                       r.author_id,
                       r.participants,
                       r.executed_at,
                       r.comment,
                       r.attachments_json,
                       ac.payout_amount
                FROM active_contracts ac
                JOIN reports r ON r.active_contract_id = ac.id
                JOIN contracts c ON c.contract_key = ac.contract_key
                WHERE ac.review_message_id = ? AND ac.status = 'SUBMITTED'
                """,
                (review_message_id,),
            )
            row = await cursor.fetchone()
            return PendingReviewRecord(**dict(row)) if row else None
        finally:
            await db.close()

    async def approve_report(self, active_contract_id: int, reviewer_id: int) -> None:
        now = utc_now_iso()
        db = await self.connect()
        try:
            cursor = await db.execute(
                "SELECT user_id, payout_amount FROM active_contracts WHERE id = ?",
                (active_contract_id,),
            )
            row = await cursor.fetchone()
            if row is None:
                raise ValueError("Active contract not found.")

            await db.execute(
                "UPDATE active_contracts SET status = 'APPROVED', approved_at = ? WHERE id = ?",
                (now, active_contract_id),
            )
            await db.execute(
                """
                INSERT INTO review_actions (active_contract_id, reviewer_id, action, reason, created_at)
                VALUES (?, ?, 'APPROVED', NULL, ?)
                """,
                (active_contract_id, reviewer_id, now),
            )
            await db.execute(
                """
                INSERT OR REPLACE INTO payouts (active_contract_id, recipient_id, amount, reviewer_id, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (active_contract_id, int(row["user_id"]), int(row["payout_amount"]), reviewer_id, now),
            )
            await db.commit()
        finally:
            await db.close()

    async def reject_report(self, active_contract_id: int, reviewer_id: int, reason: str) -> None:
        db = await self.connect()
        try:
            await db.execute(
                "UPDATE active_contracts SET status = 'REJECTED' WHERE id = ?",
                (active_contract_id,),
            )
            await db.execute(
                """
                INSERT INTO review_actions (active_contract_id, reviewer_id, action, reason, created_at)
                VALUES (?, ?, 'REJECTED', ?, ?)
                """,
                (active_contract_id, reviewer_id, reason, utc_now_iso()),
            )
            await db.commit()
        finally:
            await db.close()

    async def get_stats_snapshot(self) -> dict[str, Any]:
        db = await self.connect()
        try:
            stats: dict[str, Any] = {}

            async def scalar(query: str) -> int:
                cursor = await db.execute(query)
                row = await cursor.fetchone()
                return int(row[0] or 0)

            stats["active"] = await scalar("SELECT COUNT(*) FROM active_contracts WHERE status = 'ACTIVE'")
            stats["submitted"] = await scalar("SELECT COUNT(*) FROM active_contracts WHERE status = 'SUBMITTED'")
            stats["approved"] = await scalar("SELECT COUNT(*) FROM active_contracts WHERE status = 'APPROVED'")
            stats["rejected"] = await scalar("SELECT COUNT(*) FROM active_contracts WHERE status = 'REJECTED'")
            stats["total_paid"] = await scalar("SELECT COALESCE(SUM(amount), 0) FROM payouts")

            cursor = await db.execute(
                """
                SELECT recipient_id, COUNT(*) AS accepted_count, COALESCE(SUM(amount), 0) AS total_amount
                FROM payouts
                GROUP BY recipient_id
                ORDER BY accepted_count DESC, total_amount DESC
                LIMIT 5
                """
            )
            rows = await cursor.fetchall()
            stats["top_members"] = [dict(row) for row in rows]
            return stats
        finally:
            await db.close()

    async def cancel_active_contract(self, contract_id: int) -> tuple[bool, int | None, str | None]:
        """
        Cancel only ACTIVE contracts.
        Returns: (success, user_id, contract_title)
        """
        db = await self.connect()
        try:
            cursor = await db.execute(
                """
                SELECT ac.user_id, c.title AS contract_title
                FROM active_contracts ac
                JOIN contracts c ON c.contract_key = ac.contract_key
                WHERE ac.id = ? AND ac.status = 'ACTIVE'
                """,
                (contract_id,),
            )
            row = await cursor.fetchone()
            if row is None:
                return (False, None, None)

            await db.execute(
                """
                UPDATE active_contracts
                SET status = 'CANCELLED', cancelled_at = ?
                WHERE id = ?
                """,
                (utc_now_iso(), contract_id),
            )
            await db.commit()
            return (True, int(row["user_id"]), str(row["contract_title"]))
        finally:
            await db.close()
