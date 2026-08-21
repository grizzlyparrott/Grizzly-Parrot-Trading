# Core 6N article classification and writing map

Date: 2026-08-20

Scope: the 20 existing core New Zealand Dollar futures URLs listed below. Production URLs remain unchanged. The Futures Basics and Currencies hubs, search index, sitemap, necessary related-reading links, the canonical green-and-black currency research stylesheet and `fx-*` component namespace shared by 6A, 6B, 6C, 6E, 6J, 6M, and 6N, 6N validation/audit code, tests, and release artifacts are root-owned synchronization work rather than extra article assignments.

## Why 6N is the current target

- The Currencies hub's established full-library order is 6A, 6B, 6C, 6E, 6J, 6M, 6N, and 6S before later smaller or isolated instrument sets.
- Full modern library rebuilds already exist for 6A, 6B, 6C, 6E, 6J, and 6M. The most recent is 6M, merged to `main` in repository PR 34.
- Skipping those rebuilt clusters makes 6N the next stale full library in the actual hub order. Its 20 existing cards remain on the legacy article shell with 2025 copy, repeated structures, weak evidence boundaries, and deterministic language.
- The four 6L pages do not constitute the next core article library. 6S, 6Z, and unrelated futures, books, tools, affiliates, or site sections are outside this project.

## Cluster editorial model

- One publication and author identity: Grizzly Parrot Trading / Kyle Parrott.
- One evidence standard: current primary sources where authoritative sources exist; established fact, mechanism, empirical observation, hypothesis, inference, and trading application remain visibly distinct.
- One contract-mechanics authority: `6n-contract-specs-explained.html`. It owns the verified standard contract unit, quotation, minimum increment, P&L arithmetic, listed months, trading hours, termination, physical delivery, roll risk, margin limitations, and the current absence of a listed CME Micro NZD contract.
- `what-are-6n-futures.html` owns beginner orientation. `how-to-read-6n-price-quotes.html` owns quote-reading examples. `m6n-micro-contract-guide.html` owns the correction of the stale M6N premise and the practical consequences of no currently listed CME Micro NZD contract. All link to the canonical specification guide instead of reproducing its full block.
- No unrun study becomes a finding. Empirical pages publish protocols, definitions, and falsification criteria and explicitly disclose when no original results are reported.
- No deterministic trade language. Mechanisms are conditional, and execution pages use inputs, gates, branches, invalidation, costs, and review rather than profit promises.
- Architecture follows the question. Openings, H2 sequences, evidence components, pacing, and endings vary by subject. FAQ sections and FAQ schema are optional and must appear together.

## Writer 1: research and measurement

| URL file | Archetype | Exclusive reader purpose | Planned architecture and opening | Planned ending |
|---|---|---|---|---|
| `6n-correlations.html` | Empirical / testing | Test conditional co-movement with 6A, equities, rates, commodities, and broad USD measures without treating a changing correlation as a causal signal. | Open with two rolling windows that reverse sign; define synchronized returns -> contract rolls and clocks -> candidate mechanisms -> controls -> rolling estimates -> robustness and falsification. | Correlation acceptance record that permits “unstable or unusable.” |
| `6n-liquidity-guide.html` | Empirical / testing + execution | Measure spread, depth, volume, slippage, and fill quality across event- and DST-aware windows rather than declaring fixed tradable hours. | Open with the same chart range producing different executable costs; data fields -> clock map -> measurement bins -> event/holiday/roll controls -> market-quality gates. | Go, reduce, wait, or reject liquidity decision card. |
| `6n-multi-timeframe-framework.html` | Empirical / workflow hybrid | Convert higher-, setup-, and execution-timeframe language into causal, non-duplicative rules that can be replayed and falsified. | Open with three charts producing contradictory labels; information hierarchy -> frozen swing rules -> alignment states -> trigger and invalidation -> replay protocol -> failure cases. | One-page state handoff with explicit no-trade outcomes. |
| `6n-seasonal-patterns.html` | Empirical / testing | Test calendar effects without converting small historical samples or export narratives into forecasts. | Open with the multiple-testing problem created by months, quarters, weekdays, and holding windows; hypothesis registry -> sample -> roll/return construction -> controls -> uncertainty -> holdout. | Falsification matrix and explicit no-original-findings boundary. |
| `6n-trading-strategies.html` | Empirical / comparison | Compare fully specified trend and mean-reversion rule families against baselines, costs, regimes, and holdouts instead of claiming either “works.” | Open with the same price path classified as trend and reversion by different lookbacks; task -> rule definitions -> neutral baselines -> walk-forward design -> costs -> rejection rules. | Strategy-selection record that allows “neither.” |
| `6n-volatility-patterns.html` | Empirical / testing | Define and measure volatility distributions, clustering, event effects, and transitions without publishing invented typical ranges or timing forecasts. | Open with one average hiding quiet and jump regimes; estimators -> session/event decomposition -> roll controls -> state classification -> transition uncertainty -> robustness. | Monitoring specification that separates description from prediction. |

