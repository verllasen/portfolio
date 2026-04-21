from __future__ import annotations

from typing import TYPE_CHECKING

import discord

from bot.ui.styles import Palette, make_embed

if TYPE_CHECKING:
    from bot.main import MajesticContractsBot


def _privilege_role_ids(bot: "MajesticContractsBot") -> list[int]:
    return list(dict.fromkeys(bot.config.staff_role_ids + bot.config.operator_role_ids))


def _embed_add_text_chunks(embed: discord.Embed, title: str, text: str, chunk: int = 1000) -> None:
    body = (text or "").strip() or "—"
    if len(body) <= chunk:
        embed.add_field(name=title, value=body[:1024], inline=False)
        return
    for index, start in enumerate(range(0, len(body), chunk), start=1):
        part = body[start : start + chunk]
        embed.add_field(name=f"{title} ({index})", value=part[:1024], inline=False)


def _parse_footer_applicant_id(embed: discord.Embed) -> int | None:
    footer = (embed.footer and embed.footer.text) or ""
    if "corso_applicant:" not in footer:
        return None
    part = footer.split("corso_applicant:", 1)[1]
    part = part.split("•", 1)[0].strip()
    try:
        return int(part)
    except ValueError:
        return None


class PromotionModal(discord.ui.Modal):
    def __init__(self, feature: "PromotionFeature") -> None:
        super().__init__(title="Отчёт на повышение")
        self.feature = feature
        self.nick_static_input = discord.ui.TextInput(
            label="Ник и статик",
            placeholder="Например: Max_Corso | 12345",
            max_length=180,
        )
        self.assets_links_input = discord.ui.TextInput(
            label="Ссылки на скрины с активов",
            placeholder="Вставьте ссылки (каждую с новой строки)",
            style=discord.TextStyle.paragraph,
            max_length=3000,
        )
        self.add_item(self.nick_static_input)
        self.add_item(self.assets_links_input)

    async def on_submit(self, interaction: discord.Interaction) -> None:
        await self.feature.submit_promotion(
            interaction,
            self.nick_static_input.value.strip(),
            self.assets_links_input.value.strip(),
        )


class PromotionSubmitButton(discord.ui.Button):
    def __init__(self, bot: "MajesticContractsBot") -> None:
        super().__init__(label="Отправить отчёт на повышение", style=discord.ButtonStyle.primary, custom_id="promotion:open_modal")
        self.bot = bot

    async def callback(self, interaction: discord.Interaction) -> None:
        await interaction.response.send_modal(PromotionModal(self.bot.promotion_feature))


class PromotionPanelView(discord.ui.View):
    def __init__(self, bot: "MajesticContractsBot") -> None:
        super().__init__(timeout=None)
        self.add_item(PromotionSubmitButton(bot))


class PromotionDecisionButton(discord.ui.Button):
    def __init__(self, bot: "MajesticContractsBot", label: str, style: discord.ButtonStyle, decision_key: str) -> None:
        super().__init__(label=label, style=style, custom_id=f"promotion:decision:{decision_key}")
        self.bot = bot
        self.decision_key = decision_key

    async def callback(self, interaction: discord.Interaction) -> None:
        await self.bot.promotion_feature.process_decision(interaction, self.decision_key)


class PromotionDecisionView(discord.ui.View):
    def __init__(self, bot: "MajesticContractsBot") -> None:
        super().__init__(timeout=None)
        self.add_item(PromotionDecisionButton(bot, "Принять", discord.ButtonStyle.success, "accepted"))
        self.add_item(PromotionDecisionButton(bot, "Отклонить", discord.ButtonStyle.danger, "rejected"))


