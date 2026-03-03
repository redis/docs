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

  // Add metric type badge
  const typeBadge = document.createElement('span');
  typeBadge.className = 'metric-type-badge';
  typeBadge.textContent = metric.otel.instrument_kind;
  nameHeading.appendChild(document.createTextNode(' '));
  nameHeading.appendChild(typeBadge);

  metricDiv.appendChild(nameHeading);

  // Description
  const desc = document.createElement('p');
  desc.textContent = metric.description;
  desc.className = 'metric-description';
  metricDiv.appendChild(desc);
  
  // Metadata table
  const metaTable = document.createElement('table');
  metaTable.className = 'metric-metadata';
  
  // Unit
  if (metric.unit) {
    addMetadataRow(metaTable, 'Unit', formatUnit(metric.unit));
  }
  
  // Instrument details
  const otelDetails = [];
  if (metric.otel.monotonic !== undefined) {
    otelDetails.push(`Monotonic: ${metric.otel.monotonic}`);
  }
  if (metric.otel.async !== undefined) {
    otelDetails.push(`Async: ${metric.otel.async}`);
  }
  if (otelDetails.length > 0) {
    addMetadataRow(metaTable, 'Instrument', otelDetails.join(', '));
  }
  
  metricDiv.appendChild(metaTable);
  
  // Attributes
  if (metric.attributes && metric.attributes.length > 0) {
    const attrsHeading = document.createElement('h5');
    attrsHeading.textContent = 'Attributes';
    metricDiv.appendChild(attrsHeading);
    
    const attrsList = renderAttributeReferences(metric.attributes);
    metricDiv.appendChild(attrsList);
  }
  
  return metricDiv;
}

/**
 * Render attribute references with links
 */
function renderAttributeReferences(attributes) {
  const table = document.createElement('table');
  table.className = 'attribute-references';

  // Table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Attribute', 'Cardinality'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Table body
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

  // Create HTML table
  const htmlTable = document.createElement('table');
  htmlTable.className = 'attributes-list';

  // Table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Attribute', 'Type', 'Description', 'Examples', 'Requirement'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  htmlTable.appendChild(thead);

  // Table body
  const tbody = document.createElement('tbody');
  table.attributes.forEach(attr => {
    const row = renderAttributeRow(attr);
    tbody.appendChild(row);
  });
  htmlTable.appendChild(tbody);

  tableDiv.appendChild(htmlTable);
  return tableDiv;
}

/**
 * Render a single attribute row
 */
function renderAttributeRow(attr) {
  const row = document.createElement('tr');
  row.id = `attr-${attr.attribute}`;

  // Attribute name
  const nameCell = document.createElement('td');
  const nameCode = document.createElement('code');
  nameCode.textContent = attr.attribute;
  nameCell.appendChild(nameCode);
  row.appendChild(nameCell);

  // Type
  const typeCell = document.createElement('td');
  const typeCode = document.createElement('code');
  typeCode.textContent = attr.type;
  typeCell.appendChild(typeCode);
  row.appendChild(typeCell);

  // Description
  const descCell = document.createElement('td');
  descCell.textContent = attr.description;
  row.appendChild(descCell);

  // Examples
  const examplesCell = document.createElement('td');
  const examplesCode = document.createElement('code');
  examplesCode.textContent = attr.examples;
  examplesCell.appendChild(examplesCode);
  row.appendChild(examplesCell);

  // Requirement
  const reqCell = document.createElement('td');
  const reqBadge = document.createElement('span');
  reqBadge.className = `requirement-badge requirement-${attr.requirement_level}`;
  reqBadge.textContent = attr.requirement_level;
  reqCell.appendChild(reqBadge);

  if (attr.requirement_condition) {
    reqCell.appendChild(document.createElement('br'));
    const condition = document.createElement('small');
    condition.textContent = attr.requirement_condition;
    condition.className = 'requirement-condition';
    reqCell.appendChild(condition);
  }

  row.appendChild(reqCell);

  return row;
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

