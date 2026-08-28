# ES/MES and NQ/MNQ article classification and writing map

Date: 2026-08-28

Scope: the 34 existing instrument-specific equity-index futures URLs plus the shared `why-futures-lead-the-stock-market.html` foundation page. Production URLs remain unchanged. Shared hubs, search index, sitemap, necessary related-reading links, the existing green-and-black `currency-research-library.css`, validation/audit code, tests, and release artifacts are integration work rather than additional article assignments.

## Why these are the current targets

- The completed modern rebuild program covers the existing core currency libraries through 6Z, while the Futures Basics hub still exposes 21 ES/MES pages and 13 NQ/MNQ pages that never received a dedicated evidence-led cluster rebuild.
- The old equity-index copy is short, lightly sourced, structurally repetitive, and contains deterministic trading language. Most ES metadata remains dated 2025-11-24 and all NQ/MNQ metadata remains dated 2025-12-12.
- ES is rebuilt first conceptually because it owns the shared S&P 500 and cash-index foundation used by several comparison pages. NQ follows and links to ES rather than duplicating its mechanics.
- YM/MYM and RTY/M2K do not have existing core libraries and are not part of this rewrite scope.

## Cluster editorial model

- One publication identity: Grizzly Parrot Trading / Kyle Parrott.
- One visual system: reuse the exact shared green-and-black `currency-research-library.css` and `fx-*` component namespace. Equity pages add no page-specific theme or alternate stylesheet.
- One evidence standard: CME owns contract rules; S&P Dow Jones Indices and Nasdaq own index methodology; Federal Reserve, BLS, BEA, SEC, CFTC, and other primary institutions support event and market-structure facts. Mechanisms, hypotheses, empirical observations, and trading applications remain visibly distinct.
- Canonical ES mechanics authority: `es-tick-size-tick-value-and-margin.html`.
- Canonical NQ mechanics authority: `nq-tick-value.html`; `nq-what-is-nq.html` owns orientation and index identity, not duplicate contract arithmetic.
- Unperformed empirical work is a reproducible protocol, never a reported result. Execution pages define gates, invalidation, costs, and review without promising an edge.
- Page architecture follows the reader question. Openings, section sequences, components, table shapes, pacing, and endings must vary.

## Writer 1 — research and measurement

| URL file | Archetype | Exclusive reader purpose | Distinct architecture |
|---|---|---|---|
| `best-times-to-trade-es-e-mini-sp500.html` | Empirical / market quality | Measure which ES windows fit a specific task using spreads, depth, volume, slippage, events, DST, holidays, and roll state rather than a permanent clock ranking. | Begin with the same clock time producing different books; UTC session map -> quality measures -> exclusions -> fit matrix -> personal review. |
| `es-atr-behavior-and-volatility-zones.html` | Empirical / state classification | Define a reproducible ES volatility-state card using return distributions, range, jump share, and liquidity rather than universal ATR bands. | Begin with identical ATR values hiding different paths; measurement choices -> state dimensions -> event labels -> sizing handoff -> stale-state test. |
| `es-gap-behavior-and-how-to-trade-it.html` | Empirical / gap study | Define gaps across settlement, prior RTH close, and overnight reference points; test fill and continuation claims without declaring fixed odds. | Begin with three legitimate gap definitions; choose reference -> sample -> path labels -> controls -> costs -> falsification. |
| `es-liquidity-pockets-and-order-book-structure.html` | Empirical / microstructure | Replace permanent liquidity-zone folklore with timestamped depth, spread, queue, cancellation, trade, and price-response measurement. | Begin with displayed size disappearing; observable book states -> synchronization -> candidate metrics -> rival explanations -> execution limits. |
| `es-market-structure-trends-pulls-and-reversals.html` | Empirical / labeling | Turn trend, pullback, and reversal labels into forward-safe state definitions and testable transitions. | Begin with two analysts labeling the same path differently; definitions -> labeling clock -> transition matrix -> validation -> unusable outcome. |
| `es-opening-range-strategies-for-beginners.html` | Empirical / protocol | Convert opening-range folklore into a test protocol with time-zone, day-type, event, gap, volatility, and cost controls. | Begin with the question of when the range becomes knowable; definition -> variants -> conditioning -> execution simulation -> holdout. |
| `es-overnight-session-vs-regular-trading-hours.html` | Comparison / measurement | Compare overnight and RTH market quality and price discovery without claiming one session always leads. | Begin with one continuous contract and two liquidity regimes; session boundaries -> comparable metrics -> event handoffs -> decision use -> failure cases. |
| `es-session-highs-lows-and-vwap-usage.html` | Empirical / benchmark use | Explain how to calculate and test session extremes and VWAP with explicit reset, price, volume, and look-ahead rules. | Begin with two platforms showing different VWAPs; calculation choices -> timestamp-safe levels -> test cases -> execution cautions -> review log. |
| `nq-best-times.html` | Empirical / market quality | Measure NQ execution windows by market quality and event context, not a universal best-time list. | Begin with a fast tape that is still expensive; session map -> depth/spread/range metrics -> exclusions -> task fit -> reassessment. |
| `nq-liquidity-windows.html` | Empirical / liquidity map | Define and monitor NQ liquidity windows through spread, depth, replenishment, price impact, and scheduled flow. | Begin with volume rising while depth falls; metric stack -> window construction -> event overlays -> go/reduce/wait rules -> expiry. |
| `nq-pullbacks-vs-breakouts.html` | Empirical / comparative test | Specify a fair, forward-only comparison of pullback and breakout definitions across regimes and after costs. | Begin with labels that require future knowledge; entry definitions -> regime controls -> matched samples -> cost model -> holdout -> retirement rule. |
| `nq-volatility-vs-es.html` | Empirical / normalized comparison | Compare NQ and ES volatility after normalizing returns, dollar exposure, liquidity, concentration, and event regimes. | Begin with point ranges that cannot be compared; normalize -> measure distributions -> decompose liquidity/concentration -> regime table -> limits. |

