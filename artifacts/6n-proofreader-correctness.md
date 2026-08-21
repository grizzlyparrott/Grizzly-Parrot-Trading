# 6N evidence and correctness proofread

Review date: 2026-08-20
Reviewer: independent Proofreader 1
Frozen scope: the 20 core 6N article files and staggered date matrix in `artifacts/6n-cluster-classification.md`
Initial verdict: **FAIL**
Final independent recheck verdict after shared-CSS normalization: **PASS**

The initial audit failed closed on six material content defects and one calculator-input defect class. Root corrected every finding. After the user-mandated migration to the shared currency-library stylesheet and `currency-library` / `fx-*` namespace, I reopened the current files, reread the material claims and fixes, and reran the full 20-page release, distinctiveness, DOM, schema, link, date, arithmetic, JavaScript, source, and namespace checks. No material evidence or correctness finding remains, and the CSS migration did not alter article meaning or calculator behavior.

## Frozen review snapshot

The reviewed working tree is based on Git commit `ae5dfa186bd7d5d4d6650a9f9cbde0280fbefd21`. Because the rebuilt pages are working-tree changes, the controlling content snapshot is the following SHA-256 manifest. The SHA-256 of the ordered `hash  path` manifest is:

`437034f39dee55d97b74271a9d3d4f5e130b025dd03e3eb693e2ad2a70abee3e`

| Article file | SHA-256 |
|---|---|
| `6n-common-mistakes.html` | `4068319f64254a178e17691748b7eba68ffd49eb21aa7bfc0011eed67e9ad1b9` |
| `6n-contract-specs-explained.html` | `148e1428504582e66aa301ce8983921ddab2f9baa27324e0994b1b51d755bf19` |
| `6n-correlations.html` | `4ede8f80bd56fc5dd2626fe49cd1a288ed65f00312cb4f12ec9f854d2d460157` |
| `6n-interest-rate-impact.html` | `8ef24ae7e7bb5fdb34ab0f28169805661f2ddef33750b77f7a1211c717de44e1` |
| `6n-liquidity-guide.html` | `9e16338d2c621a03aba82ff8e42e1bcd9d23fabfcbdb75e902d8950c56af3a8d` |
| `6n-multi-timeframe-framework.html` | `c4feddcd2527c9bfbb493c39c7f8c27acd4899ef2cf0d35083ae8a695d74601c` |
| `6n-risk-sentiment-impact.html` | `deab05a0ed65514b9b54f1aecaf23fcb6650883990f6e868c231745e252f2d8a` |
| `6n-seasonal-patterns.html` | `7ad40da0317d5a0bec2418e92571c01e5a4ee4691fa8899aff2f5891426b7194` |
| `6n-spread-trading.html` | `6d066daa058f1d34724fd2b67bcba010e5a54ddd50d4490f8116019183e655c0` |
| `6n-trading-strategies.html` | `015ff4f6ebe05da2681fc3ecd628691b0a30af150eaaaa85fd1c3b5a56f603cb` |
| `6n-volatility-patterns.html` | `9a4429df3335d1c2a3417fec0c930e85bd612193151bbdfc36f0f023140ca8fb` |
| `6n-vs-6a-differences.html` | `1a5c1b57f2110282c482f75cd09ccefdd34e36da79f958bfba5e732dd3227077` |
| `how-exports-drive-6n-trends.html` | `355505a55460de75d8b3e033ee590e93cf47ff84d7a6c20d77bf862df519a078` |
| `how-to-read-6n-price-quotes.html` | `95977ffcfba126708b678d0763b257884d1e625854893cade695963dbacf01e7` |
| `how-to-trade-6n-economic-releases.html` | `00eeddd0eebea5eecf7fd69bebbb12d321336bba60ef48fac0d8bad8e9e6a091` |
| `m6n-micro-contract-guide.html` | `e27ee4bf842f3121ae47ac2f8e5ba64ab9f6b98164c1794050bf09b3db4cb3e4` |
| `us-dollar-impact-on-6n.html` | `f878e5ba89c395149827ddd8c5c72154b38f5ba8a0a5e3d1515d77b9d5c2caec` |
| `using-6n-to-hedge-nzdusd-exposure.html` | `d5708f87ee8ea51182037a6c0ca57c2048bed47400cc32b213d391b6eec66e32` |
| `what-are-6n-futures.html` | `82436ff5ad740ca6b90bafde3eb20c57ed975054fdf94c76cd82ab0f780f78e2` |
| `why-traders-use-6n-futures.html` | `e81c9055ff9f56bd667db6fb6ea9833663d949b273bef3564fc1e3cd1edfe4aa` |

