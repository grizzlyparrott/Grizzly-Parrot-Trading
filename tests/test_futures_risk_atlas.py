import csv
import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "tools" / "futures-risk-atlas.html"
JSON_PATH = ROOT / "tools" / "data" / "futures-contract-specs.json"
CSV_PATH = ROOT / "tools" / "data" / "futures-contract-specs.csv"


class FuturesRiskAtlasTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = json.loads(JSON_PATH.read_text(encoding="utf-8"))
        cls.contracts = cls.dataset["contracts"]
        cls.by_symbol = {row["symbol"]: row for row in cls.contracts}
        cls.html = HTML_PATH.read_text(encoding="utf-8")

    def test_dataset_has_expected_scope_and_unique_rows(self):
        self.assertEqual(self.dataset["schema_version"], "1.0.0")
        self.assertEqual(self.dataset["verified_on"], "2026-08-03")
        self.assertEqual(len(self.contracts), 55)
        self.assertEqual(len(self.by_symbol), len(self.contracts))
        self.assertEqual(
            {row["asset_class"] for row in self.contracts},
            {"Equity Index", "FX", "Energy", "Metals", "Agriculture", "Interest Rates"},
        )

    def test_every_row_is_source_backed_and_tick_math_reconciles(self):
        for row in self.contracts:
            with self.subTest(symbol=row["symbol"]):
                self.assertTrue(row["source_url"].startswith("https://www.cmegroup.com/"))
                self.assertEqual(row["verified_on"], "2026-08-03")
                self.assertGreater(row["outright_tick_size"], 0)
                self.assertGreater(row["tick_value_usd"], 0)
                self.assertAlmostEqual(
                    row["outright_tick_size"] * row["usd_per_1_quote_unit"],
                    row["tick_value_usd"],
                    places=9,
                )

    def test_known_high_risk_specifications(self):
        expected = {
            "M6E": (0.0001, 1.25),
            "6S": (0.00005, 6.25),
            "SI": (0.005, 25.00),
            "SIC": (0.01, 1.00),
            "PA": (0.50, 50.00),
            "ZF": (0.0078125, 7.8125),
        }
        for symbol, pair in expected.items():
            with self.subTest(symbol=symbol):
                self.assertEqual(
                    (self.by_symbol[symbol]["outright_tick_size"], self.by_symbol[symbol]["tick_value_usd"]),
                    pair,
                )

    def test_csv_and_json_are_row_equivalent(self):
        with CSV_PATH.open(encoding="utf-8", newline="") as handle:
            rows = list(csv.DictReader(handle))
        self.assertEqual(len(rows), len(self.contracts))
        self.assertEqual([row["symbol"] for row in rows], [row["symbol"] for row in self.contracts])

    def test_html_contains_static_rows_metadata_and_downloads(self):
        self.assertIn('<link rel="canonical" href="https://grizzlyparrottrading.com/tools/futures-risk-atlas.html">', self.html)
        self.assertIn('"@type":"Dataset"', self.html)
        self.assertIn('/tools/data/futures-contract-specs.csv', self.html)
        self.assertIn('/tools/data/futures-contract-specs.json', self.html)
        self.assertEqual(len(re.findall(r'<tr data-asset="', self.html)), 55)
        self.assertNotIn("__COUNT__", self.html)
        self.assertNotIn("__DATA_JSON__", self.html)

    def test_position_size_and_move_examples(self):
        mes = self.by_symbol["MES"]
        risk_per_contract = 20 * mes["tick_value_usd"]
        self.assertEqual(risk_per_contract, 25.0)
        self.assertEqual(int(250 // risk_per_contract), 10)
        cl = self.by_symbol["CL"]
        self.assertEqual(10 * cl["tick_value_usd"] * 2, 200.0)


if __name__ == "__main__":
    unittest.main()
