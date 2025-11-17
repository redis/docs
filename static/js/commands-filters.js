// Accordion Commands Filter - Phase 2
// Handles accordion expand/collapse, localStorage persistence, and filtering (name, version, deprecated)

const STORAGE_KEY = 'redis-commands-selected-group';
const DEFAULT_GROUP = 'string';

// Get filter elements
const nameFilter = document.querySelector('#name-filter');
const versionFilter = document.querySelector('#version-filter');
const deprecatedFilter = document.querySelector('#deprecated-filter');
const countText = document.querySelector('#count-text');
const noResults = document.querySelector('#no-results');
const accordion = document.querySelector('#commands-accordion');

// Accordion state management - radio button behavior (only one group open at a time)
function getExpandedGroup() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Check for old format and migrate
      const oldKey = 'redis-commands-expanded-groups';
      const oldStored = localStorage.getItem(oldKey);
      if (oldStored) {
        try {
          const oldArray = JSON.parse(oldStored);
          if (Array.isArray(oldArray) && oldArray.length > 0) {
            // Migrate first item from old array format
            localStorage.removeItem(oldKey);
            return oldArray[0];
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      return DEFAULT_GROUP;
    }
    return stored;
  } catch (e) {
    console.warn('Failed to read from localStorage:', e);
    return DEFAULT_GROUP;
  }
}

function saveExpandedGroup(groupId) {
  try {
    localStorage.setItem(STORAGE_KEY, groupId);
  } catch (e) {
    console.warn('Failed to write to localStorage:', e);
  }
}

function toggleGroup(groupId) {
  const currentExpanded = getExpandedGroup();

  if (currentExpanded === groupId) {
    // Clicking the same group - do nothing (keep it open)
    return;
  }

  // Close the currently expanded group
  if (currentExpanded) {
    updateGroupDisplay(currentExpanded, false);
  }

  // Open the new group
  saveExpandedGroup(groupId);
  updateGroupDisplay(groupId, true);

  // Scroll to the newly opened group with offset for sticky header + filters
  const groupElement = document.querySelector(`.command-group[data-group="${groupId}"]`);
  if (groupElement) {
    setTimeout(() => {
      const headerHeight = 70; // Header height
      const filterHeight = document.querySelector('#command-filter')?.parentElement?.offsetHeight || 200;
      const offset = headerHeight + filterHeight + 16; // 16px extra padding
      const elementPosition = groupElement.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }, 100);
  }
}

function updateGroupDisplay(groupId, isExpanded = null) {
  const groupElement = document.querySelector(`.command-group[data-group="${groupId}"]`);
  if (!groupElement) return;

  const header = groupElement.querySelector('.group-header');
  const content = groupElement.querySelector('.group-content');
  const chevron = groupElement.querySelector('.group-chevron');

  // If isExpanded is not provided, check localStorage
  if (isExpanded === null) {
    const expandedGroup = getExpandedGroup();
    isExpanded = expandedGroup === groupId;
  }

  if (isExpanded) {
    content.classList.remove('hidden');
    chevron.style.transform = 'rotate(90deg)';
    header.setAttribute('aria-expanded', 'true');
  } else {
    content.classList.add('hidden');
    chevron.style.transform = 'rotate(0deg)';
    header.setAttribute('aria-expanded', 'false');
  }
}

function initializeAccordion() {
  const expandedGroup = getExpandedGroup();

  // Set up click handlers for all group headers
  document.querySelectorAll('.group-header').forEach(header => {
    const groupId = header.dataset.groupId;

    header.addEventListener('click', () => {
      toggleGroup(groupId);
    });

    // Initialize display state
    updateGroupDisplay(groupId);
  });
}

// Helper function to compare versions
function compareVersions(commandVersion, filterVersion) {
  if (!commandVersion || !filterVersion) return true;

  const parseVersion = (v) => {
    const parts = v.split('.').map(n => parseInt(n) || 0);
    return parts;
  };

  const cmdParts = parseVersion(commandVersion);
  const filterParts = parseVersion(filterVersion);

  // Compare major.minor versions
  for (let i = 0; i < Math.max(cmdParts.length, filterParts.length); i++) {
    const cmdPart = cmdParts[i] || 0;
    const filterPart = filterParts[i] || 0;

    if (cmdPart < filterPart) return false;
    if (cmdPart > filterPart) return true;
  }

  return true; // Equal versions
}

