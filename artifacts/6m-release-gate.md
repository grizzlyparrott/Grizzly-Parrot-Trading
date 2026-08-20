# 6M Mexican Peso futures library release gate

- **Gate date:** 2026-08-13
- **Branch:** `agent/6m-core-rewrites-20260813`
- **Target:** the complete 20-page 6M Mexican Peso futures cluster
**Pre-merge verdict:** **PASS**

This record seals the final working-tree evidence before commit and pull request. A clean local gate authorizes the pull-request step; it is not evidence that GitHub checks have passed or that production has propagated. Those two states must be verified separately.

## Why 6M was selected

The Futures Basics and Currencies hub ordering was inspected before delegation. The completed modern currency-library sequence was 6A, 6B, 6C, 6E, and 6J, with 6C the latest merged rebuild. The next stale full cluster in the published order was 6M. Existing production paths were preserved.

The selected URLs are:

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

The per-page archetype, purpose, structure, ending, ownership boundary, and cross-page routing contract are recorded in `artifacts/6m-cluster-classification.md`.

## Authoritative mechanics boundary

`futures-basics/6m-tick-size.html` is the canonical specification page. The cluster reconciles to current CME primary material, including Rulebook Chapter 256, the current FX Product Guide, and the LATAM FX futures FAQ:

- contract unit: 500,000 Mexican pesos;
- quote orientation: U.S. dollars per Mexican peso;
- Globex minimum increment: 0.00001 USD per MXN, worth USD 5 per contract;
- ClearPort minimum increment: 0.000001 USD per MXN, worth USD 0.50 per contract;
- physical settlement and the Chapter 256 termination/delivery rules;
- no Micro MXN/USD contract represented in the current CME product guide.

Every other page defers contract specifications to the canonical page rather than maintaining a competing specification block.

## Editorial and evidence controls

- Three specialist writer tracks rebuilt research/measurement, macro/mechanism, and practical/reference pages.
- Every article retains its production URL and has synchronized title, H1, Open Graph, Twitter, description, canonical URL, Article schema, BreadcrumbList schema, dates, author, and publisher data.
- Primary-source use is visible and dated. The independent correctness review examined 67 unique HTTPS evidence URLs and found no dead or misdirected evidence link.
- Hypothetical examples, protocols, and arithmetic are labeled. No backtest result, seasonality finding, indicator edge, performance claim, or deterministic macro forecast was manufactured.
- The final automated audit reports 20 distinct component signatures, no repeated substantive paragraphs, no repeated non-generic H2 sequence, and no release warning.
- All 20 pages use the same closed, keyboard-operable native source-disclosure component while their subject-driven openings, evidence patterns, decision artifacts, and endings remain distinct.

## Independent proofreader signoffs

### Correctness and source quality: PASS

The correctness proofreader read all 20 pages and the shared/integration files, reconciled CME specifications, arithmetic, quote direction, economic and institutional claims, links, metadata, schema, HTML, and accessibility. Four fail-closed findings were corrected and independently rechecked:

1. direction-aware long/short backtest arithmetic;
2. finite, nonnegative, whole-tick margin-calculator validation and zero-risk/overflow behavior;
3. preserved high-contrast `:focus-visible` treatment through the full CSS cascade;
4. an explicitly 2026/post-2022 time-zone illustration.

Final artifact: `artifacts/6m-proofreader-correctness.md`.

### Editorial distinctiveness and neighboring-page purpose: PASS

The editorial proofreader read the complete cluster and ownership map, compared the neighboring intent groups, and failed closed on two writer-assignment seams. Both were corrected and independently rechecked: macro openings now use purpose-specific component sequences, and source disclosure/hero actions now reflect publication behavior and reader utility rather than author batch. The reviewer confirmed six distinct macro opening sequences, no repeated four-component opening anywhere in the cluster, and clean desktop/mobile behavior.

Final artifact: `artifacts/6m-proofreader-distinctiveness.md`.

## Automated and rendered evidence

