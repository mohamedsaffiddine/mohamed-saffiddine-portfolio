document.getElementById('print')?.addEventListener('click', () => window.print());

// A direct link to evidence should reveal the section it points to.
function revealLinkedEvidence() {
  const id = window.location.hash.slice(1);
  if (!id) return;
  let target;
  try {
    target = document.getElementById(decodeURIComponent(id));
  } catch {
    return;
  }
  if (!target) return;
  for (let node = target; node; node = node.parentElement) {
    if (node.tagName === 'DETAILS') node.open = true;
  }
}

window.addEventListener('hashchange', revealLinkedEvidence);
revealLinkedEvidence();
