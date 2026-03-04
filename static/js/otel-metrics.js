/**
 * OpenTelemetry Metrics Render Hook
 * Renders Redis client observability metrics in a human-friendly format
 */

document.addEventListener('DOMContentLoaded', function() {
  // Find all otel-metrics-source elements
  const metricsElements = document.querySelectorAll('pre.otel-metrics-source');
  
  metricsElements.forEach(pre => {
    try {
      // Parse the JSON data
      const data = JSON.parse(pre.textContent);
      
      // Create container for rendered output
      const container = document.createElement('div');
      container.className = 'otel-metrics-rendered';
      
      // Render metric groups
      renderMetricGroups(container, data);
      
      // Render attributes section
      renderAttributesSection(container, data);
      
      // Insert rendered content after the <pre> and hide the <pre>
      pre.style.display = 'none';
      pre.parentNode.insertBefore(container, pre.nextSibling);
      
    } catch (error) {
      console.error('Error rendering OTel metrics:', error);
    }
  });
});

/**
 * Render all metric groups
 */
function renderMetricGroups(container, data) {
  const groupsSection = document.createElement('div');
  groupsSection.className = 'otel-metric-groups';

  // Render each group (no heading - provided by surrounding text)
  data.metric_groups.forEach(group => {
    const groupDiv = renderMetricGroup(group, data.namespace_default);
    groupsSection.appendChild(groupDiv);
  });

  container.appendChild(groupsSection);
}

/**
 * Render a single metric group
 */
function renderMetricGroup(group, namespaceDefault) {
  const groupDiv = document.createElement('div');
  groupDiv.className = 'otel-metric-group';
  groupDiv.id = `group-${group.id}`;

  // Group title with ID in parentheses
  const title = document.createElement('h3');
  const titleLink = document.createElement('a');
  titleLink.href = `#group-${group.id}`;
  titleLink.textContent = group.title;
  titleLink.className = 'anchor-link';
  title.appendChild(titleLink);

  // Add copy link icon
  const copyIcon = createCopyLinkIcon(`#group-${group.id}`);
  title.appendChild(copyIcon);

  // Add group ID in code font
  title.appendChild(document.createTextNode(' '));
  const groupIdCode = document.createElement('code');
  groupIdCode.textContent = `(${group.id})`;
  groupIdCode.className = 'group-id';
  title.appendChild(groupIdCode);

  groupDiv.appendChild(title);

  // Group description
  if (group.description) {
    const desc = document.createElement('p');
    desc.textContent = group.description;
    desc.className = 'group-description';
    groupDiv.appendChild(desc);
  }

  // Render metrics in this group
  group.metrics.forEach(metric => {
    const metricDiv = renderMetric(metric, namespaceDefault);
    groupDiv.appendChild(metricDiv);
  });

  return groupDiv;
}

/**
 * Render a single metric
 */
function renderMetric(metric, namespaceDefault) {
  const metricDiv = document.createElement('div');
  metricDiv.className = 'otel-metric';

  // Determine full metric name
  const namespace = metric.namespace || namespaceDefault;
  const fullName = namespace ? `${namespace}.${metric.name}` : metric.name;
  metricDiv.id = `metric-${fullName}`;

  // Metric name heading in code font
  const nameHeading = document.createElement('h4');
  const nameLink = document.createElement('a');
  nameLink.href = `#metric-${fullName}`;
  nameLink.className = 'anchor-link';

  const nameCode = document.createElement('code');
  nameCode.textContent = fullName;
  nameCode.className = 'metric-name';
  nameLink.appendChild(nameCode);

  nameHeading.appendChild(nameLink);

  // Add copy link icon
  const copyIcon = createCopyLinkIcon(`#metric-${fullName}`);
  nameHeading.appendChild(copyIcon);

  // Add metric type badge with link to OTel docs
  nameHeading.appendChild(document.createTextNode(' '));
  const typeBadgeLink = document.createElement('a');
  typeBadgeLink.href = 'https://opentelemetry.io/docs/concepts/signals/metrics/#metric-instruments';
  typeBadgeLink.target = '_blank';
  typeBadgeLink.rel = 'noopener noreferrer';
  typeBadgeLink.className = 'metric-type-badge-link';

  const typeBadge = document.createElement('span');
  typeBadge.className = 'metric-type-badge';
  typeBadge.textContent = metric.otel.instrument_kind;

  typeBadgeLink.appendChild(typeBadge);
  nameHeading.appendChild(typeBadgeLink);

  metricDiv.appendChild(nameHeading);

  // Unit (if present) - displayed right under the metric name
  if (metric.unit) {
    const unitDiv = document.createElement('div');
    unitDiv.className = 'metric-unit';
    unitDiv.textContent = `Unit: ${formatUnit(metric.unit)}`;
    metricDiv.appendChild(unitDiv);
  }

  // Description
  const desc = document.createElement('p');
  desc.textContent = metric.description;
  desc.className = 'metric-description';
  metricDiv.appendChild(desc);

  // Attributes in a collapsible details element
  if (metric.attributes && metric.attributes.length > 0) {
    const details = document.createElement('details');
    details.className = 'metric-attributes-details';

    const summary = document.createElement('summary');
    summary.textContent = `Attributes (${metric.attributes.length})`;
    details.appendChild(summary);

    const attrsList = renderAttributeReferences(metric.attributes);
    details.appendChild(attrsList);

    metricDiv.appendChild(details);
  }

  return metricDiv;
}

/**
 * Render attribute references with links
 */
