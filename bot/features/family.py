from __future__ import annotations

from typing import TYPE_CHECKING

import discord

from bot.ui.styles import Palette, branding_attachment_files, make_embed

if TYPE_CHECKING:
    from bot.main import MajesticContractsBot


def _privilege_role_ids(bot: "MajesticContractsBot") -> list[int]:
    return list(dict.fromkeys(bot.config.staff_role_ids + bot.config.operator_role_ids))


def _parse_footer_family_applicant_id(embed: discord.Embed) -> int | None:
    footer = (embed.footer and embed.footer.text) or ""
    if "corso_family:" not in footer:
        return None
    part = footer.split("corso_family:", 1)[1].split("•", 1)[0].strip()
    try:
        return int(part)
    except ValueError:
        return None


class FamilyApplicationModal(discord.ui.Modal):
    def __init__(self, feature: "FamilyJoinFeature") -> None:
        super().__init__(title="Заявка в семью CORSO")
        self.feature = feature
        self.display_name = discord.ui.TextInput(
            label="Имя / ник (как зовут)",
            placeholder="Например: Максим / Max_Corso",
            max_length=80,
        )
        self.age = discord.ui.TextInput(label="Возраст", placeholder="Например: 19", max_length=10)
        self.source = discord.ui.TextInput(
            label="Откуда узнали о семье",
            placeholder="Друзья, TikTok, сервер…",
            max_length=200,
        )
        self.why = discord.ui.TextInput(
            label="Почему хотите вступить",
            style=discord.TextStyle.paragraph,
            placeholder="Коротко о мотивации и ожиданиях",
            max_length=600,
        )
        self.useful = discord.ui.TextInput(
            label="Чем будете полезны семье",
            style=discord.TextStyle.paragraph,
            placeholder="Навыки, онлайн, помощь, опыт RP…",
            max_length=600,
        )
        for item in (self.display_name, self.age, self.source, self.why, self.useful):
            self.add_item(item)

    async def on_submit(self, interaction: discord.Interaction) -> None:
        await self.feature.submit_application(
            interaction,
            self.display_name.value.strip(),
            self.age.value.strip(),
            self.source.value.strip(),
            self.why.value.strip(),
            self.useful.value.strip(),
        )


class FamilyApplyButton(discord.ui.Button):
    def __init__(self, bot: "MajesticContractsBot") -> None:
        super().__init__(label="Подать заявку в семью", style=discord.ButtonStyle.success, custom_id="family:open_modal", emoji="🛡️")
        self.bot = bot

    async def callback(self, interaction: discord.Interaction) -> None:
        await interaction.response.send_modal(FamilyApplicationModal(self.bot.family_feature))


class FamilyPanelView(discord.ui.View):
    def __init__(self, bot: "MajesticContractsBot") -> None:
        super().__init__(timeout=None)
        self.add_item(FamilyApplyButton(bot))


class FamilyDecisionButton(discord.ui.Button):
    def __init__(self, bot: "MajesticContractsBot", label: str, style: discord.ButtonStyle, decision_key: str) -> None:
        super().__init__(label=label, style=style, custom_id=f"family:decision:{decision_key}")
        self.bot = bot
        self.decision_key = decision_key

    async def callback(self, interaction: discord.Interaction) -> None:
        await self.bot.family_feature.process_decision(interaction, self.decision_key)


class FamilyDecisionView(discord.ui.View):
    def __init__(self, bot: "MajesticContractsBot") -> None:
        super().__init__(timeout=None)
        self.add_item(FamilyDecisionButton(bot, "Взять на рассмотрение", discord.ButtonStyle.secondary, "in_review"))


class FamilyFinalizeView(discord.ui.View):
    def __init__(self, bot: "MajesticContractsBot") -> None:
        super().__init__(timeout=None)
        self.add_item(FamilyDecisionButton(bot, "Принять", discord.ButtonStyle.success, "accepted"))
        self.add_item(FamilyDecisionButton(bot, "Отклонить", discord.ButtonStyle.danger, "rejected"))


class FamilyRejectReasonModal(discord.ui.Modal):
    def __init__(self, feature: "FamilyJoinFeature", applicant_id: int, message_id: int) -> None:
        super().__init__(title="Причина отклонения заявки")
        self.feature = feature
        self.applicant_id = applicant_id
        self.message_id = message_id
        self.reason_input = discord.ui.TextInput(
            label="Причина",
            placeholder="Напишите причину отклонения",
            style=discord.TextStyle.paragraph,
            max_length=1000,
        )
        self.add_item(self.reason_input)

    async def on_submit(self, interaction: discord.Interaction) -> None:
        await self.feature.reject_with_reason(
            interaction,
            applicant_id=self.applicant_id,
            message_id=self.message_id,
            reason=self.reason_input.value.strip(),
        )


