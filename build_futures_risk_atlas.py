#!/usr/bin/env python3
"""Build the source-backed Futures Risk Atlas and downloadable datasets."""

from __future__ import annotations

import csv
import html
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
TOOLS = ROOT / "tools"
DATA_DIR = TOOLS / "data"
VERIFIED = "2026-08-03"
CANONICAL = "https://grizzlyparrottrading.com/tools/futures-risk-atlas.html"


def contract(
    symbol: str,
    name: str,
    asset_class: str,
    exchange: str,
    contract_unit: str,
    quote_unit: str,
    tick_size: float,
    tick_value: float,
    settlement: str,
    source_url: str,
    source_title: str,
    note: str = "",
) -> dict:
    # Keep machine-readable exports free of binary floating-point artifacts
    # such as 499999.99999999994 while preserving sub-cent tick economics.
    point_value = round(tick_value / tick_size, 9)
    return {
        "symbol": symbol,
        "name": name,
        "asset_class": asset_class,
        "exchange": exchange,
        "contract_unit": contract_unit,
        "quote_unit": quote_unit,
        "outright_tick_size": tick_size,
        "tick_value_usd": tick_value,
        "usd_per_1_quote_unit": point_value,
        "settlement": settlement,
        "scope_note": note or "CME Globex outright futures tick; spreads and options excluded.",
        "source_title": source_title,
        "source_url": source_url,
        "verified_on": VERIFIED,
    }


FX_GUIDE = "https://www.cmegroup.com/markets/fx/fx-product-guide.html"
FX_TITLE = "CME Group FX Product Guide 2026"
MICRO_METALS = "https://www.cmegroup.com/markets/microsuite/metals.html"
MICRO_METALS_TITLE = "CME Group Micro Metals contract specifications"
TREASURY_GUIDE = "https://www.cmegroup.com/content/dam/cmegroup/trading/interest-rates/files/us-treasury-futures-delivery-process.pdf"
TREASURY_TITLE = "CME Group Treasury Futures Delivery Process"


