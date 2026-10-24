# Recruiter-focused UI/UX redesign

## Problem and resulting experience

The earlier site spent the opening desktop viewport on a large illustrative hero. Financial findings, the recommendation and useful documents appeared later. Small chart labels, a sideways-scrolling financial table and an equally prominent eight-file library made the page harder to scan.

The redesigned overview names the project, objective, hypothetical setting, alternatives, base NPVs and conditional recommendation within one desktop viewport. Executive Summary and Excel Model links are immediately available. The remaining page follows the analysis: engineering → financial comparison → financial scenarios and risks → recommendation → skills and source documents.

## Changes

- Replaced the illustrative hero with a compact project introduction, scope facts, a finding panel and a comparable A/B/C summary.
- Kept the financial comparison visible, with NPV as the primary measure. IRR and payback remain clearly labeled; the cash-flow exploration is secondary.
- Used progressive disclosure for the system explorer, equations, capital budget, annual cash flow, sensitivities, evidence gaps and full workflow.
- Reworked scenario NPV bars with a fixed −$4m to +$1m scale and exact readable dollar labels. Selected scenario and all five assumption values are explicit.
- Adapted the cash-flow chart to the phone viewport instead of shrinking or horizontally scrolling a desktop SVG. Exact point labels and data tables are retained.
- Made the financial table fit phones with documented compact amounts in millions. Exact source amounts remain accessible to assistive technology and in the original Excel model.
- Prioritized four core files. The project guide and three audit/validation reports are grouped in a secondary disclosure.
- Increased text readability, reduced decorative content and repeated explanations, retained clear focus styles and kept navigation anchors stable.
- Fixed PDF cleanup so a delayed close event cannot clear a newly opened document.

## Preserved

`site/data.json`, `site/model.js`, all eight original documents, the original project ZIP and the mark SVG are byte-for-byte identical to the first delivered commit (`7b74bd8`). The financial results, engineering assumptions and conditional recommendation have not changed. No dependencies were added. No deployment was changed or deleted.

## Review and delivery

The production build was rendered in Chromium at desktop, tablet, mobile and narrow-mobile widths. Every major section and the expanded system/cash-flow views were captured and reviewed. The Node tests, four-viewport browser suite and twelve axe scans pass; see `VALIDATION.md` and `artifacts/redesign/browser-report.json`.

The live URL could not be opened from this cloud runtime: the egress proxy returned HTTP 403 / tunnel connection failure. The review therefore used the existing deployed source rendered locally, and the final checks served the production `dist/` build. No live-origin validation is claimed.

Use `downloads/Manhattan_HVAC_Redesigned_Cloudflare_Pages.zip` to create a new production deployment in the **existing** `manhattan-hvac-portfolio` Cloudflare Pages project. `README.md` contains step-by-step instructions. The previously delivered deployment ZIP is retained separately for reference. GitHub-hosted previews in `previews/` are screenshots, not a live deployment.
