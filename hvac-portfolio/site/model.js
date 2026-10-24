/** Conditional calculations from the original workbook; no workbook edits. */
export function sensitivityNPV(pv, capital, price) {
  return pv.energyPV * price + pv.maintenancePV + pv.capitalPV * capital + pv.fixedPV;
}
export function cumulative(values) {
  let total = 0;
  return values.map(value => (total += value));
}
export function datedNPV(values, rate) {
  const first = Date.UTC(2026, 11, 31);
  return values.reduce((sum, value, i) => sum + value / (1 + rate) ** ((Date.UTC(2026 + i, 11, 31) - first) / 86400000 / 365), 0);
}
export function scenarioCash(components, scenario) {
  return components[0].map((_, i) => components[0][i] * scenario.price * scenario.energy + components[1][i] * scenario.maintenance + components[2][i] * scenario.capital + components[3][i]);
}