CONTRACTS = [
    # Equity indexes
    contract("ES", "E-mini S&P 500", "Equity Index", "CME", "$50 x S&P 500 Index", "index points", 0.25, 12.50, "Financial", "https://www.cmegroup.com/markets/equities/sp/e-mini-sandp500.contractSpecs.html", "CME Group E-mini S&P 500 contract specifications"),
    contract("MES", "Micro E-mini S&P 500", "Equity Index", "CME", "$5 x S&P 500 Index", "index points", 0.25, 1.25, "Financial", "https://www.cmegroup.com/markets/equities/sp/micro-e-mini-sandp-500.html", "CME Group Micro E-mini S&P 500 overview"),
    contract("NQ", "E-mini Nasdaq-100", "Equity Index", "CME", "$20 x Nasdaq-100 Index", "index points", 0.25, 5.00, "Financial", "https://www.cmegroup.com/markets/equities/nasdaq/e-mini-nasdaq-100.contractSpecs.html", "CME Group E-mini Nasdaq-100 contract specifications"),
    contract("MNQ", "Micro E-mini Nasdaq-100", "Equity Index", "CME", "$2 x Nasdaq-100 Index", "index points", 0.25, 0.50, "Financial", "https://www.cmegroup.com/markets/equities/nasdaq/micro-e-mini-nasdaq-100.html", "CME Group Micro E-mini Nasdaq-100 overview"),
    contract("YM", "E-mini Dow", "Equity Index", "CBOT", "$5 x DJIA Index", "index points", 1.0, 5.00, "Financial", "https://www.cmegroup.com/markets/equities/dow-jones/e-mini-dow.contractSpecs.html", "CME Group E-mini Dow contract specifications"),
    contract("MYM", "Micro E-mini Dow", "Equity Index", "CBOT", "$0.50 x DJIA Index", "index points", 1.0, 0.50, "Financial", "https://www.cmegroup.com/markets/equities/dow-jones/micro-e-mini-dow.html", "CME Group Micro E-mini Dow overview"),
    contract("RTY", "E-mini Russell 2000", "Equity Index", "CME", "$50 x Russell 2000 Index", "index points", 0.10, 5.00, "Financial", "https://www.cmegroup.com/markets/equities/russell/e-mini-russell-2000.contractSpecs.html", "CME Group E-mini Russell 2000 contract specifications"),
    contract("M2K", "Micro E-mini Russell 2000", "Equity Index", "CME", "$5 x Russell 2000 Index", "index points", 0.10, 0.50, "Financial", "https://www.cmegroup.com/markets/equities/russell/micro-e-mini-russell-2000.html", "CME Group Micro E-mini Russell 2000 overview"),

    # Foreign exchange; tick sizes follow the 2026 CME Globex outright column.
    contract("6E", "Euro FX", "FX", "CME", "125,000 euro", "USD per euro", 0.00005, 6.25, "Physical", FX_GUIDE, FX_TITLE),
    contract("M6E", "Micro EUR/USD", "FX", "CME", "12,500 euro", "USD per euro", 0.0001, 1.25, "Physical", FX_GUIDE, FX_TITLE),
    contract("6J", "Japanese Yen", "FX", "CME", "12,500,000 yen", "USD per yen", 0.0000005, 6.25, "Physical", FX_GUIDE, FX_TITLE),
    contract("MJY", "Micro JPY/USD", "FX", "CME", "1,250,000 yen", "USD per yen", 0.000001, 1.25, "Physical", FX_GUIDE, FX_TITLE),
    contract("6B", "British Pound", "FX", "CME", "62,500 pound sterling", "USD per pound sterling", 0.0001, 6.25, "Physical", FX_GUIDE, FX_TITLE),
    contract("M6B", "Micro GBP/USD", "FX", "CME", "6,250 pound sterling", "USD per pound sterling", 0.0001, 0.625, "Physical", FX_GUIDE, FX_TITLE),
    contract("6A", "Australian Dollar", "FX", "CME", "100,000 Australian dollars", "USD per Australian dollar", 0.00005, 5.00, "Physical", FX_GUIDE, FX_TITLE),
    contract("M6A", "Micro AUD/USD", "FX", "CME", "10,000 Australian dollars", "USD per Australian dollar", 0.0001, 1.00, "Physical", FX_GUIDE, FX_TITLE),
    contract("6C", "Canadian Dollar", "FX", "CME", "100,000 Canadian dollars", "USD per Canadian dollar", 0.00005, 5.00, "Physical", FX_GUIDE, FX_TITLE),
    contract("MCD", "Micro CAD/USD", "FX", "CME", "10,000 Canadian dollars", "USD per Canadian dollar", 0.0001, 1.00, "Physical", FX_GUIDE, FX_TITLE),
    contract("6S", "Swiss Franc", "FX", "CME", "125,000 Swiss francs", "USD per Swiss franc", 0.00005, 6.25, "Physical", FX_GUIDE, FX_TITLE),
    contract("MSF", "Micro CHF/USD", "FX", "CME", "12,500 Swiss francs", "USD per Swiss franc", 0.0001, 1.25, "Physical", FX_GUIDE, FX_TITLE),
    contract("6N", "New Zealand Dollar", "FX", "CME", "100,000 New Zealand dollars", "USD per New Zealand dollar", 0.00005, 5.00, "Physical", FX_GUIDE, FX_TITLE),
    contract("6M", "Mexican Peso", "FX", "CME", "500,000 Mexican pesos", "USD per Mexican peso", 0.00001, 5.00, "Physical", FX_GUIDE, FX_TITLE),
    contract("6Z", "South African Rand", "FX", "CME", "500,000 rand", "USD per rand", 0.000025, 12.50, "Physical", FX_GUIDE, FX_TITLE),
    contract("6L", "Brazilian Real", "FX", "CME", "100,000 Brazilian real", "USD per Brazilian real", 0.00005, 5.00, "Financial", FX_GUIDE, FX_TITLE),

    # Energy
    contract("CL", "WTI Crude Oil", "Energy", "NYMEX", "1,000 barrels", "USD per barrel", 0.01, 10.00, "Physical", "https://www.cmegroup.com/markets/energy/crude-oil/light-sweet-crude.contractSpecs.html", "CME Group WTI Crude Oil contract specifications"),
    contract("MCL", "Micro WTI Crude Oil", "Energy", "NYMEX", "100 barrels", "USD per barrel", 0.01, 1.00, "Financial", "https://www.cmegroup.com/education/articles-and-reports/micro-wti-crude-oil-futures-faq", "CME Group Micro WTI Crude Oil futures FAQ"),
    contract("NG", "Henry Hub Natural Gas", "Energy", "NYMEX", "10,000 MMBtu", "USD per MMBtu", 0.001, 10.00, "Physical", "https://www.cmegroup.com/markets/energy/natural-gas/natural-gas.contractSpecs.html", "CME Group Henry Hub Natural Gas contract specifications"),
    contract("QG", "E-mini Natural Gas", "Energy", "NYMEX", "2,500 MMBtu", "USD per MMBtu", 0.005, 12.50, "Financial", "https://www.cmegroup.com/markets/energy/natural-gas/emini-natural-gas.contractSpecs.html", "CME Group E-mini Natural Gas contract specifications"),
    contract("RB", "RBOB Gasoline", "Energy", "NYMEX", "42,000 gallons", "USD per gallon", 0.0001, 4.20, "Physical", "https://www.cmegroup.com/education/courses/introduction-to-refined-products/rbob-product-overview", "CME Group RBOB product overview"),
    contract("HO", "NY Harbor ULSD", "Energy", "NYMEX", "42,000 gallons", "USD per gallon", 0.0001, 4.20, "Physical", "https://www.cmegroup.com/markets/energy/refined-products/heating-oil.contractSpecs.html", "CME Group NY Harbor ULSD contract specifications"),

    # Metals
    contract("GC", "Gold", "Metals", "COMEX", "100 troy ounces", "USD per troy ounce", 0.10, 10.00, "Physical", "https://www.cmegroup.com/markets/metals/precious/gold.contractSpecs.html", "CME Group Gold contract specifications"),
    contract("MGC", "Micro Gold", "Metals", "COMEX", "10 troy ounces", "USD per troy ounce", 0.10, 1.00, "Physical", MICRO_METALS, MICRO_METALS_TITLE),
    contract("1OZ", "1-Ounce Gold", "Metals", "COMEX", "1 troy ounce", "USD per troy ounce", 0.25, 0.25, "Financial", "https://www.cmegroup.com/articles/faqs/faq-1-oz-gold-futures.html", "CME Group 1-Ounce Gold futures FAQ"),
    contract("SI", "Silver", "Metals", "COMEX", "5,000 troy ounces", "USD per troy ounce", 0.005, 25.00, "Physical", "https://www.cmegroup.com/rulebook/COMEX/1a/112.pdf", "COMEX Rulebook Chapter 112 - Silver Futures"),
    contract("SIL", "Micro Silver", "Metals", "COMEX", "1,000 troy ounces", "USD per troy ounce", 0.01, 10.00, "Physical", MICRO_METALS, MICRO_METALS_TITLE),
    contract("SIC", "100-Ounce Silver", "Metals", "COMEX", "100 troy ounces", "USD per troy ounce", 0.01, 1.00, "Financial", "https://www.cmegroup.com/articles/faqs/frequently-asked-questions-100-ounce-silver-futures.html", "CME Group 100-Ounce Silver futures FAQ"),
    contract("HG", "Copper", "Metals", "COMEX", "25,000 pounds", "USD per pound", 0.0005, 12.50, "Physical", "https://www.cmegroup.com/markets/metals/base/copper.contractSpecs.html", "CME Group Copper contract specifications"),
    contract("MHG", "Micro Copper", "Metals", "COMEX", "2,500 pounds", "USD per pound", 0.0005, 1.25, "Financial", MICRO_METALS, MICRO_METALS_TITLE),
    contract("PL", "Platinum", "Metals", "NYMEX", "50 troy ounces", "USD per troy ounce", 0.10, 5.00, "Physical", "https://www.cmegroup.com/education/lessons/platinum-product-overview", "CME Group Platinum product overview"),
    contract("PA", "Palladium", "Metals", "NYMEX", "100 troy ounces", "USD per troy ounce", 0.50, 50.00, "Physical", "https://www.cmegroup.com/notices/ser/2020/12/SER-8668R.pdf", "CME Group Palladium minimum price fluctuation notice"),
    contract("PAM", "Micro Palladium", "Metals", "NYMEX", "10 troy ounces", "USD per troy ounce", 0.50, 5.00, "Physical", MICRO_METALS, MICRO_METALS_TITLE),

    # Agriculture. Grain/oilseed quotes use the displayed cents-per-unit convention.
    contract("ZC", "Corn", "Agriculture", "CBOT", "5,000 bushels", "US cents per bushel", 0.25, 12.50, "Physical", "https://www.cmegroup.com/markets/agriculture/grains/corn.contractSpecs.html", "CME Group Corn contract specifications"),
    contract("ZW", "Chicago SRW Wheat", "Agriculture", "CBOT", "5,000 bushels", "US cents per bushel", 0.25, 12.50, "Physical", "https://www.cmegroup.com/markets/agriculture/grains/wheat.contractSpecs.html", "CME Group Chicago SRW Wheat contract specifications"),
    contract("ZS", "Soybeans", "Agriculture", "CBOT", "5,000 bushels", "US cents per bushel", 0.25, 12.50, "Physical", "https://www.cmegroup.com/markets/agriculture/oilseeds/soybean.contractSpecs.html", "CME Group Soybean contract specifications"),
    contract("ZM", "Soybean Meal", "Agriculture", "CBOT", "100 short tons", "USD per short ton", 0.10, 10.00, "Physical", "https://www.cmegroup.com/markets/agriculture/oilseeds/soybean-meal.contractSpecs.html", "CME Group Soybean Meal contract specifications"),
    contract("ZL", "Soybean Oil", "Agriculture", "CBOT", "60,000 pounds", "US cents per pound", 0.01, 6.00, "Physical", "https://www.cmegroup.com/markets/agriculture/oilseeds/soybean-oil.contractSpecs.html", "CME Group Soybean Oil contract specifications"),
    contract("LE", "Live Cattle", "Agriculture", "CME", "40,000 pounds", "US cents per pound", 0.025, 10.00, "Physical", "https://www.cmegroup.com/markets/agriculture/livestock/live-cattle.contractSpecs.html", "CME Group Live Cattle contract specifications"),
    contract("HE", "Lean Hogs", "Agriculture", "CME", "40,000 pounds", "US cents per pound", 0.025, 10.00, "Financial", "https://www.cmegroup.com/markets/agriculture/livestock/lean-hogs.contractSpecs.html", "CME Group Lean Hogs contract specifications"),
    contract("GF", "Feeder Cattle", "Agriculture", "CME", "50,000 pounds", "US cents per pound", 0.025, 12.50, "Financial", "https://www.cmegroup.com/markets/agriculture/livestock/feeder-cattle.contractSpecs.html", "CME Group Feeder Cattle contract specifications"),

    # U.S. Treasury futures use decimal equivalents of the exchange's fractional price display.
    contract("ZT", "2-Year U.S. Treasury Note", "Interest Rates", "CBOT", "$200,000 face value", "price points", 0.00390625, 7.8125, "Physical", TREASURY_GUIDE, TREASURY_TITLE, "Outright tick is 1/8 of 1/32; decimal equivalent shown."),
    contract("ZF", "5-Year U.S. Treasury Note", "Interest Rates", "CBOT", "$100,000 face value", "price points", 0.0078125, 7.8125, "Physical", TREASURY_GUIDE, TREASURY_TITLE, "Outright tick is 1/4 of 1/32; decimal equivalent shown. Calendar-spread tick changed in 2026 and is excluded."),
    contract("ZN", "10-Year U.S. Treasury Note", "Interest Rates", "CBOT", "$100,000 face value", "price points", 0.015625, 15.625, "Physical", TREASURY_GUIDE, TREASURY_TITLE, "Outright tick is 1/2 of 1/32; decimal equivalent shown."),
    contract("TN", "Ultra 10-Year U.S. Treasury Note", "Interest Rates", "CBOT", "$100,000 face value", "price points", 0.015625, 15.625, "Physical", TREASURY_GUIDE, TREASURY_TITLE, "Outright tick is 1/2 of 1/32; decimal equivalent shown."),
    contract("ZB", "30-Year U.S. Treasury Bond", "Interest Rates", "CBOT", "$100,000 face value", "price points", 0.03125, 31.25, "Physical", "https://www.cmegroup.com/markets/interest-rates/us-treasury/30-year-us-treasury-bond.contractSpecs.html", "CME Group 30-Year Treasury Bond contract specifications", "Outright tick is 1/32; decimal equivalent shown."),
    contract("UB", "Ultra U.S. Treasury Bond", "Interest Rates", "CBOT", "$100,000 face value", "price points", 0.03125, 31.25, "Physical", "https://www.cmegroup.com/markets/interest-rates/us-treasury/ultra-t-bond.contractSpecs.html", "CME Group Ultra Treasury Bond contract specifications", "Outright tick is 1/32; decimal equivalent shown."),
]


