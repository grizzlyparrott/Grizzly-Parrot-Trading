import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CSS_PATH = ROOT / "futures-basics" / "currency-research-library.css"


def _rgb(hex_color: str) -> tuple[int, int, int]:
    value = hex_color.lstrip("#")
    return tuple(int(value[index : index + 2], 16) for index in (0, 2, 4))


def _relative_luminance(hex_color: str) -> float:
    channels = []
    for channel in _rgb(hex_color):
        normalized = channel / 255
        channels.append(
            normalized / 12.92
            if normalized <= 0.04045
            else ((normalized + 0.055) / 1.055) ** 2.4
        )
    red, green, blue = channels
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue


def _contrast(left: str, right: str) -> float:
    light, dark = sorted(
        (_relative_luminance(left), _relative_luminance(right)), reverse=True
    )
    return (light + 0.05) / (dark + 0.05)


def _variable(css: str, name: str) -> str:
    match = re.search(rf"{re.escape(name)}:\s*(#[0-9a-f]{{6}})", css, flags=re.I)
    assert match, f"missing {name}"
    return match.group(1)


class SixCCssAccessibilityTests(unittest.TestCase):
    def test_focus_indicator_has_light_and_dark_three_to_one_layers(self):
        css = CSS_PATH.read_text(encoding="utf-8")
        focus_dark = _variable(css, "--fx-focus-dark")
        focus_light = _variable(css, "--fx-focus-light")
        paper = _variable(css, "--fx-paper")
        self.assertGreaterEqual(_contrast(focus_dark, paper), 3)
        self.assertGreaterEqual(_contrast(focus_light, paper), 3)
        self.assertIn("outline: 3px solid var(--fx-focus-light)", css)
        self.assertIn("box-shadow: 0 0 0 6px var(--fx-focus-dark)", css)

    def test_process_arrow_uses_a_dark_foreground_on_gold(self):
        css = CSS_PATH.read_text(encoding="utf-8")
        arrow = re.search(
            r"\.fx-process article:not\(:last-child\)::after\s*\{(?P<body>.*?)\n\}",
            css,
            flags=re.S,
        )
        self.assertIsNotNone(arrow)
        self.assertIn("color: var(--fx-button-ink)", arrow.group("body"))
        self.assertGreaterEqual(
            _contrast(
                _variable(css, "--fx-button-ink"), _variable(css, "--fx-gold")
            ),
            3,
        )


if __name__ == "__main__":
    unittest.main()
