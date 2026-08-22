import unittest

from scripts.sync_6s_hubs import extract_metadata


class Sync6SHubsTests(unittest.TestCase):
    def test_metadata_preserves_apostrophe_inside_double_quotes(self):
        markup = (
            '<title>6S and SNB Policy</title>'
            '<meta name="description" content="Separate Switzerland\'s policy channel from a signal.">'
        )
        title, description = extract_metadata(markup)
        self.assertEqual(title, "6S and SNB Policy")
        self.assertEqual(description, "Separate Switzerland's policy channel from a signal.")

    def test_metadata_decodes_html_entities(self):
        markup = (
            "<title>6S &amp; CHF</title>"
            "<meta name='description' content='Compare 6S &amp; CHF.'>"
        )
        title, description = extract_metadata(markup)
        self.assertEqual(title, "6S & CHF")
        self.assertEqual(description, "Compare 6S & CHF.")


if __name__ == "__main__":
    unittest.main()
