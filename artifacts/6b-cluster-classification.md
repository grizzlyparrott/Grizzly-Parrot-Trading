# Core 6B article classification and writing map

Date: 2026-08-13
Scope: the 20 existing core British Pound futures URLs listed below. The futures and currency hubs, search index, sitemap, shared stylesheet, and validation code are root-owned synchronization work, not extra article assignments.

## Cluster editorial model

- One publisher: Kyle Parrott / Grizzly Parrot Trading.
- One evidence standard: current primary sources; facts, mechanisms, observations, hypotheses, inferences, and trading applications remain visibly distinct.
- One contract-mechanics authority: `6b-contract-specs-tick-size-and-margin.html`. Other pages summarize only the mechanics needed for their question and link to that canonical treatment.
- No unrun study becomes a finding. Empirical pages disclose their measurement design and explicitly state when they report no original result.
- No deterministic trade language. A setup is a decision or testing framework with invalidation, execution friction, and failure conditions.
- Architecture follows search intent. FAQ sections and FAQ schema are optional and must appear together; neither is a cluster-wide template requirement.

## Writer 1: research and measurement

| URL file | Archetype | Distinct reader purpose | Planned architecture and opening | Planned ending |
|---|---|---|---|---|
| `6b-pullbacks-what-clean-retracements-look-like.html` | Empirical / testing + execution hybrid | Turn the vague phrase “clean pullback” into measurable, falsifiable variables. | Open with the contradiction that visual cleanliness is not an objective edge; operational definition -> event labeling -> baseline comparison -> execution interpretation -> failure cases. | Annotated research checklist that separates descriptive labels from validated expectancy. |
| `6b-volatility-compression-and-expansion-patterns.html` | Empirical / testing | Test whether a defined compression state changes the later distribution of range, direction, or execution cost. | Open with a range calculation; define compression without hindsight -> construct the event sample -> measure expansion -> control session/news/roll effects -> robustness. | Evidence hierarchy: descriptive fact, conditional observation, unproven trading rule. |
| `common-liquidity-traps-in-6b-futures.html` | Empirical / testing + execution hybrid | Replace “stop hunt” stories with observable auction and liquidity hypotheses. | Open with a misconception; claims -> observable proxies -> alternative explanations -> replay protocol -> live risk controls. | Failure-case catalog and post-event review fields. |
| `gbp-usd-correlation-with-6b-futures.html` | Comparison / empirical hybrid | Explain the near-equivalence, dated-futures basis, and the right way to measure any remaining divergence. | Open with the futures-pricing relationship rather than a claimed correlation statistic; instrument identity -> basis/carry -> synchronized-return test -> apparent breaks -> appropriate use. | Concise “same exposure, different instrument” synthesis plus measurement cautions. |
| `london-session-volatility-patterns-in-6b.html` | Empirical / testing | Show how to investigate session behavior without claiming a universal London pattern. | Open with a timezone/DST problem; define session clock -> build minute sample -> metrics and controls -> regime splits -> execution implications. | Reproducible session-study protocol. |
| `using-gbpusd-divergence-to-trade-6b-futures.html` | Empirical / testing + comparison hybrid | Determine whether a screen divergence is stale data, basis, contract choice, or a testable signal. | Open with a two-screen discrepancy scenario; synchronize symbols/timestamps -> reconcile fair basis -> classify residual -> test forward outcomes -> risk gate. | Decision tree: reconcile, discard, investigate, or test—never automatic trade. |
| `why-6b-trends-during-us-session.html` | Empirical / testing + causal hybrid | Test whether early U.S. hours trend more than a declared baseline and explain plausible overlap/news channels. | Open as a research question; define “early U.S.” and “trend” -> competing mechanisms -> sample construction -> controls -> interpretation. | Falsification criteria and related-reading path. |

## Writer 2: mechanism and explanation

| URL file | Archetype | Distinct reader purpose | Planned architecture and opening | Planned ending |
|---|---|---|---|---|
| `british-pound-volatility-drivers-in-6b.html` | Macro / causal explanation | Provide the canonical map of GBP repricing drivers without duplicating the event-specific pages. | Open with the direct distinction between a volatility catalyst and a directional forecast; mechanism map -> relative-rate channel -> growth/inflation mix -> fiscal/political risk -> global USD/liquidity -> confirmation. | Ranked evidence hierarchy and route to specialized pages. |
| `how-6b-reacts-to-boe-rate-decisions.html` | Macro / causal explanation + event workflow | Explain why the vote, guidance, forecast, and market prior can matter more than the headline rate. | Open with an unchanged-rate/hawkish-guidance scenario; pre-decision pricing -> decision package -> transmission channels -> competing forces -> event timeline -> cautious interpretation. | Scenario matrix keyed to surprise versus prior, with no directional guarantee. |
| `how-uk-cpi-inflation-moves-6b-futures.html` | Macro / causal explanation | Explain CPI surprise, composition, persistence, and the conditional BoE/rates channel. | Open with a calculation of surprise versus consensus; release anatomy -> wage/services persistence -> rates repricing -> GBP/USD and 6B -> reasons the first reaction can reverse. | Evidence checklist for reading a release, not a setup list. |
| `how-uk-economic-data-releases-impact-6b-futures.html` | Macro comparison / decision guide hybrid | Act as the event-family overview and route readers to CPI and labour/GDP depth pages. | Open with the decision problem “which release matters today?”; information hierarchy -> surprise/prior/revisions -> release families -> calendar workflow -> cross-market confirmation. | Compact event-preparation workflow and canonical links. |
| `how-uk-gdp-and-employment-data-move-6b.html` | Macro / causal comparison | Contrast growth-output data with labour, wage, and revisions evidence without collapsing them into one signal. | Open with a mixed-data scenario; two transmission maps -> data-construction caveats -> revisions and reliability -> conditional market scenarios -> confirmation. | Two-axis growth/labour scenario matrix. |
| `how-uk-political-events-affect-6b-futures.html` | Macro / causal explanation | Translate political news into fiscal, institutional, trade, and policy-continuity channels. | Open with the misconception that political drama automatically weakens sterling; event taxonomy -> transmission channels -> market-pricing sequence -> historical context used cautiously -> live verification. | Source-and-confirmation ladder for unscheduled news. |

