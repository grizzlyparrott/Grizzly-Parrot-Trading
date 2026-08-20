# 6M library editorial-distinctiveness proofread

- **Reviewer:** Independent Proofreader 2 (editorial distinctiveness and neighboring-page purpose)
- **Review date:** 2026-08-13
- **Scope:** All 20 rebuilt 6M article URLs plus `artifacts/6m-cluster-classification.md` and the generated distinctiveness report
**Final verdict:** **PASS — independent editorial-distinctiveness signoff granted after recheck**

The initial review failed closed on two author-agent seams in opening architecture and publication chrome. Both findings were corrected and independently rechecked. The final cluster reads as one edited publication while preserving subject-driven structures and unambiguous neighboring-page ownership.

## Method and evidence

1. Read the written classification/ownership map and checked every assigned purpose against the visible title, description, hero, complete H2 sequence, section progression, closing artifact, and internal 6M links.
2. Compared the principal neighboring groups side by side:
   - backtesting / data traps / indicators / seasonality;
   - best times / volatility profile / why 6M trades differently;
   - broad fundamental drivers / carry / trade and remittances / Banxico influence / Banxico rate policy / USD strength;
   - canonical specifications / beginner orientation / margin sizing;
   - slippage / trading plan / trading mistakes;
   - 6M-versus-6E-versus-6J / market-structure explanation.
3. Inspected openings, H2s, component sequences and counts, table shapes, process counts, endings, source disclosures, disclaimers, hero actions, descriptions, examples, and cross-page routing across all 20 files.
4. Ran `py scripts\audit_6m_distinctiveness.py --json artifacts\6m-distinctiveness-report.json` before and after correction. The final run reported **20 pages, 20 unique component signatures, 0 errors, and 0 warnings**. The report also found no repeated substantive paragraphs, no repeated disclosure sentences or 18-word disclosure shingles, no repeated non-generic H2s, no repeated kicker on four or more pages, and no ending structure shared by five or more pages.
5. Ran `py scripts\validate_6m_cluster.py --warnings-as-errors` on the corrected cluster. It reported **20 pages, 0 errors, and 0 warnings**.
6. Did not treat the machine results as dispositive. Recomputed the exact opening sequences, enumerated all source-disclosure variants and hero actions, and tested representative changed pages in a browser at 1440×900 and 390×844.

## Resolved findings and recheck evidence

### RESOLVED P1 — Macro/mechanism openings no longer reveal one recycled writer template

**Files/sections:**

- `6m-carry-trade.html` — hero through the opening position-economics sections
- `6m-fundamental-drivers.html` — hero through the opening driver-map/prior sections
- `6m-trade-and-remittances.html` — hero through the opening measurement/conversion sections
- Supporting pattern also appears in `banxico-influence-6m.html`, `banxico-rate-policy-6m.html`, and `usd-strength-6m.html`

**Initial evidence:** All six mechanism/macro assignments began with the same first two audited component families: `mx-market-board > mx-formula`. Carry, broad fundamental drivers, and trade/remittances repeated the same first **four** families exactly: `mx-market-board > mx-formula > mx-two-column > mx-caution`. The automated report ranked carry versus trade/remittances at **0.7500 structural-sequence similarity** and **0.9545 structure-count similarity**.

The prose, causal content, H2 wording, and ending artifacts were already distinct; this was not a duplicate-content failure. It was an architecture failure: the repeated visual cadence occurred exactly inside one writer's six-page assignment, not across an editorially defensible archetype. A balance-of-payments flow page, a broad weekly evidence ledger, an institutional-toolkit reference, an event workflow, a carry-state model, and a quote/factor-testing page should not all announce themselves with the same market-board-then-formula chassis.

**Resolution verified:** `6m-fundamental-drivers.html` now opens with a genuine mixed-evidence decision strip: `mx-decision-strip > mx-two-column > mx-caution > mx-method`. `6m-trade-and-remittances.html` now opens with a measurement/conversion evidence board: `mx-quote-board > mx-two-column > mx-caution > mx-check-grid`. Carry retains its economically appropriate return-map opening. The six macro pages now have six distinct four-component opening sequences; no exact four-component opening repeats anywhere in the 20-page cluster. The edits add purpose-specific content rather than merely renaming classes.

At 1440×900, the revised decision strip and evidence board each render as three-column components with no horizontal overflow. At 390×844 they collapse to one column, remain readable, and retain zero horizontal document overflow. Direct screenshots confirmed that the broad page visually leads with competing decision states and the flow page with the published-versus-missing evidence boundary.

### RESOLVED P1 — Source disclosure and hero navigation no longer expose the three writer batches

**Files/sections:** All 20 pages, especially each post-article source block and hero action row.

**Initial evidence:** Source presentation divided perfectly by assignment rather than by page purpose:

