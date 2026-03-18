# SPDX-FileCopyrightText: 2026 Isaac.X.Ω.Yuan
# SPDX-License-Identifier: AGPL-3.0-only

"""Seed a demo novel (西游记 前27回) for a newly registered user.

Called once per user at invite-registration time. The function is
idempotent per user: if the user already owns a novel titled "西游记",
no duplicate is created.

Assets required (committed to repo):
  - data/demo/西游记_前27回.txt
  - data/demo/西游记_前27回.window_index.v1.msgpack
  - data/worldpacks/journey-to-the-west.json
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import json
import logging
from pathlib import Path
from typing import Any, Mapping

from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.core.indexing import (
    ChapterText,
    NovelIndex,
    WindowRef,
    build_window_index_artifacts,
    mark_window_index_build_succeeded,
    resolve_window_index_target_revision,
)
from app.core.parser import parse_novel_file
from app.core.world.worldpack_import import import_worldpack_payload
from app.models import Chapter, Novel, User

logger = logging.getLogger(__name__)

try:
    import msgpack
except ImportError:  # pragma: no cover - fallback for environments without msgpack
    msgpack = None

REPO_ROOT = Path(__file__).resolve().parents[2]
DEMO_TXT = REPO_ROOT / "data" / "demo" / "西游记_前27回.txt"
DEMO_WINDOW_INDEX_ARTIFACT = (
    REPO_ROOT / "data" / "demo" / "西游记_前27回.window_index.v1.msgpack"
)
DEMO_WORLDPACK = REPO_ROOT / "data" / "worldpacks" / "journey-to-the-west.json"

DEMO_TITLE = "西游记"
DEMO_AUTHOR = "吴承恩"
DEMO_WINDOW_INDEX_ARTIFACT_VERSION = 1


@dataclass(frozen=True, slots=True)
class PackagedWindowRef:
    window_id: int
    chapter_number: int
    start_pos: int
    end_pos: int
    entity_count: int

    def to_dict(self) -> dict[str, int]:
        return {
            "window_id": self.window_id,
            "chapter_number": self.chapter_number,
            "start_pos": self.start_pos,
            "end_pos": self.end_pos,
            "entity_count": self.entity_count,
        }

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "PackagedWindowRef":
        return cls(
            window_id=int(data["window_id"]),
            chapter_number=int(data["chapter_number"]),
            start_pos=int(data["start_pos"]),
            end_pos=int(data["end_pos"]),
            entity_count=int(data["entity_count"]),
        )

    def materialize(self, *, chapter_id: int) -> WindowRef:
        return WindowRef(
            window_id=self.window_id,
            chapter_id=int(chapter_id),
            start_pos=self.start_pos,
            end_pos=self.end_pos,
            entity_count=self.entity_count,
        )


@dataclass(frozen=True, slots=True)
class DemoWindowIndexArtifact:
    format_version: int
    source_txt_sha256: str
    chapter_count: int
    language: str
    settings_signature: dict[str, Any]
    entity_windows: dict[str, list[PackagedWindowRef]]
    window_entities: dict[int, set[str]]

    def to_dict(self) -> dict[str, Any]:
        return {
            "format_version": self.format_version,
            "source_txt_sha256": self.source_txt_sha256,
            "chapter_count": self.chapter_count,
            "language": self.language,
            "settings_signature": dict(self.settings_signature),
            "entity_windows": {
                name: [ref.to_dict() for ref in refs]
                for name, refs in self.entity_windows.items()
            },
            "window_entities": {
                str(window_id): sorted(entities)
                for window_id, entities in self.window_entities.items()
            },
        }

    def to_bytes(self) -> bytes:
        payload = self.to_dict()
        if msgpack is not None:
            return msgpack.packb(payload, use_bin_type=True)
        return json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")

    @classmethod
    def from_bytes(cls, data: bytes) -> "DemoWindowIndexArtifact":
        stripped = data.lstrip()
        if stripped.startswith((b"{", b"[")):
            payload = json.loads(data.decode("utf-8"))
        elif msgpack is not None:
            payload = msgpack.unpackb(data, raw=False)
        else:
            raise RuntimeError("msgpack is required to load the packaged demo artifact")

        return cls(
            format_version=int(payload["format_version"]),
            source_txt_sha256=str(payload["source_txt_sha256"]),
            chapter_count=int(payload["chapter_count"]),
            language=str(payload["language"]),
            settings_signature=dict(payload.get("settings_signature") or {}),
            entity_windows={
                str(name): [PackagedWindowRef.from_dict(ref) for ref in refs]
                for name, refs in (payload.get("entity_windows") or {}).items()
            },
            window_entities={
                int(window_id): set(entities)
                for window_id, entities in (
                    payload.get("window_entities") or {}
                ).items()
            },
        )

    def validate(self, *, settings: Settings, source_txt_path: Path) -> None:
        if self.format_version != DEMO_WINDOW_INDEX_ARTIFACT_VERSION:
            raise ValueError(
                f"Unexpected demo window-index artifact version: {self.format_version}"
            )
        current_source_sha256 = _sha256_file(source_txt_path)
        if self.source_txt_sha256 != current_source_sha256:
            raise ValueError(
                "Demo window-index artifact source hash mismatch: "
                f"expected {current_source_sha256}, got {self.source_txt_sha256}"
            )
        expected_signature = _demo_window_index_settings_signature(settings)
        if self.settings_signature != expected_signature:
            raise ValueError(
                "Demo window-index artifact settings mismatch: "
                f"expected {expected_signature}, got {self.settings_signature}"
            )

    def materialize(
        self,
        *,
        chapter_id_by_number: Mapping[int, int],
    ) -> NovelIndex:
        entity_windows: dict[str, list[WindowRef]] = {}
        for name, refs in self.entity_windows.items():
            materialized_refs: list[WindowRef] = []
            for ref in refs:
                chapter_id = chapter_id_by_number.get(ref.chapter_number)
                if chapter_id is None:
                    raise ValueError(
                        "Missing chapter id for packaged demo index chapter "
                        f"{ref.chapter_number}"
                    )
                materialized_refs.append(ref.materialize(chapter_id=chapter_id))
            entity_windows[name] = materialized_refs

        return NovelIndex(
            entity_windows=entity_windows,
            window_entities={
                int(window_id): set(entities)
                for window_id, entities in self.window_entities.items()
            },
        )


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _demo_window_index_settings_signature(settings: Settings) -> dict[str, Any]:
    return {
        "window_size": int(settings.bootstrap_window_size),
        "window_step": int(settings.bootstrap_window_step),
        "min_window_count": int(settings.bootstrap_min_window_count),
        "min_window_ratio": float(settings.bootstrap_min_window_ratio),
        "include_cooccurrence": False,
        "use_automaton": False,
    }


def build_demo_window_index_artifact(
    *,
    settings: Settings | None = None,
) -> DemoWindowIndexArtifact:
    resolved_settings = settings or get_settings()
    chapters = parse_novel_file(str(DEMO_TXT))
    chapter_texts = [
        ChapterText(chapter_id=chapter_number, text=chapter.content)
        for chapter_number, chapter in enumerate(chapters, start=1)
    ]
    artifacts = build_window_index_artifacts(
        chapter_texts,
        settings=resolved_settings,
        include_cooccurrence=False,
        use_automaton=False,
    )

    return DemoWindowIndexArtifact(
        format_version=DEMO_WINDOW_INDEX_ARTIFACT_VERSION,
        source_txt_sha256=_sha256_file(DEMO_TXT),
        chapter_count=len(chapter_texts),
        language=artifacts.language,
        settings_signature=_demo_window_index_settings_signature(resolved_settings),
        entity_windows={
            name: [
                PackagedWindowRef(
                    window_id=ref.window_id,
                    chapter_number=ref.chapter_id,
                    start_pos=ref.start_pos,
                    end_pos=ref.end_pos,
                    entity_count=ref.entity_count,
                )
                for ref in refs
            ]
            for name, refs in artifacts.index.entity_windows.items()
        },
        window_entities={
            int(window_id): set(entities)
            for window_id, entities in artifacts.index.window_entities.items()
        },
    )


def write_demo_window_index_artifact(
    path: Path = DEMO_WINDOW_INDEX_ARTIFACT,
    *,
    settings: Settings | None = None,
) -> DemoWindowIndexArtifact:
    artifact = build_demo_window_index_artifact(settings=settings)
    path.write_bytes(artifact.to_bytes())
    return artifact


def load_demo_window_index_artifact(
    path: Path = DEMO_WINDOW_INDEX_ARTIFACT,
) -> DemoWindowIndexArtifact:
    return DemoWindowIndexArtifact.from_bytes(path.read_bytes())


def _hydrate_demo_window_index(db: Session, *, novel: Novel) -> None:
    """Best-effort packaged whole-book retrieval payload for the seeded demo novel."""
    settings = get_settings()
    artifact = load_demo_window_index_artifact()
    artifact.validate(settings=settings, source_txt_path=DEMO_TXT)

    chapter_rows = (
        db.query(Chapter.id, Chapter.chapter_number)
        .filter(Chapter.novel_id == novel.id)
        .order_by(Chapter.chapter_number.asc())
        .all()
    )
    chapter_id_by_number = {
        int(chapter_number): int(chapter_id)
        for chapter_id, chapter_number in chapter_rows
    }
    if len(chapter_id_by_number) != artifact.chapter_count:
        raise ValueError(
            "Packaged demo window-index artifact chapter count mismatch: "
            f"expected {artifact.chapter_count}, got {len(chapter_id_by_number)}"
        )

    materialized_index = artifact.materialize(
        chapter_id_by_number=chapter_id_by_number,
    )
    target_revision = resolve_window_index_target_revision(
        novel,
        has_source_text=bool(chapter_id_by_number),
    )
    mark_window_index_build_succeeded(
        novel,
        index_payload=materialized_index.to_msgpack(),
        revision=target_revision,
    )
    db.commit()
    db.refresh(novel)


def seed_demo_novel(db: Session, user: User) -> int | None:
    """Create the demo novel + import worldpack for *user*.

    Returns the novel id on success, or None if skipped/failed.
    """
    existing = (
        db.query(Novel.id)
        .filter(Novel.owner_id == user.id, Novel.title == DEMO_TITLE)
        .first()
    )
    if existing is not None:
        return None

    if not DEMO_TXT.exists():
        logger.warning("seed_demo: txt asset missing: %s", DEMO_TXT)
        return None
    if not DEMO_WORLDPACK.exists():
        logger.warning("seed_demo: worldpack asset missing: %s", DEMO_WORLDPACK)
        return None

    try:
        chapters = parse_novel_file(str(DEMO_TXT))
    except Exception:
        logger.exception("seed_demo: failed to parse demo txt")
        return None

    novel = Novel(
        title=DEMO_TITLE,
        author=DEMO_AUTHOR,
        file_path=str(DEMO_TXT),
        total_chapters=len(chapters),
        owner_id=user.id,
    )
    db.add(novel)
    db.flush()

    for chapter_number, parsed_chapter in enumerate(chapters, start=1):
        db.add(
            Chapter(
                novel_id=novel.id,
                chapter_number=chapter_number,
                title=parsed_chapter.title,
                source_chapter_label=parsed_chapter.source_chapter_label,
                source_chapter_number=parsed_chapter.source_chapter_number,
                content=parsed_chapter.content,
            )
        )
    db.flush()

    db.commit()

    try:
        from app.schemas import WorldpackV1Payload

        raw = json.loads(DEMO_WORLDPACK.read_text(encoding="utf-8"))
        payload = WorldpackV1Payload(**raw)
        import_worldpack_payload(novel_id=novel.id, body=payload, db=db)
    except Exception:
        logger.exception("seed_demo: worldpack import failed (novel %s)", novel.id)

    try:
        _hydrate_demo_window_index(db, novel=novel)
    except Exception:
        logger.exception(
            "seed_demo: window index artifact hydrate failed (novel %s)",
            novel.id,
        )

    logger.info(
        "seed_demo: created novel %s (%d chapters) for user %s",
        novel.id,
        len(chapters),
        user.username,
    )
    return novel.id