class PromotionFeature:
    DECISION_NAMES = {
        "accepted": ("Принято", Palette.SUCCESS),
        "rejected": ("Отклонено", Palette.DANGER),
    }

    def __init__(self, bot: "MajesticContractsBot") -> None:
        self.bot = bot

    def create_panel_view(self) -> discord.ui.View:
        return PromotionPanelView(self.bot)

    def create_decision_view(self) -> discord.ui.View:
        return PromotionDecisionView(self.bot)

    async def post_panel(self, channel: discord.TextChannel) -> None:
        embed = make_embed(
            "━━ CORSO · Повышение ━━",
            "### Отчёт на повышение\n"
            "Нажми **Отправить отчёт на повышение** и заполни форму:\n"
            "• **ник + статик**\n"
            "• **ссылки на скрины с активов**\n\n"
            "_Заявка уходит в канал главсостава; там только **Принять** или **Отклонить** — решение бот продублирует тебе в **ЛС**._",
            color=Palette.CORSO_TEAL,
        )
        await channel.send(embed=embed, view=self.create_panel_view())

    async def submit_promotion(
        self,
        interaction: discord.Interaction,
        nick_static: str,
        assets_links: str,
    ) -> None:
        if not isinstance(interaction.user, discord.Member):
            await interaction.response.send_message("Не удалось определить участника.", ephemeral=True)
            return

        review_channel = self.bot.get_channel(self.bot.config.promotion_review_channel_id)
        if not isinstance(review_channel, discord.TextChannel):
            await interaction.response.send_message("Канал для проверки повышений не найден.", ephemeral=True)
            return

        embed = make_embed(
            "━━ CORSO · Заявка на повышение ━━",
            f"**Кандидат:** {interaction.user.mention}\n**ID:** `{interaction.user.id}`",
            color=Palette.CORSO_RED,
        )
        embed.add_field(name="Ник + статик", value=nick_static[:1024] or "—", inline=False)
        _embed_add_text_chunks(embed, "Ссылки на скрины с активов", assets_links)
        embed.set_author(name=str(interaction.user), icon_url=interaction.user.display_avatar.url)
        embed.set_footer(text=f"corso_applicant:{interaction.user.id} • {Palette.FOOTER}")
        await review_channel.send(embed=embed, view=self.create_decision_view())
        await interaction.response.send_message("Заявка отправлена.", ephemeral=True)

    def _is_staff(self, user: discord.abc.User) -> bool:
        if not isinstance(user, discord.Member):
            return False
        role_ids = {role.id for role in user.roles}
        return any(role_id in role_ids for role_id in _privilege_role_ids(self.bot))

    async def _dm_applicant(self, user_id: int, decision_key: str, decision_title: str) -> None:
        if decision_key not in ("accepted", "rejected"):
            return
        try:
            user = self.bot.get_user(user_id) or await self.bot.fetch_user(user_id)
        except discord.HTTPException:
            return
        if decision_key == "accepted":
            text = "Твоя заявка на **повышение** принята. Уточни детали у главсостава в Discord."
            color = Palette.SUCCESS
        else:
            text = "Твоя заявка на **повышение** отклонена. При необходимости уточни причину у модератора."
            color = Palette.DANGER
        embed = make_embed("CORSO · Повышение", f"**{decision_title}**\n\n{text}", color=color)
        try:
            await user.send(embed=embed)
        except discord.HTTPException:
            pass

    async def process_decision(self, interaction: discord.Interaction, decision_key: str) -> None:
        if not self._is_staff(interaction.user):
            await interaction.response.send_message("Недостаточно прав для этой кнопки.", ephemeral=True)
            return
        if interaction.message is None or not interaction.message.embeds:
            await interaction.response.send_message("Сообщение или эмбед не найдены.", ephemeral=True)
            return
        if decision_key not in self.DECISION_NAMES:
            await interaction.response.send_message(
                "Эта кнопка от старой версии бота. Попроси выставить заявку заново.",
                ephemeral=True,
            )
            return

        decision_name, color = self.DECISION_NAMES[decision_key]
        embed = interaction.message.embeds[0].copy()
        applicant_id = _parse_footer_applicant_id(embed)
        embed.color = color
        embed.add_field(name="Решение", value=f"**{decision_name}**\nМодератор: {interaction.user.mention}", inline=False)
        await interaction.response.edit_message(embed=embed, view=None)
        if applicant_id is not None:
            await self._dm_applicant(applicant_id, decision_key, decision_name)
