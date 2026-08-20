# Core 6M article classification and writing map

Date: 2026-08-13

Scope: the 20 existing core Mexican Peso futures URLs listed below. Production URLs remain unchanged. The Futures Basics and Currencies hubs, search index, sitemap, necessary related-reading links, one 6M stylesheet, 6M validation/audit code, tests, and release artifacts are root-owned synchronization work rather than extra article assignments.

## Why 6M is the current target

- The Currencies hub's established instrument order is 6A, 6B, 6C, 6E, 6J, 6M, 6N, and 6S before later isolated instrument comparisons.
- Full modern library rebuilds already exist for 6A, 6B, 6C, 6E, and 6J. The most recently rebuilt cluster is 6C, merged to `main` in repository PR 30.
- Skipping those modern clusters makes 6M the first stale full library in the actual hub order.
- Fifteen 6M URLs are on the Currencies hub. Five additional URLs are established currency-category cards on the Futures Basics hub and are independently present in search and the sitemap: `banxico-influence-6m.html`, `banxico-rate-policy-6m.html`, `usd-strength-6m.html`, `what-are-6m-futures.html`, and `why-6m-trades-differently.html`. They are part of the same core library, not isolated code matches.
- 6N, 6S, 6Z, and unrelated futures, books, tools, affiliates, or site sections are outside this project.

## Cluster editorial model

- One publication and author identity: Grizzly Parrot Trading / Kyle Parrott.
- One evidence standard: current primary sources where authoritative sources exist; established fact, mechanism, empirical observation, hypothesis, inference, and trading application remain visibly distinct.
- One contract-mechanics authority: `6m-tick-size.html`. It owns verified contract unit, quotation, minimum increment, P&L arithmetic, listed months, trading hours, termination, delivery, roll risk, margin limitations, and any verified Micro product distinction.
- `what-are-6m-futures.html` owns beginner orientation. `6m-margin-requirements.html` owns performance-bond limits and risk-budget sizing. Both link to the canonical specifications instead of repeating its full mechanics block.
- No unrun study becomes a finding. Empirical pages publish protocols, definitions, and falsification criteria and explicitly disclose when no original results are reported.
- No deterministic trade language. Mechanisms are conditional, and execution pages use inputs, gates, branches, invalidation, costs, and review rather than profit promises.
- Architecture follows the question. Openings, H2 sequences, evidence components, pacing, and endings vary by subject. FAQ sections and FAQ schema are optional and must appear together.

## Writer 1: research and measurement

| URL file | Archetype | Exclusive reader purpose | Planned architecture and opening | Planned ending |
|---|---|---|---|---|
| `6m-backtesting.html` | Empirical / testing | Design a reproducible 6M test with dated-contract or continuous-series construction, execution costs, regimes, event controls, and bias prevention; it reports no unperformed result. | Open with two continuous 6M series that disagree at a roll; research question -> data lineage -> roll and clock choices -> rule specification -> costs -> validation -> robustness. | Reproducibility record and fail-closed acceptance criteria. |
| `6m-best-indicators.html` | Empirical / testing + comparison | Turn the word "best" into a benchmarked accept-or-reject comparison for a declared decision task. | Open with the selection-bias problem; task -> candidate definitions -> naive baseline -> walk-forward splits -> costs and multiple testing -> regime stability -> rejection rules. | Indicator decision card that permits "none beat the baseline." |
| `6m-best-times.html` | Empirical / testing | Measure volume, depth, spread, slippage, range, and event concentration across DST-safe clock windows; it does not declare universally profitable hours. | Open with the same instant labeled differently in Mexico City, Chicago, and UTC; clock map -> sample -> metrics -> event/holiday controls -> contract rolls -> robustness. | Reproducible session-study protocol, not a session ranking. |
| `6m-data-traps.html` | Reference / data-quality + empirical | Diagnose provenance, quote direction, missing trades/quotes, timestamps, rolls, settlement, and synthetic-series errors before any analysis. | Open with two vendors producing different daily candles; evidence ladder -> field audit -> time and roll checks -> liquidity-data limits -> quarantine rules. | Dataset acceptance checklist with failed/secondary/experimental outcomes. |
| `6m-seasonality.html` | Empirical / testing | Test calendar effects without converting a small historical pattern into a forecast. | Open with the multiple-comparisons problem created by twelve months and many horizons; hypothesis registry -> sample -> return construction -> controls -> uncertainty -> out-of-sample and stability tests. | Falsification matrix and explicit no-original-findings boundary. |
| `6m-volatility-profile.html` | Empirical / testing | Define and measure volatility distributions and regimes without implying direction or fixed "typical" ranges. | Open with the contradiction between one average and a heavy-tailed distribution; estimator choices -> session/event decomposition -> roll controls -> state classification -> transition uncertainty. | Monitoring specification that separates description from prediction. |