Final-tree commands:

```text
py scripts\validate_6m_cluster.py --warnings-as-errors
Checked 20 core 6M pages: 0 errors, 0 warnings.

py scripts\audit_6m_distinctiveness.py --json artifacts\6m-distinctiveness-report.json
Audited 20 pages: 20 component signatures, 0 errors, 0 warnings.

py -m unittest discover -s tests -p "test_*.py"
Ran 31 tests: OK.

git diff --check
No whitespace errors.
```

Independent in-app browser QA inspected all 20 pages at 1440 by 900 and 390 by 844. Results: no document-level horizontal overflow; one main landmark and H1 per page; working skip link; valid hero fragment targets; labeled, keyboard-focusable table scroll regions; closed native source disclosures; responsive three-column-to-one-column components; and zero browser warnings or errors. The live margin calculator was exercised through default, fractional, negative, empty, zero-risk, overflow, non-finite, and zero-budget states. Focus rendering was inspected after the final CSS correction.

Discovery synchronization generated complete 20-page entries on the Futures Basics and Currencies hubs, 849 search-index entries, and 857 sitemap URLs from 863 scanned HTML files, with zero missing canonicals and six intentional `noindex` skips.

## Final 15-question release checklist

1. **Was the correct next stale full currency cluster selected? YES.** Hub order and prior merged rebuilds establish 6M as next after the modern 6C/6E/6J set.
2. **Are the pages materially improved rather than cosmetically changed? YES.** Each page now has a purpose-owned architecture, primary evidence, explicit methods/boundaries, decision artifacts, synchronized metadata/schema, responsive/accessibility behavior, and complete routing.
3. **Does every page have a distinct purpose and ownership boundary? YES.** The 20-page classification map and independent neighboring-page review confirm it.
4. **Are current contract mechanics correct and centralized? YES.** The canonical page reconciles to current CME primary material, and dependent pages route to it.
5. **Are important factual claims grounded in primary sources? YES.** CME, Banco de Mexico, INEGI, SHCP, Federal Reserve, CFTC, BIS, IMF, Census, NIST, and NBER material is used within its stated scope.
6. **Are deterministic or guaranteed trading claims absent? YES.** The validator and two full editorial reads found none.
7. **Do empirical pages describe executable protocols without inventing findings? YES.** Backtesting, indicators, times, seasonality, volatility, and data-quality pages preserve null and rejected outcomes.
8. **Do macro pages explain mechanisms without making unsupported predictions? YES.** They separate observation, mechanism, rival explanation, confirmation, and invalidation.
9. **Do practical pages provide processes without promising an edge? YES.** Sizing, slippage, planning, mistakes, comparison, and beginner pages use gates and reconciliations.
10. **Are neighboring pages complementary instead of cannibalizing one another? YES.** Broad pages own integration; specialist pages own their narrower decisions and receive explicit cross-links.
11. **Are the architectures genuinely distinct? YES.** The audit reports 20 unique full component signatures, and the manual recheck found no repeated four-component opening.
12. **Does the library still read as one publication? YES.** Shared typography, tokens, navigation, risk treatment, attribution, and source disclosure are consistent without flattening subject structures.
13. **Are all discovery surfaces synchronized? YES.** Both hubs, the search index, sitemap, canonicals, and internal links contain the complete set.
14. **Did both independent proofreaders grant final signoff after recheck? YES.** Correctness/source quality and editorial distinctiveness both conclude PASS with no remaining blocker.
15. **Did the full release suite pass with warnings treated as failures? YES.** Validator 0/0, distinctiveness 0/0, 31 tests OK, browser QA clean, and `git diff --check` clean.

## Gate conclusion

**Pre-merge release gate: PASS.** The working tree may be committed and submitted for review. Merge remains contingent on a clean pull-request state and required GitHub checks. Publication remains unverified until the merged commit has propagated and the live 6M pages, shared stylesheet, hubs, search index, and sitemap have been independently fetched from production.
