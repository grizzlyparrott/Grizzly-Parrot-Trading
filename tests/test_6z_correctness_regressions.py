import re
import unittest
from pathlib import Path

from scripts.validate_6z_cluster import CLUSTER, MODIFIED_DATES


ROOT = Path(__file__).resolve().parents[1]
FUTURES = ROOT / "futures-basics"


class SixZCorrectnessRegressionTests(unittest.TestCase):
    def test_staggered_dates_match_every_published_surface(self):
        for filename, modified_date in MODIFIED_DATES.items():
            with self.subTest(filename=filename):
                html = (FUTURES / filename).read_text(encoding="utf-8")
                day = int(modified_date[-2:])
                visible = f"Updated August {day}, 2026"
                self.assertEqual(html.count(f'<meta property="article:modified_time" content="{modified_date}">'), 1)
                self.assertEqual(html.count(f'"dateModified":"{modified_date}"'), 1)
                self.assertEqual(html.count(visible), 1)
                self.assertEqual(html.count('<meta property="article:published_time" content="2025-11-28">'), 1)
                self.assertEqual(html.count('"datePublished":"2025-11-28"'), 1)

    def test_source_disclosure_is_uniform_and_keyboard_native(self):
        summary = "Sources, methods and editorial disclosure &mdash; reviewed August 25, 2026"
        for filename in CLUSTER:
            with self.subTest(filename=filename):
                html = (FUTURES / filename).read_text(encoding="utf-8")
                self.assertEqual(html.count('<details class="fx-sources">'), 1)
                self.assertEqual(html.count(summary), 1)
                self.assertNotIn('<details class="fx-sources" open>', html)

    def test_current_contract_mechanics_reconcile(self):
        html = (FUTURES / "6z-tick-size-and-value.html").read_text(encoding="utf-8")
        visible = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))
        self.assertRegex(visible, r"500,000 (?:South African rand|ZAR)")
        self.assertRegex(visible, r"ZAR/USD|USD per ZAR|U\.S\. dollars? per (?:South African )?rand")
        self.assertIn("0.000025", visible)
        self.assertIn("$12.50", visible)
        self.assertIn("0.000001", visible)
        self.assertIn("$0.50", visible)
        self.assertRegex(visible, r"second (?:exchange )?business day immediately preceding the third Wednesday", re.I)
        self.assertRegex(visible, r"physical delivery|physically delivered", re.I)
        self.assertIn("https://www.cmegroup.com/rulebook/CME/III/250/259/259.pdf", html)
        self.assertIn("https://www.cmegroup.com/markets/fx/fx-product-guide.html", html)

    def test_tick_and_pnl_arithmetic(self):
        self.assertAlmostEqual(500_000 * 0.000025, 12.50)
        self.assertAlmostEqual(500_000 * 0.000001, 0.50)
        self.assertAlmostEqual((0.055500 - 0.055250) * 500_000, 125.00)

    def test_orientation_page_reconciles_reciprocal_quotes(self):
        html = (FUTURES / "what-are-6z-futures.html").read_text(encoding="utf-8")
        visible = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))
        self.assertRegex(visible, r"ZAR/USD.{0,300}USD/ZAR|USD/ZAR.{0,300}ZAR/USD")
        self.assertRegex(visible, r"reciprocal|invert|1\s*/", re.I)

    def test_all_pages_link_to_canonical_mechanics_and_reject_margin_as_max_loss(self):
        for filename in CLUSTER:
            with self.subTest(filename=filename):
                html = (FUTURES / filename).read_text(encoding="utf-8")
                if filename != "6z-tick-size-and-value.html":
                    self.assertIn("6z-tick-size-and-value.html", html)
                self.assertNotRegex(html, r"(?:day|initial|overnight) margin (?:is|equals|caps?) (?:the )?maximum loss")


if __name__ == "__main__":
    unittest.main()
