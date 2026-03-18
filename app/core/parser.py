# SPDX-FileCopyrightText: 2026 Isaac.X.Ω.Yuan
# SPDX-License-Identifier: AGPL-3.0-only

import re
from pathlib import Path
from typing import List, Tuple

from app.language_policy import get_language_policy


_CHINESE_NUMERAL_RE = "0-9０-９零〇一二三四五六七八九十百千万兩两壱弐参肆伍陆陸柒捌玖拾佰仟萬"
_CHAPTER_PATTERNS_BY_LANGUAGE = {
    "zh": (
        rf"^\s*(?:第[{_CHINESE_NUMERAL_RE}]+[章回节卷篇幕]|序[章言]|楔子|尾声|尾聲|后记|後記|番外(?:篇)?|终章|終章).*$",
    ),
    "ja": (
        rf"^\s*(?:第[{_CHINESE_NUMERAL_RE}]+[章話回節幕巻卷編篇]|プロローグ|エピローグ|外伝|番外編?|後書き|あとがき|序章|終章).*$",
    ),
    "ko": (
        r"^\s*(?:제\s*[0-9０-９]+(?:장|화|편|막)|프롤로그|에필로그|외전|후기|서장|종장).*$",
    ),
    "en": (
        r"^\s*(?:(?:chapter\s+(?:\d+|[ivxlcdm]+)\b.*)|prologue\b.*|epilogue\b.*|afterword\b.*|appendix\b.*|interlude\b.*|preface\b.*)$",
    ),
}
_FALLBACK_TITLE_BY_LANGUAGE = {
    "zh": "第{n}章",
    "ja": "第{n}章",
    "ko": "제{n}장",
    "en": "Chapter {n}",
}
_SUPPORTED_TEXT_ENCODINGS = ("utf-8", "gb18030", "gbk", "gb2312", "utf-16")


def _ordered_chapter_patterns(language: str | None, *, sample_text: str) -> list[str]:
    policy = get_language_policy(language, sample_text=sample_text)
    ordered_languages = [policy.base_language, "zh", "ja", "ko", "en"]
    seen: set[str] = set()
    patterns: list[str] = []
    for code in ordered_languages:
        if code in seen:
            continue
        seen.add(code)
        patterns.extend(_CHAPTER_PATTERNS_BY_LANGUAGE.get(code, ()))
    return patterns


def _fallback_chapter_title(language: str | None, *, sample_text: str, chapter_number: int = 1) -> str:
    policy = get_language_policy(language, sample_text=sample_text)
    template = _FALLBACK_TITLE_BY_LANGUAGE.get(policy.base_language, _FALLBACK_TITLE_BY_LANGUAGE["en"])
    return template.format(n=chapter_number)


def read_novel_file_text(file_path: str) -> str:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Novel file not found: {file_path}")

    for encoding in _SUPPORTED_TEXT_ENCODINGS:
        try:
            return path.read_text(encoding=encoding)
        except (UnicodeDecodeError, UnicodeError):
            continue

    raise ValueError(f"Unable to decode file with supported encodings: {file_path}")


def parse_novel_text(content: str, *, language: str | None = None) -> List[Tuple[int, str, str]]:
    """
    Parse novel text and split by chapters.

    Returns:
        List[(chapter_num, chapter_title, chapter_content)]

    Note:
        `chapter_title` preserves the full title line (e.g. "第一章 开端", "Chapter 1 Beginning").
        Downstream UI can choose how to display it.
    """
    chapter_title_patterns = _ordered_chapter_patterns(language, sample_text=content)

    # Find all chapter titles and their positions
    chapter_positions = []
    for pattern in chapter_title_patterns:
        for match in re.finditer(pattern, content, re.MULTILINE | re.IGNORECASE):
            chapter_positions.append((match.start(), match.group()))
        if chapter_positions:
            break

    if not chapter_positions:
        # Fallback: treat entire content as one chapter
        return [(1, _fallback_chapter_title(language, sample_text=content), content.strip())]

    # Sort by position (should already be sorted, but ensure)
    chapter_positions.sort(key=lambda x: x[0])

    # Extract chapters with content
    result = []
    for i, (pos, title) in enumerate(chapter_positions):
        # Content starts after the title line
        content_start = pos + len(title)
        # Content ends at next chapter or end of file
        if i + 1 < len(chapter_positions):
            content_end = chapter_positions[i + 1][0]
        else:
            content_end = len(content)

        chapter_content = content[content_start:content_end].strip()
        result.append((i + 1, title.strip(), chapter_content))

    return result


def parse_novel_file(file_path: str, *, language: str | None = None) -> List[Tuple[int, str, str]]:
    return parse_novel_text(read_novel_file_text(file_path), language=language)


def chinese_to_arabic(chinese_num: str) -> int:
    """Convert Chinese numerals to Arabic numerals."""
    chinese_digits = {
        "零": 0, "一": 1, "二": 2, "三": 3, "四": 4,
        "五": 5, "六": 6, "七": 7, "八": 8, "九": 9,
    }
    chinese_units = {"十": 10, "百": 100, "千": 1000, "万": 10000}

    if chinese_num.isdigit():
        return int(chinese_num)

    result = 0
    temp = 0

    for char in chinese_num:
        if char in chinese_digits:
            temp = chinese_digits[char]
        elif char in chinese_units:
            if temp == 0:
                temp = 1
            result += temp * chinese_units[char]
            temp = 0

    result += temp
    return result if result > 0 else 1
