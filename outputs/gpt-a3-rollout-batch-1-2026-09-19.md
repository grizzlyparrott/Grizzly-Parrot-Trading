# GPT-A3 rollout batch 1 consolidation record

Date: September 19, 2026

## Scope and result

This batch applied the completed GPT-A3 pilot rules to five additional two-URL clusters. Five authoritative URLs were preserved and five overlapping URLs were converted to the same static redirect endpoint used by the pilot: survivor canonical, zero-second meta refresh, `window.location.replace`, and a visible fallback link. No page was noindexed or deleted.

The discoverable estate changed only by these five justified consolidations:

- XML sitemap: 856 canonical URLs before this batch, 851 after.
- Site search index: 848 entries before this batch, 843 after.
- Physical redirect files remain present so old inbound links do not become 404s.

The GPT-A1 decision dataset remained the search-evidence source. The latest aligned current-versus-prior 90-day GSC export was unavailable in GPT-A1, so every row below retains the dataset's `recent trend: unknown` status. This batch does not invent a decline or improvement trend.

## URL-by-URL decisions and search evidence

### 1. Volatility clustering

Preserved:

- `https://grizzlyparrottrading.com/market-basics/volatility-clustering-basics.html`

Consolidated:

- `https://grizzlyparrottrading.com/market-basics/volatility-clustering-in-markets.html`

Evidence:

- Survivor: 0 GSC clicks, 3 impressions, 7.3 average position in the retained 16-month export; 0 captured latest-90-day GSC clicks/impressions; 0 GA4 Organic Search sessions; 0 confirmed live backlinks; no known referral value; no usable page-level Bing row.
- Removed URL: 0 clicks, no row in the retained 16-month GSC export, 0 captured latest-90-day GSC clicks/impressions, 0 GA4 Organic Search sessions, 0 confirmed live backlinks, no known referral value, and no distinct query evidence.
- Intent overlap: both pages defined the same volatility-clustering phenomenon, listed the same causes, described the same chart appearance, and gave the same risk-adjustment advice.

Useful material was merged into a single measurement-and-risk framework. Directional predictions and claims that quiet periods must lead to violent moves were not carried forward.

### 2. Market liquidity basics

Preserved:

- `https://grizzlyparrottrading.com/market-basics/liquidity-basics.html`

Consolidated:

- `https://grizzlyparrottrading.com/market-basics/market-liquidity-basics.html`

Evidence:

- Survivor: 0 GSC clicks/impressions in the retained 16-month export; 0 captured latest-90-day GSC clicks/impressions; 1 GA4 Organic Search session; 0 confirmed live backlinks; no known referral value; no usable page-level Bing row.
- Removed URL: 0 clicks, no row in the retained 16-month GSC export, 0 captured latest-90-day GSC clicks/impressions, 0 GA4 Organic Search sessions, 0 confirmed live backlinks, no known referral value, and no distinct query evidence.
- Intent overlap: both pages explained liquidity through depth, fills, slippage, volatility, low-liquidity conditions, and practical adjustments.

The survivor now distinguishes spread, depth, cost to trade, volume, order size, and time of measurement. Twelve prior internal references to the removed URL were migrated to the survivor rather than discarded.

### 3. Market microstructure introduction

Preserved:

- `https://grizzlyparrottrading.com/market-basics/market-microstructure-the-hidden-engine.html`

Consolidated:

- `https://grizzlyparrottrading.com/market-basics/what-is-market-microstructure.html`

Evidence:

- Survivor: 0 GSC clicks, 1 impression, 2.0 average position in the retained 16-month export; 0 captured latest-90-day GSC clicks/impressions; 0 GA4 Organic Search sessions; 0 confirmed live backlinks; no known referral value; no usable page-level Bing row.
- Removed URL: 0 clicks, no row in the retained 16-month GSC export, 0 captured latest-90-day GSC clicks/impressions, 0 GA4 Organic Search sessions, 0 confirmed live backlinks, no known referral value, and no distinct query evidence.
- Intent overlap: both were beginner introductions to order types, matching, liquidity, spreads, market impact, and price formation.

The survivor now separates quotes from trades and removes claims that a book snapshot or candle reveals participant identity, intent, or future direction.

### 4. Futures open interest

Preserved:

- `https://grizzlyparrottrading.com/futures-basics/futures-open-interest-explained.html`

Consolidated:

- `https://grizzlyparrottrading.com/futures-basics/how-open-interest-signals-futures-trend-strength.html`