## Writer 3: practical systems and decisions

| URL file | Archetype | Distinct reader purpose | Planned architecture and opening | Planned ending |
|---|---|---|---|---|
| `6b-breakout-levels-how-to-identify-high-probability-zones.html` | Execution / decision workflow | Replace “high probability” assertion with a predeclared breakout-candidate and validation process. | Open with a rejected-candidate example; objective -> level provenance -> market-quality gate -> trigger/invalidation -> position math -> review. | Pass/stand-aside decision card and journal fields. |
| `6b-contract-specs-tick-size-and-margin.html` | Reference / specification | Give current, source-verifiable 6B/M6B mechanics, exact arithmetic, expiry/delivery, and margin limits. | Open with contract-unit x price-increment calculation; verified spec card -> P&L and notional math -> standard/micro comparison -> margin -> listed months/expiry/delivery. | Calculation summary and pre-order verification list. |
| `analyzing-weekly-trends-and-swings-in-6b.html` | Execution / decision workflow | Build a weekly context process without treating a chart label as predictive. | Open with a top-down decision problem; define swing algorithm -> map dated-contract/continuous-chart issues -> scenario branches -> intraday handoff -> review. | Weekly preparation worksheet. |
| `how-to-read-6b-order-flow-for-clean-entries.html` | Execution / decision workflow | Explain what futures order-flow tools actually observe, data prerequisites, and a level-first decision process. | Open with the limitation that footprint/delta describes executed futures trades, not the whole OTC GBP market; inputs -> context -> observations -> decision branches -> execution -> replay. | Data-quality and invalidation checklist. |
| `how-us-dollar-strength-confirms-or-invalidates-6b-setups.html` | Comparison / decision guide | Use broad-dollar and relative-rate evidence without double-counting GBP/USD or declaring confirmation automatic. | Open with the contradiction that 6B itself already contains USD; define independent evidence -> choose comparator -> scenario branches -> invalidation -> event caveats. | Confirmation matrix with “independent / circular / conflicting” classifications. |
| `reading-short-term-momentum-in-6b.html` | Execution / decision workflow | Convert momentum language into observable price, range, participation, and invalidation inputs. | Open with a compact market snapshot; objective -> inputs -> state classification -> entry/no-entry branches -> loss-of-momentum conditions -> review. | One-page operational workflow. |
| `why-6b-reacts-differently-than-6e-in-risk-on-markets.html` | Comparison / decision guide + macro hybrid | Compare GBP and EUR exposures without fixed “risk-on” stereotypes. | Open with two risk-on days that produce opposite relative outcomes; define risk regime -> compare policy/growth/external channels -> scenario matrix -> instrument and spread implications. | Fit guide stating when comparison is informative, ambiguous, or unusable. |

## Cross-page boundaries

- `british-pound-volatility-drivers...` is the broad causal map; event pages own detailed release mechanics.
- `how-uk-economic-data-releases...` is the event-family overview; `how-uk-cpi...` and `how-uk-gdp-and-employment...` own their specific releases.
- `gbp-usd-correlation...` owns instrument equivalence, basis, and synchronized measurement; `using-gbpusd-divergence...` owns the discrepancy-triage workflow.
- `london-session...` and `why-6b-trends-during-us-session...` must define non-overlapping clock windows and avoid repeating a generic session-phase template.
- `reading-short-term-momentum...`, `6b-pullbacks...`, `6b-volatility-compression...`, and `6b-breakout-levels...` must define separate phenomena and link rather than restate each other.
- `how-to-read-6b-order-flow...` owns futures trade/quote evidence and its data limitations; `common-liquidity-traps...` owns hypothesis testing around auction narratives.

## Shared release gates

1. Every primary claim has a primary source or is explicitly labeled as mechanism, hypothesis, or inference.
2. Current CME specifications and calculations agree across all 20 pages.
3. Metadata and Article/Breadcrumb schema agree with visible content; FAQ schema exists only with matching visible FAQs.
4. Sources use descriptive link text, secure authoritative URLs, and an explicit review date.
5. Navigation is keyboard usable, tables have semantic headers and scroll regions, and headings remain hierarchical.
6. The 20 H2 sequences, openers, endings, table shapes, card counts, and repeated phrases pass a cluster-level sameness audit.
7. Hubs, search index, sitemap, and internal links are rebuilt only after article content stabilizes.
