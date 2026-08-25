# Independent evidence and correctness proofread: core 6Z library

Review date: 2026-08-25

Reviewer role: independent Proofreader 1; evidence, mechanics, arithmetic, attribution, metadata/schema, links, and accessibility

Scope: every one of the 20 target articles enumerated in `artifacts/6z-cluster-classification.md` and `scripts/validate_6z_cluster.py`; no sampling
Edit boundary: surgical corrections were limited to target article files. No hub, search, sitemap, script, test, or release file was edited by this proofreader. No commit was made.

## Fail-closed verdict

**PASS — 20 of 20 pages pass, with 0 unresolved findings, 0 validator errors, and 0 validator warnings.**

The final integrated cluster reconciles to current primary-source mechanics, preserves the ZAR/USD quote direction, uses correct arithmetic, distinguishes margin from maximum loss, states expiry and physical-delivery boundaries accurately, avoids unsupported current-value and causal claims, and does not present research protocols as completed empirical findings. The final full validator, all 6Z unit tests, the distinctiveness audit, and `git diff --check` exit successfully.

## Review method and scope completed

1. Read `artifacts/6z-cluster-classification.md` and all 917 lines of `scripts/validate_6z_cluster.py` in full.
2. Read the complete title/head metadata, JSON-LD, visible body, internal links, source disclosure, disclaimer, and closing markup of all 20 pages.
3. Recomputed every material numerical example independently, including tick value, reciprocal quote examples, P&L, gap/slippage, margin stress, and position-size arithmetic.
4. Checked the contract against current CME Rulebook Chapter 259, CME's current FX Product Guide, live product records, trading-hours material, delivery material, and current margin/risk documentation.
5. Checked monetary-policy, inflation, implementation, reserve, fiscal, and U.S.-dollar claims against current SARB, Stats SA, South African National Treasury, and Federal Reserve sources. Checked specialist market-structure and conduct claims against CME, CFTC, BIS, and NFA sources.
6. Tested exact title/meta/schema/date agreement, canonical URLs, link resolution, table semantics, labels, skip links, JSON-LD parsing, accessibility attributes, and cluster synchronization through the fail-closed validator and release tests.
7. Reread every page affected by a correction and reran the complete gate after hub/search/sitemap synchronization.

## Primary-source truth set used

