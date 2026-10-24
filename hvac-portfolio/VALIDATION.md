# Delivery validation

The following checks were executed against this delivery in Chromium 154.0.8037.57 using Python Playwright 1.62.0. The production browser suite starts its own HTTP server serving `dist/`; it does not validate only source files.

## Passed

- All 8 Node test groups: six scenario NPVs, 22 base annual cash flows, all 25 original sensitivity-grid values, two break-even thresholds, independent load-bin/auxiliary electricity calculations, operating savings, cumulative discounted values, capital budgets and original document SHA-256 checks.
- Production build with all eight original document checksums verified; 16 site files plus the generated build manifest.
- Desktop 1440×1000, tablet 768×1024, mobile 390×844 and narrow mobile 320×740 browser runs.
- Every major section rendered and screenshot at each viewport. Desktop, tablet and mobile screenshots were inspected; font/glyph rendering, caption contrast, legend visibility and mobile chart readability were refined.
- No page-level horizontal overflow at those widths, including with all detailed tables expanded. Wide tables and the mobile cash-flow chart scroll inside labeled, keyboard-focusable regions.
- Both energy boundaries, all four component selectors, all three financial scenarios, both cash-flow modes and exact point focus labels.
- Keyboard slider input; hypothetical 120% cost reproduces C NPV −$248,475; reset returns +$68,531.
- All six document filters and all six PDF preview buttons, modal close, Escape and focus return. Browser PDF-viewer availability can differ; open/download fallbacks are included.
- Keyboard disclosure controls, skip link, all internal anchor targets and header navigation.
- All eight document downloads checked over HTTP against original hashes. The original ZIP response matches the supplied ZIP byte-for-byte; an actual browser-triggered ZIP download succeeds.
- No page errors, browser console errors or HTTP failures during the production suite.
- axe-core 4.11.0 WCAG 2 A/AA and 2.1 AA tagged checks, with detailed sections expanded: **zero violations at all four viewports**. These automated results are recorded in `artifacts/browser-report.json`.

## Boundaries

The financial/engineering website tests reproduce the supplied workbook's cached source results and equations; they do not execute every Excel formula, rerun the historical audit's full control challenges, validate tax eligibility or establish building performance. The source reports' own tests remain clearly identified as historical work.

Safari, Firefox, physical devices, assistive-technology user testing and a deployed Cloudflare origin were not tested. No live deployment or publication is claimed. PDF embedding depends on the visitor's viewer. The static build and README deployment instructions are included for deployment to your own account.