## Methodology

1. Read all 20 articles line by line, including metadata, visible prose, tables, formulas, disclosures, source annotations, internal links, JSON-LD, and inline JavaScript.
2. Reconciled current high-drift contract claims against CME Rule 258, the current CME FX Product Guide and Micro FX product slate, CME delivery material, and current CME trading-hours material.
3. Checked material macro and calendar claims against the linked official RBNZ, Stats NZ, New Zealand Treasury, MPI, RBA, Federal Reserve, BLS, BEA, Census, NBS China, DFAT, CFTC, NFA, and NIST records. Source inventory contains 48 unique official URLs across 16 domains.
4. Recomputed every published worked example and high-risk formula independently with decimal arithmetic. Quote direction, tick conversion, notional, long/short P&L, spread normalization, integer sizing, and hedge residuals were checked separately.
5. Parsed the 20 pages independently of the project validator to check HTML identity, heading order, IDs, landmarks, skip links, metadata, Open Graph/Twitter parity, Article and Breadcrumb JSON-LD, visible and machine dates, internal targets and fragments, table/form accessibility, and external-link safety.
6. Compiled all inline non-JSON scripts, then executed the two calculators with a fake DOM through normal submit handlers, including valid, invalid, off-ladder, sign, range, and integer-boundary cases.
7. Independently audited the shared-CSS migration: exactly one canonical stylesheet link and one `currency-library` root per page, no legacy namespace or stylesheet residue, every used `fx-*` class defined by the shared CSS, and theme tokens confined to presentation classes rather than visible prose or JavaScript.
8. Searched for deterministic-profit language, stale fixed-liquidity claims, invented findings, margin-as-maximum-loss language, guaranteed-stop language, and inconsistent contract mechanics. Every certainty-keyword match was a warning against certainty, not a promise.

## Exact release commands and evidence