## Writer 2 — mechanisms and market explanation

| URL file | Archetype | Exclusive reader purpose | Distinct architecture |
|---|---|---|---|
| `es-key-economic-reports-that-move-price.html` | Macro / event mechanism | Explain how inflation, labor, activity, and Fed information can reprice ES through rates, earnings, and risk premia without fixed directional rules. | Begin with a strong report and falling ES; prior -> surprise -> competing transmission channels -> confirmation -> failure cases. |
| `es-news-events-and-volatility-traps.html` | Macro / event-risk workflow | Distinguish scheduled information, unscheduled headlines, market-wide halts, and liquidity gaps, then build an event-risk decision process. | Begin with a correct thesis and untradeable fill; event taxonomy -> pre-event state -> liquidity chain -> branches -> post-event attribution. |
| `es-using-spy-and-spx-as-confirmation.html` | Comparison / cash-futures mechanism | Compare ES, SPY, and SPX clocks, units, creation/redemption, auction, and calculation mechanics; define when cross-market comparison helps or misleads. | Begin with three screens disagreeing; identity map -> timing -> basis/auction mechanics -> scenario matrix -> invalid comparisons. |
| `es-mini-vs-mes-micro-which-should-you-trade.html` | Comparison / risk fit | Compare ES and MES by identical underlying exposure, contract multiplier, tick value, cost concentration, liquidity, and whole-contract sizing. | Begin with equal chart risk but unequal account risk; verified specs -> cost-per-notional -> sizing cases -> fit criteria -> no-trade outcome. |
| `es-vs-mes-vs-nq.html` | Comparison / instrument selection | Help readers choose among ES, MES, and NQ using exposure, multiplier, liquidity, concentration, event sensitivity, and operational fit without ranking a winner. | Begin with three ways to express index risk; identity -> normalized comparison -> scenario matrix -> selection gates -> comparison failures. |
| `es-scalping-vs-swing-trading-pros-and-cons.html` | Comparison / horizon decision | Compare short and multi-session ES holding processes through cost, gap, margin, monitoring, and evidence requirements. | Begin with the holding horizon changing the risk model; inputs -> cost stack -> overnight branch -> workflow fit -> review criteria. |
| `nq-earnings-impact.html` | Macro / index-construction mechanism | Explain how constituent earnings can reach NQ through Nasdaq-100 weighting, expectations, correlation, and index futures repricing. | Begin with one company moving an index future; index construction -> prior/surprise -> direct and peer channels -> observables -> attribution limits. |
| `nq-news-volatility.html` | Macro / competing channels | Explain why rate, macro, regulatory, geopolitical, and company news can interact with NQ concentration and duration exposure without declaring permanent sensitivity. | Begin with the same headline producing opposite moves; market prior -> channel map -> liquidity amplifier -> confirmation -> invalidation. |
| `nq-vs-es.html` | Comparison / exposure decomposition | Compare NQ and ES index composition, weighting, concentration, contract scale, liquidity, and event exposure for instrument selection. | Begin with correlated charts hiding different portfolios; index identities -> normalized contract table -> scenario differences -> fit criteria -> divergence limits. |
| `nq-what-is-nq.html` | Reference / orientation | Explain what NQ represents, how Nasdaq-100 methodology differs from the futures contract, who uses it, and the safe path to canonical mechanics. | Begin with the distinction between index and contract; index identity -> futures wrapper -> lifecycle -> uses/not-uses -> next steps. |
| `why-futures-lead-the-stock-market.html` | Market structure / price discovery | Replace the slogan that futures always lead stocks with a clock-, venue-, liquidity-, and information-based explanation of price discovery. | Begin with the market being closed on one screen but active on another; define markets -> information clock -> arbitrage links -> lead/lag evidence -> exceptions. |

