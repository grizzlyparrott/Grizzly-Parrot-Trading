# Equity-index cluster source basis

Review date: 2026-08-28

This is the shared fact boundary for the ES/MES and NQ/MNQ rebuild. It records authoritative sources and the limited claims they support. It is not a substitute for page-specific sourcing or for checking a broker's current requirements.

## Contract mechanics

- [CME Chapter 358: E-mini S&P 500 futures](https://www.cmegroup.com/rulebook/CME/IV/350/358/358.pdf): ES is $50 times the S&P 500 Index; the outright minimum is 0.25 point ($12.50) and the intermonth spread minimum is 0.05 point ($2.50); expiration trading terminates at the regularly scheduled NYSE open on the final-settlement day; delivery is cash settlement; final settlement uses the S&P 500 Special Opening Quotation.
- [CME Chapter 353: Micro E-mini S&P 500 futures](https://www.cmegroup.com/rulebook/CME/IV/350/353/353.pdf): MES is $5 times the S&P 500 Index; the outright minimum is 0.25 point ($1.25) and the intermonth spread minimum is 0.05 point ($0.25); trading cannot continue after the Primary Listing Exchange opens on the determination day; delivery is cash settlement; final settlement uses component opening prices in the S&P 500 Special Opening Quotation.
- [CME Chapter 359: E-mini Nasdaq-100 futures](https://www.cmegroup.com/rulebook/CME/IV/350/359/359.pdf): NQ is $20 times the Nasdaq-100 Index; the outright minimum is 0.25 point ($5) and the intermonth spread minimum is 0.05 point ($1); expiration trading terminates at the regularly scheduled Nasdaq open; delivery is cash settlement; final settlement expressly uses each component's Nasdaq Official Opening Price in the Nasdaq-100 Special Opening Quotation.
- [CME Chapter 361: Micro E-mini Nasdaq-100 futures](https://www.cmegroup.com/rulebook/CME/IV/350/361.pdf): MNQ is $2 times the Nasdaq-100 Index; the outright minimum is 0.25 point ($0.50) and the intermonth spread minimum is 0.05 point ($0.10); trading cannot continue after the Primary Listing Exchange opens; delivery is cash settlement; final settlement is based on component opening prices. Chapter 361 does not attribute that component record to NOOP terminology.
- The chapters' unscheduled-Market-Holiday provisions move termination to the immediately preceding business day's NYSE close and substitute that prior day's Official Index Closing Value. Component-opening fallbacks differ by product and must remain attributed to the applicable chapter and current settlement procedure.
- Current listing depth is an Exchange-determined live field, not a timeless rulebook constant. Reviewed August 28, 2026: [ES specifications](https://www.cmegroup.com/markets/equities/sp/e-mini-sandp500.contractSpecs.html) list 21 consecutive quarterly contracts; [MES specifications](https://www.cmegroup.com/markets/equities/sp/micro-e-mini-sandp-500.contractSpecs.html) list 5; [NQ specifications](https://www.cmegroup.com/markets/equities/nasdaq/e-mini-nasdaq-100.contractSpecs.html) list 6 consecutive quarters plus 2 additional June and 4 additional December contracts; [MNQ specifications](https://www.cmegroup.com/markets/equities/nasdaq/micro-e-mini-nasdaq-100.contractSpecs.html) list 5 consecutive quarters.
- Standard outright futures hours are Sunday through Friday, 5:00 p.m.-4:00 p.m. CT, with a 4:00-5:00 p.m. CT maintenance halt. TACO, BTIC, TMAC and other special routes have their own increments, hours and expiration-week cutoffs; standard-session language must not be generalized to them.
- Trading schedules, product listings, holiday exceptions, maintenance breaks, performance bonds, and broker intraday margins are changeable. Articles must point readers to the current CME calendar/specification and their broker instead of freezing a broker number or presenting margin as maximum loss.

## Underlying indexes

- [S&P U.S. Indices Methodology](https://www.spglobal.com/spdji/en/methodology/article/sp-us-indices-methodology/) supports describing the S&P 500 as a float-adjusted market-capitalization-weighted large-cap U.S. equity index composed of 500 constituent companies. It does not support calling the index a passive list of the 500 largest companies.
- [Nasdaq-100 methodology](https://indexes.nasdaqomx.com/docs/methodology_NDX.pdf) supports describing the Nasdaq-100 as a modified-market-capitalization-weighted index designed to measure 100 of the largest Nasdaq-listed non-financial companies. Multiple securities from one company and temporary constituent counts above 100 are possible, so pages must distinguish companies, securities, and the index name.

## Event and market-structure evidence

- Use the responsible institution for scheduled macro claims: [Federal Reserve FOMC calendars and statements](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm), [BLS CPI](https://www.bls.gov/cpi/) and Employment Situation material, and [BEA GDP](https://www.bea.gov/data/gdp/gross-domestic-product) and PCE material.
- Use [SEC EDGAR](https://www.sec.gov/edgar/search/) or issuer investor-relations releases for earnings facts. Do not imply that every constituent has the same index impact; index weight, the surprise relative to expectations, cross-company information, and the rate response are competing channels.
- Use [CME equity-index price-limit material](https://www.cmegroup.com/trading/price-limits.html) and the current rulebook for limit and halt mechanics. Do not convert regulatory bands into ordinary support or resistance.

## Editorial boundary

- A timing, volatility, gap, liquidity, VWAP, opening-range, overnight, pullback, breakout, or lead-lag page may publish a reproducible protocol. Unless the study was actually run on identified data with costs and holdouts, it must say explicitly that it reports no original finding, edge, win rate, or probability.
- Examples are arithmetic or decision examples, not backtest results. Hypothetical numbers must be labeled hypothetical.
- Descriptive relationships are conditional. No page may claim a permanent best time, universal indicator, guaranteed fill, inevitable event reaction, fixed support/resistance zone, or automatic profitability.
