"""Shared release configuration for the rebuilt ES/MES and NQ/MNQ library."""

from pathlib import Path


BASE_URL = "https://grizzlyparrottrading.com"
ROOT = Path(__file__).resolve().parents[1]
ARTICLE_DIR = ROOT / "futures-basics"
SOURCE_REVIEW_DATE = "2026-08-28"

CLUSTER = (
    "best-times-to-trade-es-e-mini-sp500.html",
    "es-atr-behavior-and-volatility-zones.html",
    "es-building-a-simple-trading-plan.html",
    "es-common-retail-trader-mistakes.html",
    "es-gap-behavior-and-how-to-trade-it.html",
    "es-how-to-size-positions-by-account-balance.html",
    "es-intraday-support-and-resistance-levels.html",
    "es-key-economic-reports-that-move-price.html",
    "es-liquidity-pockets-and-order-book-structure.html",
    "es-market-structure-trends-pulls-and-reversals.html",
    "es-mini-vs-mes-micro-which-should-you-trade.html",
    "es-news-events-and-volatility-traps.html",
    "es-opening-range-strategies-for-beginners.html",
    "es-overnight-session-vs-regular-trading-hours.html",
    "es-roll-dates-and-contract-switching.html",
    "es-scalping-vs-swing-trading-pros-and-cons.html",
    "es-session-highs-lows-and-vwap-usage.html",
    "es-tick-size-tick-value-and-margin.html",
    "es-using-dom-and-time-and-sales.html",
    "es-using-spy-and-spx-as-confirmation.html",
    "es-vs-mes-vs-nq.html",
    "mnq-bad-habits.html",
    "nq-best-times.html",
    "nq-earnings-impact.html",
    "nq-execution-mistakes.html",
    "nq-liquidity-windows.html",
    "nq-margin.html",
    "nq-news-volatility.html",
    "nq-position-sizing.html",
    "nq-pullbacks-vs-breakouts.html",
    "nq-tick-value.html",
    "nq-volatility-vs-es.html",
    "nq-vs-es.html",
    "nq-what-is-nq.html",
    "why-futures-lead-the-stock-market.html",
)

MODIFIED_DATES = {
    "best-times-to-trade-es-e-mini-sp500.html": "2026-08-24",
    "es-common-retail-trader-mistakes.html": "2026-08-24",
    "es-liquidity-pockets-and-order-book-structure.html": "2026-08-24",
    "es-roll-dates-and-contract-switching.html": "2026-08-24",
    "mnq-bad-habits.html": "2026-08-24",
    "nq-news-volatility.html": "2026-08-24",
    "nq-what-is-nq.html": "2026-08-24",
    "es-atr-behavior-and-volatility-zones.html": "2026-08-25",
    "es-gap-behavior-and-how-to-trade-it.html": "2026-08-25",
    "es-market-structure-trends-pulls-and-reversals.html": "2026-08-25",
    "es-scalping-vs-swing-trading-pros-and-cons.html": "2026-08-25",
    "nq-best-times.html": "2026-08-25",
    "nq-position-sizing.html": "2026-08-25",
    "why-futures-lead-the-stock-market.html": "2026-08-25",
    "es-building-a-simple-trading-plan.html": "2026-08-26",
    "es-how-to-size-positions-by-account-balance.html": "2026-08-26",
    "es-mini-vs-mes-micro-which-should-you-trade.html": "2026-08-26",
    "es-session-highs-lows-and-vwap-usage.html": "2026-08-26",
    "nq-earnings-impact.html": "2026-08-26",
    "nq-pullbacks-vs-breakouts.html": "2026-08-26",
    "nq-tick-value.html": "2026-08-26",
    "es-intraday-support-and-resistance-levels.html": "2026-08-27",
    "es-key-economic-reports-that-move-price.html": "2026-08-27",
    "es-opening-range-strategies-for-beginners.html": "2026-08-27",
    "es-using-dom-and-time-and-sales.html": "2026-08-27",
    "nq-execution-mistakes.html": "2026-08-27",
    "nq-margin.html": "2026-08-27",
    "nq-volatility-vs-es.html": "2026-08-27",
    "es-news-events-and-volatility-traps.html": "2026-08-28",
    "es-overnight-session-vs-regular-trading-hours.html": "2026-08-28",
    "es-tick-size-tick-value-and-margin.html": "2026-08-28",
    "es-using-spy-and-spx-as-confirmation.html": "2026-08-28",
    "es-vs-mes-vs-nq.html": "2026-08-28",
    "nq-liquidity-windows.html": "2026-08-28",
    "nq-vs-es.html": "2026-08-28",
}

PUBLISHED_DATES = {
    **{name: "2025-11-24" for name in CLUSTER if name.startswith("es-")},
    "best-times-to-trade-es-e-mini-sp500.html": "2025-11-24",
    "es-vs-mes-vs-nq.html": "2025-11-17",
    **{name: "2025-12-12" for name in CLUSTER if name.startswith(("nq-", "mnq-"))},
    "why-futures-lead-the-stock-market.html": "2025-11-20",
}

VISIBLE_MODIFIED_DATES = {
    value: f"Updated August {int(value[-2:])}, 2026"
    for value in set(MODIFIED_DATES.values())
}

ES_MECHANICS = "es-tick-size-tick-value-and-margin.html"
NQ_MECHANICS = "nq-tick-value.html"

EMPIRICAL_PROTOCOL_PAGES = {
    "best-times-to-trade-es-e-mini-sp500.html",
    "es-atr-behavior-and-volatility-zones.html",
    "es-gap-behavior-and-how-to-trade-it.html",
    "es-liquidity-pockets-and-order-book-structure.html",
    "es-market-structure-trends-pulls-and-reversals.html",
    "es-opening-range-strategies-for-beginners.html",
    "es-overnight-session-vs-regular-trading-hours.html",
    "es-session-highs-lows-and-vwap-usage.html",
    "nq-best-times.html",
    "nq-liquidity-windows.html",
    "nq-pullbacks-vs-breakouts.html",
    "nq-volatility-vs-es.html",
}

PRIMARY_HOST_SUFFIXES = (
    "cmegroup.com",
    "spglobal.com",
    "spglobal.com/spdji",
    "nasdaq.com",
    "indexes.nasdaqomx.com",
    "federalreserve.gov",
    "bls.gov",
    "bea.gov",
    "sec.gov",
    "cftc.gov",
    "nyse.com",
)


def required_mechanics_link(filename: str) -> str | None:
    if filename == "why-futures-lead-the-stock-market.html":
        return None
    if filename.startswith(("nq-", "mnq-")):
        return None if filename == NQ_MECHANICS else NQ_MECHANICS
    return None if filename == ES_MECHANICS else ES_MECHANICS


assert set(CLUSTER) == set(MODIFIED_DATES) == set(PUBLISHED_DATES)
