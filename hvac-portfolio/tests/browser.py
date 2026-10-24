"""Functional, responsive and optional axe accessibility checks on a production build.
Requires Python Playwright and a Chromium executable. See README for invocation.
"""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import hashlib
import json
import os
import shutil
import threading
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'artifacts'
OUTPUT.mkdir(exist_ok=True)
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT / 'dist')))
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}'
data = json.loads((ROOT / 'site/data.json').read_text())
report = {'viewports': [], 'functional': [], 'axe': []}
axe = os.environ.get('AXE_SCRIPT')
errors, failed = [], []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', shutil.which('chromium')), headless=True, args=['--no-sandbox'])
        for name, width, height in [('desktop',1440,1000),('tablet',768,1024),('mobile',390,844),('narrow-mobile',320,740)]:
            page = browser.new_page(viewport={'width':width,'height':height}, reduced_motion='reduce')
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('console', lambda msg: errors.append(msg.text) if msg.type=='error' else None)
            page.on('response', lambda response: failed.append(f'{response.status} {response.url}') if response.status>=400 else None)
            page.goto(url)
            expect(page.locator('.document-card')).to_have_count(8)
            assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'), name
            page.screenshot(path=str(OUTPUT / f'{name}-full.png'), full_page=True)
            page.screenshot(path=str(OUTPUT / f'{name}-overview.png'))
            # Every major section rendered, with fixed header temporarily hidden for clean section captures.
            page.add_style_tag(content='.header{position:relative!important}html{scroll-behavior:auto!important}')
            for section in ['engineering','investment','sensitivity','evidence','library']:
                page.locator('#'+section).screenshot(path=str(OUTPUT / f'{name}-{section}.png'), style='.skip{visibility:hidden!important}')
            page.locator('[data-boundary="building"]').click()
            expect(page.locator('#energy-chart')).to_contain_text('12.7%')
            expect(page.locator('#energy-chart')).to_contain_text('5.3%')
            assert page.locator('#other-legend').is_visible()
            page.locator('[data-boundary="hvac"]').click()
            expect(page.locator('#energy-chart')).to_contain_text('37.7%')
            assert not page.locator('#other-legend').is_visible()
            for component in ['tower','pumps','fans','chillers']:
                page.locator(f'[data-component="{component}"]').click()
                assert page.locator(f'[data-component="{component}"]').get_attribute('aria-pressed')=='true'
                assert len(page.locator('#component-detail').inner_text())>100
            for scenario, text in [(1,'C still leads'),(2,'A leads'),(0,'C leads')]:
                page.locator(f'[data-scenario="{scenario}"]').click()
                expect(page.locator('#scenario-verdict')).to_contain_text(text)
            page.locator('[data-cash="nominal"]').click()
            expect(page.locator('#cash-caption')).to_contain_text('+$939,131')
            page.locator('[data-cash="discounted"]').click()
            expect(page.locator('#cash-caption')).to_contain_text('+$68,531')
            point=page.locator('.chart-point[data-key="C"][data-year="10"]')
            point.focus()
            expect(page.locator('#cash-tooltip')).to_contain_text('+$68,531')
            page.locator('#capital').focus()
            page.keyboard.press('ArrowRight')
            expect(page.locator('#capital-label')).to_contain_text('101%')
            for control,value in [('capital','120'),('price','0.2')]:
                page.locator('#'+control).evaluate('(el,value)=>{el.value=value;el.dispatchEvent(new Event("input",{bubbles:true}))}',value)
            expect(page.locator('#sensitivity-npv')).to_have_text('−$248,475')
            page.locator('#reset-sensitivity').click()
            expect(page.locator('#sensitivity-npv')).to_have_text('+$68,531')
            for category,count in [('Start here',2),('Model',1),('Engineering',1),('Research',3),('Presentation',1),('All',8)]:
                page.locator(f'[data-filter="{category}"]').click()
                expect(page.locator('.document-card')).to_have_count(count)
            first=page.locator('[data-preview]').first
            first.focus();page.keyboard.press('Enter')
            expect(page.locator('#document-dialog')).to_be_visible()
            assert page.locator('#pdf-preview').get_attribute('src').endswith('.pdf')
            page.screenshot(path=str(OUTPUT/f'{name}-document-preview.png'))
            page.locator('#close-dialog').focus();page.keyboard.press('Escape')
            expect(page.locator('#document-dialog')).not_to_be_visible()
            assert first.evaluate('(el)=>el===document.activeElement')
            for preview_button in page.locator('[data-preview]').all()[1:]:
                expected_file=preview_button.get_attribute('data-preview')
                preview_button.click()
                expect(page.locator('#document-dialog')).to_be_visible()
                assert page.locator('#pdf-preview').get_attribute('src')=='assets/documents/'+expected_file
                assert page.locator('#preview-download').get_attribute('href')=='assets/documents/'+expected_file
                page.locator('#close-dialog').click()
                expect(page.locator('#document-dialog')).not_to_be_visible()
            # Native disclosure controls work with keyboard; all expanded tables remain confined.
            for summary in page.locator('summary').all():
                summary.focus();page.keyboard.press('Enter')
                assert summary.locator('..').evaluate('(el)=>el.open')
            assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'), name+' expanded'
            if axe:
                page.add_script_tag(path=axe)
                result=page.evaluate('async()=>await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})')
                report['axe'].append({'viewport':name,'violations':result['violations'],'passes':len(result['passes'])})
                assert not result['violations'], json.dumps(result['violations'],indent=2)
            for anchor in page.locator('a[href^="#"]').all():
                target=anchor.get_attribute('href')[1:]
                assert page.locator('[id="'+target+'"]').count()==1
            report['viewports'].append({'name':name,'width':width,'overflow':False,'interactions':'passed'})
            page.close()
        page=browser.new_page()
        page.goto(url);page.wait_for_selector('.document-card')
        # Test all links and all downloads by bytes, not just status codes.
        for doc in data['documents']:
            response=page.request.get(url+'/assets/documents/'+doc['file'])
            assert response.ok
            assert hashlib.sha256(response.body()).hexdigest()==doc['sha256']
        zip_response=page.request.get(url+'/assets/Manhattan_HVAC_Portfolio_Project.zip')
        assert zip_response.ok
        assert zip_response.body()==(ROOT/'site/assets/Manhattan_HVAC_Portfolio_Project.zip').read_bytes()
        with page.expect_download() as download:
            page.locator('a[download]').filter(has_text='Download original project ZIP').click()
        assert download.value.suggested_filename=='Manhattan_HVAC_Portfolio_Project.zip'
        for name in ['index.html','styles.css','app.js','model.js','data.json','assets/mark.svg','build-manifest.json']:
            assert page.request.get(url+'/'+name).ok,name
        # Real navigation and keyboard skip link on a clean page.
        page.goto(url);page.keyboard.press('Tab')
        expect(page.locator('.skip')).to_be_focused()
        page.keyboard.press('Enter')
        assert page.evaluate('location.hash')=='#main'
        for target in ['engineering','investment','evidence','library']:
            page.locator('header a[href="#'+target+'"]').click()
            assert page.evaluate('location.hash')=='#'+target
        # PDF preview downloads do not depend on the browser's embedded PDF renderer.
        assert not errors,errors
        assert not failed,failed
        report['functional']=['all interactive controls at four widths','keyboard sliders, disclosures, modal Escape and focus return','all navigation anchors and header links','all 8 document response hashes and original ZIP','actual browser ZIP download','production assets and manifest','no browser console errors, page errors or HTTP failures']
        browser.close()
finally:
    server.shutdown()
    (OUTPUT/'browser-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'viewports':len(report['viewports']),'functional':report['functional'],'axe_violations':sum(len(a['violations']) for a in report['axe']) if axe else 'not run'},indent=2))
