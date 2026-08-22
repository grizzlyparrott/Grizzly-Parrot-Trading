# Independent distinctiveness proofread: core 6S library

Review date: 2026-08-21
Reviewer role: independent Proofreader 2; no 6S article was authored or edited during this review
Scope: the frozen 21-page 6S cluster enumerated by `scripts/validate_6s_cluster.py` and mapped in `artifacts/6s-cluster-classification.md`

## Fail-closed verdict

**PASS — 0 blocking findings and 0 required editorial fixes.**

The cluster reads as one Grizzly Parrot Trading publication while the 21 pages remain materially distinct in reader purpose, opening strategy, section sequence, evidence architecture, tables/components, decision output, and ending form. No pair crossed the automated sameness thresholds, no neighboring pages collapse into the same search intent, and no 6S page introduces a visual-theme fork.

## Methodology

1. Read the classification map and the complete article body, metadata, sources/disclosures, and HTML structure of every file in the validator's 21-page `CLUSTER` tuple.
2. Compared every title, meta description, hero lede, kicker, H2 sequence, table shape, component sequence, research-status statement, source disclosure, disclaimer, and final decision form.
3. Tested likely cannibalization families separately: policy/events, risk/havens, rates, session/liquidity, strategy labels, and reference/synthesis pages.
4. Ran the repository's cross-page sameness audit and full 6S validator, then independently counted repeated n-grams and exact substantive sentences outside source/disclaimer blocks.
5. Verified shared-theme and accessibility implications in the HTML and shared stylesheet, including keyboard focus, skip links, reduced motion, responsive breakpoints, and horizontally scrollable data tables.

## Exact automated evidence

- `py scripts\audit_6s_distinctiveness.py`: **21 pages, 21 unique component-count signatures, 0 errors, 0 warnings**.
- `py scripts\validate_6s_cluster.py --warnings-as-errors`: **21 pages, 0 errors, 0 warnings**.
- `py -m unittest tests.test_6s_css_accessibility`: **7 tests passed**.
- `py -m unittest tests.test_currency_library_theme`: **5 tests passed**.
- No exact substantive paragraph is shared by two pages; no hero lede is repeated; no non-generic normalized H2 is repeated; no disclosure sentence or 18-word disclosure shingle is duplicated; no kicker appears on four or more pages; and no ending-component sequence appears on five or more pages.
- Highest pairwise values from the sameness audit remained comfortably below their gates:
  - H2-sequence similarity: **0.0968** maximum versus a 0.82 warning gate.
  - eight-word lexical Jaccard overlap: **0.0035** maximum versus a 0.12 error gate.
  - meta-description similarity: **0.4759** maximum versus a 0.84 warning gate.
  - structural-component sequence similarity: **0.7000** maximum versus a 0.80 error gate.
- Editorial shape is not mechanically fixed: article bodies range from **1,114 to 1,629 words**, H2 counts range from **5 to 7**, and table counts range from **1 to 3**. The cluster contains 26,613 article-body words.
- The independent phrase scan found only expected publication-control repetition on four or more pages: dated research-status language, correct USD-per-CHF quote wording, and links to the canonical contract guide. The only exact eight-plus-word substantive sentence shared by two pages was `No CME dataset was purchased or analyzed for this article.` on the FOMC-week and London-fix research protocols. That is a concise data-availability disclosure, not a reused market claim, example, opening, or structural passage; it does not blur page purpose.

## Opening, structure, and ending review

- Every opening begins with a topic-specific contradiction or identification problem: FOMC-window contamination, two meanings of 8:30 a.m., reciprocal spot/futures quotes, tick arithmetic, an unchanged SNB rate with new information, price not proving intervention, two paths from payrolls, unlike risk shocks, opposing yield stories, unobservable benchmark flow, the rejection of a trigger leaderboard, competing mean-reversion lookbacks, CHF failing to rally, CHF/JPY divergence, DST-shifting handovers, correlation sign reversal, incompatible tape labels, competing compression definitions, multi-cause daily moves, hidden jump risk, and an unchanged policy gap with curve repricing.
- All 21 H2 sequences are unique and follow the page's declared reader task. Research pages progress through definition, measurement, controls, validation, and rejection; macro pages progress through institutional facts, rival mechanisms, confirmation, and failure; execution pages progress through observable inputs, hard gates, branches, and review.
- Tables are purpose-built rather than copied: timestamp maps, specification/arithmetic ledgers, evidence ladders, state matrices, causal controls, execution gates, study registries, and rejection records use different row/column shapes.
- Endings vary before the shared source/risk shell: rejection record, go/reduce/wait/reject choice, venue matrix, pre-order checklist, failure cases, monitoring boundary, no-trade gate, validation ledger, state card, risk review, or measurement protocol. The standardized source and risk disclosure is appropriate publication identity, not article-body duplication.
- No page uses a visible FAQ and no page emits FAQ schema, so there is neither repeated FAQ filler nor a visible/schema mismatch.

