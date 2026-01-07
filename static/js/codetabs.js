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

function copyCodeToClipboardForCodetabs(button) {
  const codetabsId = button.getAttribute('data-codetabs-id');
  const codetabsContainer = document.getElementById(codetabsId);

  if (!codetabsContainer) return;

  // Find the visible panel
  const visiblePanel = codetabsContainer.querySelector('.panel:not(.panel-hidden)');
  if (!visiblePanel) return;

  // Get the code from the visible panel
  const code = [...visiblePanel.querySelectorAll('code')].pop().textContent;
  navigator.clipboard.writeText(code);

  // Toggle tooltip
  const tooltip = button.querySelector('.tooltiptext');
  if (tooltip) {
    tooltip.style.display = 'block';
    setTimeout(() => tooltip.style.display = 'none', 1000);
  }
}

function copyCodeBlockLinkToClipboard(button) {
  const codetabsId = button.getAttribute('data-codetabs-id');
  const codetabsContainer = document.getElementById(codetabsId);

  if (!codetabsContainer) return;

  // Find the anchor element with the exampleId (which is the step name)
  // The anchor is a sibling of the codetabs container
  const anchor = codetabsContainer.previousElementSibling;
  const anchorId = anchor && anchor.id ? anchor.id : codetabsId;

  // Get the currently selected language from the dropdown
  const langSelector = codetabsContainer.querySelector('.lang-selector');
  const selectedLang = langSelector ? langSelector.value : null;

  // Get the full URL with the anchor ID and language parameter
  let fullUrl = window.location.origin + window.location.pathname + '#' + anchorId;
  if (selectedLang) {
    fullUrl += '?lang=' + encodeURIComponent(selectedLang);
  }

  // Copy to clipboard
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fullUrl).then(() => {
      showCopyLinkFeedback(button);
    }).catch(err => {
      console.error('Failed to copy link: ', err);
      fallbackCopyLinkToClipboard(fullUrl, button);
    });
  } else {
    // Fallback for older browsers
    fallbackCopyLinkToClipboard(fullUrl, button);
  }
}

function showCopyLinkFeedback(button) {
  const tooltip = button.querySelector('.tooltiptext');
  if (tooltip) {
    tooltip.classList.remove('opacity-0');
    tooltip.classList.add('opacity-100');
    setTimeout(() => {
      tooltip.classList.add('opacity-0');
      tooltip.classList.remove('opacity-100');
    }, 2000);
  }
}

function fallbackCopyLinkToClipboard(text, button) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      showCopyLinkFeedback(button);
      console.log('Link copied to clipboard (fallback)');
    } else {
      console.error('Fallback copy failed');
    }
  } catch (err) {
    console.error('Fallback copy failed: ', err);
  }

  document.body.removeChild(textArea);
}

function toggleVisibleLines(evt) {
  document.getElementById(evt.getAttribute('aria-controls'))
    .toggleAttribute('aria-expanded');
}

function toggleVisibleLinesForCodetabs(button) {
  const codetabsId = button.getAttribute('data-codetabs-id');
  const codetabsContainer = document.getElementById(codetabsId);

  if (!codetabsContainer) return;

  // Find the visible panel
  const visiblePanel = codetabsContainer.querySelector('.panel:not(.panel-hidden)');
  if (!visiblePanel) return;

  // Toggle aria-expanded attribute
  visiblePanel.toggleAttribute('aria-expanded');

  // Toggle visibility icons
  const iconOn = button.querySelector('.visibility-icon-on');
  const iconOff = button.querySelector('.visibility-icon-off');

  if (iconOn && iconOff) {
    iconOn.classList.toggle('panel-hidden');
    iconOff.classList.toggle('panel-hidden');
  }
}

function switchCodeTab(selectedDropdown, tabLang) {
  // Synchronize dropdown selection to all code tab dropdowns on the page
  const allDropdowns = document.querySelectorAll('.codetabs .lang-selector');
  allDropdowns.forEach((dropdown) => {
    if (dropdown === selectedDropdown) return;

    // Find the option with matching data-lang and select it
    const options = dropdown.querySelectorAll('option');
    options.forEach((option) => {
      if (option.value === tabLang) {
        dropdown.value = tabLang;
        // Trigger panel visibility update for this dropdown's codetabs
        updatePanelVisibility(dropdown);
      }
    });
  });

  // Persist tab selection
  if (window.localStorage) {
    window.localStorage.setItem('selectedCodeTab', tabLang);
  }
}

function updatePanelVisibility(dropdown) {
  const selectedLang = dropdown.value;
  const codetabsId = dropdown.getAttribute('data-codetabs-id');
  const codetabsContainer = document.getElementById(codetabsId);

  if (!codetabsContainer) return;

  // Hide all panels in this codetabs container
  const panels = codetabsContainer.querySelectorAll('.panel');
  panels.forEach((panel) => {
    panel.classList.add('panel-hidden');
  });

  // Show the selected panel
  const selectedPanel = Array.from(panels).find(panel =>
    panel.getAttribute('data-lang') === selectedLang
  );

  if (selectedPanel) {
    selectedPanel.classList.remove('panel-hidden');
  }
}

