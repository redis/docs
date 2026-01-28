(function() {
  'use strict';

  function parseTimelineData(yamlText) {
    const lines = yamlText.trim().split('\n');
    const versions = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      // Parse format: "version: release_date - eol_date"
      const match = trimmed.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const version = match[1].trim();
        const dates = match[2].trim();
        
        // Parse dates - handle different formats
        const dateMatch = dates.match(/^(.+?)\s*-\s*(.+)$/);
        if (dateMatch) {
          const releaseStr = dateMatch[1].trim();
          const eolStr = dateMatch[2].trim();
          
          versions.push({
            version: version,
            release: releaseStr,
            eol: eolStr,
            releaseDate: parseDate(releaseStr),
            eolDate: eolStr === 'TBD' ? null : parseDate(eolStr)
          });
        }
      }
    }
    
    return versions;
  }
  
  function parseDate(dateStr) {
    if (!dateStr || dateStr === 'TBD') return null;
    
    // Handle formats like "October 2025", "Feb 28, 2025", etc.
    const monthNames = {
      'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
      'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11,
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'jun': 5, 'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };
    
    // Try "Month Year" format
    let match = dateStr.match(/^(\w+)\s+(\d{4})$/i);
    if (match) {
      const month = monthNames[match[1].toLowerCase()];
      const year = parseInt(match[2]);
      return new Date(year, month, 1);
    }
    
    // Try "Month DD, YYYY" format
    match = dateStr.match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/i);
    if (match) {
      const month = monthNames[match[1].toLowerCase()];
      const day = parseInt(match[2]);
      const year = parseInt(match[3]);
      return new Date(year, month, day);
    }
    
    return null;
  }
  
  function renderTimeline(container, versions, title) {
    // Calculate date range
    const allDates = versions.flatMap(v => [v.releaseDate, v.eolDate]).filter(d => d);
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));

    // Set to start of first year and end of last year (no extra padding)
    minDate.setMonth(0, 1); // January 1st of the first year
    maxDate.setMonth(11, 31); // December 31st of the last year

    // Make responsive - use container width or default
    const containerWidth = container.offsetWidth || 800;
    const svgWidth = Math.min(containerWidth - 20, 1000); // Leave some margin
    const rowHeight = 60; // Increased spacing between rows
    const svgHeight = 80 + versions.length * rowHeight + 20; // Reduced bottom padding
    const chartLeft = 80; // Reduced from 120 to 80
    const chartRight = svgWidth - 50;
    const chartWidth = chartRight - chartLeft;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', svgHeight);
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    svg.style.fontFamily = 'Arial, sans-serif';
    svg.style.fontSize = '12px';
    svg.style.marginTop = '1em';
    svg.style.marginBottom = '1em';
    svg.style.maxWidth = '100%';
    svg.style.height = 'auto';
    
    // Title
    const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleEl.setAttribute('x', svgWidth / 2);
    titleEl.setAttribute('y', 25);
    titleEl.setAttribute('text-anchor', 'middle');
    titleEl.style.fontSize = '16px';
    titleEl.style.fontWeight = 'bold';
    titleEl.textContent = title;
    svg.appendChild(titleEl);

    // Column header for versions (two lines)
    const versionHeader1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    versionHeader1.setAttribute('x', 10);
    versionHeader1.setAttribute('y', 45);
    versionHeader1.setAttribute('text-anchor', 'start');
    versionHeader1.style.fontSize = '13px';
    versionHeader1.style.fontWeight = '900';
    versionHeader1.style.fill = '#333';
    versionHeader1.textContent = 'Cluster';
    svg.appendChild(versionHeader1);

    const versionHeader2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    versionHeader2.setAttribute('x', 10);
    versionHeader2.setAttribute('y', 58);
    versionHeader2.setAttribute('text-anchor', 'start');
    versionHeader2.style.fontSize = '13px';
    versionHeader2.style.fontWeight = '900';
    versionHeader2.style.fill = '#333';
    versionHeader2.textContent = 'version';
    svg.appendChild(versionHeader2);
    
    // Time axis
    const timeRange = maxDate.getTime() - minDate.getTime();
    
    function dateToX(date) {
      if (!date) return chartRight;
      return chartLeft + ((date.getTime() - minDate.getTime()) / timeRange) * chartWidth;
    }
    
    // Draw year markers
    for (let year = minDate.getFullYear(); year <= maxDate.getFullYear(); year++) {
      const yearDate = new Date(year, 0, 1);
      const x = dateToX(yearDate);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', 60);
      line.setAttribute('x2', x);
      line.setAttribute('y2', svgHeight - 40);
      line.style.stroke = '#e0e0e0';
      line.style.strokeWidth = '1';
      svg.appendChild(line);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', 55);
      text.setAttribute('text-anchor', 'middle');
      text.style.fontSize = '11px';
      text.style.fill = '#666';
      text.style.fontWeight = 'bold';
      text.textContent = year;
      svg.appendChild(text);
    }
    
    // Draw version timelines
    versions.forEach((version, index) => {
      const y = 90 + index * rowHeight;
      const startX = dateToX(version.releaseDate);
      const endX = version.eolDate ? dateToX(version.eolDate) : chartRight;

      // Background row for better visual separation
      const rowBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rowBg.setAttribute('x', 0);
      rowBg.setAttribute('y', y - 25);
      rowBg.setAttribute('width', svgWidth);
      rowBg.setAttribute('height', rowHeight);
      rowBg.style.fill = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
      rowBg.style.opacity = '0.5';
      svg.appendChild(rowBg);

      // Version label (left-aligned, closer to chart)
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', 10);
      label.setAttribute('y', y + 5);
      label.setAttribute('text-anchor', 'start');
      label.style.fontWeight = 'bold';
      label.style.fontSize = '13px';
      label.textContent = version.version;
      svg.appendChild(label);

      // Timeline bar
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', startX);
      rect.setAttribute('y', y - 10);
      rect.setAttribute('width', endX - startX);
      rect.setAttribute('height', 20);
      rect.style.fill = '#dc382d';
      rect.style.stroke = '#b8312a';
      rect.style.strokeWidth = '1';
      svg.appendChild(rect);

      // Release date marker and connecting line
      const releaseMarker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      releaseMarker.setAttribute('cx', startX);
      releaseMarker.setAttribute('cy', y);
      releaseMarker.setAttribute('r', 4);
      releaseMarker.style.fill = '#333';
      svg.appendChild(releaseMarker);

      // EOL marker (no connecting lines)
      if (version.eolDate) {
        const eolMarker = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        eolMarker.setAttribute('x1', endX);
        eolMarker.setAttribute('y1', y - 12);
        eolMarker.setAttribute('x2', endX);
        eolMarker.setAttribute('y2', y + 12);
        eolMarker.style.stroke = '#333';
        eolMarker.style.strokeWidth = '3';
        svg.appendChild(eolMarker);
      }

      // Date labels with closer positioning
      const releaseText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      releaseText.setAttribute('x', startX);
      releaseText.setAttribute('y', y + 25);
      releaseText.setAttribute('text-anchor', 'middle');
      releaseText.style.fontSize = '10px';
      releaseText.style.fill = '#333';
      releaseText.style.fontWeight = 'bold';
      releaseText.textContent = version.release;
      svg.appendChild(releaseText);

      // Always show EOL text
      if (version.eol === 'TBD') {
        // Show TBD at the end of the bar
        const tbdText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        tbdText.setAttribute('x', endX);
        tbdText.setAttribute('y', y + 25);
        tbdText.setAttribute('text-anchor', 'middle');
        tbdText.style.fontSize = '10px';
        tbdText.style.fill = '#333';
        tbdText.style.fontWeight = 'bold';
        tbdText.textContent = 'TBD';
        svg.appendChild(tbdText);
      } else if (version.eol) {
        const eolText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        eolText.setAttribute('x', endX);
        eolText.setAttribute('y', y + 25);
        eolText.setAttribute('text-anchor', 'middle');
        eolText.style.fontSize = '10px';
        eolText.style.fill = '#333';
        eolText.style.fontWeight = 'bold';
        eolText.textContent = version.eol;
        svg.appendChild(eolText);
      }
    });
    
    // Replace fallback content
    const fallback = container.querySelector('.timeline-fallback');
    if (fallback) {
      container.removeChild(fallback);
    }
    container.appendChild(svg);
  }
  
  document.addEventListener('DOMContentLoaded', function() {
    const sources = document.querySelectorAll('pre.timeline-source');
    
    sources.forEach(pre => {
      const title = pre.getAttribute('data-timeline-title') || 'Timeline';
      const yamlText = pre.textContent;
      const versions = parseTimelineData(yamlText);
      
      const container = pre.parentNode;
      renderTimeline(container, versions, title);
    });
  });
})();
