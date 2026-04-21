from __future__ import annotations

from typing import TYPE_CHECKING

import discord

from bot.db import ActiveContractRecord
from bot.ui.styles import Palette, make_embed

if TYPE_CHECKING:
    from bot.main import MajesticContractsBot


class ReportModal(discord.ui.Modal):
    def __init__(
        self,
        feature: "ReportsFeature",
        user_id: int,
        contracts: list[ActiveContractRecord],
    ) -> None:
        super().__init__(title="Отчёт по контракту")
        self.feature = feature
        self.user_id = user_id
        self.contract_map = {str(item.id): item for item in contracts}
        self.single_contract = contracts[0] if len(contracts) == 1 else None

        self.executed_at_input = discord.ui.TextInput(
            label="Дата и время выполнения",
            placeholder="Например: 10.04.2026 19:30",
            max_length=64,
        )
        self.participants_input = discord.ui.TextInput(
            label="Участники",
            placeholder="@user1 @user2 @user3",
            style=discord.TextStyle.paragraph,
            max_length=1000,
        )
        self.contract_id_input: discord.ui.TextInput | None = None
        if self.single_contract is None:
            placeholders = ", ".join(f"#{item.id} - {item.contract_title}" for item in contracts[:5])
            self.contract_id_input = discord.ui.TextInput(
                label="ID активного контракта",
                placeholder=placeholders or "Введите ID контракта",
                max_length=20,
            )

        if self.contract_id_input is not None:
            self.add_item(self.contract_id_input)

        for item in (self.executed_at_input, self.participants_input):
            self.add_item(item)

    async def on_submit(self, interaction: discord.Interaction) -> None:
        contract = self.single_contract
        if contract is None and self.contract_id_input is not None:
            raw_value = self.contract_id_input.value.strip()
            numeric_value = "".join(char for char in raw_value if char.isdigit())
            if numeric_value not in self.contract_map:
                allowed = ", ".join(f"#{item_id}" for item_id in self.contract_map.keys())
                embed = make_embed(
                    "Неверный ID контракта",
                    f"Укажите корректный ID. Доступные ID: {allowed}",
                    color=Palette.DANGER,
                )
                await interaction.response.send_message(embed=embed, ephemeral=True)
                return
            contract = self.contract_map[numeric_value]

        if contract is None:
            await interaction.response.send_message("Не удалось определить контракт для отчёта.", ephemeral=True)
            return

        await self.feature.submit_report(
            interaction,
            active_contract_id=contract.id,
            contract_title=contract.contract_title,
            payout_amount=contract.payout_amount,
            participants=self.participants_input.value.strip(),
            executed_at=self.executed_at_input.value.strip(),
        )


class ReportsFeature:
    def __init__(self, bot: "MajesticContractsBot") -> None:
        self.bot = bot

    def build_report_modal(self, user_id: int, contracts: list[ActiveContractRecord]) -> ReportModal:
        return ReportModal(self, user_id, contracts)

    async def submit_report(
        self,
        interaction: discord.Interaction,
        *,
        active_contract_id: int,
        contract_title: str,
        payout_amount: int,
        participants: str,
        executed_at: str,
    ) -> None:
        report_id = await self.bot.db.create_report(
            active_contract_id=active_contract_id,
            author_id=interaction.user.id,
            participants=participants,
            executed_at=executed_at,
            comment="Заявка отправлена через форму.",
            attachments=[],
        )

        review_channel_id = 1491997601996869864
        review_channel = self.bot.get_channel(review_channel_id)
        if review_channel is None or not isinstance(review_channel, discord.TextChannel):
            raise RuntimeError("Review channel not found.")

        embed = make_embed(
            "━━ CORSO · Заявка по контракту ━━",
            f"Исполнитель: {interaction.user.mention}",
            color=Palette.CORSO_RED,
        )
        embed.add_field(name="Контракт", value=f"`#{active_contract_id}` **{contract_title}**", inline=False)
        embed.add_field(name="Дата и время", value=executed_at or "—", inline=True)
        embed.add_field(name="Выплата", value=f"**{payout_amount}** {self.bot.config.currency_name}", inline=True)
        embed.add_field(name="Участники", value=participants[:1024] or "—", inline=False)
        embed.set_author(name=str(interaction.user), icon_url=interaction.user.display_avatar.url)

        review_message = await review_channel.send(embed=embed, view=self.bot.review_feature.create_review_view())
        await self.bot.db.link_review_message(active_contract_id, review_message.id, review_channel_id)
        await interaction.response.send_message(
            f"Заявка `#{report_id}` по контракту отправлена в канал проверки.",
            ephemeral=True,
        )

    async def try_consume_report_message(self, message: discord.Message) -> bool:
        return False
