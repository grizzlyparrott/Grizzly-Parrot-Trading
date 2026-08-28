# Independent evidence and correctness proofread: ES/MES + NQ/MNQ equity-index cluster

Review date: 2026-08-28

Reviewer role: independent evidence/correctness proofreader

Scope: `artifacts/equity-index-cluster-classification.md`, `artifacts/equity-index-source-basis.md`, and every one of the 35 HTML files listed in `scripts/equity_index_cluster_config.py`; no sampling. The final review used the actual current worktree after the formula, source-link, validator, and regression-test corrections.

Edit boundary: no article, script, test, hub, search index, or sitemap was edited by this proofreader. This report is the only intentional proofreader deliverable. No commit was made.

## Unconditional verdict

**PASS — the current 35-page ES/MES + NQ/MNQ cluster is correctness- and evidence-ready.**

There are **0 actionable findings: 0 critical, 0 high, 0 medium, and 0 low**. The complete current-worktree reread found no remaining defect in contract mechanics, index-methodology wording, macro/event attribution, arithmetic, signed formulas, time-zone/session language, roll or margin boundaries, empirical-claim discipline, publication dates, canonical ownership, metadata/schema, links/fragments, accessibility basics, source disclosure, or user-facing clarity.

The three non-pass statuses in the automated external-link report are S&P DJI bot-protection responses, not broken or unsupported citations. Each was independently opened and checked against the claim it supports. This does not qualify or condition the PASS.

## Final correction verification

The six issues raised in the earlier proofread, including the two items that required a second hardening pass, are resolved in the live files:

1. **No slippage double-count:** `nq-pullbacks-vs-breakouts.html` now defines `R_net` from fill-to-fill P&L less one reconciled actual transaction-fee ledger counted once. It states that actual fills already contain realized slippage, defines broker commission, exchange, clearing, regulatory, and other charges as one non-overlapping ledger, keeps modeled slippage out of fill-based P&L, and presents the benchmark-based treatment as an alternate method rather than a second deduction.
2. **Side-aware, quantity-complete cost equations:** `best-times-to-trade-es-e-mini-sp500.html` defines `side = +1` for a buy and `-1` for a sell and calculates `side × (average fill − decision benchmark) × contract multiplier × filled contracts + fees`. `nq-best-times.html` defines the same sign convention, first gives cost in points, then multiplies by the contract multiplier and filled quantity and adds fees for dollars.
3. **Retired CME guide removed:** `GlobexRefGd.pdf` appears zero times across the configured cluster. Four pages now use CME's current Futures Order Types material for the narrow order-type claims; the order-book page uses the current generic CME Globex page only for platform/central-book and data-catalog context.
4. **Chapter 361 source restored:** `artifacts/equity-index-source-basis.md` uses the live official `https://www.cmegroup.com/rulebook/CME/IV/350/361.pdf` document. The invalid nested `/350/361/361.pdf` form is absent.
5. **Stop conversion is unambiguous:** `nq-position-sizing.html` uses `ceiling(abs(entry − invalidation) / 0.25)` and labels the result as whole adverse ticks. It no longer visually adds a second rounding operation after `ceiling`.
6. **Fail-closed regression coverage added:** the correctness tests execute adverse one-tick buy and sell examples and require both to produce positive `$14.50` cost. They also execute a single non-overlapping broker/exchange/clearing/regulatory ledger, enforce the corrected formula language, reject the retired/invalid URLs, prove the source-basis artifact owns Chapter 361, parse Markdown source URLs, and reject a PDF citation that resolves to a non-PDF landing page. The link checker now covers all 35 page disclosures plus the source-basis artifact.

## Primary-source contract-mechanics reconciliation

