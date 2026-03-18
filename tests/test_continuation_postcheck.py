import types


def test_postcheck_flags_unknown_terms_and_address_tokens():
    from app.core.continuation_postcheck import postcheck_continuation

    writer_ctx = {
        "entities": [
            {"name": "\u590f\u503e\u6708", "aliases": ["\u795e\u65e0\u5fc6"]},
            {"name": "\u795e\u65e0\u538c\u591c", "aliases": []},
        ],
        "systems": [],
    }
    recent_text = "\u795e\u65e0\u5fc6\u7f13\u6b65\u8d70\u5165\u6bbf\u4e2d\u3002"

    cont = types.SimpleNamespace(
        content="\u795e\u65e0\u538c\u591c\u51b7\u7b11\u9053\uff1a\u201c\u5fc6\u513f\uff01\u628a\u2018\u6c38\u591c\u6e0a\u2019\u7ed9\u672c\u5c0a\uff01\u201d"
    )

    warnings = postcheck_continuation(
        writer_ctx=writer_ctx,
        recent_text=recent_text,
        user_prompt=None,
        continuations=[cont],
    )

    assert any(w.code == "unknown_address_token" and w.term == "\u5fc6\u513f" for w in warnings)
    assert any(w.code == "unknown_term_quoted" and w.term == "\u6c38\u591c\u6e0a" for w in warnings)
    assert all(w.version == 1 for w in warnings)
    assert all(w.message_key.startswith("continuation.postcheck.warning.") for w in warnings)
    assert any(w.message_params == {"term": "\u5fc6\u513f"} for w in warnings)


def test_postcheck_ja_naming_cues():
    """Japanese naming cue patterns detect invented names."""
    from app.core.continuation_postcheck import postcheck_continuation

    writer_ctx = {"entities": [{"name": "\u592a\u90ce", "aliases": []}], "systems": []}

    cont = types.SimpleNamespace(
        content="\u9b54\u738b\u3068\u547c\u3070\u308c\u308b\u95c7\u306e\u652f\u914d\u8005\u304c\u73fe\u308c\u305f\u3002\u300c\u6b21\u90ce\uff01\u9003\u3052\u308d\uff01\u300d"
    )

    warnings = postcheck_continuation(
        writer_ctx=writer_ctx,
        recent_text="\u592a\u90ce\u306f\u5263\u3092\u69cb\u3048\u305f\u3002",
        user_prompt=None,
        continuations=[cont],
        novel_language="ja",
    )

    assert any(w.code == "unknown_term_named" and w.term == "\u9b54\u738b" for w in warnings)
    assert any(w.code == "unknown_address_token" and w.term == "\u6b21\u90ce" for w in warnings)


def test_postcheck_ko_naming_cues():
    """Korean naming cue patterns detect invented names."""
    from app.core.continuation_postcheck import postcheck_continuation

    writer_ctx = {"entities": [{"name": "\ucca0\uc218", "aliases": []}], "systems": []}

    cont = types.SimpleNamespace(
        content="\uc774\ub984\uc740 \ub9c8\uc655\uc774\ub77c\ub294 \uc790\uac00 \ub098\ud0c0\ub0ac\ub2e4. \"\uc601\ud76c\uff01\ub3c4\ub9dd\uccd0\uff01\""
    )

    warnings = postcheck_continuation(
        writer_ctx=writer_ctx,
        recent_text="\ucca0\uc218\ub294 \uce7c\uc744 \ub4e4\uc5c8\ub2e4.",
        user_prompt=None,
        continuations=[cont],
        novel_language="ko",
    )

    terms_found = [(w.code, w.term) for w in warnings]
    assert any(
        code == "unknown_term_named" and "\ub9c8\uc655" in term
        for code, term in terms_found
    ), f"Expected Korean naming cue match, got: {terms_found}"
    assert any(w.code == "unknown_address_token" and w.term == "\uc601\ud76c" for w in warnings)


def test_postcheck_en_naming_cues():
    """English naming cue patterns detect invented names."""
    from app.core.continuation_postcheck import postcheck_continuation

    writer_ctx = {"entities": [{"name": "Alice", "aliases": []}], "systems": []}

    cont = types.SimpleNamespace(
        content='A warrior named Zarkon appeared. \u201cZoritha! Run!\u201d'
    )

    warnings = postcheck_continuation(
        writer_ctx=writer_ctx,
        recent_text="Alice drew her sword.",
        user_prompt=None,
        continuations=[cont],
        novel_language="en",
    )

    assert any(w.code == "unknown_term_named" and w.term == "Zarkon" for w in warnings)
    assert any(w.code == "unknown_address_token" and w.term == "Zoritha" for w in warnings)
