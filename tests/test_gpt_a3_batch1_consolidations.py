import json
import re
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = "https://grizzlyparrottrading.com"
REVIEW_DATE = "2026-09-19"

MAPPINGS = {
    "/market-basics/volatility-clustering-in-markets.html": "/market-basics/volatility-clustering-basics.html",
    "/market-basics/market-liquidity-basics.html": "/market-basics/liquidity-basics.html",
    "/market-basics/what-is-market-microstructure.html": "/market-basics/market-microstructure-the-hidden-engine.html",
    "/futures-basics/how-open-interest-signals-futures-trend-strength.html": "/futures-basics/futures-open-interest-explained.html",
    "/platforms-tutorials/ninjatrader-chart-templates-basics.html": "/platforms-tutorials/ninjatrader-advanced-templates.html",
}

VISUALS = {
    "/market-basics/volatility-clustering-basics.html": "market-basics/volatility-clustering-regime-map.svg",
    "/market-basics/liquidity-basics.html": "market-basics/liquidity-execution-map.svg",
    "/market-basics/market-microstructure-the-hidden-engine.html": "market-basics/market-microstructure-order-lifecycle.svg",
    "/futures-basics/futures-open-interest-explained.html": "futures-basics/open-interest-lifecycle.svg",
    "/platforms-tutorials/ninjatrader-advanced-templates.html": "platforms-tutorials/ninjatrader-template-map.svg",
}

# These are content-review gates for the five broad survivor topics. They are
# deliberately topic-specific: word count is only one signal of completeness.
CONTENT_REQUIREMENTS = {
    "/market-basics/volatility-clustering-basics.html": {
        "minimum_words": 1200,
        "headings": (
            "What clustering does and does not say",
            "Why absolute and squared returns are useful",
            "Worked measurement example",
            "Regimes, GARCH-style thinking, and limits",
            "Practical risk workflow",
        ),
        "practical": "Practical risk workflow",
    },
    "/market-basics/liquidity-basics.html": {
        "minimum_words": 1200,
        "headings": (
            "Executable size, not just displayed size",
            "Volume is not liquidity",
            "Conditions where a normal reading can fail",
            "Example: two orders, one spread",
            "A practical pre-trade check",
        ),
        "practical": "A practical pre-trade check",
    },
    "/market-basics/market-microstructure-the-hidden-engine.html": {
        "minimum_words": 1200,
        "headings": (
            "Matching, queues, and price impact",
            "Concrete execution example",
            "Order instructions have tradeoffs",
            "Common bad inferences",
            "Practical observation workflow",
        ),
        "practical": "Practical observation workflow",
    },
    "/futures-basics/futures-open-interest-explained.html": {
        "minimum_words": 1200,
        "headings": (
            "Three contract-lifecycle examples",
            "Contract-month selection and the roll",
            "Use cases and edge cases",
            "Why the classic trend matrix is only a heuristic",
            "Practical report check",
        ),
        "practical": "Practical report check",
    },
    "/platforms-tutorials/ninjatrader-advanced-templates.html": {
        "minimum_words": 1200,
        "headings": (
            "What a chart template does not replace",
            "Concrete workflow: build a repeatable chart",
            "Templates and workspaces are not the same thing",
            "Troubleshooting checklist",
            "Backup, import, and change-control caveat",
        ),
        "practical": "Concrete workflow: build a repeatable chart",
    },
}


def article_body(html):
    return html.split("<!-- ARTICLE BODY START -->", 1)[1].split(
        "<!-- ARTICLE BODY END -->", 1
    )[0]


def body_word_count(body):
    plain = re.sub(r"<[^>]+>", " ", body)
    return len(re.findall(r"\b[\w'-]+\b", plain))


