#!/usr/bin/env python3
"""Validate the Market Structure book catalog, product markup, and Merchant feed."""

from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


BASE_URL = "https://grizzlyparrottrading.com"
BOOK_SLUGS = (
    "currency-market-structure",
    "metals-market-structure",
    "equity-market-structure",
)
EDITIONS = ("paperback", "hardcover")
G_NS = "{http://base.google.com/ns/1.0}"


class Audit:
    def __init__(self) -> None:
        self.checks = 0
        self.errors: list[str] = []

    def require(self, condition: bool, message: str) -> None:
        self.checks += 1
        if not condition:
            self.errors.append(message)

    def finish(self) -> None:
        if self.errors:
            print(f"FAIL: {len(self.errors)} error(s) across {self.checks} checks", file=sys.stderr)
            for error in self.errors:
                print(f"  - {error}", file=sys.stderr)
            raise SystemExit(1)
        print(f"PASS: {self.checks} Google Books checks; 3 books and 6 physical products are synchronized.")


@dataclass(frozen=True)
class CatalogEntry:
    key: str
    series_slug: str
    edition: str
    title: str
    isbn: str
    pages: int
    price_cents: int

    @property
    def product_id(self) -> str:
        return f"{self.series_slug}-{self.edition}"

    @property
    def gtin(self) -> str:
        return re.sub(r"\D", "", self.isbn)

    @property
    def price(self) -> str:
        return f"{self.price_cents / 100:.2f}"

    @property
    def page_url(self) -> str:
        return f"{BASE_URL}/books/{self.series_slug}/"

    @property
    def landing_url(self) -> str:
        return f"{self.page_url}?edition={self.edition}#purchase"

    @property
    def image_url(self) -> str:
        return f"{self.page_url}{self.series_slug}-cover.png"


class BookHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.canonicals: list[str] = []
        self.data_editions: list[str] = []
        self.edition_links: list[str] = []
        self.stylesheets: list[str] = []
        self.jsonld_blocks: list[str] = []
        self._jsonld_parts: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "link" and values.get("rel") == "canonical" and values.get("href"):
            self.canonicals.append(str(values["href"]))
        if tag == "link" and values.get("rel") == "stylesheet" and values.get("href"):
            self.stylesheets.append(str(values["href"]))
        if values.get("data-edition"):
            self.data_editions.append(str(values["data-edition"]))
        if tag == "a" and values.get("href") and "?edition=" in str(values["href"]):
            self.edition_links.append(str(values["href"]))
        if tag == "script" and values.get("type", "").lower() == "application/ld+json":
            self._jsonld_parts = []

    def handle_data(self, data: str) -> None:
        if self._jsonld_parts is not None:
            self._jsonld_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._jsonld_parts is not None:
            self.jsonld_blocks.append("".join(self._jsonld_parts))
            self._jsonld_parts = None


def parse_catalog(path: Path, audit: Audit) -> dict[tuple[str, str], CatalogEntry]:
    text = path.read_text(encoding="utf-8")
    start_re = re.compile(r'^  "([^"]+)": Object\.freeze\(\{$')
    end_re = re.compile(r"^  \}\)(?:,)?$")
    field_re = re.compile(
        r'^    (seriesSlug|edition|title|isbn|interiorPages|priceCents): (.+?)(?:,)?$'
    )
    raw_entries: list[tuple[str, dict[str, Any]]] = []
    current_key: str | None = None
    current: dict[str, Any] = {}

    for line in text.splitlines():
        start = start_re.match(line)
        if start:
            current_key = start.group(1)
            current = {}
            continue
        if current_key is None:
            continue
        field = field_re.match(line)
        if field:
            name, raw_value = field.groups()
            raw_value = raw_value.rstrip(",")
            current[name] = json.loads(raw_value) if raw_value.startswith('"') else int(raw_value)
        if end_re.match(line):
            raw_entries.append((current_key, current))
            current_key = None
            current = {}

    entries: dict[tuple[str, str], CatalogEntry] = {}
    for key, raw in raw_entries:
        required = {"seriesSlug", "edition", "title", "isbn", "interiorPages", "priceCents"}
        if not required.issubset(raw):
            continue
        entry = CatalogEntry(
            key=key,
            series_slug=str(raw["seriesSlug"]),
            edition=str(raw["edition"]),
            title=str(raw["title"]),
            isbn=str(raw["isbn"]),
            pages=int(raw["interiorPages"]),
            price_cents=int(raw["priceCents"]),
        )
        entries[(entry.series_slug, entry.edition)] = entry

    expected_keys = {(slug, edition) for slug in BOOK_SLUGS for edition in EDITIONS}
    audit.require(set(entries) == expected_keys, "print catalog must contain exactly the expected six editions")
    for entry in entries.values():
        audit.require(valid_gtin13(entry.gtin), f"catalog ISBN has an invalid GTIN-13 checksum: {entry.isbn}")
        audit.require(entry.price_cents in {3900, 4900}, f"unexpected catalog price for {entry.product_id}")
    return entries


