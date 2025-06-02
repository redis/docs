document.addEventListener('click', function (event) {
  if (event.target.matches('#alpha-filter-container [type=button]')) {
    const element = event.target
    const activeButton = document.querySelector('#alpha-filter-container .active')
    const alphaInput = document.querySelector('#alpha-filter');

    if (activeButton) activeButton.classList.remove('active')
    if (element.value) element.classList.add('active');

    alphaInput.value = event.target.value;
    alphaInput.dispatchEvent(new Event("input"))
  }
});

const FILTERS = {
  group: {
    element: document.querySelector('#group-filter'),
    oninput: () => {
      const { value } = FILTERS.group.element;
      if (setDisabledVersions(value)) return;
      FILTERS.version.element.value = '';
      const isCore = FILTERS.group.element.value && FILTERS.group.element.selectedOptions[0].dataset.kind === 'core';
      for (const option of FILTERS.version.element.options) {
        if (option.value.includes('-')) {
          option.style.display = option.value.startsWith(value) ? '' : 'none';
        } else {
          option.style.display = isCore ? '' : 'none';
        }
      }
    }
  },
  version: {
    element: document.querySelector('#version-filter'),
    versionMatch: true
  },
  name: {
    element: document.querySelector('#name-filter'),
    partialMatch: true
  },
  alpha: {
    element: document.querySelector('#alpha-filter'),
    alphaMatch: true
  }
};

nameFilter = FILTERS.name.element
nameFilter.addEventListener('keydown', function (event) {
  switch (event.key) {
    case "Enter":
      visibleCommands = document.querySelectorAll("article.flex.flex-col.gap-2.transition.relative:not([style='display: none;'])")
      if (visibleCommands.length == 1) {
        event.preventDefault();
        commandHref = visibleCommands[0].getElementsByTagName("a")[0].href
        window.location.assign(commandHref)
      };
    default:
      return;
  }
});

const hiddenCards = [];

function setDisabledVersions(value) {
  return FILTERS.version.element.disabled = !value;
}

function isVersionGreaterThan(a, b) {
  const aSplit = a.split('.', 3),
    bSplit = b.split('.', 3);
  for (let i = 0; i < aSplit.length; i++) {
    const aNum = Number(aSplit[i]),
      bNum = Number(bSplit[i]);
    if (aNum < bNum) return true;
    else if (aNum > bNum) return false;
  }

  return true;
}

function match({ element: { value: filterValue }, versionMatch, partialMatch, alphaMatch }, elementValue) {
  if (versionMatch) {
    const version = elementValue.substring(elementValue.lastIndexOf('-') + 1);
    return isVersionGreaterThan(version, filterValue);
  } else if (partialMatch) {
    return elementValue.toLowerCase().includes(filterValue.toLowerCase());
  } else if (alphaMatch) {
    return elementValue && elementValue.toLowerCase().startsWith(filterValue.toLowerCase());
  } else {
    return filterValue === elementValue;
  }
}

function filter() {
  while (hiddenCards.length) {
    hiddenCards.pop().style.display = '';
  }

  const commandElements = document.querySelectorAll('#commands-grid > [data-group]');

  // Defensive check: if no command elements found, don't filter yet
  if (commandElements.length === 0) {
    console.warn('No command elements found for filtering. DOM may not be ready.');
    return;
  }

  for (const element of commandElements) {
    for (const [key, filter] of Object.entries(FILTERS)) {
      if (!filter.element.value) continue;

      const elementValue = key == 'alpha' ? element.dataset['name'] : element.dataset[key];
      if (!match(filter, elementValue)) {
        element.style.display = 'none';
        hiddenCards.push(element);
        break;
      }
    }
  }
}

const url = new URL(location);

function setUrl() {
  history.replaceState(null, '', url);
}

if (url.hash) {
  const value = url.hash.substring(1);
  url.searchParams.set('group', value);
  url.hash = '';
  setUrl();
}

// Initialize filters with DOM ready check
function initializeFilters() {
  // Check if commands grid exists and has content
  const commandsGrid = document.querySelector('#commands-grid');
  if (!commandsGrid || commandsGrid.children.length === 0) {
    // Retry after a short delay if DOM isn't ready
    setTimeout(initializeFilters, 50);
    return;
  }

  for (const [key, { element, oninput }] of Object.entries(FILTERS)) {
    if (url.searchParams.has(key)) {
      element.value = url.searchParams.get(key);
    }

    element.addEventListener('input', () => {
      if (oninput) oninput();

      if (!element.value) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, element.value);
      }

      setUrl();
      filter();
    });
  }

  for (const { oninput } of Object.values(FILTERS)) {
    if (oninput) oninput();
  }

  filter();
}

// Start initialization
initializeFilters();