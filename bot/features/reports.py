from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

import discord

from bot.db import ActiveContractRecord
from bot.ui.styles import Palette, logo_file_for_thumbnail, make_embed

if TYPE_CHECKING:
    from bot.main import MajesticContractsBot


@dataclass(slots=True)
class PendingSubmission:
    active_contract_id: int
    contract_title: str
    payout_amount: int
    participants: str
    executed_at: str
    note: str


class ReportModal(discord.ui.Modal):
    def __init__(
        self,
        feature: "ReportsFeature",
        user_id: int,
        contracts: list[ActiveContractRecord],
    ) -> None:
        super().__init__(title="Сдача контракта")
        self.feature = feature
        self.user_id = user_id
        self.contract_map = {str(item.id): item for item in contracts}
        self.single_contract = contracts[0] if len(contracts) == 1 else None

        self.executed_at_input = discord.ui.TextInput(
            label="Когда выполнили",
            placeholder="Например: 23.04.2026 19:30",
            max_length=64,
        )
        self.participants_input = discord.ui.TextInput(
            label="Кто участвовал",
            placeholder="Упоминания или ники",
            style=discord.TextStyle.paragraph,
            max_length=800,
        )
        self.note_input = discord.ui.TextInput(
            label="Заметка (необязательно)",
            placeholder="Коротко: что сделали, нюансы",
            style=discord.TextStyle.paragraph,
            max_length=400,
            required=False,
        )
        self.contract_id_input: discord.ui.TextInput | None = None
        if self.single_contract is None:
            placeholders = ", ".join(f"#{item.id}" for item in contracts[:5])
            self.contract_id_input = discord.ui.TextInput(
                label="ID контракта",
                placeholder=placeholders or "Только цифры",
                max_length=20,
            )

        if self.contract_id_input is not None:
            self.add_item(self.contract_id_input)

        for item in (self.executed_at_input, self.participants_input, self.note_input):
            self.add_item(item)

    async def on_submit(self, interaction: discord.Interaction) -> None:
        contract = self.single_contract
        if contract is None and self.contract_id_input is not None:
            raw_value = self.contract_id_input.value.strip()
            numeric_value = "".join(char for char in raw_value if char.isdigit())
            if numeric_value not in self.contract_map:
                allowed = ", ".join(f"#{item_id}" for item_id in self.contract_map.keys())
                embed = make_embed(
                    "Неверный ID",
                    f"Доступные: {allowed}",
                    color=Palette.DANGER,
                )
                await interaction.response.send_message(embed=embed, ephemeral=True)
                return
            contract = self.contract_map[numeric_value]

        if contract is None:
            await interaction.response.send_message("Не удалось определить контракт.", ephemeral=True)
            return

        note = (self.note_input.value or "").strip()
        self.feature.pending_submissions[interaction.user.id] = PendingSubmission(
            active_contract_id=contract.id,
            contract_title=contract.contract_title,
            payout_amount=contract.payout_amount,
            participants=self.participants_input.value.strip(),
            executed_at=self.executed_at_input.value.strip(),
            note=note,
        )

        ch = interaction.channel
        ch_mention = ch.mention if isinstance(ch, discord.TextChannel) else "этот канал"
        embed = make_embed(
            "Осталось прикрепить фото",
            f"Отправь **одно сообщение** в {ch_mention} с **1–5 скриншотами** (вложения, не ссылки).\n"
            "Текст в том сообщении можно не писать — всё уже в форме.",
            color=Palette.CORSO_TEAL,
        )
        embed.add_field(name="Контракт", value=f"`#{contract.id}` **{contract.contract_title}**", inline=False)
        await interaction.response.send_message(embed=embed, ephemeral=True)


class ReportsFeature:
    def __init__(self, bot: "MajesticContractsBot") -> None:
        self.bot = bot
        self.pending_submissions: dict[int, PendingSubmission] = {}

    def build_report_modal(self, user_id: int, contracts: list[ActiveContractRecord]) -> ReportModal:
        return ReportModal(self, user_id, contracts)

    async def try_consume_report_message(self, message: discord.Message) -> bool:
        pending = self.pending_submissions.get(message.author.id)
        if pending is None:
            return False

        image_attachments = [
            attachment
            for attachment in message.attachments
            if (attachment.content_type and attachment.content_type.startswith("image/"))
            or attachment.filename.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp"))
        ]
        if not 1 <= len(image_attachments) <= 5:
            warn = make_embed(
                "Нужны скрины",
                "Отправь **одно** сообщение с **1–5** изображениями.",
                color=Palette.WARNING,
            )
            await message.reply(embed=warn, mention_author=False)
            return True

        attachment_urls = [item.url for item in image_attachments]
        comment_parts = ["Фотоотчёт приложен сообщением."]
        if pending.note:
            comment_parts.append(pending.note)
        comment = " ".join(comment_parts)

        report_id = await self.bot.db.create_report(
            active_contract_id=pending.active_contract_id,
            author_id=message.author.id,
            participants=pending.participants,
            executed_at=pending.executed_at,
            comment=comment,
            attachments=attachment_urls,
        )

        review_channel = self.bot.get_channel(self.bot.config.review_channel_id)
        if review_channel is None or not isinstance(review_channel, discord.TextChannel):
            raise RuntimeError("Review channel not found.")

        embed = make_embed(
            "━━ CORSO · Отчёт на проверке ━━",
            f"**Исполнитель:** {message.author.mention}\n**Скринов:** {len(image_attachments)}",
            color=Palette.CORSO_RED,
        )
        embed.add_field(
            name="Контракт",
            value=f"`#{pending.active_contract_id}` **{pending.contract_title}**",
            inline=False,
        )
        embed.add_field(name="Когда", value=pending.executed_at or "—", inline=True)
        embed.add_field(
            name="Выплата",
            value=f"**{pending.payout_amount}** {self.bot.config.currency_name}",
            inline=True,
        )
        embed.add_field(name="Участники", value=pending.participants[:1024] or "—", inline=False)
        if pending.note:
            embed.add_field(name="Заметка", value=pending.note[:1024], inline=False)
        embed.set_author(name=str(message.author), icon_url=message.author.display_avatar.url)
        embed.set_image(url=attachment_urls[0])

        files: list[discord.File] = []
        logo = logo_file_for_thumbnail()
        if logo is not None:
            embed.set_thumbnail(url="attachment://corso_logo.png")
            files.append(logo)
        for index, attachment in enumerate(image_attachments):
            safe_name = attachment.filename or f"photo_{index + 1}.png"
            files.append(await attachment.to_file(filename=f"report_{index + 1}_{safe_name}"[:80]))

        review_message = await review_channel.send(
            embed=embed,
            view=self.bot.review_feature.create_review_view(),
            files=files,
        )
        await self.bot.db.link_review_message(pending.active_contract_id, review_message.id, review_channel.id)

        ok = make_embed(
            "Готово",
            f"Отчёт `#{report_id}` ушёл в канал проверки.",
            color=Palette.SUCCESS,
        )
        await message.reply(embed=ok, mention_author=False)
        self.pending_submissions.pop(message.author.id, None)
        return True