## Writer 2: mechanisms and macro explanation

| URL file | Archetype | Exclusive reader purpose | Planned architecture and opening | Planned ending |
|---|---|---|---|---|
| `6n-interest-rate-impact.html` | Macro / mechanism | Explain RBNZ-Fed path expectations, curves, carry, hedging, and competing growth/risk channels without mapping one rate move to one 6N direction. | Open with an unchanged policy rate that still reprices NZD; prior -> complete decision package -> curve response -> relative-rate channels -> competing forces -> confirmation. | Conditional rate-state matrix. |
| `6n-risk-sentiment-impact.html` | Macro / mechanism + empirical boundary | Explain why NZD can behave as a risk-sensitive currency and how to test whether that regime is active, without assigning a permanent equity beta. | Open with equities and 6N diverging during a risk shock; funding and portfolio channels -> China/commodity overlap -> USD effects -> observable confirmation -> breakdown cases. | Regime checklist separating mechanism from measured relationship. |
| `6n-vs-6a-differences.html` | Comparison / decision guide | Compare verified mechanics, liquidity context, domestic policy, China exposure, export composition, and analytical fit without ranking an easiest contract. | Open with one Asia-Pacific shock reaching AUD and NZD through different channels; apparent similarity -> critical differences -> scenario criteria -> hedge and execution implications -> comparison failures. | Instrument-selection matrix with verification reminders. |
| `how-exports-drive-6n-trends.html` | Macro / mechanism | Explain dairy, services, terms-of-trade, invoicing, hedging, lags, and offsets without treating an auction or export print as a mechanical futures signal. | Open with a strong dairy-price result alongside a weaker NZD; measurement fact -> income and balance-of-payments channels -> policy/inflation links -> timing and hedging -> rival drivers. | Evidence ladder from official trade data to unvalidated trading application. |
| `how-to-trade-6n-economic-releases.html` | Macro / event workflow | Prepare for RBNZ, Stats NZ, U.S., and relevant China releases through priors, surprise, revisions, liquidity, conditional branches, and post-event evidence. | Open seconds before a release with three unanswered questions; calendar verification -> prior -> release package -> transmission -> execution gates -> post-event review. | Before/during/after event checklist with mandatory no-trade branches. |
| `us-dollar-impact-on-6n.html` | Macro / comparison + empirical boundary | Separate the inverse quotation identity from a genuine common-dollar factor and show how to test non-circular confirmation. | Open with 6N rising while a broad USD index also rises; quote algebra -> index composition -> shared shocks -> orthogonal controls -> timing tests -> failure cases. | Confirmation checklist that rejects circular signals. |

## Writer 3: practical systems and decisions

| URL file | Archetype | Exclusive reader purpose | Planned architecture and opening | Planned ending |
|---|---|---|---|---|
| `6n-common-mistakes.html` | Execution / failure catalog | Provide a pre-mortem of mechanics, data, thesis, execution, event, and risk failures and route each fix to its canonical owner. | Open after a loss with a reconstruction timeline; failure -> observable warning -> prevention gate -> recovery/review. | Pre-trade and post-trade failure checklist. |
| `6n-contract-specs-explained.html` | Reference / specification | Serve as the canonical current 6N contract guide and arithmetic authority, including the explicit absence of a currently listed CME Micro NZD contract. | Open with contract unit multiplied by minimum increment; verified spec card -> quote/P&L -> notional -> current product-slate boundary -> months/hours -> termination/delivery -> roll and margin limits. | Pre-order verification checklist and reconciled formulas. |
| `6n-spread-trading.html` | Comparison / execution workflow | Build a measurable relative-value or hedge-ratio study for 6N versus 6A or a declared USD basket, including leg risk and non-equivalent contract notionals. | Open with a “flat” two-leg spread that carries unequal dollar exposure; objective -> leg normalization -> hedge ratio -> execution sequencing -> costs -> breakdown and review. | Spread-construction worksheet with reject conditions. |
| `how-to-read-6n-price-quotes.html` | Reference / calculation | Explain USD-per-NZD quotation, ticks, points, long/short P&L, notional exposure, and screen-to-dollar conversions without duplicating the full specification guide. | Open with `0.6124` translated into USD per NZD; quote identity -> tick ladder -> side-aware worked examples -> notional -> spot comparison -> common errors. | Quote-and-P&L self-check. |
| `m6n-micro-contract-guide.html` | Reference / product-availability correction + sizing | Correct the stale premise: verify that CME's current Micro FX slate does not list M6N, then show what a trader must do when one standard 6N exceeds the risk budget without inventing an equivalent product. | Open with the product code missing from the current CME Micro table; current-slate evidence -> historical/stale-label trap -> standard-contract risk math -> no-trade and separately verified alternatives -> broker/platform checks. | Product-verification and risk-fit decision matrix. |
| `using-6n-to-hedge-nzdusd-exposure.html` | Execution / hedging workflow | Translate a defined NZD exposure into side-aware contract counts, hedge ratios, basis/roll risk, and effectiveness review without promising a perfect hedge. | Open with a New Zealand receivable whose USD value changes before settlement; exposure sign -> objective -> contract count -> residual -> horizon/roll -> basis and accounting limits. | Worked hedge reconciliation and monitoring schedule. |
| `what-are-6n-futures.html` | Reference / definition | Explain what 6N represents, quote direction, dated-futures lifecycle, participants, uses, and core risks without duplicating specification tables. | Open with the contract’s economic identity; definition -> who uses it -> lifecycle -> basis/leverage/delivery -> suitability questions -> canonical links. | Beginner readiness gate. |
| `why-traders-use-6n-futures.html` | Comparison / decision guide | Compare centralized futures with spot NZD/USD across venue, price orientation, counterparty structure, transparency, leverage, expiry, roll, data, and practical fit. | Open with two NZD/USD screens that are not interchangeable; apparent equivalence -> structural differences -> cost/data questions -> scenarios -> when futures or spot may not fit. | Venue-selection matrix without declaring a universal winner. |

