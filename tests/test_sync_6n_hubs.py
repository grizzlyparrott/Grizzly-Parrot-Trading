import unittest

from scripts.sync_6n_hubs import extract_metadata


class Sync6NHubsTests(unittest.TestCase):
    def test_metadata_preserves_apostrophe_inside_double_quotes(self):
        markup = (
            '<title>6N and Trade</title>'
            '<meta name="description" content="Separate New Zealand\'s trade channel from a signal.">'
        )

        title, description = extract_metadata(markup)

        self.assertEqual(title, "6N and Trade")
        self.assertEqual(description, "Separate New Zealand's trade channel from a signal.")

    def test_metadata_decodes_html_entities(self):
        markup = (
            "<title>6N &amp; NZD</title>"
            "<meta name='description' content='Compare 6N &amp; NZD.'>"
        )

        title, description = extract_metadata(markup)

        self.assertEqual(title, "6N & NZD")
        self.assertEqual(description, "Compare 6N & NZD.")


if __name__ == "__main__":
    unittest.main()
