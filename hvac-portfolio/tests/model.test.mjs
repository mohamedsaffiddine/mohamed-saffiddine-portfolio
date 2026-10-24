import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sensitivityNPV, cumulative, datedNPV, scenarioCash} from '../site/model.js';
const data=JSON.parse(readFileSync(new URL('../site/data.json',import.meta.url)));
const close=(actual,expected,tolerance=.00001)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`);
test('all six dated scenario NPVs reproduce original cached workbook results',()=>{
 for (const scenario of data.scenarios) for (const key of ['B','C']) close(datedNPV(scenarioCash(data.components[key],scenario),scenario.rate),scenario.npv[key]);
});
test('both base cash-flow reconstructions match all 22 annual model values',()=>{
 for (const key of ['B','C']) scenarioCash(data.components[key],data.scenarios[0]).forEach((v,i)=>close(v,data.cash[key][i]));
});
test('all 25 cost × price cells match original sensitivity matrix',()=>{
 data.matrix.forEach((row,i)=>row.forEach((v,j)=>close(sensitivityNPV(data.sensitivity,.8+i*.2,.12+j*.04),v)));
});
test('break-even cost and tariff are consistent with workbook thresholds',()=>{
 const pv=data.sensitivity;
 const cap=-(pv.energyPV*.2+pv.maintenancePV+pv.fixedPV)/pv.capitalPV;
 const price=-(pv.maintenancePV+pv.capitalPV+pv.fixedPV)/pv.energyPV;
 close(cap*1669000,1741161.2055559198);close(price,.17239472509335177);
 close(sensitivityNPV(pv,1,.2),68530.63965304848);
 assert.ok(sensitivityNPV(pv,1.05,.2)<0);
});
test('engineering load bins and auxiliaries independently reproduce energy chart',()=>{
 const loads=[.25,.5,.75,1],hours=[750,1250,750,250];
 const curves={A:[.95,.8,.75,.72],B:[.5,.48,.52,.585],C:[.84,.73,.7,.7]};
 const fractions={A:[.8,.85,.65],B:[.48,.45,.5],C:[.6,.65,.55]};
 for(const k of ['A','B','C']){
  close(loads.reduce((sum,l,i)=>sum+1200*l*hours[i]*curves[k][i],0),data.energy[k][0]);
  fractions[k].forEach((f,i)=>close([350,150,60][i]*f*[3600,3000,3000][i],data.energy[k][i+1]));
 }
 const sum=k=>data.energy[k].reduce((a,b)=>a+b,0);
 close(sum('A'),3043500);close(sum('A')-sum('B'),1147200);close(sum('A')-sum('C'),477000);
 close((sum('A')-sum('B'))*.2+195000-25000,399440);
 close((sum('A')-sum('C'))*.2+110000-15000,190400);
});
test('discounted chart matches dated cash flows at every year',()=>{
 const first=Date.UTC(2026,11,31);
 for(const k of ['B','C']){
  const terms=data.cash[k].map((v,i)=>v/(1.085**((Date.UTC(2026+i,11,31)-first)/86400000/365)));
  cumulative(terms).forEach((v,i)=>close(v,data.discounted[k][i]));
  close(cumulative(data.cash[k])[10],k==='B'?-101565.53249514708:939130.525798111);
 }
});
test('capital budgets reconcile with original contingencies',()=>{
 close(data.capex.reduce((s,r)=>s+r.B,0)+450000,5000000);
 close(data.capex.reduce((s,r)=>s+r.C,0)+149000,1669000);
});
test('all eight original documents retain their recorded SHA-256',()=>{
 assert.equal(data.documents.length,8);
 for(const doc of data.documents){
  const bytes=readFileSync(new URL('../site/assets/documents/'+doc.file,import.meta.url));
  assert.equal(bytes.length,doc.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),doc.sha256);
 }
});