- `py scripts\validate_6n_cluster.py` — **PASS**: `Checked 20 core 6N pages: 0 errors, 0 warnings.`
- `py scripts\audit_6n_distinctiveness.py` — **PASS**: `Audited 20 pages: 20 component signatures, 0 errors, 0 warnings.`
- `py -m pytest tests\test_6n_cluster_release.py tests\test_6n_css_accessibility.py tests\test_6n_correctness_regressions.py tests\test_sync_6n_hubs.py tests\test_sync_6n_sitemap_dates.py tests\test_currency_library_theme.py -q` — **PASS**: `29 passed, 1 warning, 240 subtests passed in 1.99s`.
- `git diff --check` — **PASS**, exit 0. Git printed only expected LF-to-CRLF notices for modified files.
- Independent DOM/theme harness invocation: `$auditCode = @'...20-file independent assertion harness...'@; py -c $auditCode` — **PASS**: `FILES 20`; `jsonld: 40`; `tables: 36`; `links: 698`; `local_links: 343`; `forms: 2`; `DEFINED_FX_CLASSES 84`; `DATE_RECORDS 20`; `SITEMAP_RECORDS 20`; `ERRORS 0`. In addition to Methodology item 5, it checked the canonical shared-CSS link, theme root, legacy residue, and that every used `fx-*` class exists in the shared stylesheet.
- Independent theme-token confinement invocation: `$code = @'...visible-text/script namespace scan...'@; py -c $code` — **PASS**: `FILES 20 CLASS_VALUES 1499 FX_CLASS_TOKENS 1266 VISIBLE_OR_SCRIPT_THEME_TOKEN_ERRORS 0`.
- Independent script/runtime invocation: `$js = @'...inline-script compiler and fake-DOM calculator assertions...'@; node -e $js` — **PASS**: `FILES 20 INLINE_JS_BLOCKS 42 SYNTAX_ERRORS 0 CLASS_TOKEN_REFERENCES 0`; quote-calculator script SHA-256 `8468dbabf939e6a1d9e525115642cb9fb7cbd3822676db93f8691b988ce9dc28`; hedge-calculator script SHA-256 `c690c50a5d0cd1eb6433623ddd8670e6fd1311cdbd9714064696e73a461706b3`.
- Independent calculator invocation: `$js = @'...fake-DOM calculator assertions...'@; node -e $js` — **PASS**: `CALCULATOR_ASSERTIONS 19 PASS`. It covered long/short P&L, notional, fractional quantity rejection, off-ladder warning, receivable/payable side, both integer hedge candidates, negative exposure rejection, and percentage-range rejection.
- Independent arithmetic invocation: `$code = @'...Decimal reconciliation assertions...'@; py -c $code` — **PASS**: `ARITHMETIC_CHECKS 19 PASS 19`.
- Independent source inventory: `$code = @'...details.fx-sources URL inventory...'@; py -c $code` — **PASS**: `FILES 20 UNIQUE_PRIMARY_SOURCE_URLS 48 DOMAINS 16 MISSING_DISCLOSURES 0`.
- Certainty scan: `rg -ni --glob '6n-*.html' --glob 'how-exports-drive-6n-trends.html' --glob 'how-to-read-6n-price-quotes.html' --glob 'how-to-trade-6n-economic-releases.html' --glob 'm6n-micro-contract-guide.html' --glob 'us-dollar-impact-on-6n.html' --glob 'using-6n-to-hedge-nzdusd-exposure.html' --glob 'what-are-6n-futures.html' --glob 'why-traders-use-6n-futures.html' '\b(guarantee[ds]?|risk[- ]free|always profitable|will profit|sure thing|best time|easy money|cannot lose|proven strategy)\b' futures-basics` — all matches were manually reviewed and negate, reject, or warn about the searched claim.

The pytest command emitted a non-content `PytestCacheWarning`: Windows denied creation of `.pytest_cache` under the checkout. Test execution and assertions completed successfully. This warning does not change the content verdict.

## Post-migration semantic and runtime recheck

- The current 6N inventory still contains exactly 20 articles, 40 parsed JSON-LD objects, 36 tables, 698 links, 343 local targets, two forms, 42 inline non-JSON scripts, and the same 48 official source URLs across 16 domains as the pre-theme correctness review.
- The namespace scan found 1,266 `fx-*` class tokens but no `fx-*` or `currency-library` token in visible text or inline scripts. The new namespace therefore participates only in presentation; calculator code contains zero theme-class references and continues to address stable element IDs.
- Every page has exactly one `/futures-basics/currency-research-library.css?v=20260820a` link and one `main#main-content.currency-library`; no `nzd-*`, `mx-*`, or old 6N stylesheet reference survives. All 84 defined shared component classes cover every `fx-*` class used by the 20 pages.
- The seven resolved correctness areas remain literally present at their recorded lines: dimensionally USD shortfall, JSON-safe `P\u0026L`, current FOMC freshness labels, tick-denominated planned risk, multiplier-and-quantity strategy outcome, non-arithmetic export evidence sequence, and fail-closed calculator validation.
- Runtime outputs are unchanged: the quote calculator returns 35 ticks / $175 / $61,240 for the long example and 50 ticks / $500 / $122,480 for the two-contract short example; the hedge calculator retains receivable-short and payable-long signs plus the exact integer residuals. Invalid, fractional, off-ladder, and out-of-range cases remain fail-closed.
- The full current-text reread found no theme-induced wording, evidence, source, formula, date, metadata, link, or disclosure change that alters article meaning. The migration changes presentation ownership and class names, not the financial or editorial claims.

