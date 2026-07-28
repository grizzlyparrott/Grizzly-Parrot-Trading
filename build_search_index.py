import json
import os
import re
from pathlib import Path
from urllib.parse import urljoin, urlparse, urlunparse

# --- CONFIG ---
ROOT_DIR = Path(__file__).parent.resolve()

# Only index HTML files inside these folders (relative to root)
ALLOWED_DIRS = {
    "currencies",
    "energies",
    "futures-basics",
    "market-basics",
    "metals",
    "platforms-tutorials",
    "prop-firm-trading",
    "tools",
    "books",
}
CATEGORY_LABELS = {
    "futures-basics": "Futures Basics",
    "prop-firm-trading": "Prop Firm Trading",
    "platforms-tutorials": "Platforms & Tutorials",
    "market-basics": "Market Basics",
    "currencies": "Currencies",
    "energies": "Energies",
    "metals": "Metals",
    "books": "Books",
}
BASE_URL = "https://grizzlyparrottrading.com"
OUTPUT_FILE = ROOT_DIR / "search-index.json"

CANONICAL_RE = re.compile(
    r'<link\s+[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)["\'][^>]*>',
    re.IGNORECASE,
)
ROBOTS_META_RE = re.compile(
    r'<meta\s+[^>]*name=["\']robots["\'][^>]*content=["\']([^"\']+)["\']',
    re.IGNORECASE,
)


def is_allowed_html(path: Path) -> bool:
    if path.suffix.lower() != ".html":
        return False

    rel_parts = path.relative_to(ROOT_DIR).parts
    if not rel_parts:
        return False

    # Only include known article buckets.
    return rel_parts[0] in ALLOWED_DIRS


def is_noindex(text: str) -> bool:
    m = ROBOTS_META_RE.search(text)
    if not m:
        return False
    return "noindex" in m.group(1).lower()


def find_canonical_in_html(text: str) -> str:
    m = CANONICAL_RE.search(text)
    if not m:
        return ""
    return m.group(1).strip()


def normalize_url(url: str) -> str:
    if not url:
        return ""
    parsed = urlparse(url)
    if not parsed.scheme:
        parsed = urlparse(urljoin(BASE_URL + "/", url))
    if parsed.scheme not in {"http", "https"}:
        return ""
    path = parsed.path or "/"
    path = re.sub(r"/+", "/", path)
    if path == "/index.html":
        path = "/"
    if path.endswith("/index.html"):
        path = path[:-10] + "/"
    return urlunparse(("https", parsed.netloc, path, "", "", ""))


def fallback_canonical_for_file(path: Path) -> str:
    rel = path.relative_to(ROOT_DIR).as_posix()
    if rel == "index.html":
        return f"{BASE_URL}/"
    if rel.endswith("/index.html"):
        rel = rel[: -len("/index.html")]
        return f"{BASE_URL}/{rel}/"
    return f"{BASE_URL}/{rel}"


def extract_title_and_description(html: str):
    title_match = re.search(
        r"<title>\s*(.*?)\s*</title>",
        html,
        flags=re.IGNORECASE | re.DOTALL,
    )
    title = title_match.group(1).strip() if title_match else ""

    desc_match = re.search(
        r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']+)["\']',
        html,
        flags=re.IGNORECASE | re.DOTALL,
    )
    description = desc_match.group(1).strip() if desc_match else ""

    return title, description


def main() -> None:
    entries = []

    for root, dirs, files in os.walk(ROOT_DIR):
        # Skip hidden folders
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for fname in files:
            path = Path(root) / fname
            if not is_allowed_html(path):
                continue
            if fname.startswith("."):
                continue

            try:
                html = path.read_text(encoding="utf-8", errors="ignore")
            except Exception as e:
                print(f"Skipping {path} (read error: {e})")
                continue

            if is_noindex(html):
                continue

            canonical = find_canonical_in_html(html)
            url = normalize_url(canonical)
            if not url or not url.startswith(BASE_URL):
                url = fallback_canonical_for_file(path)

            title, description = extract_title_and_description(html)
            rel = path.relative_to(ROOT_DIR)
            parts = rel.parts
            category_folder = parts[0] if parts else ""

            entries.append(
                {
                    "title": title,
                    "url": url.replace(BASE_URL, ""),
                    "description": description,
                    "category": CATEGORY_LABELS.get(category_folder, category_folder),
                }
            )

    # Deduplicate by URL
    dedup = {}
    for entry in entries:
        if entry["url"] not in dedup:
            dedup[entry["url"]] = entry

    deduped_entries = sorted(dedup.values(), key=lambda x: x["title"].lower())

    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(deduped_entries, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(deduped_entries)} entries to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()

