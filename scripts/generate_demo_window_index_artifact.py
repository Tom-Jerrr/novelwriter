#!/usr/bin/env python3
"""Generate the packaged demo window-index artifact from current logic."""

from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def main() -> None:
    from app.core.seed_demo import (
        DEMO_WINDOW_INDEX_ARTIFACT,
        write_demo_window_index_artifact,
    )

    artifact = write_demo_window_index_artifact()
    print(f"wrote {DEMO_WINDOW_INDEX_ARTIFACT}")
    print(f"chapter_count={artifact.chapter_count}")
    print(f"language={artifact.language}")
    print(f"entities={len(artifact.entity_windows)}")
    print(f"windows={len(artifact.window_entities)}")


if __name__ == "__main__":
    main()
