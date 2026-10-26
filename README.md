# Mohamed Saffiddine — Manufacturing FP&A portfolio

Static source for the portfolio at https://mohamed-saffiddine1.pages.dev/.

## Files

- `index.html`: introduction, verified findings, cash bridge, methods, conclusion and expandable evidence.
- `styles.css`: desktop, mobile and print styles.
- `site.js`: evidence deep links and print support.
- `assets/Northstar_FPA_Operating_Model.xlsx`: original workbook, unchanged.
- `assets/dashboard.png` and `assets/scenario.png`: original workbook excerpts, unchanged.
- `Mohamed_Saffiddine_Cloudflare_Pages_v2.zip`: original source package, retained.

No dependencies or build command are required. Serve the repository root with any static web server. Root-relative asset URLs assume deployment at the domain root.

For an existing Cloudflare Pages Direct Upload project, upload a ZIP containing `index.html`, `styles.css`, `site.js` and `assets/` at its root. For an existing Git-connected project, use its current production branch and serve the repository root. Committing source alone does not confirm a Cloudflare deployment.

## Verification

- Live workbook and supplied workbook have identical SHA-256 hashes.
- Headline figures and cash bridge agree with cached workbook outputs.
- All four original evidence tables and all three binary assets are preserved.
- Internal section targets and local assets resolve.
- Desktop and 390 px / 320 px mobile frames were reviewed, including all seven evidence sections expanded, with no page-wide horizontal overflow.
- The existing live workbook download was retrieved and matched to the supplied file. Its URL and file bytes are unchanged; all local download targets exist. Browser-triggered downloads in the preview timed out, so that click-to-download check remains unverified. JavaScript syntax checked.

The website is a fixed snapshot of a fictional company with simulated data. No financial-model inputs, formulas, cached results or workbook formatting were changed.