def valid_gtin13(value: str) -> bool:
    if not re.fullmatch(r"\d{13}", value):
        return False
    total = sum(int(digit) * (1 if index % 2 == 0 else 3) for index, digit in enumerate(value[:12]))
    return (10 - total % 10) % 10 == int(value[-1])


def parse_html(path: Path, audit: Audit) -> tuple[BookHTMLParser, list[dict[str, Any]], str]:
    source = path.read_text(encoding="utf-8")
    parser = BookHTMLParser()
    parser.feed(source)
    documents: list[dict[str, Any]] = []
    for index, block in enumerate(parser.jsonld_blocks, start=1):
        try:
            parsed = json.loads(block)
        except json.JSONDecodeError as exc:
            audit.require(False, f"{path}: JSON-LD block {index} is invalid: {exc}")
            continue
        audit.require(isinstance(parsed, dict), f"{path}: JSON-LD block {index} must be an object")
        if isinstance(parsed, dict):
            documents.append(parsed)
    return parser, documents, source


def flatten_nodes(documents: list[dict[str, Any]]) -> list[dict[str, Any]]:
    nodes: list[dict[str, Any]] = []
    for document in documents:
        graph = document.get("@graph")
        if isinstance(graph, list):
            nodes.extend(node for node in graph if isinstance(node, dict))
        else:
            nodes.append(document)
    return nodes


def node_types(node: dict[str, Any]) -> set[str]:
    raw = node.get("@type", [])
    return {raw} if isinstance(raw, str) else {str(value) for value in raw}


def local_path_for_url(root: Path, url: str) -> Path:
    path = urlparse(url).path.lstrip("/")
    return root / path


def validate_hub(root: Path, audit: Audit) -> None:
    path = root / "books" / "index.html"
    parser, documents, source = parse_html(path, audit)
    canonical = f"{BASE_URL}/books/"
    audit.require(parser.canonicals == [canonical], "books hub must have one clean canonical URL")
    pages = [node for node in flatten_nodes(documents) if "CollectionPage" in node_types(node)]
    audit.require(len(pages) == 1, "books hub must expose one CollectionPage")
    if not pages:
        return
    page = pages[0]
    audit.require(page.get("url") == canonical, "books CollectionPage URL must match its canonical")
    audit.require("/index.html" not in json.dumps(page), "books CollectionPage must not expose /index.html URLs")
    expected_edition_links = {
        f"{BASE_URL}/books/{slug}/?edition={edition}#purchase"
        for slug in BOOK_SLUGS
        for edition in EDITIONS
    }
    audit.require(set(parser.edition_links) == expected_edition_links, "books hub must link directly to all six physical editions")
    audit.require(len(parser.edition_links) == 6, "books hub physical-edition links must be unique")
    item_list = page.get("mainEntity", {})
    audit.require(item_list.get("@type") == "ItemList", "books hub mainEntity must be an ItemList")
    items = item_list.get("itemListElement", [])
    audit.require(item_list.get("numberOfItems") == 3 and len(items) == 3, "books hub ItemList must contain three books")
    for position, slug in enumerate(BOOK_SLUGS, start=1):
        if position > len(items):
            break
        item = items[position - 1]
        book = item.get("item", {})
        page_url = f"{BASE_URL}/books/{slug}/"
        audit.require(item.get("position") == position, f"hub position is wrong for {slug}")
        audit.require(book.get("@type") == "Book", f"hub item is not a Book for {slug}")
        audit.require(book.get("@id") == f"{page_url}#work", f"hub @id is wrong for {slug}")
        audit.require(book.get("url") == page_url, f"hub URL is wrong for {slug}")
        audit.require(book.get("image") == f"{page_url}{slug}-cover.png", f"hub image is wrong for {slug}")
    audit.require("156 pages" in source, "equity book page count on the hub must match the 156-page print catalog")


