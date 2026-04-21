from __future__ import annotations

import asyncio
from collections import OrderedDict, defaultdict
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING, Any

import discord

from bot.ui.styles import Palette, make_embed

if TYPE_CHECKING:
    from bot.main import MajesticContractsBot

_MISSING = object()
_MESSAGE_CACHE_MAX = 3000


class AuditFeature:
    """Маршрутизация логов по каналам из config.yml."""

    def __init__(self, bot: "MajesticContractsBot") -> None:
        self.bot = bot
        self._invite_cache: dict[int, dict[str, int]] = defaultdict(dict)
        self._message_snapshots: OrderedDict[int, dict[str, Any]] = OrderedDict()
        self._voice_sessions: dict[tuple[int, int], datetime] = {}

    async def setup(self) -> None:
        for guild in self.bot.guilds:
            await self._refresh_invites(guild)

    def remember_message(self, message: discord.Message) -> None:
        if message.author.bot:
            return
        if not message.guild or not isinstance(message.channel, discord.TextChannel):
            return
        snapshot = {
            "author_id": message.author.id,
            "author_tag": str(message.author),
            "channel_id": message.channel.id,
            "guild_id": message.guild.id,
            "content": message.content or "",
            "attachments": [a.url for a in message.attachments],
            "embeds_count": len(message.embeds),
        }
        self._message_snapshots[message.id] = snapshot
        self._message_snapshots.move_to_end(message.id)
        while len(self._message_snapshots) > _MESSAGE_CACHE_MAX:
            self._message_snapshots.popitem(last=False)

    def update_message_cache(self, after: discord.Message) -> None:
        if after.id in self._message_snapshots:
            snap = self._message_snapshots[after.id]
            snap["content_before_edit"] = snap.get("content", "")
            snap["content"] = after.content or ""
            snap["attachments"] = [a.url for a in after.attachments]
            self._message_snapshots.move_to_end(after.id)

    async def log_message_created(self, message: discord.Message) -> None:
        """Каждое новое сообщение пользователя — в канал audit_messages."""
        cfg = self.bot.config
        if not cfg.audit_messages_channel_id:
            return
        if message.author.bot or not message.guild:
            return
        guild = message.guild
        body = (
            f"**Канал:** {message.channel.mention}\n"
            f"**Автор:** {message.author.mention} · `{message.author.id}`\n"
            f"**ID сообщения:** `{message.id}`"
        )
        embed = make_embed("Лог · новое сообщение", body, color=Palette.SUCCESS)
        text = (message.content or "")[:3500]
        if len((message.content or "")) > 3500:
            text = text[:3490] + "…"
        embed.add_field(name="Текст", value=text or "*(пусто / только вложения)*", inline=False)
        if message.attachments:
            embed.add_field(
                name="Вложения",
                value="\n".join(a.url for a in message.attachments[:8])[:1024],
                inline=False,
            )
        if message.embeds and not message.content:
            embed.add_field(name="Встроенные эмбеды", value=f"*{len(message.embeds)} шт.*", inline=False)
        await self._send(guild, cfg.audit_messages_channel_id, embed)

    async def _refresh_invites(self, guild: discord.Guild) -> None:
        if guild.me is None or not guild.me.guild_permissions.manage_guild:
            return
        try:
            invites = await guild.invites()
        except (discord.Forbidden, discord.HTTPException):
            return
        self._invite_cache[guild.id] = {invite.code: invite.uses or 0 for invite in invites}

    async def _fetch_text_channel(self, guild: discord.Guild, channel_id: int) -> discord.TextChannel | None:
        if channel_id <= 0:
            return None
        raw = self.bot.get_channel(channel_id)
        if isinstance(raw, discord.TextChannel):
            return raw
        try:
            fetched = await self.bot.fetch_channel(channel_id)
        except discord.HTTPException:
            return None
        return fetched if isinstance(fetched, discord.TextChannel) else None

    async def _send(self, guild: discord.Guild, channel_id: int, embed: discord.Embed) -> None:
        channel = await self._fetch_text_channel(guild, channel_id)
        if channel is None:
            return
        try:
            await channel.send(embed=embed)
        except discord.HTTPException:
            return

    def _target_label(self, target: Any) -> str:
        mention = getattr(target, "mention", None)
        if mention:
            return str(mention)
        name = getattr(target, "name", None)
        tid = getattr(target, "id", None)
        if name and tid:
            return f"**{name}** (`{tid}`)"
        if tid:
            return f"`{tid}`"
        return "`unknown`"

    async def on_invite_create_or_delete(self, guild: discord.Guild) -> None:
        await self._refresh_invites(guild)

    async def _resolve_join_invite(self, guild: discord.Guild, member: discord.Member) -> tuple[discord.Invite | None, discord.abc.User | None, int]:
        used_invite: discord.Invite | None = None
        inviter: discord.abc.User | None = None
        invite_uses = 0
        if guild.me and guild.me.guild_permissions.manage_guild:
            previous = self._invite_cache.get(guild.id, {})
            try:
                invites = await guild.invites()
            except discord.HTTPException:
                invites = []
            for invite in invites:
                old_uses = previous.get(invite.code, 0)
                current_uses = invite.uses or 0
                if current_uses > old_uses:
                    used_invite = invite
                    inviter = invite.inviter
                    invite_uses = current_uses
                    break
            self._invite_cache[guild.id] = {invite.code: invite.uses or 0 for invite in invites}
        return used_invite, inviter, invite_uses

    async def on_member_join(self, member: discord.Member) -> None:
        guild = member.guild
        cfg = self.bot.config
        used_invite, inviter, invite_uses = await self._resolve_join_invite(guild, member)

        if cfg.audit_join_channel_id:
            join_lines = [
                f"**Участник:** {member.mention} (`{member.id}`)",
                f"**Аккаунт создан:** <t:{int(member.created_at.timestamp())}:R>",
                f"**Зашёл:** <t:{int(datetime.now(timezone.utc).timestamp())}:F>",
            ]
            if inviter is not None and used_invite is not None:
                join_lines.append(f"**Пригласил:** {inviter.mention} (`{inviter.id}`)")
                join_lines.append(f"**Инвайт:** `{used_invite.code}` · использований: **{invite_uses}**")
            else:
                join_lines.append("**Пригласил:** не удалось определить (vanity / widget / отсутствие прав)")
            embed_join = make_embed("Аудит · вход на сервер", "\n".join(join_lines), color=Palette.SUCCESS)
            embed_join.set_thumbnail(url=member.display_avatar.url)
            await self._send(guild, cfg.audit_join_channel_id, embed_join)

        if cfg.member_welcome_channel_id:
            desc = (
                f"Добро пожаловать в **{guild.name}**, {member.mention}.\n"
                f"Ниже — карточка участника для главсостава."
            )
            welcome = make_embed("Новый участник · карточка", desc, color=Palette.CORSO_GOLD)
            welcome.set_thumbnail(url=member.display_avatar.url)
            welcome.add_field(name="ID", value=f"`{member.id}`", inline=True)
            welcome.add_field(name="Аккаунт Discord", value=f"<t:{int(member.created_at.timestamp())}:R>", inline=True)
            welcome.add_field(name="Участников на сервере", value=str(guild.member_count), inline=True)
            if inviter is not None and used_invite is not None:
                welcome.add_field(name="Инвайт", value=f"`{used_invite.code}`", inline=True)
                welcome.add_field(name="Пригласил", value=f"{inviter.mention}", inline=True)
                welcome.add_field(name="Счётчик инвайта", value=str(invite_uses), inline=True)
            roles = [r.mention for r in member.roles if r.name != "@everyone"][:12]
            welcome.add_field(
                name="Роли при входе",
                value=", ".join(roles) if roles else "—",
                inline=False,
            )
            await self._send(guild, cfg.member_welcome_channel_id, welcome)

    async def on_member_remove(self, member: discord.Member) -> None:
        cfg = self.bot.config
        if not cfg.member_leave_channel_id:
            return
        guild = member.guild
        await asyncio.sleep(2.0)

        kick_entry: discord.AuditLogEntry | None = None
        ban_entry: discord.AuditLogEntry | None = None
        try:
            async for entry in guild.audit_logs(limit=15):
                if datetime.now(timezone.utc) - entry.created_at > timedelta(seconds=15):
                    continue
                if getattr(entry.target, "id", None) != member.id:
                    continue
                if entry.action == discord.AuditLogAction.kick:
                    kick_entry = entry
                    break
                if entry.action == discord.AuditLogAction.ban:
                    ban_entry = entry
                    break
        except discord.Forbidden:
            pass

        actor_line = "—"
        reason_line = "—"
        if kick_entry is not None:
            actor = kick_entry.user
            actor_line = actor.mention if isinstance(actor, (discord.Member, discord.User)) else "Неизвестно"
            reason_line = (kick_entry.reason or "не указана")[:900]
            embed = make_embed(
                "Участник кикнут",
                f"**Кого:** {member.mention} (`{member.id}`)\n**Кикнул:** {actor_line}",
                color=Palette.DANGER,
            )
            embed.add_field(name="Причина", value=reason_line, inline=False)
            embed.set_thumbnail(url=member.display_avatar.url)
            await self._send(guild, cfg.member_leave_channel_id, embed)
            return

        if ban_entry is not None:
            actor = ban_entry.user
            actor_line = actor.mention if isinstance(actor, (discord.Member, discord.User)) else "Неизвестно"
            reason_line = (ban_entry.reason or "не указана")[:900]
            embed = make_embed(
                "Участник забанен",
                f"**Кого:** {member.mention} (`{member.id}`)\n**Забанил:** {actor_line}",
                color=Palette.DANGER,
            )
            embed.add_field(name="Причина", value=reason_line, inline=False)
            embed.set_thumbnail(url=member.display_avatar.url)
            await self._send(guild, cfg.member_leave_channel_id, embed)
            return

        embed = make_embed(
            "Участник покинул сервер",
            f"**Кто:** {member.mention} (`{member.id}`)\nСамостоятельный выход (кик/бан по журналу не найден за окно проверки).",
            color=Palette.WARNING,
        )
        embed.set_thumbnail(url=member.display_avatar.url)
        await self._send(guild, cfg.member_leave_channel_id, embed)

    async def on_voice_state_update(
        self,
        member: discord.Member,
        before: discord.VoiceState,
        after: discord.VoiceState,
    ) -> None:
        cfg = self.bot.config
        log_channel_id = cfg.voice_activity_log_channel_id
        if not log_channel_id:
            return
        guild = member.guild
        now = datetime.now(timezone.utc)

        if before.channel and before.channel != after.channel:
            key = (member.id, before.channel.id)
            started_at = self._voice_sessions.pop(key, None)
            if started_at is None:
                # fallback: session started before bot restart
                started_at = now
            duration = now - started_at
            spent_seconds = max(int(duration.total_seconds()), 0)
            minutes = spent_seconds // 60
            seconds = spent_seconds % 60
            leave_embed = make_embed(
                "Вышел из войса",
                f"**Участник:** {member.mention} (`{member.id}`)\n"
                f"**Канал:** {before.channel.mention}\n"
                f"**Просидел:** {minutes}м {seconds}с",
                color=Palette.WARNING,
            )
            await self._send(guild, log_channel_id, leave_embed)

        if after.channel and before.channel != after.channel:
            self._voice_sessions[(member.id, after.channel.id)] = now
            join_embed = make_embed(
                "Зашёл в войс",
                f"**Участник:** {member.mention} (`{member.id}`)\n**Канал:** {after.channel.mention}",
                color=Palette.SUCCESS,
            )
            await self._send(guild, log_channel_id, join_embed)

    async def on_message_delete(self, message: discord.Message) -> None:
        cfg = self.bot.config
        if not cfg.audit_messages_channel_id:
            return
        guild = message.guild
        if guild is None:
            return
        snap = self._message_snapshots.pop(message.id, None)
        content = snap["content"] if snap else "(не было в кэше бота — сообщение старое или бот перезапускался)"
        author_tag = snap["author_tag"] if snap else str(message.author)
        author_id = snap["author_id"] if snap else message.author.id
        attachments = snap["attachments"] if snap else [a.url for a in message.attachments]
        deleted_by_line = "Не удалось определить (возможно удалил автор или бот без записи в аудит-логе)."

        await asyncio.sleep(1.0)
        try:
            async for entry in guild.audit_logs(limit=20, action=discord.AuditLogAction.message_delete):
                if datetime.now(timezone.utc) - entry.created_at > timedelta(seconds=15):
                    continue
                target_id = getattr(entry.target, "id", None)
                if target_id is not None and target_id != author_id:
                    continue
                extra_channel = getattr(entry.extra, "channel", None)
                if extra_channel is not None and getattr(extra_channel, "id", None) != message.channel.id:
                    continue
                actor = entry.user
                if isinstance(actor, (discord.Member, discord.User)):
                    deleted_by_line = f"{actor.mention} (`{actor.id}`)"
                else:
                    deleted_by_line = "Неизвестно"
                break
        except (discord.Forbidden, discord.HTTPException):
            pass

        body = (
            f"**Канал:** {message.channel.mention}\n"
            f"**Автор:** <@{author_id}> · {author_tag}\n"
            f"**Удалил:** {deleted_by_line}\n"
            f"**ID сообщения:** `{message.id}`"
        )
        embed = make_embed("Аудит · удаление сообщения", body, color=Palette.DANGER)
        text = content[:3500] if len(content) <= 3500 else content[:3490] + "…"
        embed.add_field(name="Текст", value=text or "*(пусто)*", inline=False)
        if attachments:
            embed.add_field(name="Вложения", value="\n".join(attachments[:8])[:1024], inline=False)
        await self._send(guild, cfg.audit_messages_channel_id, embed)

    async def on_message_edit(self, before: discord.Message, after: discord.Message) -> None:
        cfg = self.bot.config
        if not cfg.audit_messages_channel_id:
            return
        if before.author.bot or not before.guild:
            return
        if before.content == after.content and before.attachments == after.attachments:
            return
        guild = before.guild
        old = before.content or "*(пусто)*"
        new = after.content or "*(пусто)*"
        embed = make_embed(
            "Аудит · редактирование сообщения",
            f"**Канал:** {before.channel.mention}\n**Автор:** {before.author.mention}\n**ID:** `{before.id}`",
            color=Palette.WARNING,
        )
        embed.add_field(name="Было", value=old[:1024], inline=False)
        embed.add_field(name="Стало", value=new[:1024], inline=False)
        await self._send(guild, cfg.audit_messages_channel_id, embed)

    async def on_audit_log_entry_create(self, entry: discord.AuditLogEntry) -> None:
        guild = entry.guild
        cfg = self.bot.config
        actor = entry.user
        target = entry.target
        created_at = entry.created_at or datetime.now(timezone.utc)
        if datetime.now(timezone.utc) - created_at > timedelta(minutes=5):
            return

        actor_line = actor.mention if isinstance(actor, (discord.Member, discord.User)) else "Неизвестно"
        target_line = getattr(target, "mention", None) or f"`{getattr(target, 'id', 'unknown')}`"
        server_log_channel_id = cfg.server_audit_channel_id

        if entry.action == discord.AuditLogAction.member_role_update and cfg.audit_roles_channel_id:
            embed = make_embed(
                "Аудит · роли",
                f"**Кто выдал/снял:** {actor_line}\n**Участник:** {target_line}",
                color=Palette.INFO,
            )
            if entry.reason:
                embed.add_field(name="Причина", value=entry.reason[:1024], inline=False)
            added_roles = [role.mention for role in entry.after.roles if role not in entry.before.roles]
            removed_roles = [role.mention for role in entry.before.roles if role not in entry.after.roles]
            if added_roles:
                embed.add_field(name="Выданные роли", value=", ".join(added_roles)[:1024], inline=False)
            if removed_roles:
                embed.add_field(name="Снятые роли", value=", ".join(removed_roles)[:1024], inline=False)
            await self._send(guild, cfg.audit_roles_channel_id, embed)
            if server_log_channel_id:
                await self._send(guild, server_log_channel_id, embed)
            return

        if entry.action == discord.AuditLogAction.member_update and cfg.audit_roles_channel_id:
            before_timeout = getattr(entry.before, "timed_out_until", None)
            after_timeout = getattr(entry.after, "timed_out_until", None)
            if before_timeout != after_timeout:
                embed = make_embed(
                    "Аудит · таймаут (мут)",
                    f"**Модератор:** {actor_line}\n**Участник:** {target_line}",
                    color=Palette.WARNING,
                )
                if entry.reason:
                    embed.add_field(name="Причина", value=entry.reason[:1024], inline=False)
                if after_timeout:
                    embed.add_field(
                        name="Действие",
                        value=f"Выдан до <t:{int(after_timeout.timestamp())}:F>",
                        inline=False,
                    )
                else:
                    embed.add_field(name="Действие", value="Таймаут снят", inline=False)
                await self._send(guild, cfg.audit_roles_channel_id, embed)
                if server_log_channel_id:
                    await self._send(guild, server_log_channel_id, embed)
                return

            before_nick = getattr(entry.before, "nick", _MISSING)
            after_nick = getattr(entry.after, "nick", _MISSING)
            if before_nick is not _MISSING or after_nick is not _MISSING:
                if before_nick != after_nick:
                    old_nick = "*(никнейм сервера не был установлен)*" if before_nick is None else str(before_nick)
                    new_nick = "*(снят)*" if after_nick is None else str(after_nick)
                    embed = make_embed(
                        "Аудит · смена никнейма",
                        f"**Кто изменил:** {actor_line}\n**Участник:** {target_line}",
                        color=Palette.CORSO_TEAL,
                    )
                    embed.add_field(name="Было", value=old_nick[:1024], inline=False)
                    embed.add_field(name="Стало", value=new_nick[:1024], inline=False)
                    await self._send(guild, cfg.audit_roles_channel_id, embed)
                    if server_log_channel_id:
                        await self._send(guild, server_log_channel_id, embed)
            return

        if entry.action == discord.AuditLogAction.unban and cfg.audit_roles_channel_id:
            embed = make_embed(
                "Аудит · разбан",
                f"**Кто:** {actor_line}\n**Цель:** {target_line}",
                color=Palette.SUCCESS,
            )
            if entry.reason:
                embed.add_field(name="Причина", value=entry.reason[:1024], inline=False)
            await self._send(guild, cfg.audit_roles_channel_id, embed)
            if server_log_channel_id:
                await self._send(guild, server_log_channel_id, embed)
            return

        overwrite_create = getattr(discord.AuditLogAction, "overwrite_create", None)
        overwrite_update = getattr(discord.AuditLogAction, "overwrite_update", None)
        overwrite_delete = getattr(discord.AuditLogAction, "overwrite_delete", None)
        server_actions = {
            discord.AuditLogAction.channel_create: "создан канал",
            discord.AuditLogAction.channel_update: "изменён канал",
            discord.AuditLogAction.channel_delete: "удалён канал",
            discord.AuditLogAction.role_create: "создана роль",
            discord.AuditLogAction.role_update: "изменена роль",
            discord.AuditLogAction.role_delete: "удалена роль",
        }
        if overwrite_create is not None:
            server_actions[overwrite_create] = "добавлены права доступа"
        if overwrite_update is not None:
            server_actions[overwrite_update] = "изменены права доступа"
        if overwrite_delete is not None:
            server_actions[overwrite_delete] = "удалены права доступа"

        if server_log_channel_id and entry.action in server_actions:
            color = Palette.INFO
            if entry.action in (discord.AuditLogAction.channel_delete, discord.AuditLogAction.role_delete):
                color = Palette.DANGER
            if entry.action in (discord.AuditLogAction.channel_create, discord.AuditLogAction.role_create):
                color = Palette.SUCCESS
            embed = make_embed(
                f"Серверный лог · {server_actions.get(entry.action, 'действие')}",
                f"**Модератор:** {actor_line}\n**Цель:** {self._target_label(target)}",
                color=color,
            )
            if entry.reason:
                embed.add_field(name="Причина", value=entry.reason[:1024], inline=False)
            before_name = getattr(entry.before, "name", _MISSING)
            after_name = getattr(entry.after, "name", _MISSING)
            if before_name is not _MISSING and after_name is not _MISSING and before_name != after_name:
                embed.add_field(name="Название", value=f"`{before_name}` -> `{after_name}`", inline=False)

            before_overwrites = getattr(entry.before, "overwrites", _MISSING)
            after_overwrites = getattr(entry.after, "overwrites", _MISSING)
            if before_overwrites is not _MISSING or after_overwrites is not _MISSING:
                overwrite_target = getattr(entry.extra, "target", None)
                overwrite_channel = getattr(entry.extra, "channel", None)
                allow = getattr(after_overwrites, "pair", lambda: (discord.Permissions.none(), discord.Permissions.none()))()[0]
                deny = getattr(after_overwrites, "pair", lambda: (discord.Permissions.none(), discord.Permissions.none()))()[1]
                allow_names = [name for name, val in allow if val]
                deny_names = [name for name, val in deny if val]
                if overwrite_target is not None:
                    embed.add_field(name="Кому доступ", value=self._target_label(overwrite_target), inline=False)
                if overwrite_channel is not None:
                    embed.add_field(name="Канал", value=self._target_label(overwrite_channel), inline=False)
                if allow_names:
                    embed.add_field(name="Разрешено", value=", ".join(allow_names)[:1024], inline=False)
                if deny_names:
                    embed.add_field(name="Запрещено", value=", ".join(deny_names)[:1024], inline=False)

            await self._send(guild, server_log_channel_id, embed)