## Writer 3 — practical systems and decisions

| URL file | Archetype | Exclusive reader purpose | Distinct architecture |
|---|---|---|---|
| `es-building-a-simple-trading-plan.html` | Decision / control system | Build a measurable ES plan from permissions, setup definitions, risk limits, execution branches, and review fields. | Begin with a plan that cannot be audited; objective -> permissions -> setup card -> risk/execution branches -> review -> versioning. |
| `es-common-retail-trader-mistakes.html` | Failure analysis | Reconstruct common ES failures and pair each with detection, prevention, containment, and review controls. | Begin with an incident timeline; failure catalog -> early signal -> preventive control -> containment -> after-action table. |
| `es-how-to-size-positions-by-account-balance.html` | Execution / sizing system | Convert risk capacity, stop distance, tick value, slippage, fees, and gap stress into whole ES/MES contract size. | Begin with the floor-function answer; define usable risk -> worked ES/MES cases -> stress overlays -> zero-contract outcome -> review. |
| `es-intraday-support-and-resistance-levels.html` | Execution / level workflow | Turn candidate reference levels into timestamped hypotheses requiring reaction, liquidity, invalidation, and review rather than permanent lines. | Begin with too many plausible levels; candidate sources -> ranking -> confirmation branches -> invalidation -> deletion log. |
| `es-roll-dates-and-contract-switching.html` | Reference / lifecycle | Explain quarterly contract selection, volume migration, basis, chart continuity, order migration, and expiration risk using current CME rules. | Begin with two ES contracts trading simultaneously; lifecycle timeline -> liquidity migration -> platform checklist -> open-order audit -> post-roll verification. |
| `es-tick-size-tick-value-and-margin.html` | Reference / canonical specification | Own ES and MES multiplier, quotation, minimum increment, tick math, listed months, hours, final settlement, roll, and margin boundaries. | Begin with multiplier times minimum increment; verified spec card -> arithmetic -> hours/months -> final settlement -> roll -> margin layers -> pre-order check. |
| `es-using-dom-and-time-and-sales.html` | Execution / microstructure | Define what DOM and time-and-sales actually observe, what they cannot identify, and a replay-based decision workflow. | Begin with displayed size that never trades; observation layers -> synchronization -> hypotheses -> execution gates -> spoofing/attribution boundary -> replay review. |
| `mnq-bad-habits.html` | Decision / scaling controls | Explain why a smaller multiplier does not repair weak process and define graduation criteria from MNQ to NQ. | Begin with identical bad decisions at one-tenth scale; behavior map -> cost concentration -> permission ladder -> graduation test -> remain-on-MNQ outcome. |
| `nq-execution-mistakes.html` | Failure analysis / execution | Organize NQ execution failures by order choice, timing, liquidity, size, event exposure, and platform state with concrete controls. | Begin with a fill reconstruction; failure chain -> visible warning -> prevention -> emergency branch -> review fields. |
| `nq-margin.html` | Reference / risk workflow | Separate CME performance bond, broker house/day margin, variation, concentration add-ons, and maximum-loss misconceptions. | Begin with two valid but different margin figures; margin layers -> update sources -> stress scenarios -> buffer workflow -> reject conditions. |
| `nq-position-sizing.html` | Execution / sizing system | Size NQ/MNQ from a declared risk budget and executable stop with slippage, fees, gap, correlation, and event stress. | Begin with a worked risk equation; inputs -> whole-contract cases -> stress matrix -> zero-size branch -> journal fields. |
| `nq-tick-value.html` | Reference / canonical specification | Own NQ and MNQ multiplier, minimum increment, tick/P&L math, listed months, hours, final settlement, roll, and margin boundaries. | Begin with `$20 x 0.25`; verified specs -> arithmetic -> NQ/MNQ comparison -> lifecycle -> margin boundary -> pre-order verification. |

## Cross-page ownership and anti-cannibalization