function onchangeCodeTab(e) {
  const selectedDropdown = e.target;
  const tabLang = e.target.value;
  const yPos = e.target.getBoundingClientRect().top;

  // Update visibility for this dropdown's panels
  updatePanelVisibility(selectedDropdown);

  // Synchronize with other dropdowns
  switchCodeTab(selectedDropdown, tabLang);

  // Scroll to the source element if it jumped
  const yDiff = e.target.getBoundingClientRect().top - yPos;
  window.scrollTo(window.scrollX, window.scrollY + yDiff);
}

// Initialize codetabs - script is deferred so DOM is already ready
(function initCodetabs() {
  // Helper function to normalize language names to match dropdown values
  function normalizeLangParam(langParam) {
    if (!langParam) return null;
    // Apply the same transformations as the template does
    let normalized = langParam.replace(/C#/g, 'dotnet');
    normalized = normalized.replace(/\./g, '-');
    normalized = normalized.replace(/_/g, '-');
    return normalized;
  }

  // Register dropdown change listeners
  const dropdowns = document.querySelectorAll('.codetabs .lang-selector');
  dropdowns.forEach((dropdown) => {
    dropdown.addEventListener("change", (e) => onchangeCodeTab(e));
  });

  // Get language preference from URL parameter or localStorage
  let selectedTab = null;
  let anchorToScroll = null;

  // Check for lang parameter in URL (before hash)
  const urlParams = new URLSearchParams(window.location.search);
  let langParam = urlParams.get('lang');

  // Also check for lang parameter after the hash (e.g., #anchor?lang=Python)
  if (!langParam && window.location.hash) {
    const hashParts = window.location.hash.split('?');
    anchorToScroll = hashParts[0].substring(1); // Remove the # prefix
    if (hashParts.length > 1) {
      const hashParams = new URLSearchParams(hashParts[1]);
      langParam = hashParams.get('lang');
    }
  }

  if (langParam) {
    selectedTab = normalizeLangParam(langParam);
  } else if (window.localStorage) {
    // Fall back to localStorage if no URL parameter
    selectedTab = window.localStorage.getItem("selectedCodeTab");
  }

  // Apply the selected language to all dropdowns
  if (selectedTab) {
    dropdowns.forEach((dropdown) => {
      const options = dropdown.querySelectorAll('option');
      const matchingOption = Array.from(options).find(opt => opt.value === selectedTab);
      if (matchingOption) {
        dropdown.value = selectedTab;
        updatePanelVisibility(dropdown);
      }
    });
  }

  // If we have an anchor with a lang parameter, scroll to it after setting the language
  if (anchorToScroll && langParam) {
    setTimeout(() => {
      const element = document.getElementById(anchorToScroll);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  }

  // Work around Chroma's tabindex: https://github.com/alecthomas/chroma/issues/731
  for (const pre of document.querySelectorAll('.highlight pre')) {
    pre.removeAttribute('tabindex');
  }

  // Helper function to apply language from URL
  function applyLanguageFromUrl() {
    let selectedTab = null;
    let anchorToScroll = null;

    // Check for lang parameter in URL (before hash)
    const urlParams = new URLSearchParams(window.location.search);
    let langParam = urlParams.get('lang');

    // Also check for lang parameter after the hash (e.g., #anchor?lang=Python)
    if (!langParam && window.location.hash) {
      const hashParts = window.location.hash.split('?');
      anchorToScroll = hashParts[0].substring(1); // Remove the # prefix
      if (hashParts.length > 1) {
        const hashParams = new URLSearchParams(hashParts[1]);
        langParam = hashParams.get('lang');
      }
    }

    if (langParam) {
      selectedTab = normalizeLangParam(langParam);
      console.log('DEBUG: Applying language from URL:', selectedTab);

      // Apply the selected language to all dropdowns
      const allDropdowns = document.querySelectorAll('.codetabs .lang-selector');
      allDropdowns.forEach((dropdown) => {
        const options = dropdown.querySelectorAll('option');
        const matchingOption = Array.from(options).find(opt => opt.value === selectedTab);
        if (matchingOption) {
          dropdown.value = selectedTab;
          updatePanelVisibility(dropdown);
        }
      });
    }

    // Scroll to the anchor if we have one
    if (anchorToScroll) {
      setTimeout(() => {
        const element = document.getElementById(anchorToScroll);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
  }

  // Handle hash changes (when user changes anchor/lang in URL without reloading)
  window.addEventListener('hashchange', () => {
    console.log('DEBUG: Hash changed to', window.location.hash);
    applyLanguageFromUrl();
  });

  // Also handle popstate events (browser back/forward buttons)
  window.addEventListener('popstate', () => {
    console.log('DEBUG: Popstate event');
    applyLanguageFromUrl();
  });

  // Monitor URL changes (including query string changes after hash)
  let lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      console.log('DEBUG: URL changed from', lastUrl, 'to', window.location.href);
      lastUrl = window.location.href;
      applyLanguageFromUrl();
    }
  }, 100);
})();
