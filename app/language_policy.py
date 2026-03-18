from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

from app.language import DEFAULT_LANGUAGE, normalize_language_code

DEFAULT_CJK_SPACE_RATIO_THRESHOLD = 0.05
DEFAULT_SENTENCE_BACKTRACK_WINDOW = 200

_CJK_RE = re.compile(r"[\u4e00-\u9fff\u3400-\u4dbf]")
_KANA_RE = re.compile(r"[\u3040-\u30ff]")
_HANGUL_RE = re.compile(r"[\uac00-\ud7af]")
_WHITESPACE_RE = re.compile(r"\s+")
_TRIM_CHARS = " \t\r\n.,!?;:\"'()[]{}<>，。！？；：、“”‘’（）【】《》、…·-—"
_SENTENCE_CLOSERS = frozenset("\"'”’）】》」』〉〕〗]")
_RELATIONSHIP_SUFFIXES_BY_LANGUAGE = {
    "zh": ("关系", "關係"),
    "ja": ("関係",),
    "ko": ("관계",),
}
_ALL_CJK_RELATIONSHIP_SUFFIXES = tuple(
    dict.fromkeys(
        suffix
        for suffixes in _RELATIONSHIP_SUFFIXES_BY_LANGUAGE.values()
        for suffix in suffixes
    )
)


def _normalize_text(value: str | None) -> str:
    return unicodedata.normalize("NFKC", value or "")


def detect_language_from_text(
    text: str,
    *,
    cjk_space_ratio_threshold: float = DEFAULT_CJK_SPACE_RATIO_THRESHOLD,
) -> str:
    normalized = _normalize_text(text)
    if not normalized.strip():
        return "en"

    if _HANGUL_RE.search(normalized):
        return "ko"
    if _KANA_RE.search(normalized):
        return "ja"

    cjk_count = sum(1 for ch in normalized if _CJK_RE.match(ch))
    latin_count = sum(1 for ch in normalized if ch.isascii() and ch.isalpha())
    if cjk_count:
        space_ratio = normalized.count(" ") / max(len(normalized), 1)
        if cjk_count >= latin_count or space_ratio < cjk_space_ratio_threshold:
            return "zh"

    return "en"


def resolve_text_processing_language(
    language: str | None,
    *,
    sample_text: str | None = None,
    default: str = DEFAULT_LANGUAGE,
) -> str:
    normalized = normalize_language_code(language, default=None)
    if normalized:
        return normalized

    if sample_text:
        detected = normalize_language_code(detect_language_from_text(sample_text), default=None)
        if detected:
            return detected

    normalized_default = normalize_language_code(default, default=None)
    if normalized_default:
        return normalized_default
    return DEFAULT_LANGUAGE


@dataclass(frozen=True, slots=True)
class LanguagePolicy:
    language: str
    base_language: str
    family: str
    tokenizer_kind: str
    common_words_bucket: str
    sentence_terminators: tuple[str, ...]
    relationship_suffixes: tuple[str, ...]

    def normalize_for_matching(self, value: str | None) -> str:
        return _normalize_text(value).casefold()

    def normalize_token(self, token: str | None) -> str:
        return _normalize_text(token).strip(_TRIM_CHARS)

    def match_has_word_boundaries(self, text: str, start: int, end: int) -> bool:
        if self.family == "cjk":
            return True

        def is_word_char(ch: str) -> bool:
            return ch.isalnum() or ch in {"_", "-"}

        left_ok = start <= 0 or not is_word_char(text[start - 1])
        right_ok = end >= len(text) or not is_word_char(text[end])
        return left_ok and right_ok

    def canonicalize_relationship_label(self, label: str | None) -> str:
        normalized = _WHITESPACE_RE.sub(" ", _normalize_text(label).strip())
        canonical = normalized.casefold()

        suffixes = self.relationship_suffixes
        if self.family == "cjk":
            suffixes = _ALL_CJK_RELATIONSHIP_SUFFIXES

        for suffix in suffixes:
            suffix_key = suffix.casefold()
            if canonical.endswith(suffix_key) and len(canonical) > len(suffix_key):
                canonical = canonical[: -len(suffix_key)].rstrip()
                break

        return canonical or normalized.casefold()

    def trim_to_sentence_boundary(
        self,
        text: str,
        target_chars: int,
        *,
        backtrack_window: int = DEFAULT_SENTENCE_BACKTRACK_WINDOW,
    ) -> str:
        if target_chars <= 0:
            return text

        slice_end = min(len(text), target_chars)
        trimmed = text[:slice_end].rstrip()
        if self._ends_with_sentence_boundary(trimmed):
            return trimmed

        window_start = max(0, slice_end - backtrack_window)
        for idx in range(slice_end, window_start, -1):
            if self._is_sentence_boundary_at(text, idx):
                return text[:idx].rstrip()

        for idx in range(slice_end, 0, -1):
            if self._is_sentence_boundary_at(text, idx):
                return text[:idx].rstrip()

        return trimmed

    def _ends_with_sentence_boundary(self, text: str) -> bool:
        return self._is_sentence_boundary_at(text, len(text))

    def _is_sentence_boundary_at(self, text: str, end_idx: int) -> bool:
        if end_idx <= 0:
            return False

        pos = end_idx - 1
        while pos >= 0 and text[pos] in _SENTENCE_CLOSERS:
            pos -= 1
        return pos >= 0 and text[pos] in self.sentence_terminators


def get_language_policy(
    language: str | None = None,
    *,
    sample_text: str | None = None,
    default: str = DEFAULT_LANGUAGE,
) -> LanguagePolicy:
    resolved = resolve_text_processing_language(language, sample_text=sample_text, default=default)
    base = resolved.split("-", 1)[0]

    if base == "zh":
        return LanguagePolicy(
            language=resolved,
            base_language=base,
            family="cjk",
            tokenizer_kind="jieba",
            common_words_bucket="zh",
            sentence_terminators=("。", "！", "？", "!", "?", "…", "."),
            relationship_suffixes=_RELATIONSHIP_SUFFIXES_BY_LANGUAGE["zh"],
        )

    if base == "ja":
        return LanguagePolicy(
            language=resolved,
            base_language=base,
            family="cjk",
            tokenizer_kind="cjk_bigram",
            common_words_bucket="zh",
            sentence_terminators=("。", "！", "？", "!", "?", "…", "."),
            relationship_suffixes=_RELATIONSHIP_SUFFIXES_BY_LANGUAGE["ja"],
        )

    if base == "ko":
        return LanguagePolicy(
            language=resolved,
            base_language=base,
            family="cjk",
            tokenizer_kind="cjk_bigram",
            common_words_bucket="zh",
            sentence_terminators=(".", "!", "?", "…", "。", "！", "？"),
            relationship_suffixes=_RELATIONSHIP_SUFFIXES_BY_LANGUAGE["ko"],
        )

    return LanguagePolicy(
        language=resolved,
        base_language=base,
        family="whitespace",
        tokenizer_kind="whitespace",
        common_words_bucket="en",
        sentence_terminators=(".", "!", "?", "…", "。", "！", "？"),
        relationship_suffixes=(),
    )