function renderAttributeReferences(attributes) {
  const table = document.createElement('table');
  table.className = 'attribute-references';

  // Table body (no header)
  const tbody = document.createElement('tbody');
  attributes.forEach(attr => {
    const row = document.createElement('tr');

    // Attribute name (linked)
    const nameCell = document.createElement('td');
    const link = document.createElement('a');
    link.href = `#attr-${attr.ref}`;
    link.textContent = attr.ref;
    link.className = 'attribute-link';
    nameCell.appendChild(link);
    row.appendChild(nameCell);

    // Cardinality
    const cardCell = document.createElement('td');
    const cardBadge = document.createElement('span');
    cardBadge.className = `cardinality-badge cardinality-${attr.cardinality}`;
    cardBadge.textContent = attr.cardinality;
    cardCell.appendChild(cardBadge);
    row.appendChild(cardCell);

    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  return table;
}

/**
 * Render the attributes section
 */
function renderAttributesSection(container, data) {
  const attrsSection = document.createElement('div');
  attrsSection.className = 'otel-attributes-section';

  // Add heading
  const heading = document.createElement('h2');
  heading.textContent = 'Attribute Definitions';
  heading.id = 'attribute-definitions';
  attrsSection.appendChild(heading);

  // Render each table
  data.attributes_definitions.tables.forEach(table => {
    const tableDiv = renderAttributeTable(table);
    attrsSection.appendChild(tableDiv);
  });

  container.appendChild(attrsSection);
}

/**
 * Render an attribute definition table
 */
function renderAttributeTable(table) {
  const tableDiv = document.createElement('div');
  tableDiv.className = 'attribute-table';

  // Table title
  const title = document.createElement('h3');
  title.textContent = table.title;
  tableDiv.appendChild(title);

  // Render each attribute as a card-like element
  const attributesContainer = document.createElement('div');
  attributesContainer.className = 'attributes-list';

  table.attributes.forEach(attr => {
    const attrDiv = renderAttributeCard(attr);
    attributesContainer.appendChild(attrDiv);
  });

  tableDiv.appendChild(attributesContainer);
  return tableDiv;
}

/**
 * Render a single attribute as a card
 */
function renderAttributeCard(attr) {
  const attrDiv = document.createElement('div');
  attrDiv.className = 'attribute-card';
  attrDiv.id = `attr-${attr.attribute}`;

  // Attribute name heading
  const nameHeading = document.createElement('h4');
  const nameCode = document.createElement('code');
  nameCode.textContent = attr.attribute;
  nameCode.className = 'attribute-name';
  nameHeading.appendChild(nameCode);

  // Add requirement badge
  nameHeading.appendChild(document.createTextNode(' '));
  const reqBadge = document.createElement('span');
  reqBadge.className = `requirement-badge requirement-${attr.requirement_level}`;
  reqBadge.textContent = attr.requirement_level;
  nameHeading.appendChild(reqBadge);

  attrDiv.appendChild(nameHeading);

  // Type
  const typeDiv = document.createElement('div');
  typeDiv.className = 'attribute-type';
  typeDiv.textContent = 'Type: ';
  const typeCode = document.createElement('code');
  typeCode.textContent = attr.type;
  typeDiv.appendChild(typeCode);
  attrDiv.appendChild(typeDiv);

  // Description
  const descDiv = document.createElement('p');
  descDiv.className = 'attribute-description';
  descDiv.textContent = attr.description;
  attrDiv.appendChild(descDiv);

  // Examples
  const examplesDiv = document.createElement('div');
  examplesDiv.className = 'attribute-examples';
  examplesDiv.textContent = 'Examples: ';
  const examplesCode = document.createElement('code');
  examplesCode.textContent = attr.examples;
  examplesDiv.appendChild(examplesCode);
  attrDiv.appendChild(examplesDiv);

  // Requirement condition (if present)
  if (attr.requirement_condition) {
    const conditionDiv = document.createElement('div');
    conditionDiv.className = 'attribute-requirement-condition';
    conditionDiv.textContent = `Condition: ${attr.requirement_condition}`;
    attrDiv.appendChild(conditionDiv);
  }

  return attrDiv;
}

/**
 * Helper: Add a metadata row to a table
 */
function addMetadataRow(table, label, value) {
  const row = document.createElement('tr');

  const labelCell = document.createElement('th');
  labelCell.textContent = label;
  row.appendChild(labelCell);

  const valueCell = document.createElement('td');
  valueCell.textContent = value;
  row.appendChild(valueCell);

  table.appendChild(row);
}

/**
 * Helper: Format unit object
 */
function formatUnit(unit) {
  if (typeof unit === 'string') {
    return unit;
  }
  if (unit.symbol && unit.semantic) {
    return `${unit.symbol} (${unit.semantic})`;
  }
  return unit.symbol || unit.semantic || '';
}

/**
 * Helper: Create a copy link icon
 */
function createCopyLinkIcon(anchor) {
  const icon = document.createElement('a');
  icon.href = anchor;
  icon.className = 'copy-link-icon';
  icon.setAttribute('aria-label', 'Copy link to clipboard');
  icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
  `;

  // Copy link to clipboard on click
  icon.addEventListener('click', function(e) {
    e.preventDefault();
    const fullUrl = window.location.origin + window.location.pathname + anchor;
    navigator.clipboard.writeText(fullUrl).then(() => {
      // Visual feedback
      const originalHTML = icon.innerHTML;
      icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      icon.classList.add('copied');

      setTimeout(() => {
        icon.innerHTML = originalHTML;
        icon.classList.remove('copied');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy link:', err);
    });
  });

  return icon;
}

