# Manhattan HVAC investment portfolio

A complete, independent static website for Mohamed Saffiddine’s hypothetical Manhattan HVAC feasibility study. Built from the supplied eight-file project, with original documents preserved. No client engagement, measured performance or investment approval is implied.

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

## Deploy to Cloudflare Pages

**Direct Upload (simplest):** run the build, then use Cloudflare Pages → create a project → Direct Upload. Upload the **contents of `dist/`**, with `index.html` at the upload root. Do not upload the source ZIP as the website. This is a static project; no Workers bindings or environment variables are needed. Cloudflare’s account/project creation is performed in your own account.

**Git-connected Pages:** choose the repository, then configure:

- Production branch: your intended branch, usually `main`.
- Root directory: `hvac-portfolio` when using the current repository layout.
- Framework preset: None.
- Build command: `python3 build.py`.
- Build output directory: `dist` (relative to the root directory above).

If you put the contents of this project at a new repository's root, leave the root-directory setting empty. Python 3 must be available in the build image. `site/_headers` is copied into `dist` and supplies security headers on Pages. The site has no client-side routes or rewrite requirement. After deployment, confirm the homepage, selectors, PDF preview and XLSX/ZIP downloads on the deployed HTTPS origin. No deployment has been performed as part of this delivery.

## Structure

```text
site/
  index.html                 Semantic, responsive single-page case study
  styles.css                 Design, responsive rules, focus and print styles
  app.js                     Charts, selectors, sensitivity controls and document library
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
artifacts/                   Generated browser report and screenshots (included in delivery ZIP)
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

Browser checks cover desktop (1440), tablet (768), mobile (390) and narrow mobile (320 pixels); selectors, charts, keyboard inputs/disclosures, PDF dialogs, navigation, document hashes and an actual ZIP download. Tables and the mobile cash-flow chart scroll within their own keyboard-focusable regions. Reduced-motion preferences are respected. Original PDF rendering depends on the browser’s PDF viewer; open/download alternatives are always provided.

## Accessibility and boundaries

The site uses semantic sections, a skip link, visible keyboard focus, native buttons/ranges/disclosures, labeled charts, exact data tables, a native modal dialog and documented source boundaries. Automated accessibility checks supplement browser and visual inspection; they are not a screen-reader certification. Safari, Firefox, physical-device testing, desktop Excel recalculation, and a deployed Cloudflare origin were not tested in this environment.

Original project documents and attribution remain with their author. No license for the source documents is invented or implied.