class GPTA3Batch1Tests(unittest.TestCase):
    def test_batch_scope_is_five_clusters(self):
        self.assertEqual(len(MAPPINGS), 5)
        self.assertEqual(len(set(MAPPINGS.values())), 5)

    def test_survivors_have_reviewed_trust_metadata_and_valid_schema(self):
        for survivor in MAPPINGS.values():
            with self.subTest(survivor=survivor):
                html = (ROOT / survivor.lstrip("/")).read_text(encoding="utf-8")
                self.assertEqual(html.count("<h1>"), 1)
                self.assertIn("Updated September 19, 2026", html)
                self.assertIn(
                    f'<meta property="article:modified_time" content="{REVIEW_DATE}">',
                    html,
                )
                self.assertIn(f'"dateModified": "{REVIEW_DATE}"', html)
                self.assertIn(
                    f'<link rel="canonical" href="{BASE}{survivor}">', html
                )
                self.assertIn('class="trust-disclosure"', html)
                self.assertRegex(html, r'class="trust-disclosure"[\s\S]*href="https://')
                blocks = re.findall(
                    r'<script type="application/ld\+json">\s*(.*?)\s*</script>',
                    html,
                    re.S,
                )
                self.assertEqual(len(blocks), 2)
                for block in blocks:
                    json.loads(block)

    def test_redirect_endpoints_match_the_pilot_method(self):
        for old, survivor in MAPPINGS.items():
            with self.subTest(old=old):
                html = (ROOT / old.lstrip("/")).read_text(encoding="utf-8")
                target = f"{BASE}{survivor}"
                self.assertIn(f'<link rel="canonical" href="{target}">', html)
                self.assertIn(f'content="0; url={target}"', html)
                self.assertIn(f'window.location.replace("{target}")', html)
                self.assertNotIn("application/ld+json", html)
                self.assertNotIn('name="robots" content="noindex', html)

    def test_search_and_sitemap_expose_only_survivors(self):
        index = json.loads((ROOT / "search-index.json").read_text(encoding="utf-8"))
        urls = [item["url"] for item in index]
        sitemap = ET.parse(ROOT / "sitemap.xml")
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        locs = [node.text for node in sitemap.findall("sm:url/sm:loc", ns)]
        for old, survivor in MAPPINGS.items():
            with self.subTest(old=old):
                self.assertNotIn(old, urls)
                self.assertEqual(urls.count(survivor), 1)
                self.assertNotIn(f"{BASE}{old}", locs)
                self.assertEqual(locs.count(f"{BASE}{survivor}"), 1)

    def test_no_live_internal_page_links_to_consolidated_urls(self):
        offenders = []
        redirect_paths = {ROOT / old.lstrip("/") for old in MAPPINGS}
        for path in ROOT.rglob("*.html"):
            if path in redirect_paths or "outputs" in path.parts:
                continue
            text = path.read_text(encoding="utf-8", errors="strict")
            for old in MAPPINGS:
                if old in text or f"{BASE}{old}" in text:
                    offenders.append((path.relative_to(ROOT).as_posix(), old))
        self.assertEqual(offenders, [])

    def test_hubs_have_one_discovery_card_per_survivor(self):
        hubs = {
            "/market-basics/volatility-clustering-basics.html": "market-basics/index.html",
            "/market-basics/liquidity-basics.html": "market-basics/index.html",
            "/market-basics/market-microstructure-the-hidden-engine.html": "market-basics/index.html",
            "/futures-basics/futures-open-interest-explained.html": "futures-basics/index.html",
            "/platforms-tutorials/ninjatrader-advanced-templates.html": "platforms-tutorials/index.html",
        }
        for survivor, hub in hubs.items():
            with self.subTest(survivor=survivor):
                html = (ROOT / hub).read_text(encoding="utf-8")
                expected = f"{BASE}{survivor}" if hub.startswith("platforms") else survivor
                card_class = "card" if hub.startswith("platforms") else "fbh-guide-card"
                cards = re.findall(
                    rf'<article class="{card_class}".*?</article>', html, re.S
                )
                self.assertEqual(sum(expected in card for card in cards), 1)

    def test_removed_unsupported_claims_do_not_survive(self):
        forbidden = {
            "/platforms-tutorials/ninjatrader-advanced-templates.html": (
                "Local Templates vs Global Templates",
                "Global templates avoid this problem entirely",
            ),
            "/futures-basics/futures-open-interest-explained.html": (
                "new money entering",
                "shorts covering, not new buyers",
            ),
            "/market-basics/market-microstructure-the-hidden-engine.html": (
                "reveals the truth about who is in control",
            ),
            "/market-basics/liquidity-basics.html": (
                "Volatility is not randomness. It’s a direct function of liquidity depth.",
            ),
        }
        for survivor, phrases in forbidden.items():
            html = (ROOT / survivor.lstrip("/")).read_text(encoding="utf-8")
            for phrase in phrases:
                with self.subTest(survivor=survivor, phrase=phrase):
                    self.assertNotIn(phrase.lower(), html.lower())

    def test_each_survivor_has_an_original_explanatory_visual(self):
        self.assertEqual(set(MAPPINGS.values()), set(VISUALS))
        stylesheet = (ROOT / "editorial-guide-visuals.css").read_text(encoding="utf-8")
        self.assertIn(".editorial-guide .eg-visual", stylesheet)
        for survivor, asset in VISUALS.items():
            with self.subTest(survivor=survivor):
                html = (ROOT / survivor.lstrip("/")).read_text(encoding="utf-8")
                svg = (ROOT / asset).read_text(encoding="utf-8")
                self.assertIn('class="container article-content editorial-guide"', html)
                self.assertIn(f'src="{Path(asset).name}"', html)
                self.assertIn('class="eg-visual"', html)
                self.assertRegex(svg, r'<svg[^>]+role="img"')
                self.assertIn("<title", svg)
                self.assertIn("<desc", svg)

    def test_survivors_pass_topic_specific_content_quality_gate(self):
        self.assertEqual(set(CONTENT_REQUIREMENTS), set(MAPPINGS.values()))
        for survivor, requirement in CONTENT_REQUIREMENTS.items():
            with self.subTest(survivor=survivor):
                html = (ROOT / survivor.lstrip("/")).read_text(encoding="utf-8")
                body = article_body(html)
                headings = re.findall(r"<h2[^>]*>(.*?)</h2>", body, re.S)
                heading_text = " ".join(re.sub(r"<[^>]+>", "", h) for h in headings)
                self.assertGreaterEqual(
                    body_word_count(body), requirement["minimum_words"],
                    "broad topic lacks sufficient substantive body depth",
                )
                self.assertGreaterEqual(len(headings), 8)
                for expected in requirement["headings"]:
                    self.assertIn(expected, heading_text)
                self.assertIn(requirement["practical"], heading_text)
                self.assertIn('class="trust-disclosure"', body)
                self.assertRegex(body, r"<table|<ol|<ul")


if __name__ == "__main__":
    unittest.main()
