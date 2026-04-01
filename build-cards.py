from pathlib import Path
import re
from html import unescape

ROOT = Path(__file__).parent.resolve()

# CHANGE THESE TWO LINES EACH TIME YOU WANT A DIFFERENT INDEX/FOLDER
INDEX = ROOT / "futures-basics" / "index.html"
FOLDER = ROOT / "futures-basics"

GRID_OPEN = '<div class="grid grid-3">'
TITLE_RE = re.compile(r"<title>(.*?)</title>", re.IGNORECASE | re.DOTALL)
DESC_RE = re.compile(r'<meta\s+name="description"\s+content="(.*?)"', re.IGNORECASE | re.DOTALL)
LINK_RE = re.compile(r'<h3>\s*<a href="([^"]+\.html)">', re.IGNORECASE)
CARD_RE = re.compile(r'<article class="card">.*?</article>', re.IGNORECASE | re.DOTALL)
CARD_DESC_RE = re.compile(r'(<p>)(.*?)(</p>)', re.IGNORECASE | re.DOTALL)

MAX_DESC_LEN = 110


def shorten(text: str, limit: int = MAX_DESC_LEN) -> str:
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0]
    return cut + "..."


def extract_title(html: str) -> str | None:
    m = TITLE_RE.search(html)
    if not m:
        return None
    title = unescape(m.group(1)).strip()
    # Remove site suffix if present
    title = re.sub(r"\s*\|\s*Grizzly Parrot Trading\s*$", "", title, flags=re.IGNORECASE)
    return title


def extract_description(html: str) -> str | None:
    m = DESC_RE.search(html)
    if not m:
        return None
    return unescape(m.group(1)).strip()


def build_card(filename: str, title: str, description: str) -> str:
    desc = shorten(description)
    return (
        f'<article class="card">\n'
        f'  <h3><a href="{filename}">{title}</a></h3>\n'
        f'  <p>{desc}</p>\n'
        f'</article>'
    )


def find_first_grid_bounds(index_html: str) -> tuple[int, int] | None:
    start = index_html.find(GRID_OPEN)
    if start == -1:
        return None

    pos = start
    depth = 0

    while pos < len(index_html):
        next_open = index_html.find("<div", pos)
        next_close = index_html.find("</div>", pos)

        if next_close == -1:
            return None

        if next_open != -1 and next_open < next_close:
            depth += 1
            pos = next_open + 4
        else:
            depth -= 1
            pos = next_close + 6
            if depth == 0:
                return start, pos

    return None


def trim_existing_card_descriptions(grid_html: str) -> str:
    def trim_one_card(card_match: re.Match) -> str:
        card_html = card_match.group(0)

        def trim_p(p_match: re.Match) -> str:
            opening = p_match.group(1)
            content = p_match.group(2)
            closing = p_match.group(3)
            return f"{opening}{shorten(unescape(content))}{closing}"

        return CARD_DESC_RE.sub(trim_p, card_html, count=1)

    return CARD_RE.sub(trim_one_card, grid_html)


def main() -> None:
    if not INDEX.exists():
        print(f"Missing index page: {INDEX}")
        return

    if not FOLDER.exists():
        print(f"Missing folder: {FOLDER}")
        return

    index_html = INDEX.read_text(encoding="utf-8")

    bounds = find_first_grid_bounds(index_html)
    if not bounds:
        print("Could not find the first <div class=\"grid grid-3\"> block.")
        return

    grid_start, grid_end = bounds
    grid_html = index_html[grid_start:grid_end]

    # First, trim descriptions already inside existing cards
    grid_html = trim_existing_card_descriptions(grid_html)

    # Then detect which article links already exist
    existing_links = set(LINK_RE.findall(grid_html))

    new_cards = []

    articles = sorted(
        [f for f in FOLDER.glob("*.html") if f.name.lower() != "index.html"],
        key=lambda x: x.stat().st_mtime,
        reverse=True
    )

    for file in articles:
        if file.name in existing_links:
            continue

        html = file.read_text(encoding="utf-8")

        title = extract_title(html)
        desc = extract_description(html)

        if not title or not desc:
            print(f"Skipping {file.name}: missing <title> or meta description")
            continue

        new_cards.append(build_card(file.name, title, desc))

    if new_cards:
        insert_pos = grid_html.find(GRID_OPEN) + len(GRID_OPEN)
        grid_html = grid_html[:insert_pos] + "\n" + "\n".join(new_cards) + "\n" + grid_html[insert_pos:]
        print(f"Added {len(new_cards)} new cards.")
    else:
        print("No new cards needed.")

    updated_html = index_html[:grid_start] + grid_html + index_html[grid_end:]
    INDEX.write_text(updated_html, encoding="utf-8")
    print(f"Updated {INDEX}")


if __name__ == "__main__":
    main()