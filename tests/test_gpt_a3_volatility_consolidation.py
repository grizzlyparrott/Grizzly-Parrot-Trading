import json
import re
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SURVIVOR = "/market-basics/what-drives-market-volatility.html"
CONSOLIDATED = "/market-basics/what-drives-market-volatility-and-why-it-spikes.html"
SURVIVOR_URL = f"https://grizzlyparrottrading.com{SURVIVOR}"
CONSOLIDATED_URL = f"https://grizzlyparrottrading.com{CONSOLIDATED}"


class GPTA3VolatilityConsolidationTests(unittest.TestCase):
    def test_survivor_has_consistent_trust_metadata(self):
        html = (ROOT / SURVIVOR.lstrip("/")).read_text(encoding="utf-8")
        self.assertEqual(html.count("<h1>"), 1)
        self.assertIn("Updated September 19, 2026", html)
        self.assertIn('<meta property="article:modified_time" content="2026-09-19">', html)
        self.assertIn('"dateModified": "2026-09-19"', html)
        self.assertIn(f'<link rel="canonical" href="{SURVIVOR_URL}">', html)
        self.assertIn('class="trust-disclosure"', html)
        blocks = re.findall(r'<script type="application/ld\+json">\s*(.*?)\s*</script>', html, re.S)
        self.assertEqual(len(blocks), 2)
        for block in blocks:
            json.loads(block)

    def test_old_url_is_a_scoped_redirect_endpoint(self):
        html = (ROOT / CONSOLIDATED.lstrip("/")).read_text(encoding="utf-8")
        self.assertIn(f'<link rel="canonical" href="{SURVIVOR_URL}">', html)
        self.assertIn(f'content="0; url={SURVIVOR_URL}"', html)
        self.assertIn(f'window.location.replace("{SURVIVOR_URL}")', html)
        self.assertNotIn("application/ld+json", html)
        self.assertNotIn('name="robots" content="noindex', html)

    def test_discovery_surfaces_contain_only_survivor(self):
        index = json.loads((ROOT / "search-index.json").read_text(encoding="utf-8"))
        urls = [item["url"] for item in index]
        self.assertEqual(urls.count(SURVIVOR), 1)
        self.assertNotIn(CONSOLIDATED, urls)

        sitemap = ET.parse(ROOT / "sitemap.xml")
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        locs = [node.text for node in sitemap.findall("sm:url/sm:loc", ns)]
        self.assertEqual(locs.count(SURVIVOR_URL), 1)
        self.assertNotIn(CONSOLIDATED_URL, locs)

        hub = (ROOT / "market-basics" / "index.html").read_text(encoding="utf-8")
        self.assertEqual(hub.count(f'href="{SURVIVOR}"'), 1)
        self.assertNotIn(CONSOLIDATED, hub)

    def test_no_live_internal_page_links_to_consolidated_url(self):
        offenders = []
        excluded = {ROOT / CONSOLIDATED.lstrip("/")}
        for path in ROOT.rglob("*.html"):
            if path in excluded or "outputs" in path.parts:
                continue
            text = path.read_text(encoding="utf-8", errors="strict")
            if CONSOLIDATED in text or CONSOLIDATED_URL in text:
                offenders.append(path.relative_to(ROOT).as_posix())
        self.assertEqual(offenders, [])


if __name__ == "__main__":
    unittest.main()
