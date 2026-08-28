import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FUTURES = ROOT / "futures-basics"
CANONICAL_CSS = FUTURES / "currency-research-library.css"
CANONICAL_LINK = (
    '<link rel="stylesheet" '
    'href="/futures-basics/currency-research-library.css?v=20260820a">'
)
LEGACY_STYLESHEETS = (
    "6a-evidence-guides.css",
    "6b-research-library.css",
    "6c-research-library.css",
    "6e-evidence-guides.css",
    "6e-contract-specs-guide.css",
    "6j-evidence-guides.css",
    "6m-research-library.css",
    "6n-research-library.css",
    "6s-research-library.css",
)
LEGACY_ROOTS = (
    "aussie-evidence",
    "sterling-library",
    "cad-library",
    "euro-evidence",
    "yen-evidence",
    "mxn-library",
    "swiss-library",
    "chf-library",
)


def variable(css: str, name: str) -> str:
    match = re.search(rf"{re.escape(name)}:\s*(#[0-9a-f]{{6}})", css, re.I)
    if not match:
        raise AssertionError(f"missing CSS variable {name}")
    return match.group(1).lower()


class CurrencyLibraryThemeTests(unittest.TestCase):
    def test_all_currency_library_pages_use_one_physical_stylesheet(self):
        pages = []
        for path in sorted(FUTURES.glob("*.html")):
            html = path.read_text(encoding="utf-8")
            if "currency-research-library.css" not in html:
                continue
            pages.append(path)
            with self.subTest(page=path.name):
                self.assertEqual(html.count(CANONICAL_LINK), 1)
                self.assertFalse(any(name in html for name in LEGACY_STYLESHEETS))
                self.assertFalse(any(root in html for root in LEGACY_ROOTS))

                if "euro-contract-guide" not in html:
                    self.assertEqual(html.count("currency-library"), 1)
                    self.assertNotRegex(
                        html,
                        r'class="[^"]*\b(?:au|gb|ca|eu|yj|mx|chf|sw)-',
                    )

        self.assertEqual(len(pages), 215)
        self.assertTrue(CANONICAL_CSS.is_file())

    def test_every_shared_component_class_has_canonical_css_definition(self):
        css = CANONICAL_CSS.read_text(encoding="utf-8")
        defined = set(re.findall(r"\.((?:fx)-[a-z0-9_-]+)", css))
        used = set()

        for path in FUTURES.glob("*.html"):
            html = path.read_text(encoding="utf-8")
            if "currency-research-library.css" not in html:
                continue
            for class_value in re.findall(r'class="([^"]+)"', html):
                used.update(
                    token for token in class_value.split() if token.startswith("fx-")
                )

        self.assertEqual(len(used), 84)
        self.assertEqual(used - defined, set())

    def test_legacy_country_stylesheets_are_removed(self):
        for filename in LEGACY_STYLESHEETS:
            with self.subTest(filename=filename):
                self.assertFalse((FUTURES / filename).exists())

    def test_canonical_palette_matches_homepage_tokens(self):
        home = (ROOT / "home-premium.css").read_text(encoding="utf-8")
        currency = CANONICAL_CSS.read_text(encoding="utf-8")

        expected_pairs = {
            "--fx-paper": "--home-bg",
            "--fx-surface": "--home-surface",
            "--fx-surface-2": "--home-surface-2",
            "--fx-surface-3": "--home-surface-3",
            "--fx-line": "--home-line",
            "--fx-ink": "--home-text",
            "--fx-forest": "--home-green",
        }
        for currency_name, home_name in expected_pairs.items():
            with self.subTest(currency_name=currency_name):
                self.assertEqual(
                    variable(currency, currency_name),
                    variable(home, home_name),
                )

    def test_country_palette_hexes_do_not_survive_in_canonical_css(self):
        css = CANONICAL_CSS.read_text(encoding="utf-8").lower()
        for old_color in (
            "#6c315e",  # former 6B purple
            "#9b312c",  # former 6C red
            "#0d467f",  # former 6E blue
            "#116348",  # former 6M country gradient
        ):
            with self.subTest(old_color=old_color):
                self.assertNotIn(old_color, css)


if __name__ == "__main__":
    unittest.main()
