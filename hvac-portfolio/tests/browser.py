"""Verify the production redesign: numerical displays, disclosure, responsive UX,
keyboard controls, documents and optional axe-core accessibility checks.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import hashlib
import json
import os
import shutil
import threading
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'artifacts' / 'redesign'
OUTPUT.mkdir(parents=True, exist_ok=True)
DATA = json.loads((ROOT / 'site/data.json').read_text())
AXE = os.environ.get('AXE_SCRIPT')
REPORT = {'viewports': [], 'functional': [], 'axe': [], 'browser_errors': [], 'http_failures': []}

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT / 'dist')))
threading.Thread(target=server.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{server.server_port}'

def money(value):
    return ('−' if value < 0 else '+' if value > 0 else '') + f'${abs(value):,.0f}'

def disclose(page, selector):
    detail = page.locator(selector)
    if not detail.evaluate('(element) => element.open'):
        detail.locator(':scope > summary').focus()
        page.keyboard.press('Enter')
    assert detail.evaluate('(element) => element.open')

def accessibility(page, viewport, state):
    if not AXE:
        return
    if not page.evaluate('typeof window.axe !== "undefined"'):
        page.add_script_tag(path=AXE)
    result = page.evaluate('async () => await axe.run(document, {runOnly: {type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"]}})')
    REPORT['axe'].append({'viewport': viewport, 'state': state, 'violations': result['violations'], 'passes': len(result['passes'])})
    assert not result['violations'], json.dumps(result['violations'], indent=2)

try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=os.environ.get('CHROMIUM_PATH', shutil.which('chromium')),
            headless=True, args=['--no-sandbox'])
        for name, width, height in [('desktop',1440,1000),('tablet',768,1024),('mobile',390,844),('narrow-mobile',320,740)]:
            page = browser.new_page(viewport={'width':width,'height':height}, reduced_motion='reduce')
            page.on('pageerror', lambda error: REPORT['browser_errors'].append(str(error)))
            page.on('console', lambda message: REPORT['browser_errors'].append(message.text) if message.type == 'error' else None)
            page.on('response', lambda response: REPORT['http_failures'].append(f'{response.status} {response.url}') if response.status >= 400 else None)
            page.goto(URL)
            expect(page.locator('#document-grid .document-card')).to_have_count(4)
            expect(page.locator('#supporting-grid .document-card')).to_have_count(4)
            assert page.locator('#supporting-grid').is_hidden()
            assert page.locator('#capital').is_hidden()
            assert page.locator('#cash-chart').is_hidden()
            assert page.locator('[data-component="chillers"]').is_hidden()
            assert all(not item.evaluate('(element) => element.open') for item in page.locator('details').all())
            expect(page.locator('#project-title')).to_contain_text('Manhattan HVAC')
            expect(page.locator('#finding-title')).to_contain_text('partial upgrade')
            expect(page.locator('.finding-number')).to_contain_text('+$68,531')
            assert page.locator('.financial-table').is_visible()
            assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'), name
            assert page.locator('.financial-table-wrap').evaluate('(element) => element.scrollWidth <= element.clientWidth + 1'), name + ' financial table'
            if name == 'desktop':
                overview_box = page.locator('.overview-comparison').bounding_box()
                assert overview_box['y'] + overview_box['height'] < height, 'Alternatives must fit in the opening desktop view'
            accessibility(page, name, 'default')
            page.screenshot(path=str(OUTPUT / f'{name}-full.png'), full_page=True)
            page.screenshot(path=str(OUTPUT / f'{name}-overview.png'))
            for section in ['engineering','investment','sensitivity','recommendation','library']:
                page.locator('#' + section).screenshot(
                    path=str(OUTPUT / f'{name}-{section}.png'),
                    style='.header{position:relative!important}.skip{visibility:hidden!important}')

            # The energy chart uses exact totals and a defined boundary.
            expect(page.locator('#energy-chart')).to_contain_text('3,043,500')
            expect(page.locator('#energy-chart')).to_contain_text('1,896,300')
            expect(page.locator('#energy-chart')).to_contain_text('2,566,500')
            page.locator('[data-boundary="building"]').click()
            expect(page.locator('#energy-chart')).to_contain_text('12.7%')
            expect(page.locator('#energy-chart')).to_contain_text('5.3%')
            expect(page.locator('#energy-chart')).to_contain_text('9,043,500')
            assert page.locator('#other-legend').is_visible()
            page.locator('[data-boundary="hvac"]').click()
            expect(page.locator('#energy-chart')).to_contain_text('37.7%')
            assert not page.locator('#other-legend').is_visible()

            disclose(page, '#system-details')
            for component in ['tower','pumps','fans','chillers']:
                button = page.locator(f'[data-component="{component}"]')
                button.click()
                assert button.get_attribute('aria-pressed') == 'true'
                assert len(page.locator('#component-detail').inner_text()) > 100
            page.locator('#system-details').screenshot(path=str(OUTPUT / f'{name}-system.png'), style='.header{visibility:hidden!important}.skip{visibility:hidden!important}')

            # All exact NPVs agree with the workbook, and the scale never moves.
            for i in [1,2,0]:
                scenario = DATA['scenarios'][i]
                button = page.locator(f'[data-scenario="{i}"]')
                button.click()
                assert button.get_attribute('aria-pressed') == 'true'
                expect(page.locator('#selected-scenario')).to_have_text(scenario['name'].upper() + ' SCENARIO')
                amounts = page.locator('#npv-chart .npv-row-head strong').all_text_contents()
                assert amounts == [money(scenario['npv'][key]) for key in ['A','B','C']], amounts
                expect(page.locator('.npv-axis')).to_contain_text('−$4m')
                expect(page.locator('.npv-axis')).to_contain_text('+$1m')
                for key, bar in zip(['A','B','C'], page.locator('.npv-bar').all()):
                    rect = bar.evaluate('(element) => {const b=element.getBoundingClientRect(), t=element.parentElement.getBoundingClientRect(); return {left:(b.x-t.x)/t.width,width:b.width/t.width,tolerance:2/t.width};}')
                    value = scenario['npv'][key]
                    assert abs(rect['left'] - (.8 + min(value,0)/5000000)) <= rect['tolerance']
                    assert abs(rect['width'] - abs(value)/5000000) <= rect['tolerance']
            expect(page.locator('#scenario-verdict')).to_contain_text('C leads')

            disclose(page, '#cash-details')
            page.locator('[data-cash="nominal"]').click()
            expect(page.locator('#cash-caption')).to_contain_text('+$939,131')
            page.locator('[data-cash="discounted"]').click()
            expect(page.locator('#cash-caption')).to_contain_text('+$68,531')
            point = page.locator('.chart-point[data-key="C"][data-year="10"]')
            point.focus()
            expect(page.locator('#cash-tooltip')).to_contain_text('+$68,531')
            point.click()
            expect(page.locator('#cash-tooltip')).to_contain_text('2036')
            assert page.locator('#cash-chart').evaluate('(element) => element.scrollWidth <= element.clientWidth + 1')
            page.locator('#cash-details').screenshot(path=str(OUTPUT / f'{name}-cash-flow.png'), style='.header{visibility:hidden!important}.skip{visibility:hidden!important}')

            disclose(page, '#sensitivity-details')
            page.locator('#capital').focus()
            page.keyboard.press('ArrowRight')
            expect(page.locator('#capital-label')).to_contain_text('101%')
            page.locator('#capital').evaluate('(element) => {element.value="120"; element.dispatchEvent(new Event("input",{bubbles:true}));}')
            expect(page.locator('#sensitivity-npv')).to_have_text('−$248,475')
            page.locator('#reset-sensitivity').click()
            expect(page.locator('#sensitivity-npv')).to_have_text('+$68,531')

            disclose(page, '#supporting-documents')
            for i, preview_button in enumerate(page.locator('[data-preview]').all()):
                filename = preview_button.get_attribute('data-preview')
                preview_button.focus()
                page.keyboard.press('Enter')
                expect(page.locator('#document-dialog')).to_be_visible()
                expect(page.locator('#pdf-preview')).to_have_attribute('src', 'assets/documents/' + filename)
                assert page.locator('#preview-download').get_attribute('href') == 'assets/documents/' + filename
                if i == 0:
                    accessibility(page, name, 'document dialog')
                    page.screenshot(path=str(OUTPUT / f'{name}-document-preview.png'))
                    page.locator('#close-dialog').focus()
                    page.keyboard.press('Escape')
                else:
                    page.locator('#close-dialog').click()
                expect(page.locator('#document-dialog')).not_to_be_visible()
                assert preview_button.evaluate('(element) => element === document.activeElement')

            # Exercise every remaining disclosure with the keyboard; scan expanded content.
            for detail in page.locator('details').all():
                if not detail.evaluate('(element) => element.open'):
                    detail.locator(':scope > summary').focus()
                    page.keyboard.press('Enter')
                    assert detail.evaluate('(element) => element.open')
            assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'), name + ' expanded'
            accessibility(page, name, 'all details expanded')
            REPORT['viewports'].append({'name':name,'width':width,'overflow':False,'interactions':'passed'})
            print(f'{name}: responsive layout, disclosures, charts, documents and keyboard controls passed', flush=True)
            page.close()

        page = browser.new_page(reduced_motion='reduce')
        page.goto(URL)
        page.wait_for_selector('.document-card')
        for document in DATA['documents']:
            response = page.request.get(URL + '/assets/documents/' + document['file'])
            assert response.ok
            assert hashlib.sha256(response.body()).hexdigest() == document['sha256']
        response = page.request.get(URL + '/assets/Manhattan_HVAC_Portfolio_Project.zip')
        assert response.ok and response.body() == (ROOT / 'site/assets/Manhattan_HVAC_Portfolio_Project.zip').read_bytes()
        with page.expect_download() as download:
            page.locator('a[download]').filter(has_text='Download original project ZIP').click()
        assert download.value.suggested_filename == 'Manhattan_HVAC_Portfolio_Project.zip'
        with page.expect_download() as download:
            page.locator('.hero-actions a[download]').click()
        assert download.value.suggested_filename == 'HVAC_CapEx_Final_Validated.xlsx'
        for filename in ['index.html','styles.css','app.js','model.js','data.json','assets/mark.svg','build-manifest.json']:
            assert page.request.get(URL + '/' + filename).ok
        for anchor in page.locator('a[href^="#"]').all():
            assert page.locator('[id="' + anchor.get_attribute('href')[1:] + '"]').count() == 1
        page.goto(URL)
        page.keyboard.press('Tab')
        expect(page.locator('.skip')).to_be_focused()
        page.keyboard.press('Enter')
        assert page.evaluate('location.hash') == '#main'
        for target in ['engineering','investment','sensitivity','library','main']:
            page.locator('header a[href="#' + target + '"]').last.click()
            assert page.evaluate('location.hash') == '#' + target
        assert not REPORT['browser_errors'], REPORT['browser_errors']
        assert not REPORT['http_failures'], REPORT['http_failures']
        REPORT['functional'] = [
            'first-screen findings and comparison; four core and four secondary documents',
            'all disclosures and interactive controls at four widths',
            'all scenario NPV labels match original data on one fixed scale',
            'responsive cash-flow chart with exact point labels',
            'keyboard sliders, disclosures, PDF modal Escape and focus return',
            'all anchor targets and sticky header navigation',
            'all eight source document hashes and original ZIP response',
            'actual browser-triggered ZIP and Excel downloads',
            'production files and build manifest; no HTTP or browser errors']
        browser.close()
finally:
    server.shutdown()
    (OUTPUT / 'browser-report.json').write_text(json.dumps(REPORT,indent=2))
print(json.dumps({'viewports':len(REPORT['viewports']),'functional':REPORT['functional'],
                  'accessibility_scans':len(REPORT['axe']),
                  'axe_violations':sum(len(item['violations']) for item in REPORT['axe']) if AXE else 'not run'},indent=2))
