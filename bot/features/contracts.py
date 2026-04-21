from __future__ import annotations

from typing import TYPE_CHECKING

import discord

from bot.ui.styles import (
    Palette,
    branding_attachment_files,
    contract_overview_embed,
    control_panel_embed,
    make_embed,
    status_badge,
)

if TYPE_CHECKING:
    from bot.main import MajesticContractsBot


class ContractSelect(discord.ui.Select):
    def __init__(self, bot: "MajesticContractsBot") -> None:
        options = [
            discord.SelectOption(
                label=contract.title,
                value=contract.key,
                description=f"{contract.category} {contract.tier} | Выплата: {contract.payout}",
            )
            for contract in bot.config.contracts.values()
        ]
        super().__init__(
            custom_id="contracts:select",
            placeholder="Выберите контракт, который хотите взять",
            min_values=1,
            max_values=1,
            options=options,
            row=0,
        )
        self.bot = bot

    async def callback(self, interaction: discord.Interaction) -> None:
        if not self.bot.user_has_any_role(interaction.user, self.bot.config.contractor_role_ids):
            embed = make_embed(
                "Нет доступа",
                "Брать контракты может только назначенная роль исполнителей.",
                color=Palette.DANGER,
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        contract = self.bot.config.contracts[self.values[0]]

        await self.bot.db.create_active_contract(interaction.user.id, contract)
        embed = contract_overview_embed(
            contract.title,
            contract.description,
            contract.payout,
            self.bot.config.currency_name,
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)


class SubmitReportButton(discord.ui.Button):
    def __init__(self, bot: "MajesticContractsBot") -> None:
        super().__init__(label="Заполнить отчёт", style=discord.ButtonStyle.primary, custom_id="contracts:submit_report", row=1)
        self.bot = bot

    async def callback(self, interaction: discord.Interaction) -> None:
        if not self.bot.user_has_any_role(interaction.user, self.bot.config.contractor_role_ids):
            embed = make_embed(
                "Нет доступа",
                "Отчёты могут отправлять только участники с ролью исполнителей.",
                color=Palette.DANGER,
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        contracts = await self.bot.db.get_open_contracts_for_user(interaction.user.id)
        if not contracts:
            embed = make_embed(
                "Нет активных контрактов",
                "Сначала возьмите контракт, а потом отправляйте отчёт.",
                color=Palette.WARNING,
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        modal = self.bot.reports_feature.build_report_modal(interaction.user.id, contracts)
        await interaction.response.send_modal(modal)


class MyActiveContractsButton(discord.ui.Button):
    def __init__(self, bot: "MajesticContractsBot") -> None:
        super().__init__(label="Мои активные", style=discord.ButtonStyle.secondary, custom_id="contracts:my_active", row=1)
        self.bot = bot

    async def callback(self, interaction: discord.Interaction) -> None:
        contracts = await self.bot.db.get_active_contracts_for_user(interaction.user.id)
        if not contracts:
            embed = make_embed("Пока пусто", "У вас ещё нет контрактов в системе.", color=Palette.NEUTRAL)
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        lines = []
        for item in contracts[:10]:
            lines.append(
                f"`#{item.id}` **{item.contract_title}**\n"
                f"Статус: **{status_badge(item.status)}** | Выплата: **{item.payout_amount} {self.bot.config.currency_name}**"
            )

        embed = make_embed("Ваши контракты", "\n\n".join(lines), color=Palette.INFO)
        await interaction.response.send_message(embed=embed, ephemeral=True)


class ContractControlView(discord.ui.View):
    def __init__(self, bot: "MajesticContractsBot") -> None:
        super().__init__(timeout=None)
        self.bot = bot
        self.add_item(ContractSelect(bot))
        self.add_item(SubmitReportButton(bot))
        self.add_item(MyActiveContractsButton(bot))


class ContractsFeature:
    def __init__(self, bot: "MajesticContractsBot") -> None:
        self.bot = bot

    def create_control_view(self) -> discord.ui.View:
        return ContractControlView(self.bot)

    async def post_control_panel(self, interaction: discord.Interaction) -> None:
        channel: discord.TextChannel | None = None
        if self.bot.config.contracts_channel_id > 0:
            raw_channel = self.bot.get_channel(self.bot.config.contracts_channel_id)
            if isinstance(raw_channel, discord.TextChannel):
                channel = raw_channel

        # Fallback for prefix command usage: post into the channel where !setup_post was called.
        if channel is None:
            current_channel = getattr(interaction, "channel", None)
            if isinstance(current_channel, discord.TextChannel):
                channel = current_channel

        if channel is None or not isinstance(channel, discord.TextChannel):
            raise RuntimeError("Contracts channel not found. Set contracts_channel_id or run command in a text channel.")

        brand_files, has_brand = branding_attachment_files()
        panel_embed = control_panel_embed(use_brand_images=has_brand)
        send_kwargs: dict = {"embed": panel_embed, "view": self.create_control_view()}
        if brand_files:
            send_kwargs["files"] = brand_files
        await channel.send(**send_kwargs)