class FamilyJoinFeature:
    DECISION_NAMES = {
        "accepted": ("Принято", Palette.SUCCESS),
        "in_review": ("На рассмотрении", Palette.WARNING),
        "rejected": ("Отклонено", Palette.DANGER),
    }

    def __init__(self, bot: "MajesticContractsBot") -> None:
        self.bot = bot

    def create_panel_view(self) -> discord.ui.View:
        return FamilyPanelView(self.bot)

    def create_decision_view(self) -> discord.ui.View:
        return FamilyDecisionView(self.bot)

    def create_finalize_view(self) -> discord.ui.View:
        return FamilyFinalizeView(self.bot)

    async def post_panel(self, channel: discord.TextChannel) -> None:
        files, has_brand = branding_attachment_files()
        embed = make_embed(
            "━━ CORSO · Вступление в семью ━━",
            "### Оформление заявки\n"
            "Нажми **Подать заявку в семью** и заполни форму честно и развёрнуто.\n\n"
            "**Дальше** главсостав рассмотрит заявку в отдельном канале и нажмёт одну из кнопок решения.",
            color=Palette.CORSO_TEAL,
        )
        if has_brand:
            embed.set_image(url="attachment://corso_banner.png")
            embed.set_thumbnail(url="attachment://corso_logo.png")
        await channel.send(embed=embed, view=self.create_panel_view(), files=files or None)

    async def submit_application(
        self,
        interaction: discord.Interaction,
        display_name: str,
        age: str,
        source: str,
        why: str,
        useful: str,
    ) -> None:
        if not isinstance(interaction.user, discord.Member):
            await interaction.response.send_message("Не удалось определить участника.", ephemeral=True)
            return

        review_id = self.bot.config.family_application_review_channel_id
        review_channel = self.bot.get_channel(review_id)
        if not isinstance(review_channel, discord.TextChannel):
            await interaction.response.send_message("Канал для заявок в семью не настроен (family_application_review_channel_id).", ephemeral=True)
            return

        embed = make_embed(
            "Заявка на вступление в семью",
            f"**Кандидат:** {interaction.user.mention}\n**ID:** `{interaction.user.id}`",
            color=Palette.CORSO_RED,
        )
        embed.add_field(name="Имя / ник", value=display_name[:1024] or "—", inline=True)
        embed.add_field(name="Возраст", value=age[:100] or "—", inline=True)
        embed.add_field(name="Откуда узнали", value=source[:1024] or "—", inline=False)
        embed.add_field(name="Почему вступить", value=why[:1024] or "—", inline=False)
        embed.add_field(name="Чем полезен", value=useful[:1024] or "—", inline=False)
        embed.set_author(name=str(interaction.user), icon_url=interaction.user.display_avatar.url)
        embed.set_footer(text=f"corso_family:{interaction.user.id} • {Palette.FOOTER}")

        await review_channel.send(embed=embed, view=self.create_decision_view())
        await interaction.response.send_message("Заявка отправлена.", ephemeral=True)

    def _is_staff(self, user: discord.abc.User) -> bool:
        if not isinstance(user, discord.Member):
            return False
        role_ids = {role.id for role in user.roles}
        return any(role_id in role_ids for role_id in _privilege_role_ids(self.bot))

    async def _dm_applicant(
        self, user_id: int, decision_key: str, decision_title: str, *, reject_reason: str | None = None
    ) -> None:
        if decision_key not in ("accepted", "rejected"):
            return
        try:
            user = self.bot.get_user(user_id) or await self.bot.fetch_user(user_id)
        except discord.HTTPException:
            return
        if decision_key == "accepted":
            text = "Твоя **заявка в семью** принята. Дальнейшие шаги уточни у главсостава."
            color = Palette.SUCCESS
        else:
            reason_line = f"\n\n**Причина:** {reject_reason}" if reject_reason else ""
            text = f"Твоя **заявка в семью** отклонена.{reason_line}"
            color = Palette.DANGER
        embed = make_embed("CORSO · Семья", f"**{decision_title}**\n\n{text}", color=color)
        try:
            await user.send(embed=embed)
        except discord.HTTPException:
            pass

    async def _dm_review_voice_channels(self, user_id: int, guild: discord.Guild | None) -> None:
        if guild is None:
            return
        review_voice_id = 1485381483991666815
        raw_channel = guild.get_channel(review_voice_id)
        if not isinstance(raw_channel, discord.VoiceChannel):
            return
        try:
            user = self.bot.get_user(user_id) or await self.bot.fetch_user(user_id)
        except discord.HTTPException:
            return
        invite_url = f"https://discord.com/channels/{guild.id}/{review_voice_id}"
        try:
            invite = await raw_channel.create_invite(max_age=3600, max_uses=1, unique=True, reason="Заявка в семью: на рассмотрении")
            invite_url = invite.url
        except discord.HTTPException:
            pass
        embed = make_embed(
            "CORSO · Заявка на рассмотрении",
            "Твоя заявка в семью взята на рассмотрение.\n"
            f"Зайди в войс **{raw_channel.name}**:\n{invite_url}",
            color=Palette.INFO,
        )
        try:
            await user.send(embed=embed)
        except discord.HTTPException:
            pass

    async def _kick_applicant(self, guild: discord.Guild | None, applicant_id: int, reason: str) -> None:
        if guild is None:
            return
        member = guild.get_member(applicant_id)
        if member is None:
            try:
                fetched = await guild.fetch_member(applicant_id)
                member = fetched
            except discord.HTTPException:
                member = None
        if member is None:
            return
        try:
            await guild.kick(member, reason=f"Отклонена заявка в семью: {reason[:400]}")
        except discord.HTTPException:
            return

    async def reject_with_reason(
        self,
        interaction: discord.Interaction,
        *,
        applicant_id: int,
        message_id: int,
        reason: str,
    ) -> None:
        if not self._is_staff(interaction.user):
            await interaction.response.send_message("Недостаточно прав для этой кнопки.", ephemeral=True)
            return
        if not reason:
            await interaction.response.send_message("Укажите причину отклонения.", ephemeral=True)
            return
        if interaction.channel is None or not isinstance(interaction.channel, discord.TextChannel):
            await interaction.response.send_message("Канал заявки недоступен.", ephemeral=True)
            return
        try:
            message = await interaction.channel.fetch_message(message_id)
        except discord.HTTPException:
            await interaction.response.send_message("Заявка не найдена.", ephemeral=True)
            return
        if not message.embeds:
            await interaction.response.send_message("Эмбед заявки не найден.", ephemeral=True)
            return

        decision_name, color = self.DECISION_NAMES["rejected"]
        embed = message.embeds[0].copy()
        embed.color = color
        embed.add_field(
            name="Решение",
            value=f"**{decision_name}**\nМодератор: {interaction.user.mention}\nПричина: {reason}",
            inline=False,
        )
        await message.edit(embed=embed, view=None)
        await interaction.response.send_message("Заявка отклонена. Кандидату отправлено уведомление.", ephemeral=True)
        await self._dm_applicant(applicant_id, "rejected", decision_name, reject_reason=reason)
        await self._kick_applicant(interaction.guild, applicant_id, reason)

    async def process_decision(self, interaction: discord.Interaction, decision_key: str) -> None:
        if not self._is_staff(interaction.user):
            await interaction.response.send_message("Недостаточно прав для этой кнопки.", ephemeral=True)
            return
        if interaction.message is None or not interaction.message.embeds:
            await interaction.response.send_message("Сообщение не найдено.", ephemeral=True)
            return

        embed = interaction.message.embeds[0].copy()
        applicant_id = _parse_footer_family_applicant_id(embed)
        if applicant_id is None:
            await interaction.response.send_message("Не удалось определить автора заявки.", ephemeral=True)
            return

        if decision_key == "in_review":
            decision_name, color = self.DECISION_NAMES["in_review"]
            embed.color = color
            embed.add_field(name="Статус", value=f"**{decision_name}**\nМодератор: {interaction.user.mention}", inline=False)
            await interaction.response.edit_message(embed=embed, view=self.create_finalize_view())
            await self._dm_review_voice_channels(applicant_id, interaction.guild)
            return

        if decision_key == "accepted":
            decision_name, color = self.DECISION_NAMES["accepted"]
            embed.color = color
            embed.add_field(name="Решение", value=f"**{decision_name}**\nМодератор: {interaction.user.mention}", inline=False)
            await interaction.response.edit_message(embed=embed, view=None)
            await self._dm_applicant(applicant_id, "accepted", decision_name)
            return

        if decision_key == "rejected":
            await interaction.response.send_modal(
                FamilyRejectReasonModal(self, applicant_id=applicant_id, message_id=interaction.message.id)
            )
            return

        await interaction.response.send_message("Неизвестное действие.", ephemeral=True)
