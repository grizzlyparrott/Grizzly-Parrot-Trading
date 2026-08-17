import re
import unittest
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_CONTENT_DIRECTORIES = (
    "books",
    "currencies",
    "energies",
    "futures-basics",
    "market-basics",
    "metals",
    "platforms-tutorials",
    "prop-firm-trading",
    "tools",
)
METADATA_CLASS_PARTS = ("byline", "article-meta", "hero-meta", "post-meta")
INTERNAL_REVIEW_CLAIM = re.compile(
    r"\b(?:primary[ -]?source|official[ -]?help|sources?|research|facts?|accuracy|"
    r"evidence|editorial(?:ly)?)[\s-]*(?:review(?:ed)?|check(?:ed)?|verif(?:ied|ication)|"
    r"validat(?:ed|ion))(?:[\s:-]+(?:complete|completed|passed))?\b|"
    r"\b(?:reviewed|checked|verified|validated)(?:\s+\w+){0,3}\s+(?:primary[ -]?sources?|"
    r"official[ -]?help|sources?|research|facts?|accuracy|evidence)\b|"
    r"\bindependently\s+(?:checked|reviewed|verified|validated)\b",
    re.IGNORECASE,
)


class ArticleMetadataParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self._depth = 0
        self._chunks: list[str] = []
        self.metadata_blocks: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]):
        attributes = dict(attrs)
        classes = (attributes.get("class") or "").lower().split()
        aria_label = (attributes.get("aria-label") or "").strip().lower()
        is_metadata = any(
            part in class_name
            for class_name in classes
            for part in METADATA_CLASS_PARTS
        ) or aria_label == "article details"

        if self._depth:
            self._depth += 1
        elif is_metadata:
            self._depth = 1
            self._chunks = []

    def handle_endtag(self, tag: str):
        if not self._depth:
            return

        self._depth -= 1
        if self._depth == 0:
            text = " ".join("".join(self._chunks).split())
            self.metadata_blocks.append(text)
            self._chunks = []

    def handle_data(self, data: str):
        if self._depth:
            self._chunks.append(data)


class ArticleMetadataHygieneTests(unittest.TestCase):
    def test_internal_review_claim_variants_are_detected(self):
        examples = (
            "Primary-source review completed",
            "Official-help review complete",
            "Fact-checked",
            "Sources verified",
            "Reviewed against primary sources",
            "CME examples independently checked",
        )

        for example in examples:
            with self.subTest(example=example):
                self.assertRegex(example, INTERNAL_REVIEW_CLAIM)

    def test_normal_publication_metadata_is_allowed(self):
        examples = (
            "By Kyle Parrott · Updated August 17, 2026",
            "By Kyle Parrott · Published November 20, 2025",
            "8 minute read",
        )

        for example in examples:
            with self.subTest(example=example):
                self.assertNotRegex(example, INTERNAL_REVIEW_CLAIM)

    def test_bylines_do_not_advertise_internal_review_work(self):
        violations: list[str] = []

        for directory_name in PUBLIC_CONTENT_DIRECTORIES:
            directory = ROOT / directory_name
            for path in sorted(directory.rglob("*.html")):
                parser = ArticleMetadataParser()
                parser.feed(path.read_text(encoding="utf-8"))
                for block in parser.metadata_blocks:
                    match = INTERNAL_REVIEW_CLAIM.search(block)
                    if match:
                        violations.append(
                            f"{path.relative_to(ROOT)}: public article metadata contains "
                            f"internal review claim {match.group(0)!r}"
                        )

        self.assertFalse(
            violations,
            "Sourcing and accuracy checks are baseline editorial work, not byline "
            "promotional copy:\n" + "\n".join(violations),
        )


if __name__ == "__main__":
    unittest.main()
