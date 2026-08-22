# Core 6S article classification and writing map

Date: 2026-08-21

Scope: the 21 existing core Swiss Franc futures URLs listed below. Production URLs remain unchanged. The Futures Basics and Currencies hubs, search index, sitemap, necessary related-reading links, the shared green-and-black `currency-research-library.css`, 6S validation/audit code, tests, and release artifacts are root-owned synchronization work rather than extra article assignments.

## Why 6S is the current target

- The Currencies hub's established full-library order places 6S after 6N and before 6Z.
- Full modern rebuilds already exist for 6A, 6B, 6C, 6E, 6J, 6M, and 6N. The most recent is 6N, merged to `main` in repository PR 35.
- The 21-page 6S library is the next existing stale core cluster. Its cards and pages still contain 2025-era repeated structures, unsupported rankings and deterministic claims such as fixed best times, permanent correlations, predictable reactions, and guaranteed mean reversion.
- `6j-vs-6s-differences.html` belongs to the already rebuilt 6J library and is outside the rewrite scope except for a necessary 6S related-reading link if validation requires one.
- Smaller or later code sets, including 6Z, and unrelated futures, tools, books, affiliates, and site sections are outside this project.

## Cluster editorial model

- One publication and author identity: Grizzly Parrot Trading / Kyle Parrott.
- One visual system: the existing shared green-and-black currency-library stylesheet and `fx-*` component namespace. No page-specific theme or replacement CSS.
- One evidence standard: current primary sources where authoritative sources exist; established fact, mechanism, empirical observation, hypothesis, inference, and trading application remain visibly distinct.
- One contract-mechanics authority: `6s-contract-specs-tick-size-margin.html`. It owns verified CME contract size, quotation, increments, tick value, listed months, hours, termination, physical delivery, roll risk, and the boundary between exchange performance bond and broker day margin.
- No unrun study becomes a finding. Empirical pages publish definitions, samples, controls, robustness and falsification criteria and disclose when no original results are reported.
- No deterministic trade language. Macro mechanisms remain conditional; execution pages use inputs, gates, branches, invalidation, costs and review rather than profit promises.
- Architecture follows the reader's question. Openings, H2 sequences, evidence components, table shapes, pacing and endings must vary by subject. FAQ sections and FAQ schema are optional and must appear together.

## Writer 1 — research and measurement

| URL file | Archetype | Exclusive reader purpose | Distinct architecture |
|---|---|---|---|
| `6s-behavior-during-fomc-weeks-not-just-fomc-day.html` | Empirical / event study | Define a test of pre-decision, decision and post-decision 6S behavior without claiming a permanent FOMC-week pattern. | Open with an event-window contamination problem; timestamp map -> prior and surprise fields -> control weeks -> liquidity/volatility measures -> robustness -> rejection record. |
| `6s-best-times-of-day-to-trade-swiss-franc-futures.html` | Empirical / market-quality decision | Replace fixed “best times” with DST-, holiday-, event- and roll-aware measurement of spreads, depth, volume, slippage and fill quality. | Open with identical clock labels producing different books; clock normalization -> measurement bins -> quality gates -> event exclusions -> go/reduce/wait/reject decision. |
| `6s-intraday-yield-tracking-how-bond-moves-guide-chf-futures.html` | Empirical / mechanism test | Test whether changes in declared U.S. and Swiss curve points add non-circular information for 6S after controlling for USD and event timing. | Open with yields and 6S moving together for opposing reasons; define yields and returns -> synchronization -> controls -> lead/lag test -> false-confirmation catalog. |
| `6s-london-fix-liquidity-shifts-and-daily-flows.html` | Empirical / execution | Measure market quality around a declared London benchmark window without asserting routine reversals or directional fix flow. | Open with an unobservable client-flow claim; benchmark facts -> window construction -> spread/depth/slippage study -> month-end and event controls -> execution guardrails. |
| `6s-mean-reversion-setups-and-why-they-work.html` | Empirical / strategy test | Convert “6S mean reverts” into fully specified candidate rules benchmarked against persistence, costs, regimes and holdouts. | Open with the same move classified as reversion or trend by different lookbacks; rule registry -> baseline -> costs -> regime controls -> walk-forward test -> abandon criteria. |
| `6s-top-correlations-for-swiss-franc-futures.html` | Empirical / testing | Test time-varying co-movement with equities, gold, rates, JPY and broad USD measures without ranking permanent drivers. | Open with a correlation sign reversal; synchronized return design -> rolling estimates -> common-factor controls -> multiple testing -> stability and falsification. |
| `6s-volatility-compression-and-breakout-behavior.html` | Empirical / strategy test | Define compression and breakout outcomes before testing them, with costs, false-break controls and out-of-sample rejection. | Open with three incompatible definitions of compression; operational definition -> candidate trigger -> outcome horizon -> controls -> robustness -> validation ledger. |

## Writer 2 — mechanisms and macro explanation

