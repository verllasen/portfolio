from __future__ import annotations

import logging
import os
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import discord
from discord.ext import commands

from bot.config import BotConfig, load_config
from bot.db import Database
from bot.features.audit import AuditFeature
from bot.features.contracts import ContractsFeature
from bot.features.family import FamilyJoinFeature
from bot.features.promotion import PromotionFeature
from bot.features.reports import ReportsFeature
from bot.features.review import ReviewFeature
from bot.ui.styles import Palette, make_embed

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("majestic-contracts-bot")


class _HealthcheckHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        if self.path in ("/", "/health"):
            payload = b"ok"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        self.send_response(404)
        self.end_headers()

    def log_message(self, format: str, *args: object) -> None:
        return


def _start_healthcheck_server() -> None:
    port_raw = os.getenv("PORT", "10000")
    try:
        port = int(port_raw)
    except ValueError:
        port = 10000
    server = ThreadingHTTPServer(("0.0.0.0", port), _HealthcheckHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True, name="healthcheck-server")
    thread.start()
    logger.info("Healthcheck server listening on :%s", port)


class MajesticContractsBot(commands.Bot):
    def __init__(self, config: BotConfig) -> None:
        intents = discord.Intents.default()
        intents.message_content = True
        intents.guilds = True
        intents.members = True
        intents.messages = True
        intents.voice_states = True

        super().__init__(
            command_prefix="!",
            intents=intents,
            activity=discord.CustomActivity(name="CORSO · контракты · семья · аудит"),
        )
        self.config = config
        self.db = Database(config.database_path)
        self.contracts_feature = ContractsFeature(self)
        self.reports_feature = ReportsFeature(self)
        self.review_feature = ReviewFeature(self)
        self.audit_feature = AuditFeature(self)
        self.promotion_feature = PromotionFeature(self)
        self.family_feature = FamilyJoinFeature(self)

    def user_has_any_role(self, user: discord.abc.User, required_role_ids: list[int]) -> bool:
        if not required_role_ids:
            return True
        if not isinstance(user, discord.Member):
            return False
        user_roles = {role.id for role in user.roles}
        return any(role_id in user_roles for role_id in required_role_ids)

    def privileged_role_ids(self) -> list[int]:
        return list(dict.fromkeys(self.config.staff_role_ids + self.config.operator_role_ids))

    def user_has_privilege(self, user: discord.abc.User) -> bool:
        return self.user_has_any_role(user, self.privileged_role_ids())

    async def setup_hook(self) -> None:
        await self.db.initialize(self.config.contracts)
        self.add_view(self.contracts_feature.create_control_view())
        self.add_view(self.review_feature.create_review_view())
        self.add_view(self.promotion_feature.create_panel_view())
        self.add_view(self.promotion_feature.create_decision_view())
        self.add_view(self.family_feature.create_panel_view())
        self.add_view(self.family_feature.create_decision_view())
        self.add_view(self.family_feature.create_finalize_view())
        await self.audit_feature.setup()

        if self.config.guild_id > 0:
            guild = discord.Object(id=self.config.guild_id)
            self.tree.copy_global_to(guild=guild)
            await self.tree.sync(guild=guild)
            logger.info("Application commands synced to guild %s", self.config.guild_id)
        else:
            await self.tree.sync()
            logger.warning("guild_id is not configured, commands were synced globally.")

    async def on_ready(self) -> None:
        await self.change_presence(activity=discord.CustomActivity(name="CORSO · контракты · семья · аудит"))
        logger.info("Logged in as %s (%s)", self.user, self.user.id if self.user else "unknown")

    async def on_message(self, message: discord.Message) -> None:
        if message.author.bot:
            return

        self.audit_feature.remember_message(message)
        await self.audit_feature.log_message_created(message)

        try:
            handled = await self.reports_feature.try_consume_report_message(message)
            if handled:
                return
        except Exception as exc:
            logger.exception("Failed to process report message: %s", exc)
            warning = make_embed(
                "Ошибка обработки отчёта",
                "Не удалось обработать отчёт. Проверьте настройки каналов и попробуйте ещё раз.",
                color=Palette.DANGER,
            )
            await message.reply(embed=warning, mention_author=False)
            return

        await self.process_commands(message)

    async def on_member_join(self, member: discord.Member) -> None:
        await self.audit_feature.on_member_join(member)

    async def on_member_remove(self, member: discord.Member) -> None:
        await self.audit_feature.on_member_remove(member)

    async def on_invite_create(self, invite: discord.Invite) -> None:
        await self.audit_feature.on_invite_create_or_delete(invite.guild)

    async def on_invite_delete(self, invite: discord.Invite) -> None:
        await self.audit_feature.on_invite_create_or_delete(invite.guild)

    async def on_audit_log_entry_create(self, entry: discord.AuditLogEntry) -> None:
        await self.audit_feature.on_audit_log_entry_create(entry)

    async def on_message_delete(self, message: discord.Message) -> None:
        await self.audit_feature.on_message_delete(message)

    async def on_message_edit(self, before: discord.Message, after: discord.Message) -> None:
        self.audit_feature.update_message_cache(after)
        await self.audit_feature.on_message_edit(before, after)

    async def on_voice_state_update(
        self, member: discord.Member, before: discord.VoiceState, after: discord.VoiceState
    ) -> None:
        await self.audit_feature.on_voice_state_update(member, before, after)


