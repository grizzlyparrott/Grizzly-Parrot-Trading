import unittest
import xml.etree.ElementTree as ET

from scripts.sync_6n_sitemap_dates import SITEMAP_NAMESPACE, update_sitemap_text
from scripts.validate_6n_cluster import BASE_URL, MODIFIED_DATES


class Sync6NSitemapDatesTests(unittest.TestCase):
    def test_each_6n_url_receives_its_approved_date(self):
        root = ET.Element(f"{{{SITEMAP_NAMESPACE}}}urlset")
        for filename in MODIFIED_DATES:
            node = ET.SubElement(root, f"{{{SITEMAP_NAMESPACE}}}url")
            ET.SubElement(node, f"{{{SITEMAP_NAMESPACE}}}loc").text = (
                f"{BASE_URL}/futures-basics/{filename}"
            )
            ET.SubElement(node, f"{{{SITEMAP_NAMESPACE}}}lastmod").text = (
                "2026-08-20T00:00:00Z"
            )

        raw = ET.tostring(root, encoding="unicode")
        updated, _ = update_sitemap_text(raw)
        result = ET.fromstring(updated)

        actual = {
            node.findtext(f"{{{SITEMAP_NAMESPACE}}}loc"): node.findtext(
                f"{{{SITEMAP_NAMESPACE}}}lastmod"
            )
            for node in result.findall(f"{{{SITEMAP_NAMESPACE}}}url")
        }
        for filename, modified_date in MODIFIED_DATES.items():
            self.assertEqual(
                actual[f"{BASE_URL}/futures-basics/{filename}"],
                f"{modified_date}T12:00:00Z",
            )

    def test_missing_cluster_url_fails_closed(self):
        root = ET.Element(f"{{{SITEMAP_NAMESPACE}}}urlset")
        with self.assertRaisesRegex(ValueError, "sitemap is missing"):
            update_sitemap_text(ET.tostring(root, encoding="unicode"))


if __name__ == "__main__":
    unittest.main()
