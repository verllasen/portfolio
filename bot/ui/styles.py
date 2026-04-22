from __future__ import annotations

from datetime import datetime
from pathlib import Path

import discord


def project_root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


class Palette:
    """Цвета в стиле Corso: бирюза логотипа + тёмный фон + акцент."""
    CORSO_TEAL = discord.Color.from_rgb(0, 188, 180)
    CORSO_RED = discord.Color.from_rgb(180, 40, 55)
    CORSO_GOLD = discord.Color.from_rgb(212, 175, 55)
    CORSO_DARK = discord.Color.from_rgb(35, 38, 42)
    PRIMARY = CORSO_TEAL
    SUCCESS = discord.Color.from_rgb(60, 200, 140)
    DANGER = discord.Color.from_rgb(220, 60, 70)
    WARNING = discord.Color.from_rgb(230, 190, 80)
    INFO = CORSO_TEAL
    NEUTRAL = discord.Color.dark_embed()

    FOOTER = "Corso Family • !setup_post | verllasen."


def _embed_base(
    title: str,
    description: str,
    *,
    color: discord.Color,
) -> discord.Embed:
    embed = discord.Embed(
        title=title,
        description=description,
        color=color,
        timestamp=datetime.utcnow(),
    )
    embed.set_footer(text=Palette.FOOTER)
    return embed


def make_embed(
    title: str,
    description: str,
    *,
    color: discord.Color = Palette.PRIMARY,
    footer: str | None = None,
) -> discord.Embed:
    embed = _embed_base(title, description, color=color)
    if footer is not None:
        embed.set_footer(text=footer)
    return embed


def status_badge(status: str) -> str:
    mapping = {
        "ACTIVE": "Активен",
        "SUBMITTED": "На проверке",
        "APPROVED": "Принят",
        "REJECTED": "Отклонён",
        "CANCELLED": "Отменён",
    }
    return mapping.get(status, status)


def branding_attachment_files() -> tuple[list[discord.File], bool]:
    """
    Файлы для attachment:// в эмбеде: баннер + логотип.
    Возвращает (список File, нужно ли проставлять URL в эмбеде).
    """
    root = project_root()
    banner_path = root / "assets" / "corso_banner.png"
    logo_path = root / "assets" / "corso_logo.png"
    external_banner = Path(
        "C:/Users/kaunk/.cursor/projects/c-Users-kaunk-OneDrive-Corso/assets/"
        "c__Users_kaunk_AppData_Roaming_Cursor_User_workspaceStorage_3891d8f58d6c61ef32ba1de472dc897a_images_1774889120537-3ee62f53-94ea-4a5b-a071-9941ac894496.png"
    )
    external_logo = Path(
        "C:/Users/kaunk/.cursor/projects/c-Users-kaunk-OneDrive-Corso/assets/"
        "c__Users_kaunk_AppData_Roaming_Cursor_User_workspaceStorage_3891d8f58d6c61ef32ba1de472dc897a_images_corso2-fbd723be-1e28-444b-9aba-1e7ea7589600.png"
    )
    files: list[discord.File] = []
    if banner_path.is_file():
        files.append(discord.File(banner_path, filename="corso_banner.png"))
    elif external_banner.is_file():
        files.append(discord.File(external_banner, filename="corso_banner.png"))
    if logo_path.is_file():
        files.append(discord.File(logo_path, filename="corso_logo.png"))
    elif external_logo.is_file():
        files.append(discord.File(external_logo, filename="corso_logo.png"))
    return files, len(files) > 0


def contract_overview_embed(contract_title: str, description: str, payout: int, currency_name: str) -> discord.Embed:
    embed = _embed_base(
        "Контракт закреплён",
        f"**{contract_title}**\n\n"
        f"{description}\n\n"
        "**Сдача:** **Заполнить отчёт** → короткая форма → **одно сообщение с 1–5 скринами** в тот же канал.",
        color=Palette.SUCCESS,
    )
    embed.add_field(name="Выплата", value=f"**{payout}** {currency_name}", inline=True)
    embed.add_field(name="Статус", value="`ACTIVE`", inline=True)
    return embed


def control_panel_embed(*, use_brand_images: bool) -> discord.Embed:
    lines = [
        "### Панель контрактов **CORSO**",
        "",
        "1. Выбери контракт в меню",
        "2. Выполни на сервере",
        "3. **Заполнить отчёт** — пара полей и опциональная заметка",
        "4. Одним сообщением — **1–5 скринов** в этот же канал",
        "",
        "**Мои активные** — список и статусы.",
    ]
    embed = _embed_base(
        "━━ CORSO · Контракты ━━",
        "\n".join(lines),
        color=Palette.CORSO_TEAL,
    )
    if use_brand_images:
        root = project_root()
        if (root / "assets" / "corso_banner.png").is_file():
            embed.set_image(url="attachment://corso_banner.png")
        if (root / "assets" / "corso_logo.png").is_file():
            embed.set_thumbnail(url="attachment://corso_logo.png")
    return embed


def logo_file_for_thumbnail() -> discord.File | None:
    path = project_root() / "assets" / "corso_logo.png"
    if path.is_file():
        return discord.File(path, filename="corso_logo.png")
    external_logo = Path(
        "C:/Users/kaunk/.cursor/projects/c-Users-kaunk-OneDrive-Corso/assets/"
        "c__Users_kaunk_AppData_Roaming_Cursor_User_workspaceStorage_3891d8f58d6c61ef32ba1de472dc897a_images_corso2-fbd723be-1e28-444b-9aba-1e7ea7589600.png"
    )
    if external_logo.is_file():
        return discord.File(external_logo, filename="corso_logo.png")
    return None