## Current primary-source reconciliation

All links below were opened or inspected as current official records during the 2026-08-20 review. The page-level source disclosures identify the claim each record supports and expose the review boundary.

| Claim group | Current authoritative evidence | Reconciled result |
|---|---|---|
| 6N unit, quote, increments, termination, delivery | [CME Rulebook Chapter 258](https://www.cmegroup.com/rulebook/CME/III/250/258/258.pdf) | 100,000 NZD; USD per NZD; 0.00005 Globex outright increment = $5; separate 0.00001 ClearPort increment; trading terminates on the second business day immediately before the third Wednesday, subject to the rule's bank-holiday adjustment; physical delivery normally occurs on the third Wednesday, subject to its forward holiday adjustment. Article claims agree. |
| Current product row, listing and route details | [CME FX Product Guide 2026](https://www.cmegroup.com/markets/fx/fx-product-guide.html) | The 6N row identifies Rule 258, Globex code 6N, ClearPort code NE, 100,000 NZD, physical settlement, current increments, and USD/NZD quotation. The pages correctly separate route-specific increments. |
| Current Micro FX availability | [CME Micro FX futures](https://www.cmegroup.com/markets/microsuite/fx.html) and the Micro table in the current FX Product Guide | The enumerated Micro slate does not list M6N. The pages say **currently** unavailable, do not invent a 10,000-NZD contract, and require future re-verification. |
| Quarterly physical-settlement operations | [CME FX delivery guide](https://www.cmegroup.com/markets/fx/fx-delivery.html) | 6N is correctly described as quarterly and physically deliverable. The pages distinguish trading termination, broker cutoff, roll/offset, and delivery. |
| Regular schedule | [CME trading hours](https://www.cmegroup.com/trading-hours.html) | Regular FX access is correctly stated as Sunday-Friday, 5:00 p.m.-4:00 p.m. CT, with a 60-minute break beginning at 4:00 p.m.; holiday schedules override. No page converts access into a fixed liquidity claim. |
| CME stale-reference boundary | Rule 258 and the current FX Product Guide, compared with older/stale CME educational material | Some older CME material still shows a 0.0001/$10 outright tick. The articles explicitly warn about that mismatch and correctly give precedence to the current rulebook, product guide, live security definition, and order route. |
| New Zealand monetary-policy framework | [RBNZ Monetary Policy Handbook](https://www.rbnz.govt.nz/monetary-policy/about-monetary-policy/monetary-policy-handbook), [RBNZ decisions](https://www.rbnz.govt.nz/monetary-policy/monetary-policy-decisions), and [May 2026 MPS](https://www.rbnz.govt.nz/monetary-policy/monetary-policy-statement/monetary-policy-statement-filtered-listing-page/2026/may-270/monetary-policy-statement-may-2026/web-version) | The mandate, forward-looking transmission, projections, scenario, and competing-channel descriptions fit the primary records. Directional consequences remain conditional. |
| Federal Reserve freshness | [Federal Reserve FOMC calendars](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm) | The official page was updated 19 August 2026. Both page-level source labels now use that exact freshness date. |
| New Zealand CPI and external-sector terminology | [Stats NZ release calendar](https://www.stats.govt.nz/release-calendar/), [June 2026 CPI](https://www.stats.govt.nz/information-releases/consumers-price-index-june-2026-quarter/), and linked Stats NZ trade/balance records | Release scope and official `tradeable`/`non-tradeable` spellings are preserved. Merchandise trade is correctly treated as goods-only, not the whole external account or an immediate FX flow. |
| Other macro calendars and mechanisms | Linked official Treasury, MPI, RBA, Federal Reserve H.10/H.15, BLS, BEA, Census, NBS China and DFAT records | Dates and labels are current to the stated review boundary; mechanisms are framed as hypotheses or channels and never as original measured 6N findings. |

## Resolved numbered findings

### C-01 — Implementation-shortfall formula mixed price and dollar units

**Original evidence:** `futures-basics/6n-liquidity-guide.html:93-94` added fees and unfilled quantity to a side-adjusted price difference without first converting every term to a declared common unit.

**Required fix:** convert filled-price slippage to USD using the 100,000-NZD contract unit and filled contract quantity; express fees and opportunity cost in USD; define side sign and the unfilled-quantity treatment.

**Recheck:** **RESOLVED** at `futures-basics/6n-liquidity-guide.html:93-94`. The formula is now `side × (fill − benchmark) × 100,000 NZD × filled contracts + USD fees + declared USD opportunity cost for unfilled quantity = Implementation shortfall in USD`, with `+1` for a buy and `-1` for a sell.

### C-02 — Raw JSON-LD encoded the visible `P&L` title incorrectly

**Original evidence:** `futures-basics/how-to-read-6n-price-quotes.html:14-15` used an HTML entity inside raw JSON-LD, so a JSON consumer could retain `&amp;` rather than the visible ampersand.

**Required fix:** encode the ampersand as valid JSON/JavaScript text while preserving safe inline HTML parsing; make Article headline and Breadcrumb terminal exactly match the decoded title and H1.

**Recheck:** **RESOLVED** at lines 14-15 with `P\u0026L`. Independent JSON parsing produces `P&L`, and Article, Breadcrumb, title, metadata, and H1 parity all pass.

### C-03 — Two FOMC source-freshness labels were stale

**Original evidence:** `futures-basics/6n-interest-rate-impact.html:102` and `futures-basics/how-to-trade-6n-economic-releases.html:102` did not reflect the current official FOMC calendar's latest update.

**Required fix:** open the current official calendar and use its current update date in both source annotations.

**Recheck:** **RESOLVED** at both line 102 records. Each now says `updated 19 August 2026`, matching the Federal Reserve page reviewed during this audit.

### C-04 — Planned-risk distance did not name its unit

**Original evidence:** `futures-basics/6n-contract-specs-explained.html:153` multiplied an ambiguous invalidation distance by `$5`, leaving readers to infer whether the distance was price, pips, or current ticks.

**Required fix:** state that the distance is counted in current 0.00005 outright ticks before multiplying by `$5 × contracts`, then add costs and stress separately.

**Recheck:** **RESOLVED** at line 153: `Invalidation distance in current 0.00005 ticks × $5 × contracts, plus costs and stress`.

### C-05 — Net-strategy formula omitted contract multiplier and quantity

**Original evidence:** `futures-basics/6n-trading-strategies.html:87` presented a price-difference expression as a monetary result without the 100,000-NZD unit and contract count.

**Required fix:** convert fill-price change to USD with the contract unit and quantity, name non-embedded costs in USD, and label the result in USD.

**Recheck:** **RESOLVED** at line 87: `side × (exit fill − entry fill) × 100,000 NZD × contract quantity − USD fees and non-embedded USD costs = Net strategy outcome in USD`.

### C-06 — Export hero presented unlike economic quantities as arithmetic

**Original evidence:** `futures-basics/how-exports-drive-6n-trends.html:56` visually combined export price, volume, import cost, services/income offsets, and rival drivers as if they formed a single additive identity.

**Required fix:** retain the valid revenue identity `price × volume`, then present the other quantities as a labeled evidence sequence rather than arithmetic.

**Recheck:** **RESOLVED** at line 56. The component is explicitly labeled `Export evidence sequence, not an arithmetic identity` and now reads `export revenue (price × volume) → compare with import bill, services and income balances → test hedging, policy and rival drivers`.

### C-07 — Calculator inputs needed fail-closed range and integer validation

**Original evidence:** the calculator blocks now at `futures-basics/how-to-read-6n-price-quotes.html:115-139` and `futures-basics/using-6n-to-hedge-nzdusd-exposure.html:99-126` could accept inputs that do not represent a valid whole-contract 6N calculation or that exceed safe finite arithmetic boundaries.

**Required fix:** reject non-finite/non-positive prices and exposure, fractional or nonpositive contract counts, invalid side values, hedge percentages outside 0%-100%, and unsafe numeric ranges; disclose off-ladder quote inputs rather than silently treating them as current outright ticks.

**Recheck:** **RESOLVED** at `futures-basics/how-to-read-6n-price-quotes.html:123-137` and `futures-basics/using-6n-to-hedge-nzdusd-exposure.html:106-117`. All 42 inline blocks compile, and the 19 valid/invalid calculator assertions pass.

## Clean-area conclusions

- **Arithmetic and quote direction:** all 19 independent decimal checks pass. A higher USD-per-NZD 6N price benefits a long; a lower price benefits a short. The `$5` tick, `$175` long example, `$250/$500` short example, `$61,240` notional, spread-normalization residuals, integer position sizing, and receivable/payable hedge signs all reconcile.
- **Contract lifecycle:** standard unit, route-specific tick increments, March-cycle quarterlies, regular hours, 9:16 a.m. CT usual termination time, Rule 258 business-day test, physical delivery, holiday adjustments, roll risk, broker cutoff risk, and daily mark-to-market are accurately separated. Margin is never described as maximum loss.
- **Micro availability:** every page that mentions M6N states the current absence, avoids invented specifications, and directs the reader to verify future exchange/product state.
- **Economics and evidence boundaries:** mechanisms are conditional, rival drivers are named, and empirical pages expressly say when no original result is reported. No mechanism is presented as a measured causal finding or deterministic 6N trade rule.
- **Dates and terminology:** all 20 pages preserve `datePublished: 2025-11-28`. Visible Updated text, `article:modified_time`, Article `dateModified`, and the approved sitemap day agree with the 2026-08-16 through 2026-08-20 matrix. Sitemap values are exactly noon UTC on the assigned day. All 20 source disclosures use the cluster-standard August 20 review label.
- **Metadata and schema:** 20 distinct title/H1 pairs, descriptions, canonicals, Open Graph/Twitter fields, Article objects, and Breadcrumb terminals agree after decoding. Forty JSON-LD objects parse successfully; no FAQ schema/body mismatch exists.
- **HTML, theme namespace, and accessibility:** one `main#main-content.currency-library` landmark and one H1 per page, exactly one shared currency stylesheet, no legacy namespace residue, all used `fx-*` classes defined, functional skip targets, no duplicate IDs, no heading jumps, valid table headers and labeled focusable scroll regions, labeled form controls, safe external-link `rel` values, and no missing local link/fragment target were found.
- **Scripts:** 42 inline non-JSON scripts compile and contain zero theme-class references. Both calculators execute correctly through their submit handlers, reject invalid inputs, retain gross/cost boundaries, and do not claim live market validation.
- **Internal synchronization:** the independent parser checked 698 links, including 343 local targets, with zero missing local page, asset, or fragment target. All 20 sitemap records are present on their assigned date.

## Final decision

**PASS.** No material factual, mathematical, evidence-fit, source-freshness, terminology, lifecycle, metadata/schema, accessibility/HTML, internal-link, namespace-migration, or inline-calculator correctness finding remains in the post-normalization 20-page 6N scope identified by the manifest above. The shared-CSS migration did not change article meaning or JavaScript behavior.

This verdict is a content/repository correctness gate. It does not claim that the working-tree changes have been committed, pushed, merged, deployed, crawled, or indexed.
