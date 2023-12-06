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

function switchCodeTab(selectedTabInput, tabLang) {
  // Synchronize tab selection to relevant page tabs
  const trg = document.querySelectorAll(`.codetabs > input[data-lang=${tabLang}]`);
  trg.forEach((element) => {
      if (element === selectedTabInput)  return;
      element.checked = true;
  });

  // Persist tab selection
  if (window.localStorage) {
    window.localStorage.setItem('selectedCodeTab', tabLang);
  }
}

function onchangeCodeTab(e) {
  const selectedTabInput = e.target;
  const tabLang = e.target.dataset.lang;
  const yPos = e.target.getBoundingClientRect().top;

  switchCodeTab(selectedTabInput, tabLang);

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
