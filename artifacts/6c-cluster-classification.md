# Core 6C article classification and writing map

Date: 2026-08-13
Scope: the 20 existing core Canadian Dollar futures URLs listed below. The Futures Basics and Currencies hubs, search index, sitemap, shared stylesheet, and validation code are root-owned synchronization work, not extra article assignments.

## Why 6C is the current target

- Modern full-library rebuilds already exist for 6J, 6E, 6A, and 6B.
- The most recent completed rebuild is 6B, merged in repository PR 29.
- The site's established currency-hub order places 6C immediately after 6B.
- All 20 pages below were introduced together by the original 6C cluster commit. Seventeen currently have Currencies-hub cards; `best-time-to-trade-6c.html`, `what-is-6c-futures.html`, and `why-6c-moves.html` remain indexed Futures Basics articles and are part of the same core library rather than isolated instrument-code pages.
- 6M, 6N, 6S, and 6Z appear later in the site's actual inventory and therefore are outside this project.

## Cluster editorial model

- One publisher: Kyle Parrott / Grizzly Parrot Trading.
- One evidence standard: current primary sources; facts, mechanisms, empirical observations, hypotheses, inferences, and trading applications remain visibly distinct.
- One contract-mechanics authority: `6c-tick-size-tick-value.html`. It will own verified standard and Micro contract specifications, quotation, arithmetic, listed months, termination, delivery, trading-hours context, roll risk, and the limits of margin figures.
- `6c-margin-and-position-sizing.html` owns risk-budget and sizing workflow. It may explain variable exchange/broker margin, but it must link to the canonical specification page rather than repeat its full contract table.
- No unrun study becomes a finding. Empirical pages disclose their measurement design and explicitly state when they report no original result.
- No deterministic trade language. A setup is a decision or testing framework with invalidation, execution friction, and failure conditions.
- Architecture follows search intent. FAQ sections and FAQ schema are optional and must appear together; neither is a cluster-wide template requirement.
- Production URLs remain unchanged.

## Writer 1: research and measurement

| URL file | Archetype | Exclusive reader purpose | Planned architecture and opening | Planned ending |
|---|---|---|---|---|
| `6c-best-trading-sessions.html` | Empirical / testing | Measure how spreads, depth, volume, range, and slippage vary across declared clock windows; it does not choose a trader's personal execution window. | Open with the daylight-saving and overlapping-calendar problem; clock definition -> dataset and contract roll -> liquidity metrics -> event/holiday controls -> regime splits -> interpretation limits. | Reproducible session-study protocol with no claimed result. |
| `6c-correlation-risk-on-risk-off.html` | Empirical / testing + macro hybrid | Define risk sentiment and test conditional co-movement instead of assigning CAD a permanent risk-on label. | Open with two superficially similar risk-off episodes that can produce different CAD outcomes; define factors -> align returns -> control USD, oil, rates, and event timing -> rolling/regime tests -> alternative explanations. | Falsification and monitoring checklist for a conditional relationship. |
| `6c-oil-correlation.html` | Empirical / testing + mechanism hybrid | Separate Canada's oil-linked transmission mechanisms from a claimed short-horizon CAD-crude trading signal. | Open with a CAD and crude screen disagreement; economic channels -> competing forces -> contract/data alignment -> lag and regime hypotheses -> testing design -> interpretation. | Evidence ladder from structural fact to unvalidated trading application. |
| `6c-orderflow-behavior.html` | Empirical / testing + execution hybrid | Explain what CME futures order-flow data can observe, what it misses in global FX, and how to test auction hypotheses. | Open with the difference between a 6C footprint and the OTC currency market; data prerequisites -> observable variables -> level-first hypotheses -> replay design -> confounds -> execution limits. | Data-quality gate and post-event review record. |
| `6c-technical-indicators-that-work.html` | Empirical / testing + comparison | Replace a universal best-indicator list with a benchmarked selection and validation framework. | Open with the selection-bias problem; decision task -> operational definitions -> baseline -> walk-forward design -> costs and multiple testing -> robustness -> rejection rules. | Indicator acceptance card that permits the answer "none." |
| `6c-volatility-cycles.html` | Empirical / testing | Define and test volatility states and transitions without pretending a descriptive state is a predictable cycle. | Open with the contradiction between a cycle and an unknown turning point; state definition -> estimator choices -> transition/duration sample -> censoring and roll controls -> validation -> use limits. | State-classification protocol and transition falsification criteria. |
| `6c-volatility-patterns.html` | Empirical / testing | Test declared compression/expansion events and their later range, direction, and execution-cost distributions. | Open with a realized-range calculation; event label -> baseline and horizon -> sample construction -> event/session/roll controls -> robustness -> trading interpretation. | Three-column evidence summary: measured fact, open hypothesis, prohibited inference. |

