import re
import unittest
from pathlib import Path

from scripts.validate_6n_cluster import CLUSTER, MODIFIED_DATES


ROOT = Path(__file__).resolve().parents[1]
FUTURES = ROOT / "futures-basics"


class SixNCorrectnessRegressionTests(unittest.TestCase):
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
                        '<meta property="article:published_time" content="2025-11-28">'
                    ),
                    1,
                )
                self.assertEqual(html.count('"datePublished":"2025-11-28"'), 1)

    def test_source_disclosure_is_uniform_and_keyboard_native(self):
        summary = (
            "Sources, methods and editorial disclosure &mdash; reviewed August 20, 2026"
        )
        for filename in CLUSTER:
            with self.subTest(filename=filename):
                html = (FUTURES / filename).read_text(encoding="utf-8")
                self.assertEqual(html.count('<details class="fx-sources">'), 1)
                self.assertEqual(html.count(summary), 1)
                self.assertNotIn('<details class="fx-sources" open>', html)
                self.assertNotIn('<section class="fx-sources"', html)

    def test_current_standard_contract_mechanics_are_reconciled(self):
        html = (FUTURES / "6n-contract-specs-explained.html").read_text(
            encoding="utf-8"
        )

        self.assertIn("100,000 New Zealand dollars", html)
        self.assertIn("U.S. dollars per New Zealand dollar", html)
        self.assertIn("0.00005 USD per NZD", html)
        self.assertIn("0.00005 &times; 100,000 = $5", html)
        self.assertIn("0.00001 USD per NZD", html)
        self.assertIn("$1 per standard contract", html)
        self.assertIn("Second business day immediately before the third Wednesday", html)
        self.assertIn("Physical delivery on the third Wednesday", html)
        self.assertIn(
            "https://www.cmegroup.com/rulebook/CME/III/250/258/258.pdf", html
        )
        self.assertIn(
            "https://www.cmegroup.com/markets/fx/fx-product-guide.html", html
        )
        self.assertNotRegex(
            html,
            r"current (?:CME |Globex )?outright (?:tick|increment) (?:is|of|=) "
            r"(?:0\.0001|\$10)",
        )

    def test_quote_math_is_side_aware_and_reconciles_by_two_methods(self):
        html = (FUTURES / "how-to-read-6n-price-quotes.html").read_text(
            encoding="utf-8"
        )
        self.assertIn("Long 6N", html)
        self.assertIn("Short 6N", html)
        self.assertIn("35 &times; $5 confirms $175", html)
        self.assertIn("50 &times; $5 confirms $250", html)

        def gross(side: int, entry: float, exit_: float, contracts: int = 1) -> float:
            return side * (exit_ - entry) * 100_000 * contracts

        self.assertAlmostEqual(gross(1, 0.61240, 0.61415), 175.0)
        self.assertAlmostEqual(gross(-1, 0.61510, 0.61260), 250.0)
        self.assertAlmostEqual((0.61415 - 0.61240) / 0.00005, 35.0)
        self.assertAlmostEqual((0.61510 - 0.61260) / 0.00005, 50.0)
        self.assertIn("Number.isSafeInteger(contracts)", html)
        self.assertIn("!Number.isFinite(entry)", html)
        self.assertIn("Off-ladder input detected", html)
        self.assertNotIn("Math.floor(Number(document.getElementById('quote-contracts')", html)

    def test_liquidity_shortfall_formula_is_dimensionally_in_usd(self):
        html = (FUTURES / "6n-liquidity-guide.html").read_text(encoding="utf-8")

        self.assertIn(
            "(fill &minus; benchmark) &times; 100,000 NZD &times; filled contracts",
            html,
        )
        self.assertIn("USD fees + declared USD opportunity cost", html)
        self.assertIn("Implementation shortfall in USD", html)

    def test_risk_and_strategy_formulas_name_units_and_quantity(self):
        specs = (FUTURES / "6n-contract-specs-explained.html").read_text(
            encoding="utf-8"
        )
        strategies = (FUTURES / "6n-trading-strategies.html").read_text(
            encoding="utf-8"
        )

        self.assertIn("Invalidation distance in current 0.00005 ticks", specs)
        self.assertIn("100,000 NZD &times; contract quantity", strategies)
        self.assertIn("Net strategy outcome in USD", strategies)

    def test_export_hero_uses_an_evidence_sequence_not_unlike_unit_arithmetic(self):
        html = (FUTURES / "how-exports-drive-6n-trends.html").read_text(
            encoding="utf-8"
        )

        self.assertIn("Export evidence sequence, not an arithmetic identity", html)
        self.assertIn("export revenue (price &times; volume)", html)
        self.assertNotIn("<code>export price</code><i aria-hidden=\"true\">+</i>", html)

    def test_fomc_source_date_includes_current_july_minutes_release(self):
        for filename in (
            "6n-interest-rate-impact.html",
            "how-to-trade-6n-economic-releases.html",
        ):
            with self.subTest(filename=filename):
                html = (FUTURES / filename).read_text(encoding="utf-8")
                self.assertIn("updated 19 August 2026", html)
                self.assertNotIn("FOMC meeting calendar and primary materials (updated 8 July 2026)", html)

    def test_m6n_url_fails_closed_on_current_product_availability(self):
        html = (FUTURES / "m6n-micro-contract-guide.html").read_text(
            encoding="utf-8"
        )
        visible = re.sub(r"<[^>]+>", " ", html)
        visible = re.sub(r"\s+", " ", visible)

        self.assertRegex(
            visible,
            r"No current CME source reviewed for this guide lists an M6N",
        )
        self.assertIn(
            "https://www.cmegroup.com/markets/microsuite/fx.html", html
        )
        self.assertIn("If one standard contract is too large", visible)
        self.assertIn("the valid CME 6N quantity is zero", visible)
        self.assertNotRegex(
            visible,
            r"(?:M6N|Micro NZD).{0,80}(?:10,000 NZD|\$1 (?:tick|per tick))",
        )

    def test_hedge_examples_preserve_exposure_sign_and_integer_residuals(self):
        html = (FUTURES / "using-6n-to-hedge-nzdusd-exposure.html").read_text(
            encoding="utf-8"
        )
        self.assertIn("Positive NZD exposure &rarr; short 6N", html)
        self.assertIn("Negative NZD exposure &rarr; long 6N", html)

        self.assertEqual(260_000 - 2 * 100_000, 60_000)
        self.assertEqual(260_000 - 3 * 100_000, -40_000)
        self.assertEqual(-240_000 + 2 * 100_000, -40_000)
        self.assertEqual(-240_000 + 3 * 100_000, 60_000)
        for expected in (
            "+60,000 NZD residual",
            "-40,000 NZD residual",
        ):
            self.assertIn(expected, html)
        self.assertIn("!Number.isFinite(amount)", html)
        self.assertIn("amount>Number.MAX_SAFE_INTEGER", html)
        self.assertIn("Number.isSafeInteger(floorCount)", html)

    def test_json_ld_uses_json_escaping_instead_of_html_entities(self):
        html = (FUTURES / "how-to-read-6n-price-quotes.html").read_text(
            encoding="utf-8"
        )
        json_ld = re.findall(
            r'<script type="application/ld\+json">(.*?)</script>', html, flags=re.S
        )

        self.assertEqual(len(json_ld), 2)
        self.assertTrue(all("&amp;" not in block for block in json_ld))
        self.assertTrue(all(r"P\u0026L" in block for block in json_ld))


if __name__ == "__main__":
    unittest.main()
