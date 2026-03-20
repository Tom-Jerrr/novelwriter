# SPDX-FileCopyrightText: 2026 Isaac.X.Ω.Yuan
# SPDX-License-Identifier: AGPL-3.0-only

"""Small locale helpers for copilot runtime/user-facing text."""

from __future__ import annotations

from app.language import normalize_language_code


def normalize_copilot_locale(locale: str | None) -> str:
    normalized = normalize_language_code(locale, default="zh") or "zh"
    return "en" if normalized.startswith("en") else "zh"


def is_english_locale(locale: str | None) -> bool:
    return normalize_copilot_locale(locale) == "en"


def choose_locale_text(locale: str | None, zh: str, en: str) -> str:
    return en if is_english_locale(locale) else zh