## Writer 2: mechanisms and macro explanation

| URL file | Archetype | Exclusive reader purpose | Planned architecture and opening | Planned ending |
|---|---|---|---|---|
| `6c-bank-of-canada-impact.html` | Macro / mechanism + event workflow | Explain how the Bank of Canada's complete decision package and its difference from market expectations can reprice 6C. | Open with an unchanged-rate decision that still moves CAD; prior -> statement/report/speech evidence -> Canadian-rate channel -> BoC-versus-Fed channel -> competing forces -> observable confirmation. | Conditional surprise matrix, not a directional rule. |
| `6c-fundamental-analysis-guide.html` | Macro / mechanism + decision workflow | Provide the canonical recurring workflow for integrating policy, growth, inflation, labor, trade, oil, and global USD evidence. | Open with a mixed-evidence weekly scenario; build the prior -> update the evidence ledger -> map relative rates and terms of trade -> form branches -> define invalidation -> review. | Reusable weekly decision worksheet. |
| `6c-us-economic-data-impact.html` | Macro / mechanism + event workflow | Trace U.S. releases through Fed expectations, the USD denominator, North American demand, and cross-border trade without assuming one reaction. | Open with a strong U.S. report that can help or hurt CAD through different channels; release surprise -> rate/USD channel -> Canada-demand channel -> market prior -> timeline -> failure cases. | Release-reading sequence keyed to observable confirmation. |
| `6c-vs-6e-vs-6j.html` | Comparison / decision guide + macro hybrid | Compare contract mechanics, quotation, macro exposure, liquidity context, and analytical use across CAD, EUR, and JPY futures. | Open with three contracts responding differently to the same U.S. shock; apparent similarity -> contract and quote differences -> policy/growth/commodity channels -> decision criteria -> when comparison fails. | Fit matrix for choosing a comparison, never an "easiest contract" ranking. |
| `why-6c-moves.html` | Macro / mechanism | Give a beginner-facing causal map of 6C price formation and route detail to specialized pages. | Open with the quotation fact that a higher 6C price means a stronger Canadian dollar versus the U.S. dollar; relative rates -> USD -> Canadian data/trade -> oil/terms of trade -> risk/liquidity -> competing forces. | Mechanism map with canonical links and explicit uncertainty boundary. |

## Writer 3: practical systems and decisions

