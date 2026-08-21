# 6N editorial distinctiveness and usefulness proofread

Review date: 2026-08-20
Reviewer: independent Proofreader 2
Frozen scope: the 20 core 6N article files enumerated in `scripts/validate_6n_cluster.py`
Initial verdict: **FAIL**

Final independent recheck verdict: **PASS**

The initial review failed closed on two real contrast defects and two visual-harness boundary defects. Root corrected all four without changing the article prose or editorial ownership. The independent recheck then passed the validator, sameness audit, expanded regression suite, fresh 40-case Edge run, and visual inspection. A later presentation-only migration moved the 6N pages onto the canonical site-wide currency-library namespace and homepage green/black stylesheet; the final static recheck below confirms that current release state. The publication earns a **PASS** for editorial distinctiveness, usefulness, namespace integrity, and desktop/mobile render behavior.

## Automated evidence

- `py scripts\validate_6n_cluster.py --warnings-as-errors` — **PASS**: `Checked 20 core 6N pages: 0 errors, 0 warnings.`
- `py scripts\audit_6n_distinctiveness.py` — **PASS**: `Audited 20 pages: 20 component signatures, 0 errors, 0 warnings.`
- `py -m unittest tests.test_6n_cluster_release tests.test_6n_css_accessibility tests.test_sync_6n_hubs tests.test_sync_6n_sitemap_dates` — **PASS**: 14 tests, 0 failures.
- Static current-file namespace check — **PASS**: all 20 pages contain exactly one `/futures-basics/currency-research-library.css?v=20260820a` link, one `main#main-content.currency-library` root, and `fx-*` component classes. Current production contains no lowercase legacy `nzd-*` namespace token and no `6n-research-library.css` reference. The canonical CSS contains a `.currency-library` root and 84 distinct `fx-*` selectors, with no legacy `nzd-*` selector or variable.
- The existing `artifacts/6n-visual-validation.json` records the current canonical build at 1440×900 and 390×844: 20 pages, 2 viewports, 40 cases, and 0 failures. Every record has HTTP 200, exactly one H1, exactly one main, one source-details block, the canonical stylesheet loaded, no page-level horizontal overflow, no local request failure, no bad local response, no console error, no page exception, and every table inside a labeled, keyboard-focusable scroll region.
- Fresh corrected-harness result — **PASS**: `Checked 40 render cases across 20 pages: 0 failures.` Representative updated desktop and mobile captures were inspected after the run; dark decision cards, ordinary links, tables, mobile stacking, focused skip links, and footer transitions render legibly without clipping or page-level overflow.

## Historical initial-fail findings (superseded snapshot)

The `nzd-*` selectors and `6n-research-library.css` path in this section identify the frozen pre-migration snapshot on which the initial failures were found. They are retained solely as historical evidence; they are not present in the current 6N production files.

### 1. Ordinary article links inherit a 1.30:1 neon-on-paper color

**Historical evidence (superseded):** `style.css:396-404` gave every anchor `#48ff9c`, then `#2cff80` plus a glow on hover. The former `futures-basics/6n-research-library.css:36-38` changed only underline offset, so ordinary source and cross-reading links retained that global neon color on the former library's `--nzd-paper: #fffefa` background. The computed contrast for `#48ff9c` against `#fffefa` was **1.2957:1**, far below WCAG AA's 4.5:1 threshold for normal text. The problem was plainly visible in desktop and mobile captures, including the crosslinks on `what-are-6n-futures.html`, `why-traders-use-6n-futures.html`, `6n-risk-sentiment-impact.html`, and `how-exports-drive-6n-trends.html`.

**Historical required fix:** in the former `futures-basics/6n-research-library.css`, explicitly set the default `.nzd-library a` color and hover/focus color to a dark cluster token and cancel the inherited glow. `var(--nzd-forest)` was 5.81:1 on paper; `var(--nzd-forest-dark)` was 9.86:1. Preserve the later hero/button-specific white and dark-on-peach rules. Add a regression assertion that the ordinary article-link foreground has at least 4.5:1 contrast on `--nzd-paper`, and that the cluster overrides the global hover glow.

**Current recheck:** **RESOLVED.** In `futures-basics/currency-research-library.css`, `.currency-library a` uses `var(--fx-forest)` with no shadow and hover uses `#7af2ad` with no shadow. The current contrast regression passes on the dark `--fx-paper: #030817` surface, hero/button-specific rules still override correctly, and the 40-case manifest remains clean.

### 2. Four shared metric-card families fall below 3:1 on light sections

**Historical evidence (superseded):** the former `futures-basics/6n-research-library.css:1021-1042` gave `.nzd-decision-strip`, `.nzd-cost-tape`, `.nzd-level-ledger`, and `.nzd-quote-board` cards `rgba(13, 35, 53, 0.5)` with 0.82–0.90 rem `#f6ebe7` and `#fff3ce` text. These components were not confined to the dark hero. On the former `--nzd-paper`, the translucent surface composited to approximately `#869098`, producing only **2.78:1** for the body copy and **2.94:1** for the label. The gray cards in the contract-spec margin section and the futures-versus-spot cost section visibly demonstrated the problem.

**Required fix:** use an opaque or sufficiently opaque dark component surface when these families sit in article sections, or define context-specific light-section cards with dark text. An opaque `#0d2335` surface yields more than 13.7:1 with both existing foregrounds. Add regression checks for both component foregrounds against the actual composited light-section background.

**Current recheck:** **RESOLVED.** The canonical `.fx-decision-strip`, `.fx-cost-tape`, `.fx-level-ledger`, and `.fx-quote-board` card families use the opaque `--fx-board-dark: #07111f` surface. The current contrast regression passes, and the affected desktop/mobile records remain free of render failures.