## Writer 2: mechanisms and macro explanation

| URL file | Archetype | Exclusive reader purpose | Planned architecture and opening | Planned ending |
|---|---|---|---|---|
| `6m-carry-trade.html` | Macro / mechanism | Explain rate differential, funding, hedging, crowding, volatility, and unwind channels without a fixed 6M direction rule. | Open with positive carry coexisting with an MXN selloff; position economics -> prerequisites -> flow channels -> competing forces -> observable confirmation -> unwind failure cases. | Conditional carry-state matrix. |
| `6m-fundamental-drivers.html` | Macro / mechanism + decision workflow | Serve as the canonical broad map for Banxico-Fed expectations, growth/inflation, trade, fiscal/political risk, global risk, and positioning. | Open with a mixed-evidence weekly scenario; establish prior -> rank evidence -> trace competing channels -> build branches -> define confirmation and invalidation. | Reusable driver ledger that routes depth to specialist pages. |
| `6m-trade-and-remittances.html` | Macro / mechanism | Explain balance-of-payments, invoicing, timing, hedging, and remittance channels specifically; it does not duplicate the broad driver map. | Open with the misconception that a large annual flow mechanically creates a same-day futures signal; measurement fact -> currency-conversion channels -> lags and offsets -> observable data -> failure cases. | Evidence ladder from official flow data to unvalidated trading application. |
| `banxico-influence-6m.html` | Macro / mechanism + institutional reference | Explain Banxico's mandate, communication, reserves, FX facilities, coordination, and wider toolkit beyond the target-rate decision. | Open with a peso move on a day without a rate change; institutional authority -> toolkit -> transmission -> evidence sources -> constraints and competing forces. | Source-first institutional monitoring map. |
| `banxico-rate-policy-6m.html` | Macro / mechanism + event workflow | Read a policy decision through the prior, complete announcement package, Mexico's rate curve, Banxico-Fed differential, and conditional reaction paths. | Open with an unchanged-rate decision that can still surprise; prior -> decision package -> curve repricing -> FX channels -> reaction timeline -> failure cases. | Scenario matrix keyed to observable confirmation. |
| `usd-strength-6m.html` | Comparison / mechanism + empirical boundary | Separate the inverse quotation identity from a genuine common-dollar factor and show how to test non-circular confirmation. | Open with the two-screen discrepancy between 6M and a broad USD index; quote algebra -> basket composition -> shared shocks -> orthogonal controls -> lag/test design -> breakdown cases. | Confirmation checklist that rejects circular signals. |

## Writer 3: practical systems and decisions

