# 6M correctness proofreader report

## Final verdict

**PASS — the correctness, source-quality, integration, schema, HTML, and accessibility release gate is clear.**

All four findings from the first independent read have been corrected and independently rechecked in the rendered source, executable calculator logic, CSS cascade, and regression suite. I found no remaining release-blocking correctness defect. No article or shared source file was edited during proofreading; this report is the only file I changed.

## Scope and evidence inspected

I independently read all 20 rebuilt target pages in full:

1. `6m-backtesting.html`
2. `6m-best-indicators.html`
3. `6m-best-times.html`
4. `6m-carry-trade.html`
5. `6m-data-traps.html`
6. `6m-fundamental-drivers.html`
7. `6m-margin-requirements.html`
8. `6m-seasonality.html`
9. `6m-slippage.html`
10. `6m-tick-size.html`
11. `6m-trade-and-remittances.html`
12. `6m-trading-mistakes.html`
13. `6m-trading-plan.html`
14. `6m-volatility-profile.html`
15. `6m-vs-6e-vs-6j.html`
16. `banxico-influence-6m.html`
17. `banxico-rate-policy-6m.html`
18. `usd-strength-6m.html`
19. `what-are-6m-futures.html`
20. `why-6m-trades-differently.html`

I also inspected the complete shared `futures-basics/6m-research-library.css`; both hub integrations; `search-index.json`; `sitemap.xml`; the synchronizer, validator, and distinctiveness auditor; and all relevant test modules. The recheck specifically reread the changed passages and executable behavior in `6m-backtesting.html`, `6m-margin-requirements.html`, `6m-best-times.html`, the shared CSS, `tests/test_6m_correctness_regressions.py`, and `tests/test_6m_css_accessibility.py`.

## Finding disposition, ranked by original severity

### F-01 — Resolved — High — `futures-basics/6m-backtesting.html:100-101`

The formula is now direction-aware:

`side × (exit fill − entry fill) × 500,000 × contracts − non-overlapping dollar costs`

The adjacent prose defines `side = +1` for a long and `−1` for a short and says that spread or slippage already embedded in fills must not be subtracted again. Independent arithmetic produced the same `$988.00` net result for a two-contract favorable long and equal-magnitude favorable short after `$12` costs. The regression test also checks equal gross dollar results for favorable long and short paths.

Required fixes remaining: none.

### F-02 — Resolved — High — `futures-basics/6m-margin-requirements.html:111-119,205-249`

`parseNonnegative` now rejects empty, negative, fractional whole-tick, and non-finite values. `riskModel` separately rejects invalid inputs, zero modeled risk, and non-finite derived arithmetic; every invalid branch returns `cap: 0`. The UI sets field-specific custom validity for invalid individual inputs and uses the live result region for explicit zero-risk and overflow messages.

I executed the actual calculator IIFE against eight states, not just its pure helper:

- Default `1000 / 60 / 20 / 40`: `$440.00` per contract, cap `2`, planned risk `$880.00`.
- Fractional ticks, negative ticks, empty ticks, and non-finite budget: `Not available`, cap `0`, explicit field validity/message.
- Zero modeled risk and derived overflow: `Not available`, cap `0`, explicit reason in the live result region.
- Zero budget with positive modeled risk: valid no-trade result, cap `0`, planned risk `$0.00`.

The executable Node regression covers default, fractional, negative, empty, zero-risk, overflow, and non-finite cases. Inputs no longer coerce invalid values into an apparently valid position size.

Required fixes remaining: none.

### F-03 — Resolved — Medium — `futures-basics/6m-research-library.css:40-49,671-673`; `tests/test_6m_css_accessibility.py:51-74`

The shared `:focus-visible` selector now includes links, buttons, inputs, selects, summaries, and focusable regions and supplies the intended light outline plus dark outer shadow. The later `.mx-fields input:focus` rule changes only `border-color`; it no longer overrides `outline` or `box-shadow`. A targeted cascade regression asserts that the later rule contains neither property, and the contrast regression verifies both focus-token layers at at least 3:1 against the tested surfaces.

Required fixes remaining: none.

