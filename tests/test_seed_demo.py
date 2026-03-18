"""Tests for the demo novel seed function."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.core.seed_demo as seed_demo_module
from app.config import get_settings
from app.core.auth import hash_password
from app.core.indexing import NovelIndex
from app.core.seed_demo import (
    DEMO_TITLE,
    DEMO_TXT,
    load_demo_window_index_artifact,
    seed_demo_novel,
)
from app.database import Base
from app.models import Chapter, Novel, User, WorldEntity, WorldRelationship, WorldSystem

engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(bind=engine)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _fresh_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    return TestingSessionLocal()


def _make_user(db, username="test_seed_user"):
    user = User(username=username, hashed_password=hash_password("x"), is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _make_novel_with_chapters(
    db, user: User, *, title: str, chapter_count: int
) -> Novel:
    novel = Novel(
        title=title,
        author="primer",
        file_path=f"/tmp/{title}.txt",
        total_chapters=chapter_count,
        owner_id=user.id,
    )
    db.add(novel)
    db.flush()
    for chapter_number in range(1, chapter_count + 1):
        db.add(
            Chapter(
                novel_id=novel.id,
                chapter_number=chapter_number,
                title=f"primer-{chapter_number}",
                content=f"primer content {chapter_number}",
            )
        )
    db.commit()
    db.refresh(novel)
    return novel


def test_packaged_demo_window_index_artifact_matches_current_inputs():
    artifact = load_demo_window_index_artifact()

    artifact.validate(settings=get_settings(), source_txt_path=DEMO_TXT)
    assert artifact.chapter_count == 27
    assert artifact.entity_windows
    assert artifact.window_entities


def test_seed_creates_novel_worldpack_and_packaged_index_without_runtime_rebuild(
    monkeypatch,
):
    db = _fresh_db()
    user = _make_user(db)
    _make_novel_with_chapters(db, user, title="primer", chapter_count=5)

    def _unexpected_runtime_build(*args, **kwargs):
        raise AssertionError(
            "seed_demo_novel should not rebuild the packaged window index at runtime"
        )

    monkeypatch.setattr(
        seed_demo_module,
        "build_window_index_artifacts",
        _unexpected_runtime_build,
    )

    novel_id = seed_demo_novel(db, user)

    assert novel_id is not None
    novel = db.query(Novel).filter(Novel.id == novel_id).one()
    assert novel.title == DEMO_TITLE
    assert novel.owner_id == user.id

    chapters = db.query(Chapter).filter(Chapter.novel_id == novel_id).all()
    assert len(chapters) == 27

    entities = db.query(WorldEntity).filter(WorldEntity.novel_id == novel_id).all()
    assert len(entities) >= 20

    rels = (
        db.query(WorldRelationship).filter(WorldRelationship.novel_id == novel_id).all()
    )
    assert len(rels) >= 15

    systems = db.query(WorldSystem).filter(WorldSystem.novel_id == novel_id).all()
    assert len(systems) == 5

    assert novel.window_index_status == "fresh"
    assert novel.window_index_revision >= 1
    assert novel.window_index_built_revision == novel.window_index_revision
    assert novel.window_index is not None

    index = NovelIndex.from_msgpack(novel.window_index)
    referenced_chapter_ids = {
        ref.chapter_id for refs in index.entity_windows.values() for ref in refs
    }
    demo_chapter_ids = {chapter.id for chapter in chapters}

    assert referenced_chapter_ids
    assert referenced_chapter_ids <= demo_chapter_ids
    assert min(referenced_chapter_ids) > 5
    db.close()


def test_seed_is_idempotent():
    db = _fresh_db()
    user = _make_user(db)
    first_id = seed_demo_novel(db, user)
    second_id = seed_demo_novel(db, user)

    assert first_id is not None
    assert second_id is None

    count = (
        db.query(Novel)
        .filter(Novel.owner_id == user.id, Novel.title == DEMO_TITLE)
        .count()
    )
    assert count == 1
    db.close()


def test_seed_does_not_affect_other_users():
    db = _fresh_db()
    user_a = _make_user(db, "seed_a")
    user_b = _make_user(db, "seed_b")

    id_a = seed_demo_novel(db, user_a)
    id_b = seed_demo_novel(db, user_b)

    assert id_a is not None
    assert id_b is not None
    assert id_a != id_b
    db.close()
