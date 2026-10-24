import {sensitivityNPV, cumulative} from './model.js';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const integer = number => new Intl.NumberFormat('en-US', {maximumFractionDigits:0}).format(number);
const money = (number, signed = true) => `${number < 0 ? '−' : number > 0 && signed ? '+' : ''}$${integer(Math.abs(number))}`;
const press = (selector, active) => $$(selector).forEach(button => button.setAttribute('aria-pressed', String(button === active)));
const components = {
 chillers: {title:'Chillers / make the same cooling with less electricity', text:'A keeps both existing units. B replaces them; C retains and rebuilds them. The model uses assumed plant-level kW/ton curves, not manufacturer-certified selections.'},
 tower: {title:'Cooling tower / reject heat to outdoor air',text:'Both upgrades refurbish tower equipment. Lower average fan power is assumed: 117,000 → 90,000 / 99,000 kWh per year for A → B / C. Tower heat rejection is thermal; the chart counts fan electricity.'},
 pumps: {title:'Water pumps / move heat through separate circuits',text:'B includes broader pump and variable-speed-drive work; C uses selective improvements. A combined 150 kW allowance covers all modeled water pumps once. Average power fractions need measured duty profiles.'},
 fans: {title:'AHU + fans / deliver conditioned air',text:'Supply and return fans share a 350 kW group and 3,600 annual hours. B / C use average electrical power fractions of 0.48 / 0.60 versus A’s 0.80. These are power fractions, not fan speeds.'}
};
function component(button) {
 press('[data-component]', button);
 $$('[data-component]').forEach(b => b.classList.toggle('selected', b === button));
 const item = components[button.dataset.component];
 $('#component-detail').innerHTML = `<strong>${item.title}</strong><p>${item.text}</p>`;
}
$$('[data-component]').forEach(button => button.addEventListener('click', () => component(button)));
component($('[data-component="chillers"]'));
try {
 const response = await fetch('data.json');
 if (!response.ok) throw new Error(`Project data: HTTP ${response.status}`);
 const data = await response.json();
 const names = ['Chillers','Supply / return fans','Water pumps','Cooling tower fans'];
 const classes = ['chiller','fans','pumps','tower','other'];
 function energy(boundary) {
  const building = boundary === 'building';
  $('#other-legend').hidden = !building;
  $('#energy-caption').textContent = `${building ? 'Whole-building' : 'HVAC'} electricity · kWh/year · equal cooling service`;
  const max = 3043500 + (building ? 6000000 : 0);
  $('#energy-chart').innerHTML = ['A','B','C'].map((key, index) => {
   const values = [...data.energy[key], ...(building ? [6000000] : [])];
   const total = values.reduce((a,b) => a+b,0);
   const saved = (max-total)/max*100;
   return `<div class="energy-row"><div class="energy-row-head"><span>${key} / ${['Existing','Full modernization','Partial upgrade'][index]}</span><strong>${integer(total)} <small>kWh</small></strong></div><div class="energy-track"><div class="energy-stack" style="width:${total/max*100}%">${values.map((value,i) => `<span class="energy-segment ${classes[i]}" tabindex="0" role="img" aria-label="${key}: ${[...names,'Other electricity'][i]}, ${integer(value)} kWh/year" style="width:${value/total*100}%" title="${[...names,'Other electricity'][i]}: ${integer(value)} kWh/year"></span>`).join('')}</div></div><div class="energy-row-note">${index === 0 ? 'Reference consumption' : `${saved.toFixed(1)}% reduction versus A`}</div></div>`;
  }).join('');
  $('#energy-insight').innerHTML = building ? '<strong>A wider boundary changes the percentage.</strong> B / C reduce whole-building electricity by 12.7% / 5.3%. Gas use is unchanged.' : '<strong>HVAC electricity only.</strong> The 37.7% / 15.7% reductions do not describe all building energy or gas use.';
 }
 $('#energy-table').innerHTML = names.map((name,i) => `<tr><th scope="row">${name}</th>${['A','B','C'].map(k=>`<td>${integer(data.energy[k][i])}</td>`).join('')}</tr>`).join('') + `<tr><th scope="row">Total HVAC</th><td>3,043,500</td><td>1,896,300</td><td>2,566,500</td></tr><tr><th scope="row">Other building electricity</th><td>6,000,000</td><td>6,000,000</td><td>6,000,000</td></tr><tr><th scope="row">Whole-building electricity</th><td>9,043,500</td><td>7,896,300</td><td>8,566,500</td></tr>`;
 $$('[data-boundary]').forEach(b => b.addEventListener('click',()=> {press('[data-boundary]',b);energy(b.dataset.boundary);}));
 energy('hvac');
 function scenario(index) {
  const scenario = data.scenarios[index];
  $('#selected-scenario').textContent = `${scenario.name.toUpperCase()} SCENARIO`;
  $('#scenario-assumptions').innerHTML = [
   ['Discount rate', `${(scenario.rate * 100).toFixed(1)}%`],
   ['Electricity price', `$${scenario.price.toFixed(2)}/kWh`],
   ['Energy realization', `${Math.round(scenario.energy * 100)}%`],
   ['Initial cost', `${Math.round(scenario.capital * 100)}% of base`],
   ['Maintenance realization', `${Math.round(scenario.maintenance * 100)}%`]
  ].map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
  // One fixed scale in every scenario: −$4m to +$1m, with zero at 80%.
  const position = value => 80 + value / 5000000 * 100;
  $('#npv-chart').innerHTML = `<div role="img" aria-label="${scenario.name} ten-year NPV: A ${money(0)}, B ${money(scenario.npv.B)}, C ${money(scenario.npv.C)}">${['A', 'B', 'C'].map((key, i) => {
   const value = scenario.npv[key];
   const end = position(value);
   return `<div class="npv-row"><div class="npv-row-head"><span>${key} / ${['Existing', 'Full', 'Partial'][i]}</span><strong class="${value < 0 ? 'negative' : value > 0 ? 'positive' : ''}">${money(value)}</strong></div><div class="npv-track"><span class="npv-bar ${key.toLowerCase()}" style="left:${Math.min(end, 80)}%;width:${Math.max(Math.abs(end - 80), 0.3)}%"></span></div></div>`;
  }).join('')}<div class="npv-axis"><span style="left:0">−$4m</span><span style="left:40%">−$2m</span><span style="left:80%">$0</span><span style="left:100%">+$1m</span></div></div>`;
  const verdicts = [
   '<strong>C leads, with a narrow cushion.</strong>C creates $68,531 of modeled value, versus a $1.755m shortfall for B. A small change in assumptions can erase C’s surplus.',
   '<strong>C still leads.</strong>Favorable inputs raise C’s NPV to $621,752. B improves but remains negative at −$514,312.',
   '<strong>A leads on incremental NPV.</strong>Both upgrades are negative: B −$3,908,537; C −$838,052. The base-case preference for C is conditional.'
  ];
  $('#scenario-verdict').innerHTML = verdicts[index];
 }
 $$('[data-scenario]').forEach(b=>b.addEventListener('click',()=>{press('[data-scenario]',b);scenario(Number(b.dataset.scenario));}));
 scenario(0);
 let currentCashMode = 'discounted';
 const smallChart = window.matchMedia('(max-width:650px)');
 function cash(mode) {
  currentCashMode = mode;
  const values = mode === 'discounted' ? data.discounted : {B: cumulative(data.cash.B), C: cumulative(data.cash.C)};
  const mobile = smallChart.matches;
  const min = -5.3, max = 1.2, W = mobile ? 360 : 900, H = mobile ? 285 : 295;
  const L = mobile ? 32 : 50, R = mobile ? 18 : 35, T = 20, B = 35;
  const x = i => L + i * (W - L - R) / 10;
  const y = v => T + (max - v / 1e6) / (max - min) * (H - T - B);
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="cash-title cash-desc"><title id="cash-title">${mode === 'discounted' ? 'Discounted' : 'Undiscounted'} cumulative base cash flows</title><desc id="cash-desc">Year 0 to Year 10. B ends at ${money(values.B[10])}; C ends at ${money(values.C[10])}. Exact annual values are in the expandable table.</desc>`;
  for (const value of (mobile ? [-5, -3, -1, 0, 1] : [-5, -4, -3, -2, -1, 0, 1])) {
   svg += `<path d="M${L} ${y(value * 1e6)}H${W - R}" stroke="${value === 0 ? '#7c9a8c' : '#dce5de'}" ${value === 0 ? 'stroke-dasharray="4 4"' : ''}/><text x="${L - 10}" y="${y(value * 1e6) + 4}" text-anchor="end" class="chart-axis">${value}</text>`;
  }
  for (let i = 0; i <= 10; i += mobile ? 2 : 1) {
   svg += `<text x="${x(i)}" y="${H - 10}" text-anchor="middle" class="chart-axis">${2026 + i}</text>`;
  }
  for (const key of ['B', 'C']) {
   const color = key === 'B' ? '#a66745' : '#356f5d';
   svg += `<polyline points="${values[key].map((value, i) => `${x(i)},${y(value)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
   values[key].forEach((value, i) => {
    svg += `<circle class="chart-point" data-key="${key}" data-year="${i}" tabindex="0" role="img" aria-label="${key}, year-end ${2026 + i}, ${money(value)}" cx="${x(i)}" cy="${y(value)}" r="${mobile ? 4 : 3.5}" fill="${color}"><title>${key} · ${2026 + i}: ${money(value)}</title></circle>`;
   });
  }
  svg += '</svg><div class="chart-tooltip" id="cash-tooltip" aria-live="polite">Select a point, or use the annual data table, for the exact value.</div>';
  $('#cash-chart').innerHTML = svg;
  $$('.chart-point').forEach(point => {
   const show = () => {
    $('#cash-tooltip').textContent = `${point.dataset.key === 'B' ? 'B Full modernization' : 'C Partial upgrade'} · Dec 31, ${2026 + Number(point.dataset.year)} · ${money(values[point.dataset.key][Number(point.dataset.year)])}`;
   };
   for (const event of ['focus', 'mouseenter', 'click']) point.addEventListener(event, show);
  });
  $('#cash-caption').textContent = mode === 'discounted'
   ? 'Discounted at 8.5% using actual days / 365. Year 10 endpoints equal base NPV: B −$1,754,620; C +$68,531.'
   : 'Undiscounted, after-tax cumulative cash flow. Year 10 endpoints: B −$101,566; C +$939,131. This is not discounted investment value.';
  $('#cash-table-caption').textContent = `${mode === 'discounted' ? 'Discounted at 8.5%' : 'Undiscounted'} cumulative after-tax cash flows · USD`;
  $('#cash-table').innerHTML = values.B.map((value, i) => `<tr><th scope="row">${2026 + i}${i === 0 ? ' (Year 0)' : ''}</th><td>${money(value)}</td><td>${money(values.C[i])}</td></tr>`).join('');
 }
 $$('[data-cash]').forEach(button => button.addEventListener('click', () => {
  press('[data-cash]', button);
  cash(button.dataset.cash);
 }));
 smallChart.addEventListener('change', () => cash(currentCashMode));
 cash('discounted');
 function sensitivity() {
  const capital=Number($('#capital').value)/100,price=Number($('#price').value);
  const npv=sensitivityNPV(data.sensitivity,capital,price);
  $('#capital-label').textContent=`${Math.round(capital*100)}% · ${money(1669000*capital,false)}`;
  $('#price-label').textContent=`$${price.toFixed(3)}/kWh`;
  $('#sensitivity-npv').textContent=money(npv);
  $('#sensitivity-npv').classList.toggle('negative',npv<0);
  $('#sensitivity-status').textContent=npv>=0?'Positive modeled NPV. A conditional surplus is not an investment approval; the other base assumptions still need evidence.':'Negative modeled NPV. At these inputs, C does not recover its discounted cost within the ten-year horizon.';
 }
 $('#capital').addEventListener('input',sensitivity);$('#price').addEventListener('input',sensitivity);
 $('#reset-sensitivity').addEventListener('click',()=>{$('#capital').value='100';$('#price').value='0.2';sensitivity();});sensitivity();
 $('#sensitivity-table').innerHTML=data.matrix.map((row,i)=>`<tr><th scope="row">${(0.8+i*0.2).toFixed(1)}×</th>${row.map((v,j)=>`<td class="${v>=0?'positive':'negative'} ${i===1&&j===2?'base-cell':''}">${money(v)}</td>`).join('')}</tr>`).join('');
 $('#capex-table').innerHTML=data.capex.map(r=>`<tr><th scope="row">${r.item}</th><td>${money(r.B,false)}</td><td>${money(r.C,false)}</td></tr>`).join('')+'<tr><th scope="row">Contingency (real-property items)</th><td>$450,000</td><td>$149,000</td></tr><tr><th scope="row">Total initial funding</th><td>$5,000,000</td><td>$1,669,000</td></tr>';
 const dialog=$('#document-dialog');
 let previewButton=null;
 function preview(doc,button) {
  previewButton=button;
  const url=`assets/documents/${doc.file}`;
  $('#dialog-title').textContent=doc.title;
  $('#pdf-preview').title=`${doc.title}: original PDF`;
  $('#pdf-preview').src=url;
  $('#preview-open').href=url;$('#preview-download').href=url;
  dialog.showModal();
 }
 $('#close-dialog').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 dialog.addEventListener('close',()=>{
  // A queued close event can arrive after another document has already opened.
  if (dialog.open) return;
  $('#pdf-preview').removeAttribute('src');
  previewButton?.focus();
 });
 const primaryFiles = [
  'Executive_Investment_Summary.pdf',
  'HVAC_CapEx_Final_Validated.xlsx',
  'Engineering_Analysis_and_System_Schematic.pdf',
  'HVAC_Engineering_Financial_Presentation.pptx'
 ];
 function documentCard(doc) {
  const extension = doc.file.split('.').pop().toUpperCase();
  const units = extension === 'XLSX' ? 'worksheets' : extension === 'PPTX' ? 'slides' : doc.pages === 1 ? 'page' : 'pages';
  const title = extension === 'XLSX' ? 'Excel financial model' : doc.title;
  return `<article class="document-card"><div class="doc-heading"><span class="file-icon">${extension}</span><div><h3>${title}</h3><span class="doc-size">${doc.pages} ${units} · ${Math.round(doc.bytes / 1024)} KB</span></div></div><p>${doc.description}</p><div class="doc-actions">${extension === 'PDF'
   ? `<button data-preview="${doc.file}" aria-label="Preview ${doc.title}">Preview PDF <svg class="arrow-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8"/></svg></button>`
   : `<span>${extension === 'XLSX' ? 'Original editable workbook' : 'Editable slides + notes'}</span>`}<a href="assets/documents/${doc.file}" download aria-label="Download ${doc.title}">Download ↓</a></div></article>`;
 }
 $('#document-grid').innerHTML = primaryFiles.map(file => documentCard(data.documents.find(doc => doc.file === file))).join('');
 $('#supporting-grid').innerHTML = data.documents.filter(doc => !primaryFiles.includes(doc.file)).map(documentCard).join('');
 $$('[data-preview]').forEach(button => button.addEventListener('click', () => {
  preview(data.documents.find(doc => doc.file === button.dataset.preview), button);
 }));

} catch(error) {
 console.error(error);
 const notice=document.createElement('p');notice.className='load-error';notice.setAttribute('role','alert');
 notice.textContent='Interactive data could not load. Serve this folder over HTTP, or download the original project ZIP below to review the complete study.';
 $('#main').prepend(notice);
}
