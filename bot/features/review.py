from __future__ import annotations

import json
from typing import TYPE_CHECKING

import discord

from bot.ui.styles import Palette, make_embed

if TYPE_CHECKING:
    from bot.main import MajesticContractsBot


class RejectReasonModal(discord.ui.Modal):
    def __init__(self, feature: "ReviewFeature", message_id: int) -> None:
        super().__init__(title="Причина отклонения")
        self.feature = feature
        self.message_id = message_id
        self.reason_input = discord.ui.TextInput(
            label="Причина",
            placeholder="Опишите, что нужно исправить в отчёте",
            style=discord.TextStyle.paragraph,
            max_length=1000,
        )
        self.add_item(self.reason_input)

    async def on_submit(self, interaction: discord.Interaction) -> None:
        await self.feature.reject_by_message(interaction, self.message_id, self.reason_input.value.strip())


class ApproveButton(discord.ui.Button):
    def __init__(self, bot: "MajesticContractsBot") -> None:
        super().__init__(label="Принять", style=discord.ButtonStyle.success, custom_id="review:approve")
        self.bot = bot

    async def callback(self, interaction: discord.Interaction) -> None:
        await self.bot.review_feature.approve_by_message(interaction)


class RejectButton(discord.ui.Button):
    def __init__(self, bot: "MajesticContractsBot") -> None:
        super().__init__(label="Отклонить", style=discord.ButtonStyle.danger, custom_id="review:reject")
        self.bot = bot

    async def callback(self, interaction: discord.Interaction) -> None:
        await interaction.response.send_modal(RejectReasonModal(self.bot.review_feature, interaction.message.id))


class ReviewView(discord.ui.View):
    def __init__(self, bot: "MajesticContractsBot") -> None:
        super().__init__(timeout=None)
        self.add_item(ApproveButton(bot))
        self.add_item(RejectButton(bot))


class ReviewFeature:
    def __init__(self, bot: "MajesticContractsBot") -> None:
        self.bot = bot

    def create_review_view(self) -> discord.ui.View:
        return ReviewView(self.bot)

    async def _get_review_message(self, record_message_id: int, record_channel_id: int) -> discord.Message | None:
        channel = self.bot.get_channel(record_channel_id)
        if channel is None:
            fetched = await self.bot.fetch_channel(record_channel_id)
            channel = fetched
        if isinstance(channel, discord.TextChannel):
            try:
                return await channel.fetch_message(record_message_id)
            except discord.HTTPException:
                return None
        return None

    def _is_staff(self, member: discord.Member | discord.User) -> bool:
        if not isinstance(member, discord.Member):
            return False
        role_ids = {role.id for role in member.roles}
        privileged = list(dict.fromkeys(self.bot.config.staff_role_ids + self.bot.config.operator_role_ids))
        return any(role_id in role_ids for role_id in privileged)

    async def approve_by_message(self, interaction: discord.Interaction) -> None:
        if interaction.message is None:
            return
        if not self._is_staff(interaction.user):
            embed = make_embed("Недостаточно прав", "Только главсостав может проверять отчёты.", color=Palette.DANGER)
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        record = await self.bot.db.get_pending_review_by_message(interaction.message.id)
        if record is None:
            embed = make_embed("Отчёт уже обработан", "Эта заявка уже не находится в статусе проверки.", color=Palette.WARNING)
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        await self.bot.db.approve_report(record.active_contract_id, interaction.user.id)
        embed = interaction.message.embeds[0].copy() if interaction.message.embeds else make_embed("Отчёт", "")
        embed.color = Palette.SUCCESS
        embed.add_field(name="Решение", value=f"Принял: {interaction.user.mention}", inline=False)
        attachments = json.loads(record.attachments_json)
        if attachments:
            embed.set_image(url=attachments[0])
        await interaction.message.edit(embed=embed, view=None)

        payouts_channel = self.bot.get_channel(self.bot.config.payouts_channel_id)
        if isinstance(payouts_channel, discord.TextChannel):
            payout_embed = make_embed(
                "Выплата подтверждена",
                f"Отчёт по контракту **{record.contract_title}** принят.",
                color=Palette.SUCCESS,
            )
            payout_embed.add_field(name="Сотрудник", value=f"<@{record.author_id}>", inline=True)
            payout_embed.add_field(name="Сумма", value=f"{record.payout_amount} {self.bot.config.currency_name}", inline=True)
            payout_embed.add_field(name="Проверяющий", value=interaction.user.mention, inline=True)
            await payouts_channel.send(embed=payout_embed)

        author = interaction.guild.get_member(record.author_id) if interaction.guild else None
        if author:
            notify_embed = make_embed(
                "Отчёт принят",
                f"Ваш отчёт по контракту **{record.contract_title}** принят. К выплате: **{record.payout_amount} {self.bot.config.currency_name}**.",
                color=Palette.SUCCESS,
            )
            try:
                await author.send(embed=notify_embed)
            except discord.HTTPException:
                pass

        await interaction.response.send_message("Отчёт принят.", ephemeral=True)

    async def reject_by_message(self, interaction: discord.Interaction, message_id: int, reason: str) -> None:
        if not self._is_staff(interaction.user):
            embed = make_embed("Недостаточно прав", "Только главсостав может проверять отчёты.", color=Palette.DANGER)
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        record = await self.bot.db.get_pending_review_by_message(message_id)
        if record is None:
            embed = make_embed("Отчёт уже обработан", "Эта заявка уже не находится в статусе проверки.", color=Palette.WARNING)
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        await self.bot.db.reject_report(record.active_contract_id, interaction.user.id, reason)

        review_message = interaction.message or await self._get_review_message(record.review_message_id, record.review_channel_id)
        if review_message:
            embed = review_message.embeds[0].copy() if review_message.embeds else make_embed("Отчёт", "")
            embed.color = Palette.DANGER
            embed.add_field(name="Отклонено", value=f"{interaction.user.mention}\nПричина: {reason}", inline=False)
            attachments = json.loads(record.attachments_json)
            if attachments:
                embed.set_image(url=attachments[0])
            await review_message.edit(embed=embed, view=None)

        author = interaction.guild.get_member(record.author_id) if interaction.guild else None
        if author:
            notify_embed = make_embed(
                "Отчёт отклонён",
                f"Ваш отчёт по контракту **{record.contract_title}** отклонён.\nПричина: {reason}",
                color=Palette.DANGER,
            )
            try:
                await author.send(embed=notify_embed)
            except discord.HTTPException:
                pass

        await interaction.response.send_message("Отчёт отклонён.", ephemeral=True)
