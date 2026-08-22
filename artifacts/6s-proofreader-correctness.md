# Independent correctness and evidence audit — core 6S cluster

**Review date:** 2026-08-21
**Reviewer:** Independent proofreader 1 (not an article writer)
**Scope:** The 21-page core Swiss Franc futures cluster enumerated by `scripts/validate_6s_cluster.py`, reviewed against `artifacts/6s-cluster-classification.md`
**Final fail-closed verdict:** **PASS — no open findings in the reviewed working-tree state**

This verdict applies to the frozen article content and synchronized release surfaces inspected here. It does not assert that the pages have been deployed, that a future external URL will remain available, or that Google has indexed the pages. I made no changes to any article, hub, script, test, stylesheet, search index, or sitemap.

## Methodology

1. Read the classification and writing map in full, then read all 21 HTML files named by the validator rather than sampling pages.
2. Reconciled current contract mechanics against primary CME materials: Rulebook Chapter 254, the 2026 FX Product Guide, the Swiss Franc contract page, the Micro FX specifications, and the current trading-hours/holiday material.
3. Independently recomputed every material contract example and reviewed formulas for dimensions, side convention, contract quantity, fixed versus variable costs, rounding, and valid zero-size outcomes.
4. Traced CHF/USD versus USD/CHF direction throughout the cluster, including reciprocal spot comparisons, long/short P&L, event interpretations, and cross-market comparisons.
5. Inventoried all external citations and reviewed the sources carrying current or material factual claims for authority, fit, and freshness. Historical research was checked for an explicit historical/sample boundary.
6. Read the macro and empirical claims for unsupported causality, timeless rankings, guarantees, unrun-study language, intervention identification, margin-as-loss language, and other unjustified certainty.
7. Independently parsed all pages for local targets and fragments, ARIA ID references, duplicate IDs, JSON-LD syntax, canonical/schema/date agreement, stylesheet consistency, inline styling, and use of the shared `fx-*` namespace.
8. Ran the project validator and the three targeted test modules, then reran all checks after the final correction.

## Contract-mechanics and arithmetic evidence

The cluster's canonical specification page agrees with the current exchange record:

