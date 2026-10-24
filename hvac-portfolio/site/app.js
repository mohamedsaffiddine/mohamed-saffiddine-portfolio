import {sensitivityNPV, cumulative} from './model.js';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const integer = number => new Intl.NumberFormat('en-US', {maximumFractionDigits:0}).format(number);
const money = (number, signed = true) => `${number < 0 ? '−' : number > 0 && signed ? '+' : ''}$${integer(Math.abs(number))}`;
const million = number => `${number < 0 ? '−' : number > 0 ? '+' : ''}$${(Math.abs(number) / 1e6).toFixed(3)}m`;
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
  $('#energy-caption').textContent = `${building ? 'Whole-building' : 'HVAC'} electricity · million kWh/year · equal cooling service`;
  const max = 3043500 + (building ? 6000000 : 0);
  $('#energy-chart').innerHTML = ['A','B','C'].map((key, index) => {
   const values = [...data.energy[key], ...(building ? [6000000] : [])];
   const total = values.reduce((a,b) => a+b,0);
   const saved = (max-total)/max*100;
   return `<div class="energy-row"><div class="energy-row-head"><span>${key} / ${['Existing','Full modernization','Partial upgrade'][index]}</span><strong>${(total/1e6).toFixed(3)}m</strong></div><div class="energy-track"><div class="energy-stack" style="width:${total/max*100}%">${values.map((value,i) => `<span class="energy-segment ${classes[i]}" tabindex="0" role="img" aria-label="${key}: ${[...names,'Other electricity'][i]}, ${integer(value)} kWh/year" style="width:${value/total*100}%" title="${[...names,'Other electricity'][i]}: ${integer(value)} kWh/year"></span>`).join('')}</div></div><div class="energy-row-note">${index === 0 ? 'Reference consumption' : `${saved.toFixed(1)}% reduction versus A`}</div></div>`;
  }).join('');
  $('#energy-insight').innerHTML = building ? '<strong>Same savings, wider boundary.</strong> Adding unchanged lighting, plugs and lifts makes B / C’s whole-building electricity reductions 12.7% / 5.3%. Gas is unchanged.' : '<strong>75.5% of C’s electricity savings come from auxiliaries.</strong> Fan, pump and tower assumptions need evidence alongside the chiller performance curve.';
 }
 $('#energy-table').innerHTML = names.map((name,i) => `<tr><th scope="row">${name}</th>${['A','B','C'].map(k=>`<td>${integer(data.energy[k][i])}</td>`).join('')}</tr>`).join('') + `<tr><th scope="row">Total HVAC</th><td>3,043,500</td><td>1,896,300</td><td>2,566,500</td></tr><tr><th scope="row">Other building electricity</th><td>6,000,000</td><td>6,000,000</td><td>6,000,000</td></tr><tr><th scope="row">Whole-building electricity</th><td>9,043,500</td><td>7,896,300</td><td>8,566,500</td></tr>`;
 $$('[data-boundary]').forEach(b => b.addEventListener('click',()=> {press('[data-boundary]',b);energy(b.dataset.boundary);}));
 energy('hvac');
 function scenario(index) {
  const s = data.scenarios[index];
  $('#scenario-assumptions').textContent = `${(s.rate*100).toFixed(1)}% discount · $${s.price.toFixed(2)}/kWh · ${(s.energy*100).toFixed(0)}% energy realization · ${(s.capital*100).toFixed(0)}% cost · ${(s.maintenance*100).toFixed(0)}% maintenance realization`;
  const left=108,zero=426,width=318;
  const x = value => zero + value/4e6*width;
  $('#npv-chart').innerHTML = `<svg viewBox="0 0 520 250" role="img" aria-labelledby="npv-title npv-desc"><title id="npv-title">${s.name} scenario: ten-year NPV</title><desc id="npv-desc">A Existing: $0. B Full: ${money(s.npv.B)}. C Partial: ${money(s.npv.C)}. Discount rate ${(s.rate*100).toFixed(1)}%.</desc>${[-4,-3,-2,-1,0,1].map(t=>`<path d="M${x(t*1e6)} 22V198" stroke="#dde3da" ${t===0?'stroke-width="1.5"':''}/><text x="${x(t*1e6)}" y="225" text-anchor="middle" class="chart-axis">${t===0?'0':t}</text>`).join('')}${['A','B','C'].map((key,i)=>{
   const value=s.npv[key],y=40+i*60;
   const end=x(value),w=Math.abs(end-zero);
   const labelx=value<0?Math.max(left+3,end+8):zero+8;
   return `<text x="0" y="${y+21}" class="npv-chart-text">${key} / ${['Existing','Full','Partial'][i]}</text><rect x="${Math.min(end,zero)}" y="${y}" width="${Math.max(w,2)}" height="33" fill="${key==='B'?'#e3b795':key==='C'?'#9eb8a3':'#9aaba2'}"/><text x="${labelx}" y="${y+21}" class="npv-value">${million(value)}</text>`;
  }).join('')}</svg>`;
  const verdict = [
   '<strong>C leads, with a narrow cushion.</strong> Its $68,531 NPV is $1.823m above B. The extra $3.331m for B is not justified within this horizon.',
   '<strong>C still leads.</strong> More favorable price, savings and cost inputs improve both options; full modernization’s NPV remains negative.',
   '<strong>A leads on incremental NPV.</strong> Both upgrades destroy modeled discounted value under the downside inputs. C’s positive base result is not robust across scenarios.'
  ];
  $('#scenario-verdict').innerHTML=verdict[index];
 }
 $$('[data-scenario]').forEach(b=>b.addEventListener('click',()=>{press('[data-scenario]',b);scenario(Number(b.dataset.scenario));}));
 scenario(0);
 function cash(mode) {
  const values=mode==='discounted'?data.discounted:{B:cumulative(data.cash.B),C:cumulative(data.cash.C)};
  const min=-5.3,max=1.2,W=1000,H=290,L=55,R=50,T=25,B=40;
  const x=i=>L+i*(W-L-R)/10;
  const y=v=>T+(max-v/1e6)/(max-min)*(H-T-B);
  let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="cash-title cash-desc"><title id="cash-title">${mode==='discounted'?'Discounted':'Undiscounted'} cumulative base cash flows</title><desc id="cash-desc">Year 0 to Year 10. B ends at ${money(values.B[10])}; C ends at ${money(values.C[10])}. Exact yearly values are in the expandable table below.</desc>`;
  for(const v of [-5,-4,-3,-2,-1,0,1]) svg+=`<path d="M${L} ${y(v*1e6)}H${W-R}" stroke="${v===0?'#809a91':'#e1e6dc'}" ${v===0?'stroke-dasharray="4 4"':''}/><text x="${L-12}" y="${y(v*1e6)+4}" text-anchor="end" class="chart-axis">${v}</text>`;
  for(let i=0;i<=10;i++) svg+=`<text x="${x(i)}" y="${H-15}" text-anchor="middle" class="chart-axis">${i===0?'2026':2026+i}</text>`;
  for(const key of ['B','C']) {
   const color=key==='B'?'#bc744f':'#447866';
   svg+=`<polyline points="${values[key].map((v,i)=>`${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
   values[key].forEach((v,i)=>{svg+=`<circle class="chart-point" data-key="${key}" data-year="${i}" tabindex="0" role="img" aria-label="${key}, year-end ${2026+i}, ${money(v)}" cx="${x(i)}" cy="${y(v)}" r="3.5" fill="${color}"><title>${key} · ${2026+i}: ${money(v)}</title></circle>`;});
  }
  svg+='</svg><div class="chart-tooltip" id="cash-tooltip" aria-live="polite">Focus or hover over a point for its exact value. A table is available below.</div>';
  $('#cash-chart').innerHTML=svg;
  $$('.chart-point').forEach(point=>{
   const show=()=>{$('#cash-tooltip').textContent=`${point.dataset.key==='B'?'B Full modernization':'C Partial upgrade'} · Dec 31, ${2026+Number(point.dataset.year)} · ${money(values[point.dataset.key][Number(point.dataset.year)])}`;};
   point.addEventListener('focus',show);point.addEventListener('mouseenter',show);
  });
  $('#cash-caption').textContent=mode==='discounted'?'Discounted at 8.5% using actual days / 365. Year 10 endpoints equal base NPV: B −$1,754,620; C +$68,531.':'Undiscounted, after-tax cumulative cash flow. Year 10 endpoints: B −$101,566; C +$939,131. Nominal recovery is not discounted investment value.';
  $('#cash-table-caption').textContent=`${mode==='discounted'?'Discounted at 8.5%':'Undiscounted'} cumulative after-tax cash flows · USD`;
  $('#cash-table').innerHTML=values.B.map((v,i)=>`<tr><th scope="row">${2026+i}${i===0?' (Year 0)':''}</th><td>${money(v)}</td><td>${money(values.C[i])}</td></tr>`).join('');
 }
 $$('[data-cash]').forEach(b=>b.addEventListener('click',()=>{press('[data-cash]',b);cash(b.dataset.cash);}));cash('discounted');
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
 dialog.addEventListener('close',()=>{$('#pdf-preview').removeAttribute('src');previewButton?.focus();});
 function documents(filter) {
  const docs=data.documents.filter(d=>filter==='All'||d.category===filter);
  $('#document-count').textContent=`${docs.length} ${docs.length===1?'file':'files'}`;
  $('#document-grid').innerHTML=docs.map(doc=>{
   const ext=doc.file.split('.').pop().toUpperCase();
   return `<article class="document-card"><div class="doc-meta"><span class="file-icon">${ext}</span><span>${doc.category.toUpperCase()} / ${Math.round(doc.bytes/1024)} KB</span></div><h3>${doc.title}</h3><p>${doc.description}</p><div class="doc-actions">${ext==='PDF'?`<button data-preview="${doc.file}" aria-label="Preview ${doc.title}">Preview PDF <svg class="arrow-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8"/></svg></button>`:`<span>${doc.pages} ${ext==='XLSX'?'worksheets':'slides'}</span>`}<a href="assets/documents/${doc.file}" download aria-label="Download ${doc.title}">Download ↓</a></div></article>`;
  }).join('');
  $$('[data-preview]').forEach(b=>b.addEventListener('click',()=>preview(data.documents.find(d=>d.file===b.dataset.preview),b)));
 }
 $$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{press('[data-filter]',b);documents(b.dataset.filter);}));documents('All');
} catch(error) {
 console.error(error);
 const notice=document.createElement('p');notice.className='load-error';notice.setAttribute('role','alert');
 notice.textContent='Interactive data could not load. Serve this folder over HTTP, or download the original project ZIP below to review the complete study.';
 $('#main').prepend(notice);
}
