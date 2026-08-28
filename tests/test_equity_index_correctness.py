import re
import unittest

from scripts.equity_index_cluster_config import (
    CLUSTER,
    ES_MECHANICS,
    MODIFIED_DATES,
    NQ_MECHANICS,
    PUBLISHED_DATES,
    ROOT,
    required_mechanics_link,
)
from scripts.check_equity_index_source_links import (
    collect_source_owners,
    markdown_external_urls,
    misleading_pdf_redirect,
)
from scripts.sync_equity_index_discovery import update_sitemap_text
from scripts.verify_equity_index_live import normalized_bytes


FUTURES = ROOT / "futures-basics"


class EquityIndexCorrectnessTests(unittest.TestCase):
    def test_modified_dates_are_evenly_staggered_across_five_days(self):
        counts = {
            date: list(MODIFIED_DATES.values()).count(date)
            for date in set(MODIFIED_DATES.values())
        }
        self.assertEqual(
            counts,
            {
                "2026-08-24": 7,
                "2026-08-25": 7,
                "2026-08-26": 7,
                "2026-08-27": 7,
                "2026-08-28": 7,
            },
        )

    def test_staggered_dates_match_all_published_surfaces(self):
        for filename in CLUSTER:
            with self.subTest(filename=filename):
                html = (FUTURES / filename).read_text(encoding="utf-8")
                modified = MODIFIED_DATES[filename]
                published = PUBLISHED_DATES[filename]
                visible = f"Updated August {int(modified[-2:])}, 2026"
                self.assertEqual(
                    html.count(
                        f'<meta property="article:modified_time" content="{modified}">'
                    ),
                    1,
                )
                self.assertEqual(html.count(f'"dateModified":"{modified}"'), 1)
                self.assertEqual(html.count(visible), 1)
                self.assertEqual(
                    html.count(
                        f'<meta property="article:published_time" content="{published}">'
                    ),
                    1,
                )
                self.assertEqual(html.count(f'"datePublished":"{published}"'), 1)

    def test_canonical_mechanics_ownership(self):
        for filename in CLUSTER:
            with self.subTest(filename=filename):
                expected = required_mechanics_link(filename)
                if expected:
                    html = (FUTURES / filename).read_text(encoding="utf-8")
                    self.assertIn(expected, html)
        shared = (FUTURES / "why-futures-lead-the-stock-market.html").read_text(
            encoding="utf-8"
        )
        self.assertIn(ES_MECHANICS, shared)
        self.assertIn(NQ_MECHANICS, shared)

    def test_contract_arithmetic(self):
        self.assertAlmostEqual(50 * 0.25, 12.50)
        self.assertAlmostEqual(5 * 0.25, 1.25)
        self.assertAlmostEqual(20 * 0.25, 5.00)
        self.assertAlmostEqual(2 * 0.25, 0.50)
        self.assertAlmostEqual(50 * 0.05, 2.50)
        self.assertAlmostEqual(5 * 0.05, 0.25)
        self.assertAlmostEqual(20 * 0.05, 1.00)
        self.assertAlmostEqual(2 * 0.05, 0.10)
        self.assertAlmostEqual((6000.00 - 5997.50) * 50, 125.00)
        self.assertAlmostEqual((25000.00 - 24990.00) * 20, 200.00)

    def test_canonical_pages_cover_the_current_exchange_record(self):
        es = (FUTURES / ES_MECHANICS).read_text(encoding="utf-8")
        nq = (FUTURES / NQ_MECHANICS).read_text(encoding="utf-8")

        for expected in (
            "0.05 point = $2.50",
            "0.05 point = $0.25",
            "21 consecutive March/June/September/December quarterly contracts",
            "5 consecutive March/June/September/December quarterly contracts",
            "Sunday through Friday, 5:00 p.m. to 4:00 p.m. Central Time",
            "4:00 p.m. to 5:00 p.m. CT",
            "regularly scheduled start of NYSE trading",
            "primary listing exchange opens",
            "Cash settlement",
            "Special Opening Quotation of the S&amp;P 500",
            "immediately preceding business day's NYSE close",
        ):
            with self.subTest(page=ES_MECHANICS, expected=expected):
                self.assertIn(expected, es)

        for expected in (
            "NQ spread tick at $1",
            "MNQ spread tick at $0.10",
            "6 consecutive quarterly contracts plus 2 additional June and 4 additional December contracts",
            "MNQ is listed for 5 consecutive quarterly contracts",
            "Sunday through Friday, 5:00 p.m. to 4:00 p.m. Central Time",
            "4:00 p.m. to 5:00 p.m. CT",
            "Regularly scheduled start of Nasdaq Stock Market trading",
            "No trading after the Primary Listing Exchange opens",
            "each component's Nasdaq Official Opening Price (NOOP)",
            "Special Opening Quotation based on component opening prices",
            "Cash settlement",
            "immediately preceding business day's NYSE close",
        ):
            with self.subTest(page=NQ_MECHANICS, expected=expected):
                self.assertIn(expected, nq)

    def test_margin_is_not_described_as_maximum_loss(self):
        pattern = re.compile(
            r"broker.{0,80}(?:day|intraday) margin.{0,80}(?:maximum|max) loss",
            re.I | re.S,
        )
        for filename in CLUSTER:
            with self.subTest(filename=filename):
                html = (FUTURES / filename).read_text(encoding="utf-8")
                visible = re.sub(r"<[^>]+>", " ", html)
                self.assertIsNone(pattern.search(visible))

    def test_cost_formulas_are_side_aware_and_do_not_double_count(self):
        es_times = (FUTURES / "best-times-to-trade-es-e-mini-sp500.html").read_text(
            encoding="utf-8"
        )
        nq_times = (FUTURES / "nq-best-times.html").read_text(encoding="utf-8")
        comparison = (FUTURES / "nq-pullbacks-vs-breakouts.html").read_text(
            encoding="utf-8"
        )
        sizing = (FUTURES / "nq-position-sizing.html").read_text(encoding="utf-8")

        self.assertIn(
            "side &times; (average fill &minus; decision benchmark) &times; "
            "contract multiplier &times; filled contracts + fees",
            es_times,
        )
        self.assertIn("side = +1 for a buy and &minus;1 for a sell", es_times)
        self.assertIn(
            "side &times; (execution VWAP for Q &minus; decision-time midquote)",
            nq_times,
        )
        self.assertIn(
            "contract multiplier &times; filled Q + fees",
            nq_times,
        )
        self.assertIn(
            "fill-to-fill P&amp;L &minus; reconciled actual transaction-fee ledger "
            "counted once",
            comparison,
        )
        self.assertIn("one non-overlapping ledger", comparison)
        self.assertIn(
            "never subtract modeled slippage from a fill-based result",
            comparison,
        )
        self.assertNotRegex(
            comparison,
            r"realized P&amp;L.{0,120}modeled slippage",
        )
        stop_formula = re.search(
            r'<div class="fx-formula" aria-label="Structural stop conversion to ticks">.*?</div>',
            sizing,
            re.S,
        )
        self.assertIsNotNone(stop_formula)
        self.assertIn("ceiling(", stop_formula.group(0))
        self.assertNotIn('<i aria-hidden="true">+</i>', stop_formula.group(0))

        def shortfall_usd(side, fill, benchmark, multiplier, quantity, fees):
            return side * (fill - benchmark) * multiplier * quantity + fees

        self.assertAlmostEqual(shortfall_usd(1, 100.25, 100.00, 50, 1, 2), 14.50)
        self.assertAlmostEqual(shortfall_usd(-1, 99.75, 100.00, 50, 1, 2), 14.50)

        fill_to_fill_pnl = (101.00 - 100.00) * 20
        nonoverlapping_fee_ledger = {
            "broker_commission": 1.25,
            "exchange": 0.80,
            "clearing": 0.20,
            "regulatory": 0.05,
        }
        self.assertAlmostEqual(
            fill_to_fill_pnl - sum(nonoverlapping_fee_ledger.values()),
            17.70,
        )

    def test_retired_and_invalid_cme_source_urls_are_absent(self):
        cluster_html = "\n".join(
            (FUTURES / filename).read_text(encoding="utf-8") for filename in CLUSTER
        )
        source_basis = (ROOT / "artifacts" / "equity-index-source-basis.md").read_text(
            encoding="utf-8"
        )
        self.assertNotIn("GlobexRefGd.pdf", cluster_html)
        self.assertNotIn("/350/361/361.pdf", source_basis)
        self.assertIn("/350/361.pdf", source_basis)

    def test_source_link_audit_includes_markdown_and_rejects_pdf_redirects(self):
        self.assertEqual(
            markdown_external_urls(
                "[one](https://example.com/a.pdf) and [two](https://example.org/b)"
            ),
            {"https://example.com/a.pdf", "https://example.org/b"},
        )
        self.assertTrue(
            misleading_pdf_redirect(
                "https://example.com/guide.pdf",
                "https://example.com/landing",
                "text/html",
            )
        )
        self.assertFalse(
            misleading_pdf_redirect(
                "https://example.com/guide.pdf",
                "https://cdn.example.com/current-guide.pdf",
                "application/pdf",
            )
        )
        owners = collect_source_owners()
        self.assertIn(
            "artifacts/equity-index-source-basis.md",
            owners["https://www.cmegroup.com/rulebook/CME/IV/350/361.pdf"],
        )

    def test_sitemap_rewriter_sets_every_approved_date(self):
        namespace = "http://www.sitemaps.org/schemas/sitemap/0.9"
        rows = []
        for filename in CLUSTER:
            rows.append(
                "<url><loc>https://grizzlyparrottrading.com/futures-basics/"
                f"{filename}</loc><lastmod>2026-01-01T00:00:00Z</lastmod></url>"
            )
        raw = f'<urlset xmlns="{namespace}">' + "".join(rows) + "</urlset>"
        updated, changed = update_sitemap_text(raw)
        self.assertEqual(changed, len(CLUSTER))
        for filename, modified in MODIFIED_DATES.items():
            self.assertIn(
                f"<loc>https://grizzlyparrottrading.com/futures-basics/{filename}</loc>"
                f"<lastmod>{modified}T12:00:00Z</lastmod>",
                updated,
            )

    def test_live_verifier_normalizes_only_bom_and_line_endings(self):
        self.assertEqual(normalized_bytes(b"\xef\xbb\xbfA\r\nB\rC\n"), b"A\nB\nC\n")
        self.assertNotEqual(normalized_bytes(b"alpha"), normalized_bytes(b"Alpha"))


if __name__ == "__main__":
    unittest.main()