## Historical visual-harness findings (superseded snapshot)

### 3. The skip-link check samples during its 160 ms transition

**Historical evidence (superseded):** `scripts/visual_check_6n.js:89` focused `.nzd-skip-link` and immediately evaluated its bounding box. The former `futures-basics/6n-research-library.css:1831-1836` animated the transform for 160 ms. The generated screenshots showed the focused skip link fully visible, but the immediate metric captured its transitional off-screen box and recorded a failure on all 40 cases.

**Historical required fix:** wait for the focus transition before sampling, or disable the skip-link transition under `prefers-reduced-motion: reduce` (the harness already creates a reduced-motion context). Rerun all 40 cases. The latter also makes reduced-motion handling complete because the skip link sat outside `.nzd-library` and was not covered by the former scoped reduced-motion rule.

**Current recheck:** **RESOLVED.** Reduced-motion CSS now includes `.fx-skip-link`, the harness waits after focus, all 40 current manifest records report the focused link visible, and the updated captures show it fully on-screen.

### 4. An external UET tracking pixel is counted as a broken content image

**Historical evidence (superseded):** every record's only `brokenImages` entry was a runtime-injected `https://bat.bing.com/action/...` URL. There were zero failed local assets and zero bad local responses. The former `scripts/visual_check_6n.js:116-119` logic counted every image with zero natural width, even though the rest of the harness deliberately limited request failures and HTTP failures to the local origin.

**Historical required fix:** apply the same local-origin boundary to the broken-image check, or classify third-party tracking requests separately from publication assets. Do not suppress failures for local article images. Rerun all 40 cases.

**Current recheck:** **RESOLVED.** The harness now limits broken content-image failures to local-origin assets while retaining separate local request and response checks. The current 40-case manifest contains no broken local image or failed local asset in any case.

## Editorial and anti-cannibalization review

No blocking editorial issue was found.

- All 20 titles, hero ledes, and non-generic H2 sequences are distinct. The automated audit found no repeated substantive paragraph, hero lede, disclosure sentence, 18-word disclosure shingle, normalized H2, overused kicker, or overused ending sequence.
- Pairwise lexical overlap is very low. The highest 8-word Jaccard overlap is 0.0036 (`6n-interest-rate-impact.html` versus `6n-risk-sentiment-impact.html`), well below the 0.12 failure threshold.
- The most structurally similar candidates remain editorially separate on manual inspection:
  - `6n-risk-sentiment-impact.html` explains funding/portfolio/external-demand mechanisms and ends in a regime record; `how-exports-drive-6n-trends.html` decomposes official external-sector measurements, transmission lags, and rival drivers and ends in an evidence ladder.
  - `6n-contract-specs-explained.html` owns verified exchange mechanics and reconciliation; `m6n-micro-contract-guide.html` corrects an unsupported product premise, tests integer risk fit, and permits zero as the only valid size.
  - `what-are-6n-futures.html` is a beginner lifecycle/readiness orientation; `why-traders-use-6n-futures.html` is a futures-versus-retail-spot venue decision.
  - `6n-liquidity-guide.html` owns executable market-quality measurement; `6n-volatility-patterns.html` owns distributions, state definitions, and transition uncertainty.
  - `6n-correlations.html` owns synchronized conditional co-movement tests; `6n-risk-sentiment-impact.html` links to it rather than claiming a measured beta.
- Openings range from arithmetic reconciliation and missing-product evidence to contradictory windows, conflicting charts, event clocks, corporate exposure, and venue comparisons. Ending forms include acceptance records, state matrices, evidence ladders, pre/post checklists, hedge reconciliations, no-trade decisions, monitoring specifications, and readiness gates.
- Component sequences and all 20 component-count signatures are unique. Tables, process counts, cards, calculators, state machines, causal maps, and ending components are not used as noun-swapped templates.
- Risk language is conditional and fail-closed. No page converts an unrun study into a result, margin into maximum loss, a stop into a guaranteed fill, or a mechanism into a deterministic 6N direction.
- Source disclosures consistently expose the August 20, 2026 review boundary while varying the page-specific method and non-finding statement. No blanket FAQ boilerplate was added; FAQ and FAQ schema are absent together.

## Final decision

### Post-PASS exports-hero presentation recheck

The scoped `.fx-formula--sequence` refinement on `how-exports-drive-6n-trends.html` was independently checked against the current files after the original PASS. The validator still reports **20 pages, 0 errors, 0 warnings**; the distinctiveness audit still reports **20 unique component signatures, 0 errors, 0 warnings**; and the current headless Edge manifest reports **40 desktop/mobile cases, 0 failures**. Direct inspection at 1440×900 and 390×844 confirms that the evidence sequence reads vertically with centered downward arrows, comfortable line wrapping, no overlap or clipping, and a legible hierarchy at both widths. Its descriptive `aria-label` remains present.

### Canonical shared-theme final recheck

The current 6N release is consistently green and black in the same visual language as the homepage: `--fx-paper: #030817`, `--fx-surface: #091423`, and `--fx-forest: #51e391`. All 20 current article files use the canonical shared stylesheet and `currency-library`/`fx-*` namespace. No current production file or canonical selector retains the former lowercase `nzd-*` namespace; occurrences above are intentionally preserved historical evidence only.

**PASS.** No meaningful editorial-distinctiveness, usefulness, accessibility, namespace, shared-theme, or desktop/mobile render issue remains in the frozen 20-page 6N publication scope. The initial defects are fixed, their regression coverage is active, and the final current-file recheck is clean.