- `es-tick-size-tick-value-and-margin.html` owns ES/MES exchange mechanics and arithmetic. `nq-tick-value.html` owns NQ/MNQ mechanics. Every other page links to the appropriate authority and repeats only calculation inputs it actively uses.
- `nq-what-is-nq.html` owns orientation and Nasdaq-100 identity. It does not duplicate the full mechanics card.
- `es-mini-vs-mes-micro-which-should-you-trade.html` owns the ES/MES size comparison. `es-vs-mes-vs-nq.html` owns three-contract selection. `nq-vs-es.html` owns the underlying-index and exposure comparison.
- `nq-volatility-vs-es.html` owns a reproducible normalized volatility comparison; `nq-vs-es.html` owns qualitative instrument selection.
- `best-times-to-trade-es-e-mini-sp500.html` and `nq-best-times.html` own broad task-fit measurement. The liquidity-window pages own live market-quality monitoring rather than clock rankings.
- `es-opening-range-strategies-for-beginners.html` owns opening-range tests. `es-gap-behavior-and-how-to-trade-it.html` owns close-to-open reference definitions and gap-path tests.
- `es-news-events-and-volatility-traps.html` owns event-risk operations. `es-key-economic-reports-that-move-price.html` owns macro transmission. The NQ earnings and news pages own their narrower index-specific mechanisms.
- `es-liquidity-pockets-and-order-book-structure.html` owns descriptive book measurement. `es-using-dom-and-time-and-sales.html` owns live observation and replay workflow.
- `why-futures-lead-the-stock-market.html` owns market-wide price-discovery mechanics. `es-using-spy-and-spx-as-confirmation.html` owns the practical ES/SPY/SPX comparison.
- Sizing pages own arithmetic and size permissions; planning, mistakes, and horizon pages link to them rather than reproducing full formulas.

## Staggered modification-date matrix

Visible Updated dates, Article `dateModified`, `article:modified_time`, and sitemap `lastmod` must agree. Historical `datePublished` values remain unchanged.

| Modified date | URL files |
|---|---|
| `2026-08-24` | `best-times-to-trade-es-e-mini-sp500.html`, `es-common-retail-trader-mistakes.html`, `es-liquidity-pockets-and-order-book-structure.html`, `es-roll-dates-and-contract-switching.html`, `mnq-bad-habits.html`, `nq-news-volatility.html`, `nq-what-is-nq.html` |
| `2026-08-25` | `es-atr-behavior-and-volatility-zones.html`, `es-gap-behavior-and-how-to-trade-it.html`, `es-market-structure-trends-pulls-and-reversals.html`, `es-scalping-vs-swing-trading-pros-and-cons.html`, `nq-best-times.html`, `nq-position-sizing.html`, `why-futures-lead-the-stock-market.html` |
| `2026-08-26` | `es-building-a-simple-trading-plan.html`, `es-how-to-size-positions-by-account-balance.html`, `es-mini-vs-mes-micro-which-should-you-trade.html`, `es-session-highs-lows-and-vwap-usage.html`, `nq-earnings-impact.html`, `nq-pullbacks-vs-breakouts.html`, `nq-tick-value.html` |
| `2026-08-27` | `es-intraday-support-and-resistance-levels.html`, `es-key-economic-reports-that-move-price.html`, `es-opening-range-strategies-for-beginners.html`, `es-using-dom-and-time-and-sales.html`, `nq-execution-mistakes.html`, `nq-margin.html`, `nq-volatility-vs-es.html` |
| `2026-08-28` | `es-news-events-and-volatility-traps.html`, `es-overnight-session-vs-regular-trading-hours.html`, `es-tick-size-tick-value-and-margin.html`, `es-using-spy-and-spx-as-confirmation.html`, `es-vs-mes-vs-nq.html`, `nq-liquidity-windows.html`, `nq-vs-es.html` |

## Shared release gates

1. Every material factual claim has a descriptive primary-source link or explicit evidence label.
2. Current CME specifications and all calculations reconcile; broker day margin is never described as maximum loss.
3. Metadata, visible H1, Article schema, Breadcrumb schema, and any FAQ schema agree with visible content.
4. All 35 pages use the one existing green-and-black shared stylesheet and no page-specific theme fork.
5. Headings, landmarks, navigation, tables, formulas, and scroll regions work at desktop and narrow widths.
6. Cluster validation, link checks, schema parsing, automated sameness audit, evidence review, editorial-distinctiveness review, visual QA, repository tests, and `git diff --check` all pass before release.
7. The Futures Basics hub, search index, sitemap, and necessary related-reading links are synchronized only after article content stabilizes.
