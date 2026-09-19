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

## Visual correction

The original rollout used the legacy plain-article shell despite the stronger visual system already present on newer Grizzly Parrot guides. On September 19, 2026, the five preserved survivor pages were corrected without altering their consolidation or trust decisions. Each now uses the shared editorial visual treatment and a purpose-built, accessible SVG diagram:

- volatility clustering: an illustrative quiet/elevated regime map that explicitly distinguishes return magnitude from a directional forecast;
- liquidity: an order-size, spread, depth, and conditions-to-execution-cost map that states displayed depth is not a guaranteed fill;
- market microstructure: a quote-to-marketable-order-to-completed-trade lifecycle that separates observations from participant intent;
- futures open interest: a lifecycle that distinguishes new positions, both sides closing, and transfers, without inferring motive; and
- NinjaTrader templates: a conceptual object map that differentiates chart templates from workspaces and other template types, including the Data Series compatibility check.

These are original explanatory graphics, not generic market imagery or platform screenshots. Their captions and alternative text preserve the corresponding YMYL limitations.

## Content-quality correction and rollout stop

Further GPT-A3 consolidation rollout is stopped. The five existing survivors were re-reviewed against internal completeness benchmarks before any other survivor page can be considered: `futures-basics/gc-market-microstructure.html` (3,446 body words), `platforms-tutorials/tradovate-chart-drawing-tools-explained.html` (1,890 body words), and the subject-matter depth of `platforms-tutorials/insignia-futures-options-overview.html`. The benchmarks inform scope; they are not templates or arbitrary length targets.

The prior versions were 419–501 body words and could pass only technical, trust, redirect, and visual checks. The revised body counts are:

- volatility clustering: 1,002 words;
- liquidity basics: 856 words;
- market microstructure: 871 words;
- futures open interest: 881 words; and
- NinjaTrader chart templates: 847 words.

Major additions are topic-specific. Volatility now includes absolute/squared-return measurement, a worked regime comparison, conceptual GARCH-style thinking, and a risk workflow. Liquidity now covers executable versus displayed size, volume versus liquidity, fragile conditions, and a stated-size example. Microstructure now covers matching and queue limits, price impact, a concrete execution example, failure modes, and a disciplined observation workflow. Open interest now includes contract-lifecycle examples, contract-month/roll treatment, report-status checks, spread/hedging caveats, and practical use cases. NinjaTrader now distinguishes each saved object, provides a tested-chart workflow, and adds backup/change-control limits.

The test suite now includes a topic-specific survivor content gate. It requires a scoped broad-topic body floor, at least eight substantive sections, named topic-required sections, a practical workflow, a non-paragraph explanatory structure, preserved trust disclosure, and the existing visual/redirect/discovery checks. No global word count is used as a sole pass condition. The earlier five versions would have failed their scoped body-depth and required-section checks.

Verification for this correction: focused survivor acceptance checks passed 9/9; the full repository suite passed 131/131; and `git diff --check` passed. Content commit `48327ef935cdd316c68b78c35fa10c5b36808671` was deployed by successful GitHub Pages run `35475071691`. No-cache live checks returned HTTP 200 for all five survivor URLs and confirmed a newly required section on each. The primary IndexNow run `35475072177` succeeded; a subsequent automated IndexNow run was still in progress at this record time. No additional survivor clusters were changed.

## Batch 2 hold and second content-depth correction

Batch 2 is explicitly on hold. No additional pages were selected, edited, consolidated, or evaluated for release. The same five survivors were revised again because the 847–1,002 word versions, while structurally improved, remained too compressed for broad educational topics.

The content-quality gate now uses a hard 1,200 substantive-body-word floor for every one of these five broad survivor topics, in addition to—not instead of—the topic-specific heading, workflow/example, explanatory-structure, source, trust, visual, redirect, and discovery checks. The final counts for this revision are volatility clustering 1,339; liquidity basics 1,258; market microstructure 1,204; futures open interest 1,235; and NinjaTrader templates 1,216.

The added material develops actual reasoning: volatility now works through tick-value risk recalculation and observation records; liquidity works through stated-size price averaging, live-condition evaluation, and order-instruction tradeoffs; microstructure works through queue limits, observable versus unobservable evidence, and execution review; open interest works through a beginning-to-ending contract ledger, roll interpretation, and reporting-version discipline; and NinjaTrader works through object selection, same-series testing, safe troubleshooting, and recoverable change control. No duplicates were restored and no additional survivor cluster was changed.

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

### Original consolidation release

Focused regression coverage verifies the five mappings, trust metadata, parsable JSON-LD, redirect behavior, hub-card uniqueness, internal-link migration, sitemap/search-index uniqueness, and removal of the most material unsupported claims.

Verification results:

- Focused GPT-A3 batch tests: 7 passed.
- Full repository suite: 129 passed.
- `git diff --check`: passed; only the repository's existing Windows line-ending notices were emitted.
- GitHub Pages content commit: `b13041e2c903417e240bc709e0375cf3d21849b2`.
- GitHub Pages run `35468161271`: build, status report, and deploy jobs all succeeded.
- IndexNow runs `35468161621` and `35468182913`: both succeeded for the same content commit.
- Live browser verification: all five survivor URLs rendered the expected reviewed title, September 19, 2026 date, and survivor canonical.
- Live redirect verification: all five old URLs navigated to the exact intended survivor.
- Discovery verification: the released sitemap contains 851 canonical URLs and the released search index contains 843 entries; the five old URLs are absent and each survivor is present exactly once. Hub regression checks confirm one primary card per survivor.

### Visual correction release

- Visual-specific regression coverage: 8 passed, including one original SVG and one accessible figure on every survivor.
- Full repository suite: 130 passed.
- SVG XML parsing: passed for all five new diagrams.
- Local browser visual QA: passed for the volatility and NinjaTrader guide layouts; headings, update badges, graphics, captions, and responsive-width rendering were checked after a heading-contrast correction.
- The correction changes neither canonical URLs, redirects, sitemap membership, search-index membership, Article dates, source disclosures, nor the original consolidation evidence.
- Visual-correction content commit: `88e8f711a8f482d92af6f736310d432aa5129670` (`Restore visual treatment for GPT-A3 survivors`).
- GitHub Pages deployment `35474484748`: succeeded (build, status report, and deploy jobs).
- IndexNow submission `35474485264`: succeeded. A second automated IndexNow run was still in progress when this record was updated.
- Final live verification: all five survivor URLs returned HTTP 200 with no-cache requests and contained their exact new SVG reference. The volatility page was also browser-verified live with the visual visible and its accessible alternative text exposed.

## Pattern verdict

The pilot rules do not need to change. They do need to remain strict: require same intent, a zero-equity removed URL, a clearly better survivor, no unique operational purpose, source-checked merged content, migrated discovery, and tested redirect behavior. A pair with only superficial title similarity, a distinct feature task, unresolved query intent, or no defensible survivor should remain separate.
