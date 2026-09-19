# Action 2 freshness and YMYL trust review

Review date: September 19, 2026

Scope: the 9 proven-value and 14 near-breakthrough URLs in the September 19 search-performance decision dataset.

Release boundary: no other content page in the 858-URL inventory was selected for editorial work.

## Outcome

- 23 of 23 priority pages were reviewed.
- 12 pages required factual, interpretive, platform-workflow, or rule-caveat corrections.
- 11 pages retained their substantive copy; only review-date, source-state, or directly related schema metadata was standardized.
- URLs, canonicals, search intent, and valid evergreen material were preserved.
- No consolidation, redirect, noindex, redesign, imagery, or archive work was performed.

## Pages with substantive trust corrections

| Priority | Risk | Page | Review and change record |
|---|---|---|---|
| Proven | High | `/futures-basics/feeder-cattle-vs-live-cattle-pricing-mechanics.html` | Corrected expiration mechanics: Live Cattle is physically delivered; Feeder Cattle is financially settled to the CME Feeder Cattle Index. Recast deterministic ratio/placement claims as hypotheses requiring cash, feed-cost, and Cattle on Feed confirmation. Added CME sources and changing-specification caveat. |
| Proven | Moderate | `/market-basics/liquidity-migration-how-liquidity-shifts-through-session.html` | Removed claims that displayed liquidity proves participant intent or forecasts direction. Distinguished observations from tests; added displayed-order/cancellation/hidden-liquidity limitations and CME/CFTC context. |
| Proven | High | `/energies/cl-tick-size-tick-value-specs.html` | Verified CL contract size and tick value. Distinguished exchange performance bonds from broker margin, clarified physical-delivery and broker cutoff risk, identified month selection as platform-specific, and marked calculations illustrative. |
| Proven | High | `/platforms-tutorials/ninjatrader-8-chart-settings-basics.html` | Corrected scaling workflow to current Fixed versus Automatic behavior and reset navigation. Updated template guidance and added version/workspace caveat with official NinjaTrader sources. |
| Proven | High | `/platforms-tutorials/tradovate-chart-settings-complete-guide.html` | Replaced stale/right-click-specific instructions with the current gear-settings workflow. Marked settings as illustrative and added version/workspace caveat with official Tradovate sources. |
| Proven | High | `/futures-basics/gc-tick-size-tick-value-specs.html` | Verified 100-troy-ounce contract and $10 minimum tick. Corrected current listing schedule, separated exchange specifications from broker requirements, and added delivery/cutoff and illustrative-risk caveats. |
| Proven | High | `/platforms-tutorials/bookmap-connections-and-data-feeds.html` | Removed unsupported “fastest” and universal prop/broker claims. Broadened connection scope to Bookmap's current provider model and added entitlement, provider, symbol, and plan caveats. |
| Near-breakthrough | High | `/prop-firm-trading/trailing-drawdown-explained.html` | Reframed trailing drawdown as a nonstandard provider rule. Distinguished balance/equity inputs, intraday/end-of-day clocks, floors, and breach comparisons; made the numerical walkthrough explicitly illustrative. |
| Near-breakthrough | High | `/prop-firm-trading/prop-firm-refund-policy-explained.html` | Replaced unsupported industry-wide prevalence and timing claims with an evidence-led refund audit framework. Added current Topstep examples while explicitly stating they are one provider's rules, not an industry standard. |
| Near-breakthrough | High | `/tools/trailing-drawdown-simulator.html` | Removed the “Apex-style” label and documented the simulator's exact simplified model. Added current first-party examples showing why provider, program, stage, clock, high-water input, and breach comparison must be checked separately. |
| Near-breakthrough | Moderate | `/futures-basics/gc-liquidity-levels-structure.html` | Removed deterministic intent, stop-hunt, predictive, and “reliable setup” language. Reframed the material as a falsifiable observation framework with market-data limitations and current CME/CFTC sources. |
| Near-breakthrough | Low | `/market-basics/micro-pullbacks-tiny-retracements-reveal-intent.html` | Removed claims that small pullbacks reveal intent or provide the safest entry. Reframed examples as testable observations and added leverage/execution context from CFTC and CME sources. |

## Pages reviewed without gratuitous substantive rewriting

| Priority | Risk | Page | Review record |
|---|---|---|---|
| Proven | High | `/` | Added visible library-scope/trust review state and directly related page date metadata. Existing search intent and homepage copy preserved. |
| Proven | Moderate | `/books/metals-market-structure/` | Added visible product-information review state and Book `dateModified`; product copy preserved. |
| Near-breakthrough | Low | `/tools/` | Added visible tool-description/scope review state and page date metadata; tool hub copy preserved. |
| Near-breakthrough | Low | `/about.html` | Added visible profile/editorial-scope review state and page date metadata; profile copy preserved. |
| Near-breakthrough | Low | `/contact.html` | Added visible contact-information review state and page date metadata; contact copy preserved. |
| Near-breakthrough | High | `/privacy.html` | Added a visible statement that the notice was reviewed and did not claim a policy change; privacy copy preserved. |
| Near-breakthrough | Low | `/books/` | Added visible catalog review state and CollectionPage `dateModified`; catalog copy preserved. |
| Near-breakthrough | Low | `/futures-basics/gc-market-microstructure.html` | Standardized visible review date and added missing Open Graph article dates; evergreen material preserved. |
| Near-breakthrough | Low | `/futures-basics/6s-chf-usd-spot-vs-futures-differences.html` | Standardized the existing review/date state; current first-party sourcing and substantive copy preserved. |
| Near-breakthrough | Low | `/futures-basics/m6n-micro-contract-guide.html` | Standardized the existing review/date state; existing explanation that M6N is not a listed CME symbol was preserved. |
| Near-breakthrough | Low | `/futures-basics/es-session-highs-lows-and-vwap-usage.html` | Standardized the existing review/date state; evergreen session/VWAP framework preserved. |

## Authoritative source classes checked

- CME Group contract pages, current product material, and the applicable NYMEX/COMEX rulebook chapters for cattle, WTI Crude Oil, Gold, and FX.
- CFTC futures-market education for leverage, orders, and market-data limitations.
- NinjaTrader, Tradovate, and Bookmap first-party documentation for platform behavior and connectivity.
- Current Topstep and My Funded Futures first-party help policies as explicitly labeled examples of provider-specific prop rules.

Each materially corrected article now contains its own source links, review date, and a change-risk statement. First-party provider rules are presented as examples, not as universal or permanent rules.

## Trust metadata and presentation

- Legacy Article pages now expose consistent `datePublished`, `dateModified`, Open Graph article dates, and a visible September 19, 2026 reviewed/update date.
- Existing modern Article pages retain their schema structure with standardized review dates; missing Open Graph article dates were added where needed.
- Reviewed non-article pages received scoped visible review notes and appropriate `dateModified` metadata without implying that unchanged legal or commercial terms changed.
- Two small reusable styles support the review and source disclosures; this is not a redesign.

## Verification record

Pre-release scoped checks:

- Exact priority-page allowlist: 23 of 23.
- Exactly one H1 and a visible September 19, 2026 review state: 23 of 23.
- Article schema and Open Graph dates internally consistent: pass.
- JSON-LD parses on all 23 pages: pass.
- Added authoritative-source links use HTTPS: pass.
- Regression assertions for removed high-risk claims: pass.

The release retains search-index metadata changes only for the seven reviewed pages whose descriptions changed; baseline ordering and all other entries are preserved. Sitemap dates were synchronized through the existing governed cluster scripts. The full repository suite, deployment result, and live HTTP verification are recorded in the release commit and CI history for this Action 2 release.