def fmt_number(value: float) -> str:
    if value == 0:
        return "0"
    if abs(value) >= 1:
        return f"{value:,.6f}".rstrip("0").rstrip(".")
    return f"{value:.9f}".rstrip("0").rstrip(".")


def money(value: float) -> str:
    digits = 3 if round(value, 2) != value else 2
    return f"${value:,.{digits}f}".rstrip("0").rstrip(".")


def validate() -> None:
    symbols = [row["symbol"] for row in CONTRACTS]
    if len(symbols) != len(set(symbols)):
        raise ValueError("Duplicate symbols in Futures Risk Atlas dataset")
    for row in CONTRACTS:
        if row["outright_tick_size"] <= 0 or row["tick_value_usd"] <= 0:
            raise ValueError(f"Non-positive tick data for {row['symbol']}")
        expected = row["outright_tick_size"] * row["usd_per_1_quote_unit"]
        if abs(expected - row["tick_value_usd"]) > 1e-9:
            raise ValueError(f"Tick math mismatch for {row['symbol']}")
        if not row["source_url"].startswith("https://www.cmegroup.com/"):
            raise ValueError(f"Non-CME source for {row['symbol']}")


def table_rows() -> str:
    rows = []
    for row in CONTRACTS:
        search = " ".join(str(row[key]) for key in ("symbol", "name", "asset_class", "exchange", "contract_unit", "settlement")).lower()
        rows.append(
            f'''<tr data-asset="{html.escape(row['asset_class'])}" data-search="{html.escape(search)}">
              <th scope="row"><button class="symbol-button" type="button" data-symbol="{html.escape(row['symbol'])}">{html.escape(row['symbol'])}</button></th>
              <td>{html.escape(row['name'])}</td>
              <td>{html.escape(row['asset_class'])}</td>
              <td>{html.escape(row['contract_unit'])}</td>
              <td>{html.escape(row['quote_unit'])}</td>
              <td>{fmt_number(row['outright_tick_size'])}</td>
              <td>{money(row['tick_value_usd'])}</td>
              <td>{money(row['usd_per_1_quote_unit'])}</td>
              <td>{html.escape(row['settlement'])}</td>
              <td><a href="{html.escape(row['source_url'])}" rel="noopener" target="_blank">Official source</a></td>
            </tr>'''
        )
    return "\n".join(rows)