| Field | ES — Chapter 358 | MES — Chapter 353 | NQ — Chapter 359 | MNQ — Chapter 361 | Final result |
|---|---|---|---|---|---|
| Multiplier | $50 per index point | $5 per index point | $20 per index point | $2 per index point | PASS |
| Outright increment | 0.25 = $12.50 | 0.25 = $1.25 | 0.25 = $5.00 | 0.25 = $0.50 | PASS |
| Intermonth spread increment under Rule 542.A | 0.05 = $2.50 | 0.05 = $0.25 | 0.05 = $1.00 | 0.05 = $0.10 | PASS |
| Listing depth reviewed 2026-08-28 | 21 consecutive quarters | 5 consecutive quarters | 6 consecutive quarters + 2 additional June + 4 additional December contracts | 5 consecutive quarters | PASS; correctly product-specific and date-stamped |
| Standard outright session | Generally 5:00 p.m.-4:00 p.m. CT, Sunday-Friday, with 4:00-5:00 p.m. maintenance halt | Same | Same | Same | PASS; holidays, halts, broker limits, and special routes are bounded |
| Normal expiring-contract termination | Regularly scheduled NYSE open | No trading after the Primary Listing Exchange opens | Regularly scheduled Nasdaq open | No trading after the Primary Listing Exchange opens | PASS; product distinctions preserved |
| Final value | S&P 500 SOQ from component openings | S&P 500 SOQ from component openings | Nasdaq-100 SOQ expressly based on component NOOPs | Nasdaq-100 SOQ from component opening prices | PASS; MNQ is not falsely attributed to Chapter 359's NOOP wording |
| Delivery | Cash settlement | Cash settlement | Cash settlement | Cash settlement | PASS; no physical-delivery claim |
| Unscheduled Market Holiday/component fallback | Chapter-specific prior-business-day and component provisions | Chapter-specific provisions | Chapter-specific prior-business-day and Nasdaq/NOOP provisions | Chapter-specific component-opening provisions | PASS; exceptional paths are not generalized |

