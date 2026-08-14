# 6C Core Library Release Gate

Review date: 2026-08-13

Scope: the 20-page Canadian Dollar futures (6C) core article library listed in `scripts/validate_6c_cluster.py`.

## Target selection

Repository inventory and hub ordering established that 6J, 6E, 6A, and 6B already had the modern full-library treatment, with 6B the most recent completed cluster. The next existing stale core library in the site's established ordering was 6C. No nonexistent code, isolated article, or unrelated section was substituted.

## Final cluster test

1. **Correct next cluster identified automatically: PASS.** The inventory and site order select 6C after the completed 6B cluster.
2. **All target pages materially improved: PASS.** Every production URL now contains a substantive evidence-led rebuild of more than 1,100 visible article words, current metadata, primary-source disclosure, and responsive components.
3. **Distinct reader purpose per URL: PASS.** `artifacts/6c-cluster-classification.md` records the exclusive purpose, archetype, architecture, opening, ending, and cannibalization boundary for every page.
4. **Current contract mechanics: PASS.** The canonical specification page reconciles the 100,000 CAD standard unit, 0.00005 outright increment, $5 tick, 10,000 CAD Micro unit, 0.0001 Micro increment, $1 Micro tick, physical delivery, termination rule, and the May 10, 2026 expansion to 16 serial months plus 20 consecutive quarterlies.
5. **Primary sourcing: PASS.** Pages use responsible institutions including CME, Bank of Canada, Statistics Canada, Federal Reserve, BLS, BEA, BIS, CFTC, EIA, and NIST. A reachability audit checked 56 unique external citations: 36 returned HTTP 200/206, 20 blocked automated access with HTTP 403, and none returned a confirmed 404 or 5xx failure. Access-blocked URLs were not mislabeled as independently reachable.
6. **Unsupported deterministic claims removed: PASS.** The validator rejects deterministic or edge-promising language; mechanisms and applications remain conditional.
7. **Empirical protocol versus findings: PASS.** All seven empirical pages explicitly disclose that no original result was produced and specify falsifiable future research designs.
8. **Mechanism versus prediction: PASS.** Macro pages distinguish institutional facts, transmission mechanisms, hypotheses, inferences, and possible applications.
9. **Process versus promised edge: PASS.** Execution pages provide calculations, gates, invalidation, sizing, and review procedures without promising profitability.
10. **Neighboring pages complement one another: PASS.** The classification map defines content ownership and the canonical specification page; topic pages link instead of reproducing large mechanics blocks.
11. **Multiple genuine architectures: PASS.** The library includes specification reconciliation, event packages, causal maps, falsification trees, state machines, decision trees, cost tapes, scorecards, comparison boards, and weekly research workflows.
12. **One publication without one repeated article: PASS.** The distinctiveness audit reports 20 unique component signatures, zero duplicate disclosure sentences or 18-word disclosure shingles, and zero near-duplicate structural sequences.
13. **Discovery and metadata synchronized: PASS.** Both hubs contain each target once, the live hub search returns exactly the 20 6C guides, `search-index.json` contains 849 total entries, and `sitemap.xml` contains 857 canonical URLs with no missing canonical fallback.
14. **Both independent proofreaders signed off: PASS.** The evidence/correctness reviewer and editorial-distinctiveness reviewer rechecked the repaired snapshot read-only and reported no material blocker.
15. **Technical and distinctiveness gates: PASS.** Cluster validation reports 0 errors/0 warnings; the sameness audit reports 20 signatures/0 errors/0 warnings; repository unit discovery reports 19 passing tests.

## Reproducible release evidence

- `py scripts\validate_6c_cluster.py --warnings-as-errors` — 20 pages, 0 errors, 0 warnings.
- `py scripts\audit_6c_distinctiveness.py --json artifacts\6c-distinctiveness-report.json` — 20 signatures, 0 errors, 0 warnings.
- `py -m unittest discover -s tests -v` — 19 tests passed.
- `py -m pytest -q -p no:cacheprovider tests` — 19 tests passed.
- Desktop and mobile article QA — 40 of 40 viewport checks passed; no overflow or console errors.
- Desktop and mobile hub QA — 4 of 4 checks passed; all 20 target links appeared exactly once.
- Interactive Futures Basics search — 20 visible, 20 unique, 0 missing, 0 extra.
- `py scripts\submit_indexnow.py --all --dry-run --skip-live-check` — 857 URLs validated; no request sent.
- `git diff --check` — no whitespace errors.

Release remains contingent on the pull-request checks, merge result, Pages deployment, and independent live verification of the deployed revision.
