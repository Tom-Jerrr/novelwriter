from app.core.generator import _trim_to_target_chars
from app.language_policy import detect_language_from_text, get_language_policy


def test_detect_language_from_text_supports_cjk_families():
    assert detect_language_from_text("Alice and Bob walked home.") == "en"
    assert detect_language_from_text("云澈看向远方。") == "zh"
    assert detect_language_from_text("勇者は城へ向かった。") == "ja"
    assert detect_language_from_text("민수는 집으로 돌아갔다.") == "ko"


def test_english_policy_trims_at_period_boundary():
    trimmed = get_language_policy("en").trim_to_sentence_boundary(
        "Alpha beta. Gamma delta. Omega",
        17,
    )

    assert trimmed == "Alpha beta."


def test_english_policy_treats_apostrophes_as_word_boundaries():
    policy = get_language_policy("en")
    straight = "Alice's lantern dimmed."
    curly = "Alice’s lantern dimmed."

    straight_start = straight.index("Alice")
    curly_start = curly.index("Alice")

    assert policy.match_has_word_boundaries(straight, straight_start, straight_start + len("Alice"))
    assert policy.match_has_word_boundaries(curly, curly_start, curly_start + len("Alice"))


def test_generator_trim_uses_language_policy_for_english():
    trimmed = _trim_to_target_chars(
        "Alpha beta. Gamma delta. Omega",
        17,
        language="en",
    )

    assert trimmed == "Alpha beta."