def validate_book_pages(
    root: Path, entries: dict[tuple[str, str], CatalogEntry], audit: Audit
) -> dict[str, dict[str, Any]]:
    products: dict[str, dict[str, Any]] = {}
    for slug in BOOK_SLUGS:
        path = root / "books" / slug / "index.html"
        parser, documents, source = parse_html(path, audit)
        base = f"{BASE_URL}/books/{slug}/"
        nodes = flatten_nodes(documents)
        by_id = {str(node["@id"]): node for node in nodes if node.get("@id")}

        audit.require(parser.canonicals == [base], f"{slug}: canonical URL is wrong")
        audit.require(set(parser.data_editions) == {"digital", "paperback", "hardcover"}, f"{slug}: landing page must expose all three edition selectors")
        audit.require(len(parser.data_editions) == 3, f"{slug}: edition selector values must be unique")
        audit.require(any("20260811-google-books" in href for href in parser.stylesheets), f"{slug}: updated shared stylesheet is not cache-busted")
        audit.require("new URLSearchParams(window.location.search).get('edition')" in source, f"{slug}: edition query selection is missing")
        audit.require("aria-current" in source and "is-selected" in source, f"{slug}: selected edition needs visible and accessible state")
        audit.require("buy.stripe.com" not in json.dumps(documents) and "book.stripe.com" not in json.dumps(documents), f"{slug}: structured data must use the product landing page, not checkout")

        required_ids = {
            f"{BASE_URL}/#organization",
            f"{BASE_URL}/about.html#kyle-parrott",
            f"{BASE_URL}/books/#market-structure-series",
            f"{base}#work",
            f"{base}#digital",
            f"{base}#paperback",
            f"{base}#hardcover",
        }
        audit.require(required_ids.issubset(by_id), f"{slug}: JSON-LD graph is missing required entities")
        if not required_ids.issubset(by_id):
            continue

        organization = by_id[f"{BASE_URL}/#organization"]
        policy = organization.get("hasMerchantReturnPolicy", {})
        audit.require(policy.get("applicableCountry") == "US", f"{slug}: return policy country must be US")
        audit.require(policy.get("returnPolicyCategory") == "https://schema.org/MerchantReturnNotPermitted", f"{slug}: structured return category does not match the store policy")
        audit.require(policy.get("merchantReturnLink") == f"{BASE_URL}/store-policy.html", f"{slug}: return policy link is wrong")

        work = by_id[f"{base}#work"]
        work_examples = {item.get("@id") for item in work.get("workExample", [])}
        expected_examples = {f"{base}#{edition}" for edition in ("digital", *EDITIONS)}
        audit.require(node_types(work) == {"Book"}, f"{slug}: work entity must be a Book")
        audit.require(work.get("url") == base, f"{slug}: work URL is wrong")
        audit.require(work_examples == expected_examples, f"{slug}: workExample must link all three editions")

        digital = by_id[f"{base}#digital"]
        digital_offer = digital.get("offers", {})
        digital_url = f"{base}?edition=digital#purchase"
        audit.require(node_types(digital) == {"Book"}, f"{slug}: digital edition must be a Book, not a Shopping product")
        audit.require(digital.get("bookFormat") == "https://schema.org/EBook", f"{slug}: digital book format is wrong")
        audit.require(digital.get("url") == digital_url and digital_offer.get("url") == digital_url, f"{slug}: digital landing URL is wrong")
        audit.require(digital_offer.get("price") == "29.00" and digital_offer.get("priceCurrency") == "USD", f"{slug}: digital price is wrong")

        for edition in EDITIONS:
            entry = entries[(slug, edition)]
            node = by_id[f"{base}#{edition}"]
            offer = node.get("offers", {})
            expected_format = f"https://schema.org/{'Paperback' if edition == 'paperback' else 'Hardcover'}"
            audit.require(node_types(node) == {"Book", "Product"}, f"{entry.product_id}: must be both Book and Product")
            audit.require(node.get("sku") == entry.product_id, f"{entry.product_id}: structured SKU is wrong")
            audit.require(node.get("isbn") == entry.isbn, f"{entry.product_id}: structured ISBN is wrong")
            audit.require(node.get("gtin13") == entry.gtin, f"{entry.product_id}: structured GTIN is wrong")
            audit.require(valid_gtin13(str(node.get("gtin13", ""))), f"{entry.product_id}: structured GTIN checksum is invalid")
            audit.require(node.get("numberOfPages") == entry.pages, f"{entry.product_id}: structured page count is wrong")
            audit.require(node.get("bookFormat") == expected_format, f"{entry.product_id}: structured book format is wrong")
            audit.require(node.get("url") == entry.landing_url and offer.get("url") == entry.landing_url, f"{entry.product_id}: landing URL is wrong")
            audit.require(offer.get("price") == entry.price and offer.get("priceCurrency") == "USD", f"{entry.product_id}: structured price is wrong")
            audit.require(offer.get("availability") == "https://schema.org/InStock", f"{entry.product_id}: availability must be InStock")
            audit.require(offer.get("itemCondition") == "https://schema.org/NewCondition", f"{entry.product_id}: condition must be NewCondition")
            audit.require(node.get("image") == entry.image_url, f"{entry.product_id}: image URL is wrong")
            audit.require(len(str(node.get("description", ""))) >= 80, f"{entry.product_id}: product description is too thin")
            audit.require(local_path_for_url(root, entry.image_url).is_file(), f"{entry.product_id}: cover image file is missing")
            products[entry.product_id] = node
    return products