| URL file | Archetype | Exclusive reader purpose | Distinct architecture |
|---|---|---|---|
| `6s-how-6s-reacts-to-snb-rate-decisions.html` | Macro / event mechanism | Explain how the full SNB decision package can reprice CHF relative to the Fed without mapping hikes or cuts to one guaranteed direction. | Open with an unchanged policy rate and a large CHF move; prior -> decision package -> curve and FX channels -> competing forces -> observable confirmation -> failure cases. |
| `6s-how-snb-interventions-still-impact-swiss-franc-today.html` | Macro / institutional mechanism | Explain intervention tools, balance-sheet evidence, communication, sight deposits and uncertainty without claiming that intervention can be identified from price alone. | Open with a sharp move that is not proof of intervention; authority and history -> possible tools -> observable evidence ladder -> alternative explanations -> monitoring limits. |
| `6s-how-us-economic-data-moves-swiss-franc-futures.html` | Macro / event mechanism | Decompose U.S. data surprises through Fed-path, USD, yields and risk channels while preserving the CHF quote direction. | Open with a strong payroll print producing two plausible CHF paths; prior -> release package -> revisions -> competing transmission -> market confirmation -> no-trade cases. |
| `6s-impact-of-global-risk-events-how-chf-reacts-to-shocks.html` | Macro / scenario analysis | Explain safe-haven, funding, balance-sheet, liquidity and policy channels across different shocks without treating CHF as a universal risk-off trade. | Open with two risk shocks producing opposite CHF outcomes; shock taxonomy -> channel map -> rival USD/JPY effects -> observable state -> breakdown cases. |
| `6s-macro-triggers-ranking-the-events-that-move-chf-the-most.html` | Macro / decision framework | Replace the unsupported permanent ranking with a state-dependent trigger triage based on surprise, prior, channel, liquidity and confirmation. | Open by rejecting a timeless leaderboard; classify trigger -> measure surprise -> map channels -> assess state and liquidity -> rank conditionally -> post-event review. |
| `6s-safe-haven-flows-and-why-chf-surges-in-market-panics.html` | Macro / mechanism + evidence boundary | Explain why CHF may receive haven demand and why USD funding, SNB policy or deleveraging can offset it. | Open with CHF failing to rally during stress; institutional attributes -> portfolio/funding channels -> intervention constraint -> confirmation ladder -> failure matrix. |
| `6s-yield-spreads-and-how-interest-rate-differentials-drive-price.html` | Macro / mechanism + measurement | Explain curve-relative pricing and carry while distinguishing expected policy paths from a single observed yield spread. | Open with the spot policy gap unchanged while futures reprice; curve selection -> expectation horizon -> carry and hedging -> competing risk channels -> measurement protocol. |

## Writer 3 — practical systems and decisions

| URL file | Archetype | Exclusive reader purpose | Distinct architecture |
|---|---|---|---|
| `6s-chf-usd-spot-vs-futures-differences.html` | Comparison / decision guide | Compare 6S futures with the correctly oriented spot pair across quotation, venue, clearing, expiry, roll, financing, data and operational fit. | Open with two screens whose quote directions differ; quote translation -> structural comparison -> cost/data checklist -> use cases -> venue-rejection matrix. |
| `6s-contract-specs-tick-size-margin.html` | Reference / specification | Serve as the canonical current 6S mechanics and arithmetic authority. | Open with contract unit multiplied by minimum increment; verified spec card -> quote/P&L examples -> months/hours -> expiry/delivery -> roll -> margin limitations -> pre-order checklist. |
| `6s-safe-haven-vs-jpy-which-leads-in-risk-off.html` | Comparison / decision guide | Compare CHF and JPY mechanisms, policy constraints, quote orientation and test design without declaring a permanent leader. | Open with CHF and JPY diverging in the same shock; apparent similarity -> structural differences -> state matrix -> measurement criteria -> when comparison fails. |
| `6s-session-overlaps-why-europe-us-handover-moves-chf-futures.html` | Execution / market-quality workflow | Build a DST-aware Europe-U.S. handover plan based on observable spreads, depth, events and fills rather than a guaranteed volatility window. | Open with the overlap shifting on the UTC clock; session map -> DST cases -> event collisions -> market-quality gates -> execution branches -> review. |
| `6s-typical-liquidity-behavior-sweeps-fakeouts-slow-drifts.html` | Execution / classification workflow | Operationalize sweep, false-break and drift labels using order-book and path evidence rather than asserting a contract personality. | Open with three traders labeling the same tape differently; label definitions -> required observations -> causal sequencing -> invalidation -> replay worksheet. |
| `6s-what-moves-swiss-franc-futures.html` | Hybrid driver map | Provide the canonical daily synthesis of quote direction, SNB/Fed repricing, risk, funding, intervention evidence and liquidity while linking to specialist pages. | Open with a multi-cause move; establish quote identity -> driver triage -> evidence ladder -> conflict resolution -> daily state card. |
| `6s-why-6s-has-low-volatility-and-how-to-trade-it.html` | Empirical boundary / execution | Challenge the permanent low-volatility premise and build a measured volatility-state and risk-sizing workflow with a no-trade outcome. | Open with a quiet average hiding jump risk; distribution versus label -> state measures -> liquidity interaction -> sizing gates -> invalidation -> risk review. |