| URL file | Archetype | Exclusive reader purpose | Planned architecture and opening | Planned ending |
|---|---|---|---|---|
| `6m-tick-size.html` | Reference / specification | Serve as the canonical current 6M contract guide and arithmetic authority. | Open with contract unit multiplied by minimum increment; verified specification card -> quote and P&L examples -> notional exposure -> standard/Micro distinction if verified -> listed months -> hours -> termination/delivery -> roll and margin limits. | Pre-order verification checklist and reconciled formulas. |
| `what-are-6m-futures.html` | Reference / definition | Explain what the instrument represents, quote direction, dated futures lifecycle, uses, and core risks without duplicating the specification guide. | Open with the quote-direction definition; identity -> participants and uses -> lifecycle -> basis/leverage/delivery risk -> suitability questions -> canonical links. | Beginner readiness gate. |
| `6m-margin-requirements.html` | Reference / calculation + execution | Keep exchange/broker performance bonds separate from maximum loss and size from risk budget plus invalidation distance. | Open with the integer contract-count equation; verified tick input -> loss budget -> invalidation -> gap/slippage stress -> variable margin constraints -> broker checks. | Worked reconciliation and pre-order sizing checklist. |
| `6m-slippage.html` | Execution / decision workflow + measurement | Measure implementation shortfall and decide whether spread, depth, order type, and event risk permit execution. | Open with a planned target consumed by spread and slippage; cost decomposition -> data needed -> market-quality gates -> order branches -> stress cases -> post-trade review. | Go, reduce, wait, or reject decision card. |
| `6m-trading-mistakes.html` | Execution / failure catalog | Provide a pre-mortem of process failures and route each correction to the owning specialist page. | Open after the loss with a reconstruction timeline; failure mode -> observable warning -> prevention gate -> recovery/review, organized by data, mechanics, thesis, execution, and risk. | Pre-trade and post-trade failure checklist. |
| `6m-trading-plan.html` | Execution / decision workflow + hybrid | Integrate evidence, catalyst calendar, contract choice, setup, sizing, execution, invalidation, and review without claiming an edge. | Open with a plausible macro thesis that fails the execution gate; required inputs -> decision branches -> sizing -> order plan -> event/overnight controls -> review. | One-page plan worksheet with explicit no-trade outcomes. |
| `6m-vs-6e-vs-6j.html` | Comparison / decision guide | Compare verified mechanics, quote conventions, macro exposures, liquidity context, and analytical fit across the three futures without ranking an "easiest" contract. | Open with one U.S. shock producing three different transmission paths; apparent similarity -> critical differences -> decision criteria -> scenario fit -> when comparison fails. | Instrument-selection matrix and verification reminders. |
| `why-6m-trades-differently.html` | Macro / market-structure + execution hybrid | Explain 6M-specific participation, liquidity, jump, event, and execution characteristics without duplicating the three-instrument guide or volatility study. | Open with equal chart ranges but unequal executable risk; participant map -> liquidity and jumps -> event transmission -> order consequences -> data limits -> planning implications. | Market-structure consequence map linking to empirical and execution owners. |

## Cross-page ownership and anti-cannibalization rules

- `6m-tick-size.html` is the only canonical specification page. `what-are-6m-futures.html` owns orientation; `6m-margin-requirements.html` owns risk-budget sizing and performance-bond limitations.
- `6m-fundamental-drivers.html` owns the broad driver map. The Banxico, carry, trade/remittance, and USD pages own depth on their named channels and link back instead of restating the full map.
- `banxico-rate-policy-6m.html` owns decision-day rate-policy interpretation. `banxico-influence-6m.html` owns the wider institutional toolkit.
- `6m-best-times.html` owns a session study protocol. `6m-volatility-profile.html` owns distribution and regime measurement. Neither reports universal best hours, ranges, or directional effects.
- `6m-backtesting.html` owns the full research pipeline. `6m-data-traps.html` owns source acceptance and preprocessing failures. `6m-best-indicators.html` and `6m-seasonality.html` own their named hypothesis families.
- `6m-slippage.html` owns implementation-shortfall measurement and live market-quality gates. `why-6m-trades-differently.html` owns the explanatory market-structure map. `6m-vs-6e-vs-6j.html` owns instrument choice.
- `6m-trading-plan.html` owns integrated decision construction. `6m-trading-mistakes.html` owns the failure pre-mortem and links to specialist corrections.
- Mechanism pages may explain plausible causal channels but must not convert them into empirical findings or guaranteed direction. Empirical pages may specify a test but must not imply it was run.

## Shared release gates

1. Every material factual claim has a descriptive link to a primary source or an explicit evidence label.
2. Current CME specifications and calculations agree across all 20 pages; broker day margin is never presented as maximum loss.
3. Metadata and visible H1s are distinct and accurate. Article and Breadcrumb schema agree with the page. FAQ schema appears only with matching visible FAQs.
4. Sources use secure authoritative URLs and record an explicit review date.
5. Navigation is keyboard usable; heading hierarchy, landmarks, tables, formulas, and scroll regions are accessible at desktop and narrow widths.
6. Openings, H2 sequences, ending forms, component signatures, table shapes, card/process counts, FAQ presence, phrases, and descriptions pass the cluster sameness audit.
7. Hubs, search, sitemap, and necessary internal links are synchronized only after article content stabilizes.