def validate_feed(
    root: Path,
    entries: dict[tuple[str, str], CatalogEntry],
    page_products: dict[str, dict[str, Any]],
    audit: Audit,
) -> None:
    path = root / "google-merchant-books.xml"
    try:
        tree = ET.parse(path)
    except ET.ParseError as exc:
        audit.require(False, f"Merchant feed XML is invalid: {exc}")
        return
    channel = tree.getroot().find("channel")
    audit.require(channel is not None, "Merchant feed must contain a channel")
    if channel is None:
        return
    audit.require(channel.findtext("link") == f"{BASE_URL}/books/", "Merchant feed channel link is wrong")
    items = channel.findall("item")
    audit.require(len(items) == 6, "Merchant feed must contain exactly six physical editions")
    by_id = {item.findtext(f"{G_NS}id", ""): item for item in items}
    expected_ids = {entry.product_id for entry in entries.values()}
    audit.require(set(by_id) == expected_ids, "Merchant feed IDs do not match the print catalog")
    ids = [item.findtext(f"{G_NS}id", "") for item in items]
    gtins = [item.findtext(f"{G_NS}gtin", "") for item in items]
    links = [item.findtext(f"{G_NS}link", "") for item in items]
    audit.require(len(ids) == len(set(ids)), "Merchant feed IDs must be unique")
    audit.require(len(gtins) == len(set(gtins)), "Merchant feed GTINs must be unique")
    audit.require(len(links) == len(set(links)), "Merchant feed landing URLs must be edition-specific")

    for entry in entries.values():
        item = by_id.get(entry.product_id)
        if item is None:
            continue
        value = lambda name: item.findtext(f"{G_NS}{name}", "")
        title = value("title")
        description = value("description")
        audit.require(entry.edition.title() in title and entry.title in title, f"{entry.product_id}: feed title is wrong")
        audit.require(len(description) >= 100, f"{entry.product_id}: feed description is too thin")
        audit.require(value("link") == entry.landing_url, f"{entry.product_id}: feed landing URL is wrong")
        audit.require(value("image_link") == entry.image_url, f"{entry.product_id}: feed image URL is wrong")
        audit.require(value("availability") == "in_stock", f"{entry.product_id}: feed availability is wrong")
        audit.require(value("price") == f"{entry.price} USD", f"{entry.product_id}: feed price is wrong")
        audit.require(value("condition") == "new", f"{entry.product_id}: feed condition is wrong")
        audit.require(value("brand") == "Grizzly Parrot Trading", f"{entry.product_id}: feed brand is wrong")
        audit.require(value("gtin") == entry.gtin and valid_gtin13(value("gtin")), f"{entry.product_id}: feed GTIN is wrong")
        audit.require(value("identifier_exists") == "yes", f"{entry.product_id}: identifier_exists must be yes")
        audit.require(bool(value("product_type")), f"{entry.product_id}: product_type is missing")
        audit.require("ebook" not in title.lower() and "digital" not in title.lower(), f"{entry.product_id}: digital books cannot be in the Shopping feed")
        page_product = page_products.get(entry.product_id, {})
        audit.require(page_product.get("gtin13") == value("gtin"), f"{entry.product_id}: feed and page GTINs differ")
        audit.require(page_product.get("offers", {}).get("price") == entry.price, f"{entry.product_id}: feed and page prices differ")


def validate_sitemap_and_policy(root: Path, audit: Audit) -> None:
    sitemap = ET.parse(root / "sitemap.xml")
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    records = {
        node.findtext("s:loc", "", namespace): node.findtext("s:lastmod", "", namespace)
        for node in sitemap.getroot().findall("s:url", namespace)
    }
    required = [f"{BASE_URL}/books/"] + [f"{BASE_URL}/books/{slug}/" for slug in BOOK_SLUGS]
    for url in required:
        audit.require(url in records, f"sitemap is missing {url}")
        audit.require(records.get(url, "").startswith("2026-08-11T"), f"sitemap lastmod was not refreshed for {url}")

    policy_path = root / "store-policy.html"
    policy = policy_path.read_text(encoding="utf-8").lower()
    audit.require(policy_path.is_file(), "store policy page is missing")
    audit.require("available only for delivery to addresses in the united states" in policy, "store policy must disclose US-only delivery")
    audit.require("we do not accept returns or exchanges" in policy, "store policy must disclose the no-change-of-mind return rule")
    audit.require("shipping is charged separately" in policy, "store policy must disclose separate shipping charges")


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    audit = Audit()
    entries = parse_catalog(root / "fulfillment" / "paperback-worker" / "src" / "catalog.mjs", audit)
    validate_hub(root, audit)
    page_products = validate_book_pages(root, entries, audit)
    validate_feed(root, entries, page_products, audit)
    validate_sitemap_and_policy(root, audit)
    audit.finish()


if __name__ == "__main__":
    main()