## Cross-page ownership and anti-cannibalization

- `6s-contract-specs-tick-size-margin.html` owns exchange mechanics and arithmetic. Other pages repeat only the minimum needed and link back.
- `6s-what-moves-swiss-franc-futures.html` owns the daily synthesis. SNB, U.S.-data, yield-spread, global-risk and safe-haven pages own their specialist mechanisms and must not duplicate the full driver map.
- `6s-how-6s-reacts-to-snb-rate-decisions.html` owns scheduled decision interpretation. `6s-how-snb-interventions-still-impact-swiss-franc-today.html` owns intervention authority, evidence and identification limits.
- `6s-impact-of-global-risk-events-how-chf-reacts-to-shocks.html` owns shock taxonomy. `6s-safe-haven-flows-and-why-chf-surges-in-market-panics.html` owns the CHF haven mechanism. `6s-safe-haven-vs-jpy-which-leads-in-risk-off.html` owns cross-instrument selection and testing.
- `6s-top-correlations-for-swiss-franc-futures.html` owns measured co-movement. Macro pages explain mechanisms but do not report correlation findings.
- `6s-best-times-of-day-to-trade-swiss-franc-futures.html` owns full-day market-quality comparison. `6s-session-overlaps-why-europe-us-handover-moves-chf-futures.html` owns the Europe-U.S. handover workflow. `6s-london-fix-liquidity-shifts-and-daily-flows.html` owns the benchmark-window study.
- `6s-typical-liquidity-behavior-sweeps-fakeouts-slow-drifts.html` owns tape-state labels. `6s-volatility-compression-and-breakout-behavior.html` owns a formal compression/breakout test. `6s-mean-reversion-setups-and-why-they-work.html` owns a formal reversion-strategy test.
- `6s-intraday-yield-tracking-how-bond-moves-guide-chf-futures.html` owns synchronized intraday measurement. `6s-yield-spreads-and-how-interest-rate-differentials-drive-price.html` owns the policy-path and carry mechanism.

## Shared release gates

1. Every material factual claim has a descriptive primary-source link or an explicit evidence label.
2. Current CME specifications and calculations agree across all 21 pages; broker day margin is never presented as maximum loss.
3. Metadata and visible H1s are distinct and accurate. Article and Breadcrumb schema agree with the page. FAQ schema appears only with matching visible FAQs.
4. Sources use secure authoritative URLs and record an explicit review date.
5. Navigation is keyboard usable; heading hierarchy, landmarks, tables, formulas and scroll regions are accessible at desktop and narrow widths.
6. All pages use the shared green-and-black stylesheet. No inline theme fork, alternate article shell or cluster-specific CSS is permitted.
7. Openings, H2 sequences, ending forms, component signatures, table shapes, card/process counts, FAQ presence, phrases and descriptions pass the cluster sameness audit.
8. Hubs, search, sitemap and necessary internal links are synchronized only after article content stabilizes.

## Staggered modification-date matrix

Each page's visible Updated date, Article `dateModified`, `article:modified_time`, and sitemap `lastmod` must agree. Original `datePublished` values remain historical.

| Modified date | URL files |
|---|---|
| `2026-08-17` | `6s-behavior-during-fomc-weeks-not-just-fomc-day.html`, `6s-best-times-of-day-to-trade-swiss-franc-futures.html`, `6s-chf-usd-spot-vs-futures-differences.html`, `6s-contract-specs-tick-size-margin.html` |
| `2026-08-18` | `6s-how-6s-reacts-to-snb-rate-decisions.html`, `6s-how-snb-interventions-still-impact-swiss-franc-today.html`, `6s-how-us-economic-data-moves-swiss-franc-futures.html`, `6s-impact-of-global-risk-events-how-chf-reacts-to-shocks.html` |
| `2026-08-19` | `6s-intraday-yield-tracking-how-bond-moves-guide-chf-futures.html`, `6s-london-fix-liquidity-shifts-and-daily-flows.html`, `6s-macro-triggers-ranking-the-events-that-move-chf-the-most.html`, `6s-mean-reversion-setups-and-why-they-work.html` |
| `2026-08-20` | `6s-safe-haven-flows-and-why-chf-surges-in-market-panics.html`, `6s-safe-haven-vs-jpy-which-leads-in-risk-off.html`, `6s-session-overlaps-why-europe-us-handover-moves-chf-futures.html`, `6s-top-correlations-for-swiss-franc-futures.html` |
| `2026-08-21` | `6s-typical-liquidity-behavior-sweeps-fakeouts-slow-drifts.html`, `6s-volatility-compression-and-breakout-behavior.html`, `6s-what-moves-swiss-franc-futures.html`, `6s-why-6s-has-low-volatility-and-how-to-trade-it.html`, `6s-yield-spreads-and-how-interest-rate-differentials-drive-price.html` |