// Filtering logic
function filterCommands() {
  const searchTerm = nameFilter.value.toLowerCase().trim();
  const versionValue = versionFilter.value;
  const deprecatedValue = deprecatedFilter.value;
  let totalVisible = 0;
  let totalCommands = 0;

  // Get all command groups
  const groups = document.querySelectorAll('.command-group');

  groups.forEach(group => {
    const groupElement = group;
    const commands = group.querySelectorAll('.command-item');
    let visibleInGroup = 0;

    commands.forEach(command => {
      totalCommands++;
      const commandName = command.dataset.name.toLowerCase();
      const commandVersion = command.dataset.since;
      const isDeprecated = command.dataset.deprecated === 'true';

      let visible = true;

      // Filter by name
      if (searchTerm && !commandName.includes(searchTerm)) {
        visible = false;
      }

      // Filter by version
      if (visible && versionValue && !compareVersions(commandVersion, versionValue)) {
        visible = false;
      }

      // Filter by deprecated status
      if (visible && deprecatedValue !== 'show') {
        if (deprecatedValue === 'hide' && isDeprecated) {
          visible = false;
        } else if (deprecatedValue === 'only' && !isDeprecated) {
          visible = false;
        }
      }

      if (visible) {
        command.style.display = '';
        visibleInGroup++;
        totalVisible++;
      } else {
        command.style.display = 'none';
      }
    });

    // Update group count
    const countSpan = group.querySelector('.group-count');
    if (countSpan) {
      const hasFilters = searchTerm || versionValue || deprecatedValue !== 'show';
      if (hasFilters) {
        countSpan.textContent = `(${visibleInGroup} of ${commands.length} commands)`;
      } else {
        countSpan.textContent = `(${commands.length} commands)`;
      }
    }

    // Hide group if no visible commands
    if (visibleInGroup === 0) {
      groupElement.style.display = 'none';
    } else {
      groupElement.style.display = '';

      const groupId = groupElement.dataset.group;
      const content = groupElement.querySelector('.group-content');
      const chevron = groupElement.querySelector('.group-chevron');
      const header = groupElement.querySelector('.group-header');

      // Auto-expand groups with visible commands when filters are active
      const hasFilters = searchTerm || versionValue || deprecatedValue !== 'show';
      if (hasFilters) {
        if (content && chevron && header) {
          content.classList.remove('hidden');
          chevron.style.transform = 'rotate(90deg)';
          header.setAttribute('aria-expanded', 'true');
        }
      } else {
        // When filters are cleared, collapse all groups except the selected one
        const selectedGroup = getExpandedGroup();
        if (content && chevron && header) {
          if (groupId === selectedGroup) {
            content.classList.remove('hidden');
            chevron.style.transform = 'rotate(90deg)';
            header.setAttribute('aria-expanded', 'true');
          } else {
            content.classList.add('hidden');
            chevron.style.transform = 'rotate(0deg)';
            header.setAttribute('aria-expanded', 'false');
          }
        }
      }
    }
  });

  // Update count text
  const hasFilters = searchTerm || versionValue || deprecatedValue !== 'show';
  if (hasFilters) {
    countText.textContent = `Showing ${totalVisible} of ${totalCommands} commands`;
  } else {
    countText.textContent = `Showing ${totalCommands} commands`;
  }

  // Show/hide no results message
  if (totalVisible === 0) {
    noResults.classList.remove('hidden');
    accordion.classList.add('hidden');
  } else {
    noResults.classList.add('hidden');
    accordion.classList.remove('hidden');
  }
}

// Enter key handler - navigate to command if only one visible
nameFilter.addEventListener('keydown', function (event) {
  if (event.key === "Enter") {
    const visibleCommands = document.querySelectorAll('.command-item:not([style*="display: none"]) a');
    if (visibleCommands.length === 1) {
      event.preventDefault();
      window.location.assign(visibleCommands[0].href);
    }
  }
});

// URL state management
function updateURLParams() {
  const params = new URLSearchParams();

  if (nameFilter.value) {
    params.set('search', nameFilter.value);
  }
  if (versionFilter.value) {
    params.set('version', versionFilter.value);
  }
  if (deprecatedFilter.value !== 'show') {
    params.set('deprecated', deprecatedFilter.value);
  }

  const newURL = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
  window.history.replaceState({}, '', newURL);
}

function loadURLParams() {
  const params = new URLSearchParams(window.location.search);

  if (params.has('search')) {
    nameFilter.value = params.get('search');
  }
  if (params.has('version')) {
    versionFilter.value = params.get('version');
  }
  if (params.has('deprecated')) {
    deprecatedFilter.value = params.get('deprecated');
  }
}

// Input handlers for all filters
nameFilter.addEventListener('input', () => {
  filterCommands();
  updateURLParams();
});
versionFilter.addEventListener('change', () => {
  filterCommands();
  updateURLParams();
});
deprecatedFilter.addEventListener('change', () => {
  filterCommands();
  updateURLParams();
});

// Initialize on DOM ready
function initialize() {
  const accordion = document.querySelector('#commands-accordion');
  if (!accordion || accordion.children.length === 0) {
    // Retry after a short delay if DOM isn't ready
    setTimeout(initialize, 50);
    return;
  }

  // Load filter values from URL
  loadURLParams();

  initializeAccordion();
  filterCommands();

  // Scroll to the currently expanded group with offset for sticky header + filters
  const expandedGroup = getExpandedGroup();
  const groupElement = document.querySelector(`[data-group="${expandedGroup}"]`);
  if (groupElement) {
    // Use setTimeout to ensure the accordion has finished expanding
    setTimeout(() => {
      const headerHeight = 70; // Header height
      const filterHeight = document.querySelector('#command-filter')?.parentElement?.offsetHeight || 200;
      const offset = headerHeight + filterHeight + 16; // 16px extra padding
      const elementPosition = groupElement.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }, 100);
  }
}

// Start initialization
initialize();