| URL file | Archetype | Exclusive reader purpose | Planned architecture and opening | Planned ending |
|---|---|---|---|---|
| `6c-breakout-behavior.html` | Execution / decision workflow + empirical hybrid | Turn breakout folklore into a predeclared candidate, confirmation, invalidation, sizing, and review process. | Open with a level breach that fails the market-quality gate; decision problem -> level provenance -> trigger -> acceptance/failure branches -> execution costs -> review sample. | Pass, wait, or reject decision tree. |
| `6c-margin-and-position-sizing.html` | Reference / calculation + execution workflow | Size positions from a loss budget and invalidation distance while keeping margin separate from risk. | Open with the exact dollars-at-risk equation; verified tick input -> stop/invalidation -> integer contract count -> gap/slippage stress -> margin and broker constraints -> review. | Pre-order sizing checklist and worked reconciliation. |
| `6c-scalping-guide.html` | Execution / decision workflow | Decide whether current 6C market quality can support a short-horizon plan after costs; it does not promise named setups work. | Open with a spread/slippage calculation that consumes the planned target; required data -> market-quality gate -> setup definition -> order and invalidation branches -> event exclusions -> replay. | Go/no-go card plus post-trade cost record. |
| `6c-support-resistance-levels.html` | Execution / decision workflow + empirical hybrid | Define level provenance and test reaction behavior; breakout handling remains on the breakout page. | Open with two charts drawing different levels; objective level sources -> tolerance bands -> pre-touch conditions -> reaction labels -> validation sample -> failure cases. | Level-quality scorecard and link to breakout workflow. |
| `6c-swing-trading-strategy.html` | Execution / decision workflow + macro hybrid | Build a multi-session planning process that connects a macro thesis to dated-contract chart structure and explicit invalidation. | Open with a thesis that is plausible but not yet tradable; thesis -> catalyst calendar -> contract/roll choice -> entry branches -> sizing -> overnight/event risk -> review. | Swing-plan worksheet with falsification field. |
| `6c-tick-size-tick-value.html` | Reference / specification | Serve as the canonical current guide to 6C and Micro 6C mechanics, P&L math, expiry/delivery, trading hours, roll, and margin limitations. | Open with contract unit multiplied by minimum increment; verified specification card -> worked P&L and notional examples -> standard/micro comparison -> listed months -> termination/delivery -> operational implications. | Pre-order verification checklist and calculation summary. |
| `best-time-to-trade-6c.html` | Execution / decision guide | Help a reader choose a trading window based on liquidity, event risk, strategy horizon, and personal constraints; it does not report universal session findings. | Open with an execution choice between a quiet clock window and a scheduled release; required inputs -> branches by task -> event and DST checks -> market-quality thresholds -> stand-aside conditions. | Personal window-selection matrix linked to the session study. |
| `what-is-6c-futures.html` | Reference / definition | Explain what the instrument is, what a long/short quote means, why dated futures exist, and who uses them without duplicating the full spec guide. | Open with the quote-direction definition; instrument identity -> futures lifecycle -> participants/uses -> standard versus micro orientation -> basis and leverage risks -> where to verify mechanics. | Beginner readiness checklist and canonical-spec link. |

## Cross-page ownership and anti-cannibalization rules

- `6c-tick-size-tick-value.html` is the sole canonical specification page. `what-is-6c-futures.html` owns orientation; `6c-margin-and-position-sizing.html` owns risk-budget math.
- `why-6c-moves.html` is the concise beginner mechanism map. `6c-fundamental-analysis-guide.html` owns the recurring evidence-integration workflow. Event and oil pages own depth on their named channels.
- `6c-best-trading-sessions.html` owns an empirical time-of-day study protocol. `best-time-to-trade-6c.html` owns the reader-specific execution-window decision.
- `6c-volatility-cycles.html` owns state definitions and transitions. `6c-volatility-patterns.html` owns declared compression/expansion event tests.
- `6c-support-resistance-levels.html` owns level provenance and reaction labels. `6c-breakout-behavior.html` owns breach, acceptance, failure, and execution branches.
- `6c-orderflow-behavior.html` owns observable CME trade/quote evidence and global-FX limitations. `6c-scalping-guide.html` owns the complete short-horizon market-quality and cost decision.
- `6c-oil-correlation.html` owns the oil-CAD mechanism plus its empirical test. The broad driver pages summarize and link instead of reproducing it.
- `6c-correlation-risk-on-risk-off.html` owns conditional cross-asset measurement. `6c-vs-6e-vs-6j.html` owns instrument comparison and selection criteria.
- `6c-technical-indicators-that-work.html` owns indicator validation. Other execution pages may name an input only when operationally necessary and must not present it as a proven edge.
- `6c-swing-trading-strategy.html` owns multi-session plan construction. Intraday/scalping and breakout pages own their shorter-horizon workflows.

## Shared release gates

1. Every primary claim has a primary source or is explicitly labeled as mechanism, hypothesis, or inference.
2. Current CME specifications and calculations agree across all 20 pages.
3. Metadata and Article/Breadcrumb schema agree with visible content; FAQ schema exists only with matching visible FAQs.
4. Sources use descriptive link text, secure authoritative URLs, and an explicit review date.
5. Navigation is keyboard usable, tables have semantic headers and scroll regions, and headings remain hierarchical.
6. The 20 H2 sequences, openers, endings, table shapes, card/process counts, and repeated phrases pass a cluster-level sameness audit.
7. Hubs, search index, sitemap, and internal links are rebuilt only after article content stabilizes.