### F-04 — Resolved — Medium — `futures-basics/6m-best-times.html:27,31-34`

The hero now begins “Under the 2026 time-zone rules,” and the board is explicitly labeled “Illustration: 2026 U.S. daylight time.” The page still instructs researchers to resolve historical observations using the law and timezone rules in force for each observation date. An independent timezone execution confirmed that 14:00 UTC maps to 08:00 Mexico City / 09:00 Chicago on July 15, 2026 and 08:00 / 08:00 on December 15, 2026.

Required fixes remaining: none.

## Independent fact and arithmetic reconciliation

The core contract mechanics reconcile to current first-party CME material:

- Chapter 256 defines MXN/USD futures, a 500,000 MXN unit, a 0.00001 Globex increment worth `$5`, and a 0.000001 ClearPort increment worth `$0.50`.
- Trading terminates on the second business day immediately before the third Wednesday, subject to the stated Chicago/New York bank-holiday rule; physical delivery is on the third Wednesday with the rule's business-day adjustment.
- The current CME product guide and LATAM FAQ agree on USD-per-MXN orientation, physical settlement, 13 consecutive months plus two additional quarterlies, delivery/rolling mechanics, and USD variation margin. The guide does not list a Micro MXN/USD contract.
- 6E, 6J, M6E, and MJY units, minimum increments, and tick values used by the comparison page reconcile to the current CME material.
- Worked examples reconcile independently: canonical `$350`/`$700` values, comparison-page move arithmetic, the `$440` margin model and floor, and the slippage page's `$150` gross path, `$50` price shortfall, `$12` fees, and `$88` net result.
- Quote language is consistent: 6M is USD per MXN; a higher 6M quote means a stronger peso; the common USD/MXN spot convention is reciprocal and is not an exact dated-futures price.

The economic and institutional claims remain appropriately bounded. Banxico claims reconcile to the central-bank law, Exchange Commission authority, the December 1994 floating-regime record, official intervention-tool records, and the 2026 calendar's extraordinary-action caveat. Federal Reserve, CFTC, INEGI, Banco de México, BIS, NIST, and NBER sources are used within their stated scope. Hypothetical arithmetic, protocols, and illustrations are labeled; no page converts cited context into an unperformed 6M result or unsupported performance certainty.

## Links, metadata, schema, HTML, and integration

- The first-pass audit extracted 67 unique HTTPS evidence links from the article bodies. Sixty-three opened directly; four dynamic/parser-hostile official endpoints were corroborated through official search results or alternate official records. No dead or misdirected evidence link was found.
- All 20 pages preserve exact title/H1/Open Graph/Twitter/Article-headline parity and exact meta/Open Graph/Twitter description parity.
- Each page has one Article object and one correct three-item BreadcrumbList. The canonical specification page's visible FAQ and FAQPage schema match in question/answer order; the other pages do not expose unsupported FAQ schema.
- Author, publisher, canonical/main-entity URL, image, publication date, and modification date are consistent across the cluster.
- No duplicate IDs, missing internal targets or fragments, unnamed links or controls, unlabeled SVGs, unscoped table headers, inaccessible table regions, or `_blank` evidence links missing `noopener` were found.
- Both hubs, the search index, and the sitemap contain the complete 20-page set with metadata and URL parity. The distinctiveness audit reports 20 distinct component signatures.

## Final command evidence

Executed from the frozen 6M worktree after the fixes:

```text
py scripts\validate_6m_cluster.py --warnings-as-errors
Checked 20 core 6M pages: 0 errors, 0 warnings.

py scripts\audit_6m_distinctiveness.py
Audited 20 pages: 20 component signatures, 0 errors, 0 warnings.

py -m unittest discover -s tests -v
Ran 31 tests in 3.607s — OK

git diff --check
No whitespace errors; output contained only LF-to-CRLF working-copy notices.
```

The validator result is supporting evidence, not the basis of this verdict. The final PASS rests on the independent full-page/source review, direct arithmetic and timezone checks, actual calculator-IIFE execution across valid and invalid states, CSS cascade inspection, link/schema/integration reconciliation, and clean automated gates.
