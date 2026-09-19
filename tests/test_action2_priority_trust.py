import json
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REVIEW_DATE = "2026-09-19"
REVIEW_LABEL = "September 19, 2026"

PRIORITY_PATHS = (
    "futures-basics/feeder-cattle-vs-live-cattle-pricing-mechanics.html",
    "market-basics/liquidity-migration-how-liquidity-shifts-through-session.html",
    "energies/cl-tick-size-tick-value-specs.html",
    "index.html",
    "platforms-tutorials/ninjatrader-8-chart-settings-basics.html",
    "platforms-tutorials/tradovate-chart-settings-complete-guide.html",
    "futures-basics/gc-tick-size-tick-value-specs.html",
    "platforms-tutorials/bookmap-connections-and-data-feeds.html",
    "books/metals-market-structure/index.html",
    "tools/index.html",
    "about.html",
    "contact.html",
    "privacy.html",
    "books/index.html",
    "prop-firm-trading/trailing-drawdown-explained.html",
    "futures-basics/gc-market-microstructure.html",
    "prop-firm-trading/prop-firm-refund-policy-explained.html",
    "tools/trailing-drawdown-simulator.html",
    "futures-basics/6s-chf-usd-spot-vs-futures-differences.html",
    "futures-basics/gc-liquidity-levels-structure.html",
    "futures-basics/m6n-micro-contract-guide.html",
    "market-basics/micro-pullbacks-tiny-retracements-reveal-intent.html",
    "futures-basics/es-session-highs-lows-and-vwap-usage.html",
)


class CanonicalParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical = None
        self.h1_count = 0

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "link" and values.get("rel") == "canonical":
            self.canonical = values.get("href")
        if tag == "h1":
            self.h1_count += 1


class Action2PriorityTrustTests(unittest.TestCase):
    def test_scope_is_exactly_the_23_priority_pages(self):
        self.assertEqual(len(PRIORITY_PATHS), 23)
        self.assertEqual(len(set(PRIORITY_PATHS)), 23)
        for rel in PRIORITY_PATHS:
            with self.subTest(rel=rel):
                self.assertTrue((ROOT / rel).is_file())

    def test_every_priority_page_has_one_h1_and_visible_review_date(self):
        for rel in PRIORITY_PATHS:
            with self.subTest(rel=rel):
                html = (ROOT / rel).read_text(encoding="utf-8")
                parser = CanonicalParser()
                parser.feed(html)
                self.assertEqual(parser.h1_count, 1)
                self.assertIn(REVIEW_LABEL, html)
                self.assertIsNotNone(parser.canonical)

    def test_article_dates_are_consistent_in_schema_and_open_graph(self):
        for rel in PRIORITY_PATHS:
            html = (ROOT / rel).read_text(encoding="utf-8")
            if not re.search(r'"@type"\s*:\s*"Article"', html):
                continue
            with self.subTest(rel=rel):
                self.assertRegex(
                    html,
                    rf'"dateModified"\s*:\s*"{REVIEW_DATE}"',
                )
                self.assertIn(
                    f'<meta property="article:modified_time" content="{REVIEW_DATE}">',
                    html,
                )

    def test_json_ld_blocks_parse(self):
        pattern = re.compile(
            r'<script\s+type="application/ld\+json">(.*?)</script>',
            re.IGNORECASE | re.DOTALL,
        )
        for rel in PRIORITY_PATHS:
            html = (ROOT / rel).read_text(encoding="utf-8")
            for index, block in enumerate(pattern.findall(html), start=1):
                with self.subTest(rel=rel, block=index):
                    json.loads(block)

    def test_corrected_high_risk_claims_do_not_return(self):
        forbidden = {
            "futures-basics/feeder-cattle-vs-live-cattle-pricing-mechanics.html": (
                "Live cattle settles against negotiated cash trades",
                "live cattle with a demand floor",
            ),
            "platforms-tutorials/bookmap-connections-and-data-feeds.html": (
                "three feeds that matter",
                "fastest and most detailed futures feed available",
                "Apex-style cap",
            ),
            "prop-firm-trading/prop-firm-refund-policy-explained.html": (
                "This is the most common model",
                "Refund timing varies but falls into predictable ranges",
            ),
            "tools/trailing-drawdown-simulator.html": ("Apex-Style Cap",),
            "futures-basics/gc-liquidity-levels-structure.html": (
                "Stop clusters always sit here",
                "GC follows a repeatable liquidity script",
            ),
            "market-basics/micro-pullbacks-tiny-retracements-reveal-intent.html": (
                "they’re the safest way to enter continuation",
                "show exactly who’s in control",
            ),
        }
        for rel, phrases in forbidden.items():
            html = (ROOT / rel).read_text(encoding="utf-8")
            for phrase in phrases:
                with self.subTest(rel=rel, phrase=phrase):
                    self.assertNotIn(phrase.lower(), html.lower())

    def test_added_source_links_use_https(self):
        article_paths = tuple(
            rel
            for rel in PRIORITY_PATHS
            if "trust-disclosure" in (ROOT / rel).read_text(encoding="utf-8")
        )
        self.assertEqual(len(article_paths), 12)
        for rel in article_paths:
            html = (ROOT / rel).read_text(encoding="utf-8")
            section = html.split('<section class="trust-disclosure"', 1)[1]
            links = re.findall(r'href="(https?://[^"]+)"', section)
            with self.subTest(rel=rel):
                self.assertTrue(links)
                self.assertTrue(all(link.startswith("https://") for link in links))


if __name__ == "__main__":
    unittest.main()
