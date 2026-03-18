from __future__ import annotations

from app.language_policy import get_language_policy


def canonicalize_relationship_label(label: str, *, language: str | None = None) -> str:
    policy = get_language_policy(language, sample_text=label)
    return policy.canonicalize_relationship_label(label)