## Neighboring-page cannibalization review

| Overlap family | Page ownership boundary | Result |
|---|---|---|
| FOMC / U.S. data / macro triggers | FOMC owns the contamination-aware meeting-window study; U.S. data owns release-package transmission; macro triggers owns cross-event intake and temporary priority. | Distinct intent and output; PASS. |
| SNB decisions / SNB intervention | The decision page owns scheduled package-versus-prior interpretation; the intervention page owns institutional tools, delayed evidence, and identification limits. | No duplicate SNB explainer; PASS. |
| Global shocks / CHF haven / CHF versus JPY | Global shocks owns taxonomy and funding-state mapping; CHF haven owns the franc-specific mechanism and offsets; CHF-versus-JPY owns normalized cross-instrument leadership tests. | Clear specialist boundaries and cross-links; PASS. |
| Best time / Europe-U.S. handover / London fix | Best time owns full-session market-quality comparison; handover owns the DST-aware execution branch; London fix owns the administrator-anchored benchmark study. | Clock language does not collapse the three intents; PASS. |
| Yield spreads / intraday yield tracking | Yield spreads owns curve choice, expected policy paths, carry, and basis; intraday tracking owns synchronized availability and lead-lag testing. | Mechanism and measurement are separated; PASS. |
| Liquidity labels / compression / mean reversion / low volatility | Liquidity labels owns reproducible tape classification; compression owns a breakout/false-break protocol; mean reversion owns a costed reversal candidate; low volatility owns distribution, state, and sizing vetoes. | No strategy-page cannibalization; PASS. |
| Spot comparison / contract specs / what moves | Spot comparison owns quote translation and venue choice; contract specs is the sole mechanics/arithmetic authority; what moves owns the daily multi-driver synthesis. | Reference and synthesis roles are explicit; PASS. |

## Publication identity, theme, mobile, and accessibility

- All **21/21** pages load exactly `/futures-basics/currency-research-library.css?v=20260820a` and retain the common `currency-library` / `fx-*` shell. There are **0** page-level `<style>` blocks and **0** alternate 6S stylesheets.
- The shared stylesheet uses the homepage-derived dark surface plus green accent variables (`--fx-paper: #030817`, `--fx-forest: #51e391`, `--fx-green-deep: #123326`) and explicitly labels the palette as one site-wide visual language.
- The correlation page has two inline `left` percentages solely to position illustrative markers; they introduce no color, typography, surface, or theme override and are not a CSS fork.
- All **21/21** pages have one main landmark, one H1, and a keyboard skip link. All **33/33** tables are inside focusable `fx-table-scroll` regions with accessible labels, allowing narrow-screen horizontal scrolling without forcing page overflow.
- Shared responsive rules collapse layouts at 1050, 780, and 520 pixels; visible focus uses contrasting light and green layers; the skip link appears on keyboard focus; and `prefers-reduced-motion` suppresses animation/transition behavior.

## Numbered findings

None.

## Release recommendation

Distinctiveness and publication-consistency gates are satisfied. This proofread does not require article changes and does not block the 6S release.

## Post-PASS integration confirmation

Rechecked after the correlations-page `<title>` changed from the HTML entity to literal UTF-8 `Don’t` and the search index was rebuilt. The HTML title and `search-index.json` now contain the same rendered text. The current cluster still passes with **21 unique component signatures, 0 audit errors, 0 audit warnings, 0 validator errors, and 0 validator warnings**; the combined theme/accessibility suite also remains **12/12 passing**. The encoding-only integration change does not alter this proofreader's PASS verdict.
