'use strict';

// Keep old section links useful after moving technical material into disclosures.
function revealLinkedEvidence() {
  let target;
  try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); }
  catch { return; }
  if (!target) return;
  for (let node = target; node; node = node.parentElement) {
    if (node.tagName === 'DETAILS') node.open = true;
  }
}
window.addEventListener('hashchange', revealLinkedEvidence);
revealLinkedEvidence();

// Include supporting evidence when printing, then restore the reader's view.
let closedBeforePrint = [];
window.addEventListener('beforeprint', () => {
  closedBeforePrint = [...document.querySelectorAll('details:not([open])')];
  closedBeforePrint.forEach(detail => { detail.open = true; });
});
window.addEventListener('afterprint', () => {
  closedBeforePrint.forEach(detail => { detail.open = false; });
  closedBeforePrint = [];
});
document.getElementById('print')?.addEventListener('click', () => window.print());