def options() -> str:
    return "\n".join(
        f'<option value="{html.escape(row["symbol"])}">{html.escape(row["symbol"])} - {html.escape(row["name"])}</option>'
        for row in CONTRACTS
    )


def build_html() -> str:
    data_json = json.dumps(CONTRACTS, separators=(",", ":"), ensure_ascii=False).replace("</", "<\\/")
    template = r'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="format-detection" content="telephone=no">
  <title>Futures Risk Atlas: Tick Values & Contract Specs | Grizzly Parrot Trading</title>
  <meta name="description" content="Source-backed futures contract specifications, tick values, settlement types, risk math, and downloadable CSV/JSON for 55 CME Group contracts.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="__CANONICAL__">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta property="og:title" content="Futures Risk Atlas: 55 Source-Backed Contract Specs">
  <meta property="og:description" content="Compare tick size, tick value, contract unit, quote convention, and settlement across 55 CME Group futures contracts.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="__CANONICAL__">
  <meta property="og:site_name" content="Grizzly Parrot Trading">
  <meta property="og:image" content="https://grizzlyparrottrading.com/OG-default.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Futures Risk Atlas: 55 Source-Backed Contract Specs">
  <meta name="twitter:description" content="Filter, calculate, download, and cite verified futures contract risk data.">
  <meta name="twitter:image" content="https://grizzlyparrottrading.com/OG-default.png">
  <link rel="stylesheet" href="../style.css">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-JMJVR3G5YN"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-JMJVR3G5YN');</script>
  <script src="/uet.js" defer></script>
  <script type="application/ld+json">
  {
    "@context":"https://schema.org",
    "@graph":[
      {"@type":"Dataset","name":"Grizzly Parrot Futures Risk Atlas","description":"Exchange-source-backed outright tick sizes, tick values, quote conventions, contract units, and settlement methods for 55 CME Group futures contracts.","url":"__CANONICAL__","dateModified":"__VERIFIED__","creator":{"@type":"Organization","name":"Grizzly Parrot Trading","url":"https://grizzlyparrottrading.com/"},"distribution":[{"@type":"DataDownload","encodingFormat":"text/csv","contentUrl":"https://grizzlyparrottrading.com/tools/data/futures-contract-specs.csv"},{"@type":"DataDownload","encodingFormat":"application/json","contentUrl":"https://grizzlyparrottrading.com/tools/data/futures-contract-specs.json"}]},
      {"@type":"WebApplication","name":"Futures Risk Atlas calculators","applicationCategory":"FinanceApplication","operatingSystem":"Any","url":"__CANONICAL__","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}},
      {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://grizzlyparrottrading.com/"},{"@type":"ListItem","position":2,"name":"Trading Tools","item":"https://grizzlyparrottrading.com/tools/"},{"@type":"ListItem","position":3,"name":"Futures Risk Atlas","item":"__CANONICAL__"}]}
    ]
  }
  </script>
  <style>
    .atlas-wrap{max-width:1280px}.atlas-kicker{font-size:.88rem;letter-spacing:.08em;text-transform:uppercase;color:#f6b73c;font-weight:800}.atlas-meta,.atlas-callout,.atlas-panel,.atlas-method{background:#111827;border:1px solid #293548;border-radius:14px}.atlas-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;margin-top:1.4rem;overflow:hidden}.atlas-stat{padding:1rem 1.15rem;background:#0f172a}.atlas-stat strong{display:block;font-size:1.55rem;color:#fff}.atlas-stat span{color:#b8c2d4;font-size:.9rem}.atlas-toolbar{display:grid;grid-template-columns:minmax(240px,2fr) minmax(190px,1fr) auto;gap:.75rem;align-items:end;margin:1.25rem 0}.atlas-toolbar label,.atlas-panel label{display:block;font-weight:700;margin-bottom:.35rem}.atlas-toolbar input,.atlas-toolbar select,.atlas-panel input,.atlas-panel select{width:100%;box-sizing:border-box;border:1px solid #40506a;border-radius:9px;background:#0b1220;color:#fff;padding:.75rem}.atlas-button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:.7rem 1rem;border-radius:9px;border:1px solid #f6b73c;background:#f6b73c;color:#111827;font-weight:800;text-decoration:none;cursor:pointer}.atlas-button.secondary{background:transparent;color:#f6b73c}.atlas-downloads{display:flex;gap:.65rem;flex-wrap:wrap;margin:1rem 0}.atlas-table-wrap{overflow:auto;border:1px solid #293548;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.18)}.atlas-table{width:100%;border-collapse:collapse;min-width:1180px;background:#0b1220}.atlas-table caption{text-align:left;padding:1rem;color:#b8c2d4}.atlas-table th,.atlas-table td{padding:.72rem .75rem;border-bottom:1px solid #243044;text-align:left;vertical-align:top}.atlas-table thead th{position:sticky;top:0;background:#172033;color:#fff;z-index:1}.atlas-table tbody tr:hover{background:#111c2f}.atlas-table a{color:#77c7ff}.symbol-button{border:0;background:transparent;color:#f6b73c;font:inherit;font-weight:900;cursor:pointer;padding:0}.atlas-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.atlas-panel{padding:1.2rem}.atlas-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.85rem}.atlas-result{margin-top:1rem;padding:1rem;background:#08111f;border-left:4px solid #f6b73c;border-radius:8px;min-height:72px}.atlas-callout,.atlas-method{padding:1.2rem;margin:1.2rem 0}.atlas-code{display:block;white-space:pre-wrap;word-break:break-word;background:#08111f;border:1px solid #293548;border-radius:9px;padding:1rem;color:#dbeafe}.atlas-note{color:#b8c2d4}.atlas-hidden{display:none}.atlas-source-list{columns:2;column-gap:2rem}.atlas-source-list li{break-inside:avoid;margin-bottom:.5rem}.atlas-source-list a{word-break:break-word}.copy-status{margin-left:.6rem;color:#b8c2d4}.noscript-warning{padding:1rem;background:#3b1d1d;border:1px solid #7f1d1d;border-radius:9px}
    @media(max-width:800px){.atlas-meta,.atlas-grid{grid-template-columns:1fr}.atlas-toolbar{grid-template-columns:1fr}.atlas-fields{grid-template-columns:1fr}.atlas-source-list{columns:1}}
  </style>
</head>
<body>
<header class="site-header"><div class="container header-inner"><div class="logo"><span class="logo-mark">GP</span><span class="logo-text"><a href="https://grizzlyparrottrading.com/">Grizzly Parrot Trading</a></span></div><nav class="main-nav"><a href="https://grizzlyparrottrading.com/futures-basics/">Futures Basics</a><a href="https://grizzlyparrottrading.com/prop-firm-trading/">Prop Firms</a><a href="https://grizzlyparrottrading.com/platforms-tutorials/">Platforms</a><a href="https://grizzlyparrottrading.com/market-basics/">Market Basics</a><a href="https://grizzlyparrottrading.com/tools/">Tools</a></nav></div></header>
<main>
  <section class="hero"><div class="container hero-inner"><div class="hero-text"><div class="atlas-kicker">Exchange-sourced reference data</div><h1>Futures Risk Atlas</h1><p>Compare the contract details that turn a price move into real dollars: outright tick size, tick value, quote convention, contract unit, and settlement method. Then use the same verified data for position sizing and move-risk math.</p><div class="atlas-meta"><div class="atlas-stat"><strong>__COUNT__</strong><span>futures contracts</span></div><div class="atlas-stat"><strong>6</strong><span>asset classes</span></div><div class="atlas-stat"><strong>__VERIFIED__</strong><span>last source verification</span></div></div></div></div></section>

  <section class="section"><div class="container atlas-wrap">
    <h2>Search the contract reference</h2>
    <p class="atlas-note">Every row links to an official CME Group source. Values are for outright futures on CME Globex unless the row note says otherwise; option and spread ticks are deliberately excluded.</p>
    <div class="atlas-toolbar">
      <div><label for="atlas-search">Symbol, name, exchange, or contract unit</label><input id="atlas-search" type="search" autocomplete="off" placeholder="Try MES, crude oil, CBOT, or 100 troy ounces"></div>
      <div><label for="atlas-asset">Asset class</label><select id="atlas-asset"><option value="">All asset classes</option><option>Equity Index</option><option>FX</option><option>Energy</option><option>Metals</option><option>Agriculture</option><option>Interest Rates</option></select></div>
      <button class="atlas-button secondary" id="atlas-reset" type="button">Reset filters</button>
    </div>
    <p id="atlas-count" aria-live="polite">Showing __COUNT__ contracts.</p>
    <div class="atlas-downloads"><a class="atlas-button" href="/tools/data/futures-contract-specs.csv" download>Download CSV</a><a class="atlas-button secondary" href="/tools/data/futures-contract-specs.json" download>Download JSON</a></div>
    <div class="atlas-table-wrap">
      <table class="atlas-table" id="atlas-table"><caption>Verified contract specifications. Select a symbol to load it into both calculators.</caption><thead><tr><th scope="col">Symbol</th><th scope="col">Contract</th><th scope="col">Asset</th><th scope="col">Contract unit</th><th scope="col">Quote unit</th><th scope="col">Outright tick</th><th scope="col">USD / tick</th><th scope="col">USD / 1 quote unit</th><th scope="col">Settlement</th><th scope="col">Source</th></tr></thead><tbody>__ROWS__</tbody></table>
    </div>
    <noscript><p class="noscript-warning">The reference table and downloads work without JavaScript. Enable JavaScript only if you want filtering and calculators.</p></noscript>
  </div></section>

  <section class="section"><div class="container atlas-wrap"><h2>Use the same data for risk math</h2><div class="atlas-grid">
    <section class="atlas-panel" aria-labelledby="size-heading"><h3 id="size-heading">Position size from a stop in ticks</h3><div class="atlas-fields"><div><label for="size-symbol">Contract</label><select id="size-symbol">__OPTIONS__</select></div><div><label for="risk-budget">Maximum dollar risk</label><input id="risk-budget" type="number" min="0" step="0.01" value="250"></div><div><label for="stop-ticks">Stop distance in ticks</label><input id="stop-ticks" type="number" min="0" step="1" value="20"></div></div><button class="atlas-button" id="size-calc" type="button">Calculate position size</button><div class="atlas-result" id="size-result" aria-live="polite"></div></section>
    <section class="atlas-panel" aria-labelledby="move-heading"><h3 id="move-heading">Dollar effect of a price move</h3><div class="atlas-fields"><div><label for="move-symbol">Contract</label><select id="move-symbol">__OPTIONS__</select></div><div><label for="move-contracts">Contracts</label><input id="move-contracts" type="number" min="1" step="1" value="1"></div><div><label for="move-mode">Move entered as</label><select id="move-mode"><option value="ticks">Ticks</option><option value="price">Quoted price units</option></select></div><div><label for="move-amount">Move size</label><input id="move-amount" type="number" min="0" step="any" value="10"></div></div><button class="atlas-button" id="move-calc" type="button">Calculate dollar move</button><div class="atlas-result" id="move-result" aria-live="polite"></div></section>
  </div></div></section>

  <section class="section"><div class="container atlas-wrap">
    <h2>Methodology, limits, and citation</h2>
    <div class="atlas-method"><h3>What is normalized</h3><p>The atlas preserves each market's native displayed quote convention. Grain and livestock increments are shown in U.S. cents because that is how those futures are quoted; Treasury fractions are also shown as decimal point equivalents. The dollar-per-tick value is the common comparison field.</p><h3>What is not included</h3><p>Broker day margins, exchange performance bonds, live prices, options ticks, calendar-spread ticks, fees, and slippage are not included. Those values either change frequently or use different rules. A null or omitted field is never replaced with an estimate.</p><h3>Verification policy</h3><p>Every row requires an official exchange source, internal tick-math reconciliation, and a recorded verification date. Corrections can be sent to <a href="mailto:grizzlyparrott04@gmail.com?subject=Futures%20Risk%20Atlas%20correction">grizzlyparrott04@gmail.com</a>.</p></div>
    <div class="atlas-callout"><h3>Use or cite this dataset</h3><p>You may quote individual rows, use the CSV/JSON in educational work, or link readers to this reference. Attribute the source so readers can verify the methodology and update date.</p><code class="atlas-code" id="citation-code">Source: &lt;a href="__CANONICAL__"&gt;Grizzly Parrot Trading Futures Risk Atlas&lt;/a&gt; (verified __VERIFIED__).</code><button class="atlas-button secondary" id="copy-citation" type="button">Copy citation HTML</button><span class="copy-status" id="copy-status" aria-live="polite"></span></div>
    <h3>Primary exchange sources</h3><ul class="atlas-source-list">__SOURCE_LIST__</ul>
    <p class="atlas-note">Dataset version 1.0.0. First published __VERIFIED__. This educational reference is not financial or trading advice.</p>
  </div></section>
</main>
<footer class="site-footer"><div class="container footer-inner"><div class="footer-book"><h3>Books</h3><p>Market structure, risk, and execution frameworks.</p><a href="https://grizzlyparrottrading.com/books/" class="footer-book-link">View All Books</a></div><div class="footer-links"><a href="https://grizzlyparrottrading.com/about.html">About</a><a href="https://grizzlyparrottrading.com/disclaimer.html">Disclaimer</a><a href="https://grizzlyparrottrading.com/privacy.html">Privacy</a><a href="https://grizzlyparrottrading.com/contact.html">Contact</a></div><p class="footer-copy">&copy; <span id="year"></span> Grizzly Parrot Trading. All rights reserved.</p></div></footer>
<script id="atlas-data" type="application/json">__DATA_JSON__</script>
<script>
(() => {
  'use strict';
  const data = JSON.parse(document.getElementById('atlas-data').textContent);
  const bySymbol = new Map(data.map(row => [row.symbol, row]));
  const money = value => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:3}).format(value);
  const number = value => new Intl.NumberFormat('en-US', {maximumFractionDigits:9}).format(value);
  const search = document.getElementById('atlas-search');
  const asset = document.getElementById('atlas-asset');
  const rows = [...document.querySelectorAll('#atlas-table tbody tr')];
  const count = document.getElementById('atlas-count');

  function filterRows() {
    const query = search.value.trim().toLowerCase();
    const selectedAsset = asset.value;
    let visible = 0;
    rows.forEach(row => {
      const show = (!query || row.dataset.search.includes(query)) && (!selectedAsset || row.dataset.asset === selectedAsset);
      row.classList.toggle('atlas-hidden', !show);
      if (show) visible += 1;
    });
    count.textContent = `Showing ${visible} contract${visible === 1 ? '' : 's'}.`;
  }
  search.addEventListener('input', filterRows);
  asset.addEventListener('change', filterRows);
  document.getElementById('atlas-reset').addEventListener('click', () => { search.value=''; asset.value=''; filterRows(); search.focus(); });

  const sizeSymbol = document.getElementById('size-symbol');
  const moveSymbol = document.getElementById('move-symbol');
  function selectSymbol(symbol, scroll) {
    if (!bySymbol.has(symbol)) return;
    sizeSymbol.value = symbol;
    moveSymbol.value = symbol;
    const url = new URL(window.location.href);
    url.searchParams.set('symbol', symbol);
    history.replaceState(null, '', url);
    calculateSize();
    calculateMove();
    if (scroll) document.getElementById('size-heading').scrollIntoView({behavior:'smooth',block:'start'});
  }
  document.querySelectorAll('.symbol-button').forEach(button => button.addEventListener('click', () => selectSymbol(button.dataset.symbol, true)));
  sizeSymbol.addEventListener('change', () => selectSymbol(sizeSymbol.value, false));
  moveSymbol.addEventListener('change', () => selectSymbol(moveSymbol.value, false));

  function calculateSize() {
    const row = bySymbol.get(sizeSymbol.value);
    const budget = Number(document.getElementById('risk-budget').value);
    const stopTicks = Number(document.getElementById('stop-ticks').value);
    const output = document.getElementById('size-result');
    if (!row || !Number.isFinite(budget) || budget <= 0 || !Number.isFinite(stopTicks) || stopTicks <= 0) { output.textContent='Enter a positive risk budget and stop distance.'; return; }
    const riskPerContract = stopTicks * row.tick_value_usd;
    const contracts = Math.floor(budget / riskPerContract);
    const used = contracts * riskPerContract;
    output.innerHTML = contracts < 1 ? `<strong>0 contracts fit.</strong><br>One ${row.symbol} contract risks ${money(riskPerContract)} at a ${number(stopTicks)}-tick stop, above the ${money(budget)} budget.` : `<strong>${contracts} contract${contracts===1?'':'s'}</strong><br>${money(riskPerContract)} per contract; ${money(used)} total planned risk; ${money(budget-used)} budget left unused.`;
  }
  document.getElementById('size-calc').addEventListener('click', calculateSize);

  function calculateMove() {
    const row = bySymbol.get(moveSymbol.value);
    const contracts = Number(document.getElementById('move-contracts').value);
    const amount = Number(document.getElementById('move-amount').value);
    const mode = document.getElementById('move-mode').value;
    const output = document.getElementById('move-result');
    if (!row || !Number.isInteger(contracts) || contracts <= 0 || !Number.isFinite(amount) || amount < 0) { output.textContent='Enter a positive whole contract count and a non-negative move.'; return; }
    const ticks = mode === 'ticks' ? amount : amount / row.outright_tick_size;
    const dollars = ticks * row.tick_value_usd * contracts;
    output.innerHTML = `<strong>${money(dollars)} absolute contract-value change</strong><br>${number(ticks)} ticks across ${contracts} ${row.symbol} contract${contracts===1?'':'s'} at ${money(row.tick_value_usd)} per tick.`;
  }
  document.getElementById('move-calc').addEventListener('click', calculateMove);
  ['move-contracts','move-amount','move-mode'].forEach(id => document.getElementById(id).addEventListener('change', calculateMove));
  ['risk-budget','stop-ticks'].forEach(id => document.getElementById(id).addEventListener('change', calculateSize));

  document.getElementById('copy-citation').addEventListener('click', async () => {
    const text = document.getElementById('citation-code').textContent;
    const status = document.getElementById('copy-status');
    try { await navigator.clipboard.writeText(text); status.textContent='Copied.'; }
    catch (_) { status.textContent='Copy blocked by the browser; select the text above.'; }
  });
  document.getElementById('year').textContent = new Date().getFullYear();
  const requested = new URL(window.location.href).searchParams.get('symbol');
  selectSymbol(requested && bySymbol.has(requested.toUpperCase()) ? requested.toUpperCase() : 'MES', false);
})();
</script>
</body>
</html>
'''
    unique_sources = []
    seen = set()
    for row in CONTRACTS:
        key = row["source_url"]
        if key not in seen:
            seen.add(key)
            unique_sources.append(f'<li><a href="{html.escape(key)}" rel="noopener" target="_blank">{html.escape(row["source_title"])}</a></li>')
    return (template
        .replace("__CANONICAL__", CANONICAL)
        .replace("__VERIFIED__", VERIFIED)
        .replace("__COUNT__", str(len(CONTRACTS)))
        .replace("__ROWS__", table_rows())
        .replace("__OPTIONS__", options())
        .replace("__SOURCE_LIST__", "\n".join(unique_sources))
        .replace("__DATA_JSON__", data_json))


def write_outputs() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    dataset = {
        "schema_version": "1.0.0",
        "name": "Grizzly Parrot Futures Risk Atlas",
        "canonical_url": CANONICAL,
        "verified_on": VERIFIED,
        "scope": "CME Group outright futures tick specifications; spreads, options, margins, fees, and live prices excluded.",
        "contracts": CONTRACTS,
    }
    (DATA_DIR / "futures-contract-specs.json").write_text(json.dumps(dataset, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    fields = list(CONTRACTS[0].keys())
    with (DATA_DIR / "futures-contract-specs.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        writer.writerows(CONTRACTS)
    (TOOLS / "futures-risk-atlas.html").write_text(build_html(), encoding="utf-8", newline="\n")


if __name__ == "__main__":
    validate()
    write_outputs()
    print(f"Built Futures Risk Atlas with {len(CONTRACTS)} verified contract rows.")
