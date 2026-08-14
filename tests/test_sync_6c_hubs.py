import unittest

from scripts.sync_6c_hubs import extract_metadata


class Sync6CHubsTests(unittest.TestCase):
    def test_metadata_preserves_apostrophe_inside_double_quotes(self):
        markup = (
            '<title>6C and Oil</title>'
            '<meta name="description" content="Separate Canada\'s oil channel from a signal.">'
        )

        title, description = extract_metadata(markup)

        self.assertEqual(title, "6C and Oil")
        self.assertEqual(description, "Separate Canada's oil channel from a signal.")

    def test_metadata_decodes_html_entities(self):
        markup = (
            "<title>6C &amp; MCD</title>"
            "<meta name='description' content='Compare 6C &amp; MCD.'>"
        )

        title, description = extract_metadata(markup)

        self.assertEqual(title, "6C & MCD")
        self.assertEqual(description, "Compare 6C & MCD.")


if __name__ == "__main__":
    unittest.main()