Evidence:

- Survivor: 0 GSC clicks/impressions in the retained 16-month export; 0 captured latest-90-day GSC clicks/impressions; 1 GA4 Organic Search session; 0 confirmed live backlinks; no known referral value; no usable page-level Bing row.
- Removed URL: 0 clicks, no row in the retained 16-month GSC export, 0 captured latest-90-day GSC clicks/impressions, 0 GA4 Organic Search sessions, 0 confirmed live backlinks, no known referral value, and no distinct query evidence.
- Intent overlap: the removed page's entire purpose was the trend-strength interpretation already included in the broader open-interest definition, calculation, volume comparison, contract-selection, and expiration guide.

The survivor retains the useful trend-analysis discussion but labels the classic price/open-interest matrix as a heuristic, not proof of “new money,” short covering, participant class, or direction.

### 5. NinjaTrader 8 chart templates

Preserved:

- `https://grizzlyparrottrading.com/platforms-tutorials/ninjatrader-advanced-templates.html`

Consolidated:

- `https://grizzlyparrottrading.com/platforms-tutorials/ninjatrader-chart-templates-basics.html`

Evidence:

- Survivor: 0 GSC clicks, 4 impressions, 5.0 average position in the retained 16-month export; 0 captured latest-90-day GSC clicks/impressions; 0 GA4 Organic Search sessions; 0 confirmed live backlinks; no known referral value; no usable page-level Bing row.
- Removed URL: 0 clicks, no row in the retained 16-month GSC export, 0 captured latest-90-day GSC clicks/impressions, 0 GA4 Organic Search sessions, 0 confirmed live backlinks, no known referral value, and no distinct query evidence.
- Intent overlap: both covered saving, loading, defaults, what a chart template saves, and template troubleshooting.

The basics were merged into the stronger URL. The survivor was corrected against current NinjaTrader 8 documentation: chart templates are not divided into workspace-bound “local” and “global” templates; source and destination charts must have the same number of Data Series; chart templates can override Data Series settings such as Trading Hours; drawing objects are not part of chart templates.

## Trust and freshness work

All five survivors now include:

- a visible `Updated September 19, 2026` label;
- matching Article `dateModified` and Open Graph modified time;
- canonical, Article schema, and BreadcrumbList tied to the preserved URL;
- first-party or regulatory source links;
- an explicit scope/change-risk note;
- an educational and leveraged-futures risk disclosure;
- examples and interpretations labeled as limitations or heuristics rather than operational facts.

Sources checked included NinjaTrader's current chart-template help, CME's liquidity methodology, CME and CFTC open-interest definitions/reports, Investor.gov order-type guidance, CFTC Futures Market Basics, and Cboe's VIX FAQ.

## Discovery and redirect work

- Every live HTML reference to a removed URL was migrated to its survivor.
- Duplicate cards were removed from the Market Basics, Futures Basics, and Platforms hubs; each survivor has one primary hub card.
- Search-index entries for removed URLs were removed and survivor titles/descriptions were regenerated from the reviewed pages.
- Removed canonicals are absent from the XML sitemap; each survivor appears exactly once.
- The five old files remain as redirect endpoints and are neither indexed as separate canonicals nor marked `noindex`.

## Deliberately excluded candidates

- Bookmap heatmap basics versus Bookmap liquidity explained was not consolidated because a platform heatmap walkthrough can retain a distinct feature/setup intent from a general liquidity interpretation page.
- Market correlation pages were not included because the surviving evidence was only one historical impression and the high-risk claims need a more focused factual review before an irreversible consolidation decision.
- Volatility-cycle pages were not included because both were zero-evidence pages and the current evidence did not identify a clearly stronger survivor.

These exclusions confirm that low traffic and textual similarity remain screening signals, not sufficient reasons to consolidate.

## Verification gate

Focused regression coverage verifies the five mappings, trust metadata, parsable JSON-LD, redirect behavior, hub-card uniqueness, internal-link migration, sitemap/search-index uniqueness, and removal of the most material unsupported claims. Full repository tests and live deployment verification are recorded in the deployment section after release.

## Pattern verdict

The pilot rules do not need to change. They do need to remain strict: require same intent, a zero-equity removed URL, a clearly better survivor, no unique operational purpose, source-checked merged content, migrated discovery, and tested redirect behavior. A pair with only superficial title similarity, a distinct feature task, unresolved query intent, or no defensible survivor should remain separate.