## Cross-page ownership and anti-cannibalization rules

- `6n-contract-specs-explained.html` is the only canonical mechanics page. `what-are-6n-futures.html` owns orientation; `how-to-read-6n-price-quotes.html` owns quote/P&L teaching; `m6n-micro-contract-guide.html` owns the current product-availability correction and the no-trade outcome when standard 6N does not fit the risk budget.
- `6n-interest-rate-impact.html` owns the relative-policy mechanism. `how-to-trade-6n-economic-releases.html` owns the event workflow. Neither turns a surprise into a deterministic direction rule.
- `6n-risk-sentiment-impact.html` owns the risk-regime mechanism. `6n-correlations.html` owns measured co-movement methodology. `us-dollar-impact-on-6n.html` owns dollar-factor identity and non-circular confirmation.
- `how-exports-drive-6n-trends.html` owns export and terms-of-trade channels. `6n-vs-6a-differences.html` owns cross-instrument choice and links rather than repeating the export explanation.
- `6n-liquidity-guide.html` owns executable market-quality measurement. `6n-volatility-patterns.html` owns distribution and regime measurement. Neither declares permanent best hours or typical ranges.
- `6n-trading-strategies.html` owns reproducible trend-versus-reversion comparison. `6n-multi-timeframe-framework.html` owns information hierarchy and execution-state handoff, not strategy performance.
- `6n-spread-trading.html` owns normalized relative-value construction. `using-6n-to-hedge-nzdusd-exposure.html` owns single-exposure risk reduction and hedge effectiveness.
- `why-traders-use-6n-futures.html` owns venue choice. `what-are-6n-futures.html` owns instrument definition. `6n-common-mistakes.html` owns the failure pre-mortem and links to specialist corrections.
- Mechanism pages may explain plausible causal channels but must not convert them into empirical findings or guaranteed direction. Empirical pages may specify a test but must not imply it was run.

## Shared release gates

1. Every material factual claim has a descriptive link to a primary source or an explicit evidence label.
2. Current CME specifications and calculations agree across all 20 pages; broker day margin is never presented as maximum loss.
3. Metadata and visible H1s are distinct and accurate. Article and Breadcrumb schema agree with the page. FAQ schema appears only with matching visible FAQs.
4. Sources use secure authoritative URLs and record an explicit review date.
5. Navigation is keyboard usable; heading hierarchy, landmarks, tables, formulas, and scroll regions are accessible at desktop and narrow widths.
6. Openings, H2 sequences, ending forms, component signatures, table shapes, card/process counts, FAQ presence, phrases, and descriptions pass the cluster sameness audit.
7. Hubs, search, sitemap, and necessary internal links are synchronized only after article content stabilizes.

## Staggered modification-date matrix

The user requires the rebuilt library to show a credible staggered refresh across the five days ending on release day. Each page's visible “Updated” date, Article `dateModified`, any article modified-time metadata, and sitemap `lastmod` must agree with this matrix. Original `datePublished` values remain historical and must not be overwritten.

| Modified date | URL files |
|---|---|
| `2026-08-16` | `6n-common-mistakes.html`, `6n-contract-specs-explained.html`, `6n-correlations.html`, `6n-interest-rate-impact.html` |
| `2026-08-17` | `6n-liquidity-guide.html`, `6n-multi-timeframe-framework.html`, `6n-risk-sentiment-impact.html`, `6n-seasonal-patterns.html` |
| `2026-08-18` | `6n-spread-trading.html`, `6n-trading-strategies.html`, `6n-volatility-patterns.html`, `6n-vs-6a-differences.html` |
| `2026-08-19` | `how-exports-drive-6n-trends.html`, `how-to-read-6n-price-quotes.html`, `how-to-trade-6n-economic-releases.html`, `m6n-micro-contract-guide.html` |
| `2026-08-20` | `us-dollar-impact-on-6n.html`, `using-6n-to-hedge-nzdusd-exposure.html`, `what-are-6n-futures.html`, `why-traders-use-6n-futures.html` |