def register_commands(bot: MajesticContractsBot) -> None:
    @bot.command(name="setup_post")
    async def setup_post_prefix(ctx: commands.Context) -> None:
        if not bot.user_has_privilege(ctx.author):
            await ctx.reply("Эта команда доступна только главсоставу.")
            return
        interaction_like = _ContextInteractionAdapter(ctx)
        await bot.contracts_feature.post_control_panel(interaction_like)

    @bot.command(name="stats")
    async def stats_prefix(ctx: commands.Context) -> None:
        if not bot.user_has_privilege(ctx.author):
            await ctx.reply("Эта команда доступна только главсоставу.")
            return
        snapshot = await bot.db.get_stats_snapshot()
        embed = make_embed("Статистика семьи", "Актуальный срез по контрактам и выплатам.", color=Palette.INFO)
        embed.add_field(name="Активные", value=str(snapshot["active"]), inline=True)
        embed.add_field(name="На проверке", value=str(snapshot["submitted"]), inline=True)
        embed.add_field(name="Принято", value=str(snapshot["approved"]), inline=True)
        embed.add_field(name="Отклонено", value=str(snapshot["rejected"]), inline=True)
        embed.add_field(name="Всего выплачено", value=f'{snapshot["total_paid"]} {bot.config.currency_name}', inline=True)

        top_members = snapshot["top_members"]
        if top_members:
            lines = [
                f"{index + 1}. <@{item['recipient_id']}> - {item['accepted_count']} контракт(ов), {item['total_amount']} {bot.config.currency_name}"
                for index, item in enumerate(top_members)
            ]
            embed.add_field(name="Топ участников", value="\n".join(lines), inline=False)
        await ctx.reply(embed=embed)

    @bot.command(name="setup_promotion")
    async def setup_promotion_prefix(ctx: commands.Context) -> None:
        if not bot.user_has_privilege(ctx.author):
            await ctx.reply("Эта команда доступна только главсоставу.")
            return
        setup_id = bot.config.promotion_setup_command_channel_id
        public_id = bot.config.promotion_public_channel_id
        allowed = {cid for cid in (setup_id, public_id) if cid}
        if allowed and ctx.channel.id not in allowed:
            hints = []
            for cid in sorted(allowed):
                ch = bot.get_channel(cid)
                hints.append(ch.mention if isinstance(ch, discord.TextChannel) else f"<#{cid}>")
            await ctx.reply(
                "Команду `!setup_promotion` нужно вызвать в одном из разрешённых каналов: " + ", ".join(hints)
            )
            return
        target = bot.get_channel(public_id)
        if not isinstance(target, discord.TextChannel):
            await ctx.reply("В config.yml не задан или недоступен `promotion_public_channel_id`.")
            return
        try:
            await bot.promotion_feature.post_panel(target)
        except discord.HTTPException as exc:
            await ctx.reply(
                f"Не удалось опубликовать панель (права бота в {target.mention} или размер сообщения). "
                f"Проверьте: отправка сообщений, вложения, эмбеды. Код: `{exc.status}`."
            )

    @bot.command(name="setup_family")
    async def setup_family_prefix(ctx: commands.Context) -> None:
        if not bot.user_has_privilege(ctx.author):
            await ctx.reply("Эта команда доступна только главсоставу.")
            return
        if not isinstance(ctx.channel, discord.TextChannel):
            await ctx.reply("Используйте команду в текстовом канале.")
            return
        await bot.family_feature.post_panel(ctx.channel)

    @bot.command(name="cancel_contract")
    async def cancel_contract_prefix(ctx: commands.Context, contract_id: int) -> None:
        if not bot.user_has_privilege(ctx.author):
            await ctx.reply("Эта команда доступна только главсоставу.")
            return

        success, user_id, contract_title = await bot.db.cancel_active_contract(contract_id)
        if not success:
            await ctx.reply("Активный контракт с таким ID не найден.")
            return

        embed = make_embed(
            "Контракт отменён",
            f"Контракт `#{contract_id}` (**{contract_title}**) отменён главсоставом.",
            color=Palette.WARNING,
        )
        embed.add_field(name="Исполнитель", value=f"<@{user_id}>", inline=True)
        embed.add_field(name="Отменил", value=ctx.author.mention, inline=True)
        await ctx.reply(embed=embed)

    @bot.event
    async def on_command_error(ctx: commands.Context, error: commands.CommandError) -> None:
        if isinstance(error, commands.CommandNotFound):
            return
        await ctx.reply(f"Ошибка команды: {error}")


class _ContextInteractionAdapter:
    def __init__(self, ctx: commands.Context) -> None:
        self._ctx = ctx
        self.channel = ctx.channel

    async def response_send_message(self, content: str, *, ephemeral: bool = False) -> None:
        # ephemeral unavailable in prefix commands, use normal reply.
        await self._ctx.reply(content)

    @property
    def response(self) -> "_ContextInteractionAdapter":
        return self

    async def send_message(self, content: str, *, ephemeral: bool = False) -> None:
        await self.response_send_message(content, ephemeral=ephemeral)


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    config = load_config(root)
    bot = MajesticContractsBot(config)
    register_commands(bot)
    _start_healthcheck_server()
    bot.run(config.token, log_handler=None)


if __name__ == "__main__":
    main()