| Topic | Authoritative truth used in review | Cluster result |
|---|---|---|
| Contract identity | [CME Rulebook Chapter 259](https://www.cmegroup.com/rulebook/CME/III/250/259/259.pdf) defines South African rand/U.S. dollar futures with a 500,000-rand trading unit. The [current CME FX Product Guide](https://www.cmegroup.com/markets/fx/fx-product-guide.html) identifies Globex code 6Z and ClearPort/clearing code RA. | Correct on all pages that state the contract identity. |
| Quote orientation | 6Z is quoted in U.S. dollars per South African rand: ZAR/USD. A higher 6Z quote means the rand is stronger against the dollar. Common USD/ZAR displays are the reciprocal series, not the same quote. | Correct and consistently signed throughout the cluster. No inverse-direction defect remains. |
| Minimum increments | Chapter 259 gives a 0.000025 Globex minimum, so `500,000 × 0.000025 = $12.50` per standard contract. It gives a 0.000001 ClearPort increment, so `500,000 × 0.000001 = $0.50`; that route-specific increment does not create a Micro contract. | Correct. Globex and ClearPort are not conflated. |
| Listed months and hours | Chapter 259 delegates listed contracts and trading hours to CME. Historical product-guide ladders are not immutable current terms. CME's current live chain, trading-hours page, holiday calendar, security definition, and notices control. | Corrected so the canonical page requires live verification instead of hard-coding a historical ladder as current. |
| Termination | Trading terminates on the second business day immediately preceding the third Wednesday. If that date is a Chicago or New York bank holiday, the preceding common business day applies. Current CME product material supplies the published 9:16 a.m. CT termination time. | Correct on the canonical page and routed correctly from the other pages. |
| Delivery/final settlement | Chapter 259 provides physical delivery on the third Wednesday, subject to the rule's delivery-country and Chicago/New York holiday adjustment. Broker cutoffs may be earlier. Daily settlement data are not the same thing as an executable trade or final delivery. | Correct. No page calls the contract cash-settled, treats a chart settle as a guaranteed fill, or ignores broker delivery cutoffs. |
| Product size | CME's current FX product listings identify the standard 500,000-rand contract and do not identify a currently listed Micro 6Z contract. | Correct. Pages return zero contracts when one standard contract is too large instead of inventing a smaller multiplier. |
| Margin and loss | CME performance bonds and broker house/day requirements are variable collateral, not a purchase price or maximum-loss cap. [CFTC Staff Letter 20-17](https://www.cftc.gov/csl/20-17/download) warns that futures losses can exceed deposited funds and can lead to calls, liquidation, and deficits. | Correct throughout. Notional, performance bond, risk budget, and realized loss remain distinct. |
| SARB framework | [SARB's current monetary-policy page](https://www.resbank.co.za/en/home/what-we-do/monetary-policy) uses a 3% inflation target with a 1-percentage-point tolerance band, headline CPI from Stats SA, and the SARB Policy Rate terminology. The [implementation framework](https://www.resbank.co.za/en/home/what-we-do/financial-markets/monetary-policy-implementation-framework) describes the tiered-floor/surplus-reserve system and deposit facility. | Correct. The articles do not recycle the obsolete 3–6% range, do not hard-code a current rate, and do not call implementation a guaranteed currency signal. |
| SARB authority and FX attribution | [SARB's institutional record](https://www.resbank.co.za/en/home/about-us) supports its price-stability object, statutory financial-stability mandate, and management of official gold/FX reserves. Those facts do not prove that SARB caused a particular intraday 6Z move or defends a fixed rand level. | Correct. No peg, defended-price, or unsupported intervention claim remains. |
| Statistics and fiscal attribution | [Stats SA CPI P0141](https://www.statssa.gov.za/?page_id=1854&PPN=P0141) is the appropriate official headline-CPI source. [National Treasury's 2026 Budget Review](https://www.treasury.gov.za/documents/National%20Budget/2026/budgetReview.aspx) is appropriate for fiscal, debt, and borrowing context. Monthly merchandise trade is not attributed to Stats SA. | Correct. Source ownership and claim boundaries are accurate. |
| Federal Reserve and cross-currency context | Federal Reserve policy, FOMC calendar, and H.10 sources support policy-path and broad/bilateral-dollar context. BOJ and ECB official policy pages support the comparison page. Direction remains expectation-relative and conditional. | Correct. No current rate, guaranteed reaction, or unsupported causal direction is asserted. |

## Arithmetic reconciliation

All material examples were recomputed independently:

- Tick values: `500,000 × 0.000025 = $12.50`; `500,000 × 0.000001 = $0.50`.
- Canonical P&L example: `0.055425 - 0.054800 = 0.000625`; `0.000625 ÷ 0.000025 = 25 ticks`; `25 × $12.50 = $312.50`.
- Reciprocal orientation: `1 ÷ 18.00 ≈ 0.055556`; `1 ÷ 18.50 ≈ 0.054054`, so higher USD/ZAR corresponds to lower ZAR/USD/6Z.
- Notional example: `0.055000 × 500,000 = $27,500`; the page correctly says this is exposure scale, not margin or a loss cap.
- Slippage example: `0.054500 - 0.054350 = 0.000150 = 6 Globex ticks = $75` per contract.
- Margin scenarios: `32 × $12.50 + 4 × $12.50 + $10 = $460`; `68 × $12.50 + $10 = $860`.
- Position sizing: `49 × $12.50 + $10 = $622.50`; two contracts = `$1,245`; `72 × $12.50 + $10 = $910`.
- Tick rounding: `0.000811 ÷ 0.000025 = 32.44`, rounded away from safety to 33 ticks; `33 × $12.50 = $412.50` before costs.

No arithmetic discrepancy remains.

## Findings and exact resolutions

### 1. Resolved — historical listed-month ladder was presented too strongly

`6z-tick-size-and-value.html` stated `13 consecutive calendar months plus two deferred March-cycle months` as a verified current term and said product materials supplied the listed-month convention. Current Chapter 259 instead delegates listings to CME, while the current online guide does not guarantee that ladder.

Resolution: the row now says **“Determined by CME under Chapter 259”** and requires confirmation of the currently listed expiry/year in the live chain, explicitly warning not to assume a historical ladder remains current. The introductory mechanics text now says Chapter 259 delegates listed contracts and hours to the exchange. The termination row was made a complete sentence beginning **“The second business day immediately preceding the third Wednesday”** without changing the rule.

### 2. Resolved — imprecise ClearPort route description

`6z-tick-size-and-value.html` called 0.000001 an “off-exchange submission increment.” ClearPort is the relevant named CME submission route, and the broad wording could be read as covering unrelated off-exchange products.

Resolution: the page now calls it the **“finer ClearPort submission increment”** and retains the explicit warning that it does not change the Globex order ladder or create a Micro contract.

### 3. Resolved — stale source target on the beginner page

`what-are-6z-futures.html` cited the 2023 PDF guide for a code and listed-month summary even though the visible page did not use a historical ladder and a current online directory is available.

Resolution: the source now targets the **current CME FX Product Guide** and limits its description to the current 6Z/RA product-code entry and listing context.

### 4. Resolved — signed implementation-shortfall formulas lacked explicit sign values

`why-6z-slippage-hits-harder.html` and `6z-trade-management-guide.html` used a side sign but did not state its numeric convention.

Resolution: both pages now define **+1 for a buy and −1 for a sell**, so a worse buy or worse sell produces positive shortfall. The slippage page retains its one-tick two-sided test: both adverse cases must equal $12.50 per standard contract.

### 5. Resolved — comparative slippage title asserted an unmeasured result

The legacy title **“Why 6Z Slippage Hits Harder”** implied a comparative empirical conclusion, while the page correctly discloses that no original 6Z order-book study, typical slippage, fill-rate, depth, or order-type result is reported.

Resolution: the title is now **“Why 6Z Slippage Can Hit Harder: Measure and Control It.”** The HTML title, H1, Open Graph title, Twitter title, Article headline, breadcrumb name, and five in-cluster article anchors were updated together. The slug remains unchanged. Final hub and search synchronization agrees with the revised metadata.

### 6. Resolved — release integration was initially stale

The first full validator run found 150 synchronization errors and 0 warnings, all confined to unsynchronized currency hub, futures hub, search index, and sitemap data. It reported no article-level error or warning. Those files were outside this proofreader's edit authorization.

Resolution: the release owner ran the three integration syncs. This proofreader then reran the full validator and complete 6Z test discovery. The authoritative final result is **0 errors and 0 warnings**.

## Empirical-claim and determinism audit

The six classification-designated empirical pages all state that they report a protocol, not a completed 6Z result:

- `6z-algorithmic-behavior.html`: no actor identity, spoofing intent, or 6Z algorithm result is inferred from price/book patterns alone.
- `6z-liquidity-map.html`: no typical spread, depth, best interval, or capacity result is claimed.
- `6z-seasonal-patterns.html`: no calendar edge is claimed; the page requires point-in-time data, multiple-testing control, and an untouched holdout.
- `6z-volatility-profile.html`: no typical volatility state, jump frequency, or profitable threshold is claimed.
- `best-indicators-for-6z.html`: no indicator winner or profitable model is claimed; baseline and walk-forward requirements remain explicit.
- `best-times-to-trade-6z-futures.html`: no best clock window is claimed; DST, event, holiday, roll, quantity, and non-fill controls are required.

The slippage page separately discloses no original order-book study or typical execution result. Across all 20 pages, causal statements are conditional, examples are labeled hypothetical or procedural, and words such as “always,” “guaranteed,” and “proves” are either absent from substantive claims or used only to reject overclaiming.

## Metadata, schema, links, HTML, and accessibility

- All 20 pages have one canonical URL matching the filename and one H1.
- HTML title, H1, Open Graph title, Twitter title, Article headline, breadcrumb final name, and hub/search metadata agree after synchronization.
- Meta description, Open Graph description, Twitter description, and Article description agree on each page.
- `datePublished` remains `2025-11-28` on all pages. `dateModified`, Open Graph modified time, visible byline date, hub/search data, and sitemap lastmod agree with the staggered schedule: four pages each on August 21, 22, 23, 24, and 25, 2026.
- Article and BreadcrumbList JSON-LD parse successfully and use the correct canonical URL.
- Internal 6Z links resolve, ownership-routing links remain coherent, and the revised slippage anchor text is synchronized.
- Tables use header scopes; scrollable table regions have labels and keyboard focus; navigation and landmark labels are present; skip links target the article main content; image metadata has alt text; external target-blank source links carry `noopener noreferrer`.
- Every page includes a dated sources/methods disclosure and educational risk language. Source targets are official or primary bodies: CME, CFTC, SARB, Stats SA, National Treasury, Federal Reserve, BIS, NFA, BOJ, and ECB.

## Page-by-page verdicts

| Page | Evidence/correctness result | Verdict |
|---|---|---|
| `6z-algorithmic-behavior.html` | Separates observable messages from actor identity and intent; CFTC spoofing boundary is accurate; no original actor/algorithm result claimed; source targets and internal ownership links pass. | PASS |
| `6z-liquidity-map.html` | Distinguishes quoted, traded, and experienced liquidity; requires dated contract and sequenced data; does not invent typical depth/capacity; metadata, sources, tables, and links pass. | PASS |
| `6z-margin-requirements.html` | Correctly separates exchange clearing, broker house/day margin, notional, risk budget, and maximum loss; both stress examples reconcile; loss-beyond-deposit language is accurate. | PASS |
| `6z-position-sizing.html` | Whole-contract floor logic, upward tick rounding, execution/gap/fee overlays, portfolio cap, and zero-contract boundary are arithmetically and conceptually correct. | PASS |
| `6z-seasonal-patterns.html` | Point-in-time calendar protocol, roll handling, multiple-testing controls, and holdout rules are sound; no seasonal result is invented. | PASS |
| `6z-tick-size-and-value.html` | Canonical 6Z identity, quote, increments, P&L, current-listing control, hours caveat, termination, physical delivery, no-Micro boundary, and margin wording pass after corrections. | PASS |
| `6z-trade-management-guide.html` | State transitions, stop/target/event/exit branches, order reconciliation, and signed shortfall definition are correct; no fill guarantee is implied. | PASS |
| `6z-trading-psychology.html` | Behavioral controls are framed as procedures rather than efficacy claims; leverage and execution limits are accurate; CME/NFA source targets and accessibility pass. | PASS |
| `6z-volatility-profile.html` | Separates continuous and jump behavior, book stress, and event labels; routes sizing correctly; no typical state or profitable threshold is claimed. | PASS |
| `6z-vs-6e-vs-6j-differences.html` | Quote directions, contract normalization, tick economics, and central-bank context are not compared on raw price units; current official CME/Fed/SARB/ECB/BOJ targets pass. | PASS |
| `best-indicators-for-6z.html` | Requires frozen objectives, simple baselines, point-in-time inputs, leakage control, walk-forward testing, and retirement; reports no winning indicator. | PASS |
| `best-times-to-trade-6z-futures.html` | UTC/DST reconstruction, event/holiday/roll exclusions, quantity-specific market quality, and non-fill accounting are correct; reports no universal best time. | PASS |
| `common-6z-trading-mistakes.html` | Incident causes, prevention, containment, reconciliation, leverage, stop, quote, month, and delivery warnings are correct and non-deterministic. | PASS |
| `fundamental-drivers-of-6z.html` | Correct ZAR/USD sign; conditional relative-policy, inflation/growth, fiscal, commodity/trade, global-dollar, and liquidity channels; proper Stats SA/Treasury/Fed/SARB attribution. | PASS |
| `how-sarb-influences-6z.html` | Current SARB mandate, Policy Rate terminology, tiered-floor implementation, reserves, financial-stability role, and attribution limits are accurate; no peg/intervention overclaim. | PASS |
| `how-us-dollar-moves-6z.html` | Separates bilateral ZAR/USD from broad-dollar measures and funding/rate channels; official Fed/H.10 sources support the framework; all directions remain conditional. | PASS |
| `sarb-rates-impact-6z.html` | Interprets the full decision package relative to the frozen prior, curve, vote, forecast, and risk language; a hike/cut label is not treated as deterministic. | PASS |
| `what-are-6z-futures.html` | Beginner identity, futures-versus-spot distinction, current code source, physical lifecycle, quote orientation, no-Micro status, and loss-beyond-margin language pass. | PASS |
| `why-6z-slippage-hits-harder.html` | Revised conditional title, trigger-versus-fill mechanics, six-tick example, side-aware shortfall, order replay, non-fill/partial treatment, and no-result disclosure pass. | PASS |
| `why-6z-trades-differently.html` | Structural claims remain hypotheses to test against matched major-currency contracts; no permanent edge, actor identity, or guaranteed commodity/clock response is asserted. | PASS |

## Final commands and results

| Command | Final result |
|---|---|
| `python scripts/validate_6z_cluster.py --warnings-as-errors` | Exit 0: `Checked 20 core 6Z pages: 0 errors, 0 warnings.` |
| `python -m unittest tests.test_6z_cluster_release tests.test_6z_correctness_regressions tests.test_sync_6z_hubs tests.test_sync_6z_sitemap_dates tests.test_currency_library_theme` | Exit 0: 18 tests run, all OK. |
| `python scripts/audit_6z_distinctiveness.py` | Exit 0: 20 pages, 20 component signatures, 0 errors, 0 warnings. |
| `git diff --check` | Exit 0: no whitespace errors. Git emitted only informational Windows line-ending conversion notices. |

## Final release recommendation

**PASS.** The evidence and correctness gate is satisfied with zero unresolved warnings or errors. This proofreader does not block release.
