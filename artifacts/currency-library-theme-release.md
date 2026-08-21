# Currency library visual-system release

Release date: 2026-08-20
Scope: 139 modern currency-futures research pages across 6A, 6B, 6C, 6E, 6J, 6M, and 6N
Verdict: **PASS**

## Result

Every in-scope page now loads one physical stylesheet:

`/futures-basics/currency-research-library.css?v=20260820a`

The 138 pages using the common article architecture share the `currency-library` root and `fx-*` component namespace. The single specialized 6E contract-specification page keeps its purpose-built `e6-*` architecture but receives the same homepage-derived palette from the same physical stylesheet.

The obsolete country-specific stylesheets were removed. No production page or release script references their filenames, roots, or component namespaces.

## Homepage visual contract

The canonical currency stylesheet maps its visual language directly to `home-premium.css`:

| Role | Homepage token | Currency token | Value |
|---|---|---|---|
| Page background | `--home-bg` | `--fx-paper` | `#030817` |
| Primary surface | `--home-surface` | `--fx-surface` | `#091423` |
| Secondary surface | `--home-surface-2` | `--fx-surface-2` | `#0d1b2d` |
| Raised surface | `--home-surface-3` | `--fx-surface-3` | `#11243a` |
| Border | `--home-line` | `--fx-line` | `#20354b` |
| Primary text | `--home-text` | `--fx-ink` | `#f8fafc` |
| Primary accent | `--home-green` | `--fx-forest` | `#51e391` |
| Secondary accent | `--home-gold` | `--fx-gold` | `#f4c55e` |

Country-coded purple, red, blue, and country-gradient themes do not survive in the canonical stylesheet. Green is the shared interactive and identity accent; navy-black surfaces and light text match the home page.

## Regression evidence

- Shared-theme contract: 139 pages, one canonical link per page, no legacy stylesheet or root residue, homepage token parity, and no retired country colors.
- Component coverage: all 84 `fx-*` classes used by the 139 pages have definitions in the canonical stylesheet.
- Semantic-preservation audit: all 99 pre-6M/6N pages reproduce their `HEAD` versions exactly after applying only the declared stylesheet, root, and component-prefix migration.
- Full repository test discovery: 64 tests passed, including all 5 shared-theme contract tests.
- Cluster validators: 6B, 6C, 6M, and 6N each checked 20 pages with 0 errors and 0 warnings.
- Cluster sameness audits: 6B, 6C, 6M, and 6N each produced 20 unique component signatures with 0 errors and 0 warnings.
- Cross-library Edge render: 8 representative pages at 1440×900 and 390×844, 16/16 passed with the canonical sheet loaded, correct computed homepage colors, one H1, no horizontal overflow, no failed local request, and no console error.
- Full 6N Edge render: all 20 pages at both viewports, 40/40 passed, including skip links, tables, assets, calculators, overflow, and console checks.
- The specialized 6E page was corrected after the first render exposed horizontal overflow; its final desktop and mobile cases pass.

Machine-readable render evidence is stored in `artifacts/currency-library-visual-validation.json` and `artifacts/6n-visual-validation.json`.

## Independent 6N release proofs

- Correctness and evidence: **PASS**, recorded in `artifacts/6n-proofreader-correctness.md` against the final shared-CSS namespace.
- Editorial distinctiveness, usefulness, accessibility, namespace integrity, and desktop/mobile behavior: **PASS**, recorded in `artifacts/6n-proofreader-distinctiveness.md` against the final shared-CSS namespace and 40-case render manifest.
