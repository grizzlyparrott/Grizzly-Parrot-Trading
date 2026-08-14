import unittest

from build_search_index import extract_title_and_description


class BuildSearchIndexTests(unittest.TestCase):
    def test_description_preserves_apostrophe_inside_double_quotes(self):
        markup = (
            '<title>Oil and 6C</title>'
            '<meta name="description" content="Separate Canada\'s oil channel from a signal.">'
        )

        title, description = extract_title_and_description(markup)

        self.assertEqual(title, "Oil and 6C")
        self.assertEqual(description, "Separate Canada's oil channel from a signal.")

    def test_description_preserves_double_quote_entity_inside_single_quotes(self):
        markup = (
            "<title>Quoted term</title>"
            "<meta name='description' content='Define the &quot;signal&quot; before testing.'>"
        )

        _, description = extract_title_and_description(markup)

        self.assertEqual(description, "Define the &quot;signal&quot; before testing.")


if __name__ == "__main__":
    unittest.main()