Official mechanics sources checked: [Chapter 353](https://www.cmegroup.com/rulebook/CME/IV/350/353/353.pdf), [Chapter 358](https://www.cmegroup.com/rulebook/CME/IV/350/358/358.pdf), [Chapter 359](https://www.cmegroup.com/rulebook/CME/IV/350/359/359.pdf), [Chapter 361](https://www.cmegroup.com/rulebook/CME/IV/350/361.pdf), current [ES](https://www.cmegroup.com/markets/equities/sp/e-mini-sandp500.contractSpecs.html), [MES](https://www.cmegroup.com/markets/equities/sp/micro-e-mini-sandp-500.contractSpecs.html), [NQ](https://www.cmegroup.com/markets/equities/nasdaq/e-mini-nasdaq-100.contractSpecs.html), and [MNQ](https://www.cmegroup.com/markets/equities/nasdaq/micro-e-mini-nasdaq-100.contractSpecs.html) product pages, plus [CME SER-9677](https://www.cmegroup.com/content/dam/cmegroup/notices/ser/2026/02/ser-9677.pdf) for the March 2026 NQ listing-cycle expansion.

The cluster correctly limits the 0.05-point values to intermonth spreads. It does not transfer them to standard outright orders. TACO, BTIC, TMAC, and other special routes are expressly outside the standard outright session/increment statements.

## Formula and arithmetic reconciliation

- Multiplier/tick products are correct: `$50 × 0.25 = $12.50`, `$5 × 0.25 = $1.25`, `$20 × 0.25 = $5.00`, and `$2 × 0.25 = $0.50`.
- Intermonth-spread products are correct: `$50 × 0.05 = $2.50`, `$5 × 0.05 = $0.25`, `$20 × 0.05 = $1.00`, and `$2 × 0.05 = $0.10`.
- ES/MES and NQ/MNQ P&L, tick-count, notional, margin-stress, and whole-contract floor examples recompute correctly.
- The numerical signed-cost regression produces `$14.50` for both a one-tick adverse ES buy and a one-tick adverse ES sell when one contract and `$2.00` fees are used. Both costs are positive under the declared side convention.
- The fill-ledger regression starts with `$20.00` fill-to-fill P&L and subtracts broker commission `$1.25`, exchange `$0.80`, clearing `$0.20`, and regulatory `$0.05` exactly once, producing `$17.70`.
- Structural stop conversion uses adverse `ceiling` once. Position sizes use a whole-contract floor and retain the zero-contract outcome.

## Index methodology, macro attribution, and empirical claims

- [S&P U.S. Indices Methodology](https://www.spglobal.com/spdji/en/methodology/article/sp-us-indices-methodology/) supports the cluster's description of the S&P 500 as a float-adjusted market-capitalization-weighted U.S. large-cap index with 500 constituent companies. No page reduces it to an automatic list of the 500 largest companies.
- The current [Nasdaq-100 methodology](https://indexes.nasdaqomx.com/docs/methodology_NDX.pdf) supports `modified market-capitalization-weighted`, 100 of the largest Nasdaq-listed non-financial companies, and the company/security distinction. The cluster does not misstate multiple eligible share classes or temporary counts above 100.
- Federal Reserve event-study attribution remains historically and methodologically bounded. The cited papers support their respective release-window and lead/lag findings; the pages do not present those findings as current universal laws.
- Macro and earnings pages use the responsible primary institutions and frame reactions through the surprise versus prior/expectation, rates, earnings weights, liquidity, correlation, and competing channels. No deterministic `report up = futures up/down` rule appears.
- Every empirical-design page says it provides a protocol rather than a completed original study. No fabricated win rate, edge, probability, typical spread, best session, actor identity, causal event result, or backtest finding appears. Hypothetical arithmetic is labeled.

## Sessions, clocks, roll, margin, and user-facing boundaries

- CT and ET are labeled; UTC/timezone-aware conversion is required where analysis spans daylight-saving changes. Exchange trade date is separated from calendar date.
- The standard Sunday-Friday 5:00 p.m.-4:00 p.m. CT session and 4:00-5:00 p.m. CT maintenance boundary are stated with holiday, halt, broker, and route caveats.
- RTH is a disclosed cash-session research window, not a false description of the full Globex session. Vendor session templates are not presented as exchange rules.
- Roll Monday is a convention/observation point, not an automatic or mandatory move. Dated-symbol, open-order, basis, liquidity, calendar-spread, and broker-cutoff checks are preserved.
- CME performance bond, broker day/overnight margin, notional exposure, planned risk, maximum loss, and liquidity capacity remain distinct. Margin is never described as purchase price or a loss cap.
- Explanations are actionable without implying certainty: calculations declare units and inputs, execution branches state invalidation and review requirements, and no-trade/zero-size outcomes remain available.

## Canonical ownership, metadata, dates, links, and accessibility

- `es-tick-size-tick-value-and-margin.html` remains the canonical ES/MES mechanics owner; `nq-tick-value.html` remains the canonical NQ/MNQ mechanics owner. Other pages link to the applicable owner and repeat only inputs needed for their immediate calculation. The shared lead/lag page links to both.
- All 35 pages have exactly one configured canonical URL, one H1, consistent title/description surfaces, valid Article and BreadcrumbList JSON-LD, current source disclosure, and educational risk language.
- Historical publication dates are preserved exactly: ES pages use the configured 2025-11-24 dates except `es-vs-mes-vs-nq.html` at 2025-11-17; NQ/MNQ pages use 2025-12-12; `why-futures-lead-the-stock-market.html` uses 2025-11-20. JSON-LD and Open Graph publication fields agree.
- Modification dates are exactly staggered seven pages per day across 2026-08-24, 2026-08-25, 2026-08-26, 2026-08-27, and 2026-08-28. JSON-LD `dateModified`, Open Graph `article:modified_time`, visible Updated text, hub/search records, and sitemap `lastmod` agree.
- Internal file targets and fragments resolve. The independent DOM scan found no skipped heading levels, missing region labels, unresolved `aria-labelledby` references, target-blank links missing `noopener noreferrer`, or images missing nonempty alt text.
- The external-source report covers 36 checked documents: the 35 pages plus `artifacts/equity-index-source-basis.md`. It found **68 unique URLs: 65 pass, 3 warning, 0 error**. The three warnings are HTTP 403 bot-protection responses from S&P DJI for the S&P 500 page, Index Mathematics Methodology, and S&P U.S. Indices Methodology. Independent live opening confirmed all three destinations resolve and support the cited S&P identity, weighting, and divisor/mathematics claims.
- PDF-source validation fails closed when a requested PDF resolves to a non-PDF landing page. No retired Globex guide or invalid Chapter 361 path remains.

## Page-by-page disposition

| Page | Disposition |
|---|---|
| `best-times-to-trade-es-e-mini-sp500.html` | PASS |
| `es-atr-behavior-and-volatility-zones.html` | PASS |
| `es-building-a-simple-trading-plan.html` | PASS |
| `es-common-retail-trader-mistakes.html` | PASS |
| `es-gap-behavior-and-how-to-trade-it.html` | PASS |
| `es-how-to-size-positions-by-account-balance.html` | PASS |
| `es-intraday-support-and-resistance-levels.html` | PASS |
| `es-key-economic-reports-that-move-price.html` | PASS |
| `es-liquidity-pockets-and-order-book-structure.html` | PASS |
| `es-market-structure-trends-pulls-and-reversals.html` | PASS |
| `es-mini-vs-mes-micro-which-should-you-trade.html` | PASS |
| `es-news-events-and-volatility-traps.html` | PASS |
| `es-opening-range-strategies-for-beginners.html` | PASS |
| `es-overnight-session-vs-regular-trading-hours.html` | PASS |
| `es-roll-dates-and-contract-switching.html` | PASS |
| `es-scalping-vs-swing-trading-pros-and-cons.html` | PASS |
| `es-session-highs-lows-and-vwap-usage.html` | PASS |
| `es-tick-size-tick-value-and-margin.html` | PASS |
| `es-using-dom-and-time-and-sales.html` | PASS |
| `es-using-spy-and-spx-as-confirmation.html` | PASS |
| `es-vs-mes-vs-nq.html` | PASS |
| `mnq-bad-habits.html` | PASS |
| `nq-best-times.html` | PASS |
| `nq-earnings-impact.html` | PASS |
| `nq-execution-mistakes.html` | PASS |
| `nq-liquidity-windows.html` | PASS |
| `nq-margin.html` | PASS |
| `nq-news-volatility.html` | PASS |
| `nq-position-sizing.html` | PASS |
| `nq-pullbacks-vs-breakouts.html` | PASS |
| `nq-tick-value.html` | PASS |
| `nq-volatility-vs-es.html` | PASS |
| `nq-vs-es.html` | PASS |
| `nq-what-is-nq.html` | PASS |
| `why-futures-lead-the-stock-market.html` | PASS |

## Final current-worktree evidence

| Check | Result |
|---|---|
| Complete semantic reread of both governing artifacts and all 35 configured pages | PASS; 35/35 inspected, no sampling |
| `py -m pytest tests/test_equity_index_correctness.py tests/test_equity_index_cluster_release.py -q` | Exit 0: **15 passed, 163 subtests passed**; one non-substantive pytest-cache permission warning |
| `py scripts/validate_equity_index_cluster.py --warnings-as-errors` | Exit 0: **35 pages, 0 errors, 0 warnings** |
| Independent DOM/date/canonical/formula/retired-link scan | **35 pages, 0 issues**; modified-date distribution 7/7/7/7/7; retired Globex occurrences 0; old slippage formula occurrences 0 |
| Current `artifacts/equity-index-source-link-report.json` | **68 unique URLs across 35 pages plus source basis: 65 pass, 3 independently resolved bot-protection warnings, 0 errors** |
| `git diff --check` | Exit 0; only informational Windows LF-to-CRLF notices |

## Changeable-source caveat

Exchange listing depth, trading/holiday schedules, special-route conventions, performance bonds, broker house/day margins, methodology documents, and source URLs can change after this 2026-08-28 review. The cluster already treats those as live fields, dates current observations, distinguishes broker requirements from exchange facts, and directs readers to current primary sources. This ordinary source-freshness obligation does not alter the present unconditional PASS.

## Release recommendation

**Release/correctness certification: PASS.** No correctness remediation remains from this independent proofread.
