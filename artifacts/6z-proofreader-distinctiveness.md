# Independent distinctiveness proofread: core 6Z library

Review date: 2026-08-25

Reviewer role: independent Proofreader 2; no 6Z article, hub, sitemap, search file, script, or test was authored or edited during this review
Scope: the 20-page 6Z cluster enumerated in `scripts/validate_6z_cluster.py` and mapped in `artifacts/6z-cluster-classification.md`

## Fail-closed verdict

**PASS — 0 unresolved findings, 0 audit errors, and 0 audit warnings.**

The cluster reads as one Grizzly Parrot Trading publication while every page retains a distinct reader question, opening problem, H2 sequence, evidence architecture, table/component profile, worked example, decision output, and ending. The only material sameness found during review was duplicated risk-disclosure language on six empirical pages. Those six disclosures were rewritten with page-specific language, the complete affected set was reread, and the audit now passes with no residual sentence or 18-word disclosure overlap.

## Review method

1. Read `artifacts/6z-cluster-classification.md` in full, including page ownership, anti-cannibalization boundaries, publication dates, and release gates.
2. Read the complete visible article body, title, metadata context, source disclosure, disclaimer, and HTML structure of all 20 target pages.
3. Compared openings, hero rhetoric, H2 sequences, component order, table shapes, panel/card/process counts, examples, FAQs, endings, phrase reuse, pacing, reader purpose, internal routing, and publication cohesion.
4. Tested the highest-risk ownership families independently: market quality and execution; volatility, sizing, and lifecycle; SARB institution and SARB events; daily macro synthesis and specialist mechanisms; research protocols; orientation/specification; behavior and incident prevention; structural comparison and three-instrument selection.
5. Read `scripts/audit_6z_distinctiveness.py` in full, ran it before and after the disclosure correction, and inspected the current `artifacts/6z-distinctiveness-report.json`.

## Current automated evidence

- Fresh command result from `python scripts\audit_6z_distinctiveness.py`: **20 pages, 20 unique component-count signatures, 0 errors, 0 warnings**.
- The current JSON report agrees: **page_count 20, unique_component_signatures 20, errors 0, warnings 0**.
- No exact substantive paragraph, hero lede, non-generic normalized H2, disclosure sentence, or 18-word disclosure shingle is shared across pages.
- No kicker is reused on four or more pages, and no ending sequence is reused on five or more pages. In fact, all **20 ending-component sequences are unique**.
- Highest pairwise values remain below every gate:
  - H2-sequence similarity: **0.1026** (`6z-liquidity-map.html` versus `6z-margin-requirements.html`) against the 0.82 warning gate.
  - Eight-word lexical Jaccard overlap: **0.0049** (`6z-algorithmic-behavior.html` versus `6z-liquidity-map.html`) against the 0.12 error gate.
  - Meta-description similarity: **0.5871** (`fundamental-drivers-of-6z.html` versus `what-are-6z-futures.html`) against the 0.84 warning gate.
  - Structural-sequence similarity: **0.7619** (`6z-seasonal-patterns.html` versus `best-times-to-trade-6z-futures.html`) against the 0.80 error gate.
- The 20 bodies total approximately **25,959 words** and range from **1,191 to 1,638 words**. H2 counts range from **5 to 8** and table counts from **0 to 4**. Panel counts range from **3 to 11** and card-like counts from **4 to 14**.
- Only `how-sarb-influences-6z.html` and `why-6z-trades-differently.html` use an `fx-process`, each with four steps. They share the same four-component opening shell, but their hero problems, H2 sequences, process content, remaining component sequences, examples, and decisions are different. This is publication-system reuse, not editorial duplication.
- No page contains a visible `fx-faq` block. Because the classification map does not assign a FAQ purpose, the absence is cohesive and creates no repeated FAQ filler.

## Opening, pacing, components, and endings

