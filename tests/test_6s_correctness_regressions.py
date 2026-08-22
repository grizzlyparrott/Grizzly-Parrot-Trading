import re
import unittest
from pathlib import Path

from scripts.validate_6s_cluster import CLUSTER, MODIFIED_DATES


ROOT = Path(__file__).resolve().parents[1]
FUTURES = ROOT / "futures-basics"


class SixSCorrectnessRegressionTests(unittest.TestCase):
    def test_staggered_dates_match_every_published_surface(self):
        for filename, modified_date in MODIFIED_DATES.items():
            with self.subTest(filename=filename):
                html = (FUTURES / filename).read_text(encoding="utf-8")
                day = int(modified_date[-2:])
                visible = f"Updated August {day}, 2026"
                self.assertEqual(
                    html.count(
                        f'<meta property="article:modified_time" content="{modified_date}">'
                    ),
                    1,
                )
                self.assertEqual(html.count(f'"dateModified":"{modified_date}"'), 1)
                self.assertEqual(html.count(visible), 1)
                self.assertEqual(
                    html.count(
                        '<meta property="article:published_time" content="2025-11-27">'
                    ),
                    1,
                )
                self.assertEqual(html.count('"datePublished":"2025-11-27"'), 1)

    def test_source_disclosure_is_uniform_and_keyboard_native(self):
        summary = (
            "Sources, methods and editorial disclosure &mdash; reviewed August 21, 2026"
        )
        for filename in CLUSTER:
            with self.subTest(filename=filename):
                html = (FUTURES / filename).read_text(encoding="utf-8")
                self.assertEqual(html.count('<details class="fx-sources">'), 1)
                self.assertEqual(html.count(summary), 1)
                self.assertNotIn('<details class="fx-sources" open>', html)

    def test_current_standard_and_micro_contract_mechanics_reconcile(self):
        html = (FUTURES / "6s-contract-specs-tick-size-margin.html").read_text(
            encoding="utf-8"
        )
        visible = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))
        self.assertRegex(visible, r"125,000 (?:Swiss francs|CHF)")
        self.assertRegex(visible, r"U\.S\. dollars? per Swiss franc|USD per CHF")
        self.assertIn("0.00005", visible)
        self.assertIn("$6.25", visible)
        self.assertIn("0.00001", visible)
        self.assertIn("$1.25", visible)
        self.assertRegex(visible, r"MSF|Micro Swiss Franc")
        self.assertRegex(visible, r"12,500 (?:Swiss francs|CHF)")
        self.assertRegex(visible, r"second business day immediately preceding the third Wednesday", re.I)
        self.assertRegex(visible, r"physical delivery|physically delivered", re.I)
        self.assertIn(
            "https://www.cmegroup.com/rulebook/CME/III/250/254/254.pdf", html
        )
        self.assertIn(
            "https://www.cmegroup.com/markets/fx/fx-product-guide.html", html
        )
        self.assertIn(
            "https://www.cmegroup.com/markets/microsuite/fx.html", html
        )

    def test_tick_and_pnl_arithmetic(self):
        self.assertAlmostEqual(125_000 * 0.00005, 6.25)
        self.assertAlmostEqual(125_000 * 0.00001, 1.25)
        self.assertAlmostEqual(12_500 * 0.0001, 1.25)
        self.assertAlmostEqual((1.27450 - 1.27200) * 125_000, 312.50)

    def test_spot_comparison_reconciles_reciprocal_quotes(self):
        html = (FUTURES / "6s-chf-usd-spot-vs-futures-differences.html").read_text(
            encoding="utf-8"
        )
        visible = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))
        self.assertRegex(visible, r"CHF/USD.{0,300}USD/CHF|USD/CHF.{0,300}CHF/USD")
        self.assertRegex(visible, r"reciprocal|invert|1\s*/", re.I)

    def test_all_pages_link_to_canonical_mechanics_and_reject_margin_as_max_loss(self):
        for filename in CLUSTER:
            with self.subTest(filename=filename):
                html = (FUTURES / filename).read_text(encoding="utf-8")
                if filename != "6s-contract-specs-tick-size-margin.html":
                    self.assertIn("6s-contract-specs-tick-size-margin.html", html)
                self.assertNotRegex(
                    html,
                    r"(?:day|initial|overnight) margin (?:is|equals|caps?) (?:the )?maximum loss",
                )


if __name__ == "__main__":
    unittest.main()
