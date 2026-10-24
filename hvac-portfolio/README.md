# Manhattan HVAC investment portfolio

A focused UI/UX redesign of Mohamed Saffiddine’s existing Manhattan HVAC feasibility portfolio. It prioritizes the objective, A/B/C results and conditional recommendation; separates methodology, financials, scenarios, recommendation and documents; and places supporting detail behind native disclosures. All original project materials, cached numerical data and financial helpers are preserved. No client engagement, measured performance or investment approval is implied.

## Run locally

Requires Python 3.9+ for serving/building. Node 18+ is needed only for the automated JavaScript checks and optional npm command shortcuts. There are **no application dependencies to install**, no credentials and no backend.

From this directory:

```sh
python3 -m http.server 8001 --directory site
```

Visit the local server using your browser. Open the site over HTTP, not by double-clicking `index.html`: the app loads `data.json` with `fetch`. The packaged production site works on any static HTTPS host.

Equivalent shortcut: `npm run dev` (binds to all interfaces for cloud development).

## Build and preview production

```sh
python3 build.py
python3 -m http.server 8002 --directory dist
```

`build.py` verifies all original document hashes, replaces only this project's generated `dist/` directory and copies the complete standalone site. `dist/build-manifest.json` records production file SHA-256 hashes. No bundler, CDN, external font, analytics or remote API is required.

## Update the existing Cloudflare Pages website

The existing website is `https://manhattan-hvac-portfolio.pages.dev/`. This redesign does **not** create a different project or change the live deployment automatically.

1. Run `python3 build.py` from this directory.
2. Download `Manhattan_HVAC_Redesigned_Cloudflare_Pages.zip` from this branch’s `downloads/` folder. This ZIP has `index.html` at its root and contains the complete tested production output.
3. In Cloudflare **Workers & Pages**, open the existing **manhattan-hvac-portfolio** Pages project.
4. In its **Deployments** area, choose **Create a new deployment** (or the upload-new-deployment action shown in the dashboard).
5. Select the **Production** environment, upload the redesigned Pages ZIP and deploy. Use the existing project; do not delete it or start a second project.
6. Confirm the existing URL now shows “Manhattan HVAC modernization study.” Check the scenario buttons, PDF previews and Excel/ZIP downloads on that HTTPS origin. The previous deployment remains available for rollback in Cloudflare’s deployment history.

If uploading a folder, upload the contents of `dist/` with `index.html` at the root. Do not upload the full source archive or the original study ZIP as website files. There are no backend bindings, secrets or runtime environment variables. The app uses relative asset URLs and preserves `#main`, `#engineering`, `#investment`, `#sensitivity`, `#evidence` and `#library` anchors. `#recommendation` is a new anchor.

**Optional Git-connected build:** framework None; root directory `hvac-portfolio`; build command `python3 build.py`; output directory `dist`. Use your intended deployment branch. This is an alternative to the current manual upload workflow, not a required migration. Cloudflare’s build image needs Python 3. If this folder is placed at a repository root, leave the root-directory setting empty.

`site/_headers` is copied into `dist` and preserves the existing Pages security headers. There are no client-side routes or rewrite requirements. No live deployment has been changed by the redesign work.

## Structure

```text
site/
  index.html                 Semantic, responsive single-page case study
  styles.css                 Design, responsive rules, focus and print styles
  app.js                     Responsive charts, progressive disclosure, selectors and document library
  model.js                   Small pure financial calculation helpers
  data.json                  Original cached workbook data and document checksum metadata
  _headers                   Cloudflare Pages HTTP response headers
  assets/mark.svg            Local vector mark
  assets/documents/          All eight original files, unchanged
  assets/Manhattan_HVAC_Portfolio_Project.zip  Original upload, unchanged
build.py                     Standard-library-only production build
package.json                 Optional run/test shortcuts; no dependency install
DATA_PROVENANCE.md           Source cells, calculations and editorial boundaries
VALIDATION.md                Checks actually executed and testing limitations
requirements-test.txt        Optional browser testing dependency
tests/model.test.mjs         Financial, engineering and preservation checks
tests/browser.py             Production browser checks and screenshots
artifacts/                   Generated browser reports and screenshots; redesign outputs in artifacts/redesign/
dist/                        Production output (included in delivery ZIP)
```

## Maintain the content

Edit text and section structure in `site/index.html`, visual styles in `site/styles.css`, and behavior in `site/app.js`. `model.js` is isolated for financial tests. Data is local and requests no external services.

`data.json` contains **saved workbook results**, not a live spreadsheet engine. The scenario controls select the original three cases. The sensitivity controls reproduce the original C present-value decomposition while holding all other inputs at base. Charts and tables use the same JSON values.

If the study is revised, keep the original materials archived. Export fresh, recalculated workbook results into `data.json`, reconcile them against the documented source cells, update document size/hash metadata intentionally, revise the affected narrative and tests, and run the checks below. Do not edit a workbook or PDF merely to make a website test pass. Some source reports retain earlier internal filenames; the download cards use the actual supplied filenames. The Step 1 audit is historical: its control findings were addressed by the supplied Step 2 report.

## Automated checks

Financial/engineering and preservation checks (no package installation):

```sh
node --test tests/model.test.mjs
```

Production browser tests require Python Playwright and Chromium:

```sh
python3 -m pip install -r requirements-test.txt
python3 -m playwright install chromium
python3 build.py
python3 tests/browser.py
```

If a system browser is installed, use `CHROMIUM_PATH=/usr/bin/chromium python3 tests/browser.py`; this was the browser used for delivery. Otherwise Playwright uses its installed browser. The script starts its own temporary server, tests production `dist/`, writes screenshots and a JSON report to `artifacts/`, and shuts the server down.

For optional axe-core checks, install it in a separate tooling directory (not an application dependency):

```sh
npm install --prefix /tmp/hvac-a11y --cache /tmp/hvac-npm-cache axe-core@4.11.0 --no-audit --no-fund
AXE_SCRIPT=/tmp/hvac-a11y/node_modules/axe-core/axe.min.js python3 tests/browser.py
```

Browser checks cover desktop (1440), tablet (768), mobile (390) and narrow mobile (320 pixels); default/expanded disclosures, exact chart values and scales, keyboard controls, PDF dialogs, navigation, document hashes, and actual ZIP/Excel downloads. The base financial comparison fits on phones using compact amounts in millions while keeping exact source values accessible to assistive technology; the cash-flow chart adapts its ticks and geometry to the viewport. Detailed tables remain in keyboard-focusable scrolling regions. Reduced-motion preferences are respected. Accessibility reports and screenshots are saved in `artifacts/redesign/`. Original PDF rendering depends on the browser’s PDF viewer; open/download alternatives are always provided.

## Accessibility and boundaries

The site uses semantic sections, a skip link, visible keyboard focus, native buttons/ranges/disclosures, labeled charts, exact data tables, a native modal dialog and documented source boundaries. Automated accessibility checks supplement browser and visual inspection; they are not a screen-reader certification. Safari, Firefox, physical-device testing, desktop Excel recalculation, and a deployed Cloudflare origin were not tested in this environment.

Original project documents and attribution remain with their author. No license for the source documents is invented or implied.
