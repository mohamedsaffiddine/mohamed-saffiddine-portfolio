# Redesign validation

The following checks were executed on the redesigned production `dist/` build in Chromium 154.0.8037.57 using Python Playwright 1.62.0. The browser suite creates a temporary local HTTP server; it does not test only source files.

## Passed

- All 8 Node test groups: six scenario NPVs, 22 base annual cash flows, all 25 original sensitivity-grid cells, break-even thresholds, independent load-bin/auxiliary electricity calculations, operating savings, discounted cash-flow values, capital budgets and original document checksums.
- Production build verifies the eight original document SHA-256 hashes and emits 16 static site files plus `build-manifest.json`. The complete build requires only Python 3 and no application dependency installation.
- Desktop 1440×1000, tablet 768×1024, mobile 390×844 and narrow mobile 320×740 browser checks.
- The objective, finding and A/B/C comparison fit the opening desktop viewport. The financial table fits all four widths without horizontal scrolling; exact monetary values are preserved in accessible text while phones show clearly labeled compact amounts in millions.
- Progressive disclosure is closed by default. Four core documents are primary; four supporting documents are secondary. Each disclosure opens with the keyboard.
- Both energy boundaries, with exact totals and correct 37.7%/15.7% HVAC versus 12.7%/5.3% whole-building electricity reductions.
- All four component buttons and explanations; all three financial scenarios, selected state and assumption values.
- Every scenario NPV label matches the original data. Bar geometry uses the correct sign and one consistent −$4m to +$1m scale.
- Both cash-flow modes, responsive chart sizing, exact labels by pointer/focus, and the endpoints matching the original NPVs or undiscounted cash totals.
- Keyboard slider input; a 120% initial-cost sensitivity returns C NPV −$248,475; reset returns +$68,531.
- All six PDF preview buttons, correct original paths, close button, Escape and focus return. Open/download alternatives remain available if a browser cannot render an embedded PDF.
- All eight original document HTTP response hashes and the original ZIP bytes. Actual browser-triggered downloads of the original ZIP and Excel model succeed.
- Skip link, retained internal anchor targets and sticky-header navigation.
- No page-level horizontal overflow in default or fully expanded states at any tested width. Detailed technical tables stay inside keyboard-focusable regions; the cash-flow chart also fits without lateral scrolling.
- No browser console errors, page errors or HTTP failures during the production suite.
- **12 axe-core 4.11.0 scans with zero violations** for WCAG 2 A/AA and 2.1 AA tagged checks: default state, PDF dialog and all disclosures expanded, at each of four viewports. Results are in `artifacts/redesign/browser-report.json`.
- A separate byte comparison against commit `7b74bd8` confirms `site/data.json`, `site/model.js`, all original documents and assets remain unchanged.

## Visual review

Captured and inspected desktop/tablet/mobile overview, engineering, financial analysis, scenarios, recommendation and document-library screens, plus expanded system and cash-flow views. Refinements included moving the mobile NPV into the first screen, fitting all financial alternatives into the mobile table, replacing an unsupported arrow glyph, retaining readable chart labels and separating primary documents from supporting reports.

The browser test outputs screenshots to `artifacts/redesign/`. Selected public preview files are copied to `previews/` for direct GitHub viewing.

## Boundaries

The live `https://manhattan-hvac-portfolio.pages.dev/` URL was blocked by the cloud environment's egress proxy (HTTP 403 / tunnel connection failure). The existing deployed source was reviewed through its local rendered build; no direct live-origin browser review is claimed. The live Cloudflare deployment was not changed, deleted or replaced.

The website tests reproduce the original workbook's cached values and relevant equations. They do not recalculate every Excel formula or rerun the historical audit's complete spreadsheet-control suite. Historical project test counts remain clearly identified as source-report claims. No site performance, tax eligibility, legal compliance or actual investment approval is established.

Safari, Firefox, physical devices and assistive-technology user testing were not performed. Automated accessibility results are not a certification. Cloudflare Pages upload structure and headers are included and verified locally; a newly deployed HTTPS origin must be checked after the user publishes the redesign.