- The openings are question-specific. They begin with different contradictions: anonymous book activity versus actor identity; a price level changing market meaning; conflicting margin numbers; a zero-contract sizing boundary; a seductive calendar mean; direct tick arithmetic; an unexecutable stop; a disguised rule breach; equal ATR with unequal execution risk; superficially similar currency futures; correlated indicators; a DST-shifting clock bin; a multi-control incident; a multi-cause daily move; a no-change SARB day; an undefined “dollar up” claim; consensus rate with non-consensus package; reciprocal quote translation; a stop fill beyond trigger; and equal returns with unequal market quality.
- All H2 sequences are unique and follow the assigned purpose. Research pages move through definitions, data, controls, validation, and rejection. Macro pages move through official mechanism, competing channels, corroboration, and attribution limits. Practical pages move through inputs, hard gates, branches, and review.
- Table shapes are not a repeated template. The library includes specification tables, cost and risk worksheets, state matrices, evidence ladders, event records, comparison matrices, and incident-control tables. `sarb-rates-impact-6z.html` deliberately uses no table and instead relies on event cards, reaction paths, and a journal.
- Worked material is purpose-built: replenishment identification, a liquidity-map cell, margin/gap arithmetic, a floor-function sizing case, month-end testing, two-method P&L reconciliation, live-management branches, behavioral-control testing, continuous-versus-jump state, Fed-driven instrument selection, walk-forward momentum, order-size-specific clock bins, incident reconstruction, competing inflation paths, publication-specific SARB attribution, three dollar clocks, two expectation-relative SARB packages, futures-versus-spot translation, stop-fill shortfall, and a matched-major comparison.
- Pacing is cohesive without becoming mechanical. The longer canonical mechanics and slippage pages carry the broadest operational reference burden; the shorter decision pages still contain complete inputs, controls, and outputs.
- Every page closes with a topic-specific decision, boundary, ledger, readiness check, or research-status statement before the common sources-and-risk shell. The shared source-review date and educational framing create publication identity; the substantive endings remain unique.

## Anti-cannibalization review

| Overlap family | Ownership boundary verified | Verdict |
|---|---|---|
| Algorithmic behavior / liquidity map / slippage | Actor-identification limits and event hypotheses; descriptive quoted/traded/experienced liquidity mapping; realized order-path cost diagnosis. | PASS |
| Volatility / position sizing / trade management | State measurement; risk-budget-to-whole-contract arithmetic; live position lifecycle and branches. | PASS |
| Best time / seasonality / indicators | Intraday market-quality bins; calendar-horizon effects; signal-family comparison against baselines. | PASS |
| SARB institution / SARB rate decision | Institutional mandate, tools, implementation, and publication evidence; scheduled package-versus-prior interpretation. | PASS |
| Fundamental drivers / U.S. dollar / SARB specialists | Daily multi-driver synthesis routes to narrower dollar, institutional, and event mechanisms rather than duplicating them. | PASS |
| Why 6Z differs / 6Z versus 6E versus 6J | State-dependent structural explanation; three-contract operational selection and normalization. | PASS |
| Contract mechanics / orientation / margin / sizing | One mechanics authority; beginner identity and lifecycle; collateral workflow; risk-based quantity. | PASS |
| Psychology / common mistakes / management | Behavioral permissions and interruption; incident prevention and containment; trade-state execution branches. | PASS |

## Page-by-page verdicts

