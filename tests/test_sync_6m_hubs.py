import unittest

from scripts.sync_6m_hubs import extract_metadata


class Sync6MHubsTests(unittest.TestCase):
    def test_metadata_preserves_apostrophe_inside_double_quotes(self):
        markup = (
            '<title>6M and Trade</title>'
            '<meta name="description" content="Separate Mexico\'s trade channel from a signal.">'
        )

        title, description = extract_metadata(markup)

        self.assertEqual(title, "6M and Trade")
        self.assertEqual(description, "Separate Mexico's trade channel from a signal.")

    def test_metadata_decodes_html_entities(self):
        markup = (
            "<title>6M &amp; MXN</title>"
            "<meta name='description' content='Compare 6M &amp; MXN.'>"
        )

        title, description = extract_metadata(markup)

        self.assertEqual(title, "6M & MXN")
        self.assertEqual(description, "Compare 6M & MXN.")


if __name__ == "__main__":
    unittest.main()