| Item | Audited result | Primary evidence |
|---|---|---|
| Contract identity and unit | Standard 6S is CHF/USD, quoted in USD per CHF, for 125,000 CHF. | [CME Rulebook Chapter 254](https://www.cmegroup.com/rulebook/CME/III/250/254/254.pdf); [CME FX Product Guide 2026](https://www.cmegroup.com/markets/fx/fx-product-guide.html) |
| Standard Globex outright tick | 0.00005 USD per CHF; `125,000 × 0.00005 = $6.25`. The pages correctly keep the ClearPort 0.00001/$1.25 increment separate. | Same CME sources |
| Micro contract | MSF is 12,500 CHF with a 0.0001 increment and `$1.25` tick value. It is correctly treated as a distinct product, not a fractional 6S order. | [CME Micro FX specifications](https://www.cmegroup.com/markets/microsuite/fx.html) |
| Listed months and regular access | 20 March-cycle quarterly contracts; regular access Sunday-Friday, 5:00 p.m.-4:00 p.m. CT, with the daily break and holiday exceptions stated as controls rather than liquidity promises. | [CME Swiss Franc contract page](https://www.cmegroup.com/markets/fx/g10/swiss-franc.contractSpecs.html); [CME trading hours](https://www.cmegroup.com/trading-hours.html) |
| Termination and delivery | Trading terminates on the second business day immediately preceding the third Wednesday, with the rule's bank-holiday adjustment; physical delivery normally occurs on the third Wednesday, subject to its adjustment. The page distinguishes the 9:16 a.m. CT termination time from the delivery date and from broker cutoffs. | CME Chapter 254 and product materials |

Independent arithmetic reconciliations all passed:

- `0.00175 × 125,000 = $218.75`; `0.00175 / 0.00005 = 35` ticks; `35 × $6.25 = $218.75`.
- A short move from 1.25400 to 1.25250 is `0.00150 × 125,000 = $187.50` for one contract and `$375.00` for two.
- One standard tick across three contracts is `3 × $6.25 = $18.75`.
- At an illustrative 1.25000 quote, `125,000 × 1.25000 = $156,250` of quoted notional; the page correctly says this is neither margin nor maximum loss.
- `12,500 × 0.0001 = $1.25` for MSF.
- Long and short formulas use opposite price differences and consistently return gross USD P&L before costs.

Quote direction is consistent on every page: higher 6S means more USD per CHF and therefore a stronger CHF versus USD. The spot comparison correctly states that commonly displayed USD/CHF is reciprocal to 6S's CHF/USD orientation, uses `1 / USD/CHF` only as a comparison translation, and warns that executable bid/ask sides, timestamps, value dates, and futures basis cannot be replaced by an inverted midpoint.

## Economic claims and source fit

The citation inventory contains **165 external-link occurrences, 51 unique external URLs, and 14 authoritative hosts**. The important current claims were checked against the linked primary materials:

- SNB mandate, strategy, implementation tools, decision-package structure, and intervention-disclosure limits are tied to current SNB strategy, decision, Q&A, data, and annual-report sources.
- The 18 June 2026 SNB assessment supports the stated 0% policy rate and increased willingness to counter rapid and excessive franc appreciation. The pages correctly present that as dated policy context, not a permanent ceiling or proof of a transaction.
- The SNB decision archive supports the later summaries-of-discussion boundary; the 2025 annual report supports the cited historical net FX purchases. Weekly sight deposits, balance-sheet stocks, and later quarterly/annual transaction disclosures are not mislabeled as real-time intervention evidence.
- BLS Employment Situation and CPI archives, BEA Personal Income and Outlays, Federal Reserve FOMC/H.10/H.15/liquidity-swap materials, BIS funding and covered-interest-parity research, and the IMF 2026 Switzerland Article IV mission statement fit the claims assigned to them.
- [LSEG's current WMR page](https://www.lseg.com/en/ftse-russell/benchmarks/wmr-fx-benchmarks) supports the 4:00 p.m. London closing-spot benchmark fact. The article does not infer client identity or a routine reversal from that benchmark.
- [CME's current CVOL FAQ](https://www.cmegroup.com/market-data/cme-group-benchmark-administration/cme-group-volatility-indexes-faq.html) supports the options-derived 30-day forward-risk description and explicitly identifies CHF/USD CVOL as end-of-day only; the page now states that availability boundary.
- The older SNB safe-haven and capital-flow working papers are explicitly described as sample-specific historical evidence, not current universal laws. Empirical protocol pages disclose that no original result is being reported and provide definitions, controls, costs, holdouts, and rejection criteria instead.

Two direct BLS archive extractions returned a crawler-side error during source inspection; the exact official BLS archive pages and release identities were independently confirmed through official BLS search results. This is not a blanket HTTP-availability certificate for the 51 URLs, but it produced no unresolved source-fit or content contradiction.

## Findings raised and closed

Each item below was treated as release-blocking until the writer/root corrected it. I did not make the corrections.

| # | Page(s) | Finding and required fix | Final recheck evidence |
|---:|---|---|---|
| 1 | `6s-best-times-of-day-to-trade-swiss-franc-futures.html` | The all-gates formula omitted `impact` even though impact was a stated hard gate. Required: add impact to the conjunction so prose and executable logic agree. | The formula now reads `clock & spread & depth & stability & impact & event & contract`; recheck passed. |
| 2 | `6s-london-fix-liquidity-shifts-and-daily-flows.html` | The filled-order shortfall expression combined unlike units and lacked an explicit side convention and clean unfilled-order treatment. Required: dimension the filled term in USD and separate misses. | It now states `side × (fill − decision) × 125,000 × filled contracts + USD fees`, defines buy `+1`/sell `−1`, and permits an unfilled-order USD opportunity cost only under a predeclared miss model. |
| 3 | `6s-why-6s-has-low-volatility-and-how-to-trade-it.html` | Position sizing did not reliably distinguish one-time USD costs from quantity-dependent costs. Required: subtract fixed costs once, put stressed variable USD cost per contract in the denominator, floor to whole contracts, enumerate nonlinear candidates, and allow zero. | The displayed formula and explanatory paragraph now do all five; recheck passed. |
| 4 | `6s-yield-spreads-and-how-interest-rate-differentials-drive-price.html` | The visual not-equal sign was hidden from assistive technology without an equivalent spoken relation. Required: give the complete formula an accessible label that states “is not equal to.” | Current `aria-label` speaks the full expected-path versus current-rate relationship; all ARIA references also pass. |
| 5 | `6s-why-6s-has-low-volatility-and-how-to-trade-it.html` | The citation used the superseded `/markets/fx/cvol.html` path and omitted the product-availability boundary. Required: use the current official FAQ and disclose CHF/USD's end-of-day-only status. | Current FAQ URL and explicit end-of-day-only statement are present; recheck passed. |
| 6 | `6s-session-overlaps-why-europe-us-handover-moves-chf-futures.html`; `6s-what-moves-swiss-franc-futures.html`; `6s-why-6s-has-low-volatility-and-how-to-trade-it.html` | Three generic SNB press-release citations used a superseded listing endpoint. Required: replace all three with the deterministic current official listing. | All three now use `https://www.snb.ch/en/news-publications/media-releases`; no superseded cluster occurrence remains. |
| 7 | `6s-mean-reversion-setups-and-why-they-work.html` | The net-result formula subtracted generically named costs from realized P&L without a common unit or quantity scope. Required: label every term in USD and state that all terms refer to the filled contract quantity. | Current formula labels P&L, spread, impact, fees, and roll as USD; its accessible label states the filled-quantity scope. |
| 8 | `6s-what-moves-swiss-franc-futures.html` | The bare `https://data.snb.ch/` citation returned a non-deterministic/503 landing response. Required: use the deterministic official English endpoint. | It now uses `https://data.snb.ch/en`; the bare root occurs zero times. |

**Open findings after recheck: 0.**

## HTML, metadata, navigation, and shared-style checks

Independent parsing of the final 21 pages produced:

- **537** internal-link occurrences checked; every target exists.
- **183** fragment-link occurrences checked; every referenced fragment exists.
- **120** `aria-labelledby`/`aria-describedby` ID references checked; every referenced ID exists; no duplicate-ID finding.
- **42** JSON-LD blocks parsed successfully (Article and BreadcrumbList coverage across all pages).
- Canonical URL, `og:url`, Article `url`/`mainEntityOfPage`, Breadcrumb terminal URL, published date, modified date, and visible updated date checks: **0 issues**.
- Staggered modification-date distribution is exactly **4 / 4 / 4 / 4 / 5** across August 17, 18, 19, 20, and 21, 2026. Historical `datePublished` remains 2025-11-27.
- Every page uses the same two shared stylesheet references: `../style.css` and `/futures-basics/currency-research-library.css?v=20260820a`.
- **64** used `fx-*` classes were checked against **84** definitions in the shared currency stylesheet; **0 undefined used classes**.
- No page-level `<style>` block or theme fork was found. The only two `style` attributes are the approved positional `left:18%` and `left:72%` correlation markers, not theme declarations.
- Hub cards, search-index records, sitemap entries/lastmod values, canonical-mechanics links, and the cluster distinctiveness gate pass the project validator.

## Final command evidence

Final post-fix commands and results:

```text
py scripts\validate_6s_cluster.py --warnings-as-errors
Checked 21 core 6S pages: 0 errors, 0 warnings.

py -m unittest -v tests.test_6s_correctness_regressions tests.test_6s_css_accessibility tests.test_6s_cluster_release
Ran 16 tests in 1.683s
OK

Independent structural parser
pages=21 internal_links=537 fragment_links=183 external_links=165
aria_id_refs=120 jsonld_blocks=42 inline_styles=2
fx_classes_used=64 fx_classes_defined=84 undefined_used=0
issues=0

Independent metadata/date parser
modified_date_distribution=2026-08-17:4, 2026-08-18:4, 2026-08-19:4, 2026-08-20:4, 2026-08-21:5
metadata_schema_issues=0

git diff --check -- ':(glob)futures-basics/6s-*.html'
exit 0; no whitespace errors (Windows LF-to-CRLF advisories only)
```

The 16-test suite covers canonical mechanics links and margin boundaries, standard/MSF reconciliation, reciprocal spot quotes, staggered dates, tick/P&L arithmetic, source-disclosure behavior, keyboard/focus/reduced-motion/contrast requirements, shared 6N/6S CSS namespace, fail-closed validation, and distinctiveness.

## Final decision

**PASS.** The final reviewed state has no open correctness, evidence, mechanics, arithmetic, quote-direction, economic-claim, source-fit, date, expiry/settlement, terminology, certainty, link, metadata/schema, accessibility/HTML, or shared-CSS finding. Any subsequent content or source change requires a fresh fail-closed review.