| Page | Distinct reader output and shape | Verdict |
|---|---|---|
| `6z-algorithmic-behavior.html` | Identification boundary, sequenced-event design, rival explanations, spoofing limit, and falsification log. Two measurement tables; distinct replenishment protocol. Disclosure reread after correction. | PASS |
| `6z-liquidity-map.html` | Quoted/traded/experienced layers, normalization, regime map, order gate, and stale-map rejection. One four-column map table. Disclosure reread after correction. | PASS |
| `6z-margin-requirements.html` | Exchange/broker/trade-risk separation, variation, gap stress, cash buffer, worksheet, and rejection conditions. Three differently sized three-column tables. | PASS |
| `6z-position-sizing.html` | Floor-function sizing, zero-contract boundary, execution/gap estimation, stress overlays, portfolio cap, and estimate review. Four tables plus formula-led opening. | PASS |
| `6z-seasonal-patterns.html` | Calendar definition, point-in-time sample, rival regime exposure, multiplicity, untouched holdout, and abandonment. Distinct month-end protocol. Disclosure reread after correction. | PASS |
| `6z-tick-size-and-value.html` | Sole specification and arithmetic authority, quote orientation, dual P&L reconciliation, hours, delivery, Micro-status boundary, and pre-order gate. Longest reference architecture. | PASS |
| `6z-trade-management-guide.html` | Preflight, explicit position states, event override, stop process, target/time branches, exit evidence, and after-action review. Four lifecycle tables. | PASS |
| `6z-trading-psychology.html` | State-versus-story separation, permission design, environment controls, interruption ladder, recovery, and behavioral audit. Does not duplicate incident reconstruction. | PASS |
| `6z-volatility-profile.html` | Distribution, jump concentration, book stress, event labels, state card, and sizing handoff. Continuous-versus-jump worked example. Disclosure reread after correction. | PASS |
| `6z-vs-6e-vs-6j-differences.html` | Quote translation, contract normalization, scenario matrix, selection gate, ranking failures, and Fed-case selection. Three-instrument purpose remains separate from structural 6Z explanation. | PASS |
| `best-indicators-for-6z.html` | Objective definition, point-in-time inputs, simple baselines, registered candidate matrix, leakage controls, and retirement. Walk-forward momentum example. Disclosure reread after correction. | PASS |
| `best-times-to-trade-6z-futures.html` | UTC/DST reconstruction, fixed bins, order-specific market quality, event/holiday/roll exclusions, go/reduce/wait/reject, and fill review. Disclosure reread after correction. | PASS |
| `common-6z-trading-mistakes.html` | Multi-cause incident reconstruction, ten-row control matrix, prevention hierarchy, detection, containment, and closure test. Strongest failure-analysis architecture in the cluster. | PASS |
| `fundamental-drivers-of-6z.html` | Canonical daily synthesis: quote sign, six driver families, evidence ladder, conflict resolution, state card, and competing inflation paths. Specialist links prevent mechanism sprawl. | PASS |
| `how-sarb-influences-6z.html` | Mandate, policy/implementation/reserve/stability layers, conditional channels, attribution sequence, rivals, and publication selection. Institutional scope remains distinct from the meeting page. | PASS |
| `how-us-dollar-moves-6z.html` | Bilateral-versus-broad measurement, four dollar channels, required evidence, divergence diagnosis, decision boundary, and three time horizons. | PASS |
| `sarb-rates-impact-6z.html` | Frozen prior, full decision package, relative curves/carry, competing forces, confirmation sequence, failure modes, and contemporaneous event journal. Card-led, table-free structure. | PASS |
| `what-are-6z-futures.html` | Beginner orientation, users, futures-versus-spot distinction, lifecycle, fit matrix, risk families, and readiness path. Routes details to canonical mechanics. | PASS |
| `why-6z-slippage-hits-harder.html` | Decision-to-fill chain, cost decomposition, order-level replay, order branches, event/roll regimes, stop-trading gate, and execution ledger. Distinct realized-cost authority. | PASS |
| `why-6z-trades-differently.html` | Structural mechanisms, state dependence, matched-major test, live execution consequence, convergence conditions, research blueprint, and practical boundary. | PASS |

## Material finding and resolution

### 1. Resolved — repeated empirical-page disclaimer language

The first audit failed with four errors. The exact sentence `Futures are leveraged and losses can exceed opening margin.` appeared in:

- `6z-algorithmic-behavior.html`
- `6z-liquidity-map.html`
- `6z-seasonal-patterns.html`
- `6z-volatility-profile.html`
- `best-indicators-for-6z.html`
- `best-times-to-trade-6z-futures.html`

`6z-seasonal-patterns.html` and `best-indicators-for-6z.html` also shared `This material is educational, not personalized investment or execution advice.`, which produced two repeated 18-word disclosure shingles.

Required edit: replace the repeated wording with topic-specific educational and leverage-risk language while retaining the substantive warning. This was completed across all six pages. The revised paragraphs separately address actor inference, disappearing liquidity, calendar failure, model lag, backtest failure, and clock-window deterioration. A fresh audit now reports **0 errors and 0 warnings**, and the current JSON contains no duplicated disclosure sentences or 18-word disclosure shingles.

## Release recommendation

The distinctiveness and publication-cohesion gate is satisfied. No unresolved editorial warning, purpose collision, copied example, repeated FAQ, duplicated substantive passage, or structural sameness issue remains. This proofreader does not block the 6Z release.
