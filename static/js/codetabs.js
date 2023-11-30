// TODO: URI-able tabs

function copyCodeToClipboard(panelId) {
  // Get the last <code>, path depends on highlighter options
  const code = [...document.querySelectorAll(`${panelId} code`)].pop().textContent;
  navigator.clipboard.writeText(code);

  // Toggle tooltip
  const tooltip = document.querySelector(`${panelId} .tooltiptext`);
  tooltip.style.display = 'block';
  setTimeout(() => tooltip.style.display = 'none', 1000);
}

function toggleVisibleLines(evt) {
  document.getElementById(evt.getAttribute('aria-controls'))
    .toggleAttribute('aria-expanded');
}

function switchCodeTab(tabGroup, tabId) {
  // Synchronize tab selection to relevant page tabs
  for (const tv of document.querySelectorAll('.codetabs')) {
    if (tv.id === tabGroup) continue; // Skip caller
    const trg = document.getElementById(`${tabId}_${tv.id}`);
    if (!trg) continue; // Skip tabs where there's no target
    trg.checked = true;
  }

  // Persist tab selection
  if (window.localStorage) {
    window.localStorage.setItem('selectedCodeTab', tabId);
  }
}

function onchangeCodeTab(e) {
  const tabGroup = e.target.parentElement.id;
  const tabId = e.target.parentElement.querySelector(`label[for="${e.srcElement.id}"]`).textContent;
  const yPos = e.target.getBoundingClientRect().top;

  switchCodeTab(tabGroup, tabId);

  // Scroll to the source element if it jumped
  const yDiff = e.target.getBoundingClientRect().top - yPos;
  window.scrollTo(window.scrollX, window.scrollY + yDiff);
}

document.addEventListener('DOMContentLoaded', () => {
  // Register tab switch listeners
  for (const tvr of document.querySelectorAll('.codetabs > input[type="radio"]')) {
    tvr.addEventListener("change", (e) => onchangeCodeTab(e));
  }

  // Restore selection
  if (window.localStorage) {
    const selectedTab = window.localStorage.getItem("selectedCodeTab");
    if (selectedTab) {
      switchCodeTab(null, selectedTab);
    }
  }

  // Work around Chroma's tabindex: https://github.com/alecthomas/chroma/issues/731
  for (const pre of document.querySelectorAll('.highlight pre')) {
    pre.removeAttribute('tabindex');
  }

});
