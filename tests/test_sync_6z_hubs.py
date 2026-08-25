import unittest

from scripts.sync_6z_hubs import extract_metadata


class Sync6ZHubsTests(unittest.TestCase):
    def test_metadata_preserves_apostrophe_inside_double_quotes(self):
        markup = (
            '<title>6Z and SARB Policy</title>'
            '<meta name="description" content="Separate South Africa\'s policy channel from a signal.">'
        )
        title, description = extract_metadata(markup)
        self.assertEqual(title, "6Z and SARB Policy")
        self.assertEqual(description, "Separate South Africa's policy channel from a signal.")

    def test_metadata_decodes_html_entities(self):
        markup = (
            "<title>6Z &amp; ZAR</title>"
            "<meta name='description' content='Compare 6Z &amp; ZAR.'>"
        )
        title, description = extract_metadata(markup)
        self.assertEqual(title, "6Z & ZAR")
        self.assertEqual(description, "Compare 6Z & ZAR.")


if __name__ == "__main__":
    unittest.main()
