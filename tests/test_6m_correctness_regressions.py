import json
import re
import subprocess
import unittest
from pathlib import Path

from scripts.validate_6m_cluster import CLUSTER


ROOT = Path(__file__).resolve().parents[1]
FUTURES = ROOT / "futures-basics"


def _extract_function(source: str, name: str) -> str:
    match = re.search(
        rf"^  function {re.escape(name)}\([^)]*\)\{{.*?^  \}}",
        source,
        flags=re.M | re.S,
    )
    assert match, f"missing JavaScript function {name}"
    return match.group(0).strip()


class SixMCorrectnessRegressionTests(unittest.TestCase):
    def test_backtest_formula_is_direction_aware_for_longs_and_shorts(self):
        html = (FUTURES / "6m-backtesting.html").read_text(encoding="utf-8")

        self.assertIn("Direction-aware net backtest result formula", html)
        self.assertIn("side &times; (exit fill &minus; entry fill)", html)
        self.assertIn("use +1 for a long and &minus;1 for a short", html)
        self.assertIn("not already embedded in those fills", html)

        def gross_dollars(side: int, entry: float, exit_: float) -> float:
            return side * (exit_ - entry) * 500_000

        self.assertAlmostEqual(gross_dollars(1, 0.0500, 0.0510), 500.0)
        self.assertAlmostEqual(gross_dollars(-1, 0.0510, 0.0500), 500.0)

    def test_margin_model_rejects_invalid_ticks_and_nonfinite_inputs(self):
        html = (FUTURES / "6m-margin-requirements.html").read_text(encoding="utf-8")
        parse_function = _extract_function(html, "parseNonnegative")
        model_function = _extract_function(html, "riskModel")
        cases = [
            ["1000", "60", "20", "40"],
            ["1000", "60.5", "20", "40"],
            ["1000", "-1", "20", "40"],
            ["1000", "", "20", "40"],
            ["1000", "0", "0", "0"],
            ["1000", "1e308", "1e308", "0"],
            ["1e309", "60", "20", "40"],
        ]
        script = (
            f"{parse_function}\n{model_function}\n"
            f"console.log(JSON.stringify({json.dumps(cases)}.map(x => riskModel(...x))));"
        )
        result = subprocess.run(
            ["node", "-e", script],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
        )

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        models = json.loads(result.stdout)
        self.assertEqual(
            models[0],
            {"valid": True, "reason": "", "per": 440, "cap": 2, "planned": 880},
        )
        self.assertEqual([model["reason"] for model in models[1:]], [
            "input",
            "input",
            "input",
            "zero",
            "overflow",
            "input",
        ])
        self.assertTrue(all(model["cap"] == 0 for model in models[1:]))
        self.assertIn("setCustomValidity", html)
        self.assertIn("Tick distances must be whole numbers", html)
        self.assertIn("too large to calculate safely", html)

    def test_dst_illustration_is_explicitly_dated(self):
        html = (FUTURES / "6m-best-times.html").read_text(encoding="utf-8")

        self.assertIn("Under the 2026 time-zone rules", html)
        self.assertIn("Illustration: 2026 U.S. daylight time", html)
        self.assertIn("Offsets are date-dependent inputs", html)

    def test_source_disclosure_chrome_is_publication_level(self):
        summary = (
            "Sources, methods and editorial disclosure &mdash; reviewed August 13, 2026"
        )

        for filename in CLUSTER:
            with self.subTest(filename=filename):
                html = (FUTURES / filename).read_text(encoding="utf-8")
                self.assertEqual(html.count('<details class="fx-sources">'), 1)
                self.assertEqual(html.count(summary), 1)
                self.assertNotIn('<details class="fx-sources" open>', html)
                self.assertNotIn('<section class="fx-sources"', html)


if __name__ == "__main__":
    unittest.main()
