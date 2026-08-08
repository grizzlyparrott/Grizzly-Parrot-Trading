# Grizzly Parrot Trading

Grizzly Parrot Trading is a futures trading education website built with custom HTML, CSS, and JavaScript.

The site focuses on market structure, futures basics, platform education, prop firm trading, metals, currencies, and trading tools. It is built as a real public content site, not a demo project.

Live site: https://grizzlyparrottrading.com/

## What this project demonstrates

This project demonstrates my ability to build, organize, maintain, and improve a live educational website with a large content structure.

Key work includes:

- Custom HTML, CSS, and JavaScript pages
- Responsive layouts for desktop and mobile users
- SEO-focused page structure
- Internal linking between article hubs and supporting pages
- Market education content organized by category
- Book landing pages and product-style pages
- Tools and educational resources for futures traders
- Metadata, canonical tags, and search visibility improvements
- Ongoing updates, revisions, and site maintenance

## Main sections

The site includes sections for:

- Futures basics
- Market basics
- Prop firm trading
- Platform tutorials
- Metals
- Currencies
- Trading tools
- Books and long-form educational products

## Technologies used

- HTML
- CSS
- JavaScript
- Git
- GitHub
- GitHub Pages or static hosting workflow
- Google Search Console
- Bing Webmaster Tools
- Google Analytics

## IndexNow

The site publishes its IndexNow ownership key at the domain root. After each successful `pages-build-deployment` run on `main`, `.github/workflows/indexnow.yml` verifies that the live key and sitemap match the deployed revision and then submits only added, updated, or removed page URLs. A manual `all` run is available for an initial or recovery backfill of the complete sitemap.

The submission client fails closed on an invalid key, an off-domain sitemap URL, a stale live deployment, or a non-success API response. Each workflow run retains a JSON report for 30 days and distinguishes a completed submission from an HTTP 202 response that is still pending key validation.

`build_sitemap.py` converts Git commit timestamps to UTC before writing each `<lastmod>` value, so the sitemap never labels a local wall-clock time as UTC.

Local validation does not send data:

```powershell
py -3 -m unittest discover -s tests -v
py -3 scripts/submit_indexnow.py --all --dry-run --skip-live-check
```

## Purpose

The goal of this project is to create a useful futures trading education site built around clear explanations, structured learning paths, and practical market education.

The site is educational only. It does not provide financial advice, trading advice, investment advice, or buy/sell recommendations.

## Status

This is an active live project. I continue to update pages, improve structure, add tools, revise metadata, and expand the site's educational content.