- the six research/measurement pages use a closed `<details class="mx-sources">` with a dated summary;
- the six macro/mechanism pages use an always-visible `<section class="mx-sources">` with a repeated `Sources reviewed` H2;
- the eight practical/reference pages use an open `<details class="mx-sources" open>` with “evidence boundaries” summary wording.

Hero navigation had a second writer-correlated split: every research and macro page had exactly two `.mx-hero-actions`, while all eight practical/reference pages had none — including pages with obvious destinations such as the margin calculator, canonical specification card, and printable plan worksheet. Readers should not be able to infer which specialist produced a page from disclosure behavior and hero controls.

**Resolution verified:** All 20 pages now contain exactly one closed native `<details class="mx-sources">`; none retains the old always-visible `<section>` or `open` variant. All 20 summaries use the exact publication label `Sources, methods and editorial disclosure — reviewed August 13, 2026`. In the browser, the summary was visible and closed at both widths; pointer activation opened the source list, left focus on the native `SUMMARY`, and keyboard Enter closed it again. This confirms meaningful native disclosure semantics, not merely matching markup.

Hero actions now follow reader utility rather than assignment. Direct links were added to the canonical specification card/ticket check, margin calculator/reconciliation, slippage example/execution gate, and plan inputs/worksheet. Actions were removed from the Banxico institutional reference and volatility description page. The final inventory is 14 pages with actions and six without, distributed across all three writer groups. Every revised action was visible at 390 pixels, every fragment target existed, a live click landed on the intended `#path` section, and the eight changed pages had zero horizontal overflow at desktop and mobile widths. Browser logs contained no warnings or errors during this recheck.

## Areas that pass

- **Ownership and cannibalization:** The broad driver page explicitly owns integration and routes specialist depth outward. Banxico rate-policy event reading is cleanly separated from Banxico's wider institutional toolkit. Best-times owns a clock-window study; volatility owns distributions/states; market structure owns participation and executable-state consequences. Backtesting owns the full experimental pipeline while data traps owns source admission. Trading plan, mistakes, slippage, sizing, beginner orientation, specifications, and instrument comparison each answer a distinct reader decision.
- **Openings as prose:** Every hero lede is unique and question-specific. The examples — disagreeing continuous series, 800 indicator combinations, DST labels, positive carry during an MXN selloff, mixed weekly evidence, annual flows versus conversion, a margin-floor equation, $88 slippage reconciliation, inverse spot quotation, and equal candle ranges with unequal executable risk — do real explanatory work rather than swapping nouns in a shared paragraph.
- **Headings and descriptions:** Titles, descriptions, H1s, and substantive H2s are distinct. The largest reported description similarity is 0.5399 (backtesting versus indicators), which reflects shared research vocabulary rather than search-intent duplication. No pair has a repeated non-generic H2 sequence.
- **Full-body reuse:** The top 8-gram Jaccard overlap is only 0.0029. There are no exact duplicate substantive paragraphs and no duplicated disclosure sentence or 18-word disclosure shingle. Recurrent phrases such as “no original study is reported” serve a necessary evidence boundary and are followed by page-specific exclusions.
- **Endings:** Full structural component signatures are unique on all 20 pages, no exact ending structure is shared even by two pages, and the close forms match the subject: reproducibility record, indicator decision card, session protocol, carry-state matrix, dataset gate, driver ledger, integer-sizing reconciliation, falsification matrix, execution decision card, ticket check, evidence ladder, failure checklist, plan worksheet, monitoring specification, selection boundaries, institutional map, policy matrix, non-circular checklist, beginner readiness gate, and consequence map.
- **Examples and evidence patterns:** Worked examples are confined to the appropriate owners and are not repackaged as empirical results. Empirical pages explicitly preserve the possibility of null/rejected findings. Mechanism pages distinguish established facts, hypotheses, confirmation, rivals, and invalidation. Practical pages turn those inputs into gates rather than promises.
- **Cross-page routing:** Links generally send mechanics to `6m-tick-size.html`, broad mechanisms to `6m-fundamental-drivers.html`, execution measurement to `6m-slippage.html`, data admission to `6m-data-traps.html`, and risk sizing to `6m-margin-requirements.html`. This reinforces rather than blurs neighboring purpose.
- **Disclaimers:** Risk disclosures are page-specific enough to avoid a pasted legal paragraph while preserving publication-level futures-risk language.

## Final signoff

Both original P1 findings are resolved. Fresh machine gates are clean, the six-for-six macro opening signature is gone, no exact four-component opening repeats in the cluster, the source system is uniform and keyboard-operable, and hero navigation is purpose-driven across writer groups. The ownership and anti-cannibalization conclusions in the passing areas above remain unchanged after the edits.

**Independent Proofreader 2 final status: PASS. No editorial-distinctiveness release blocker remains.**
