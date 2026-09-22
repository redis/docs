// Context map rendering engine
// Parses YAML flow diagrams (nodes + edges) and renders them as a clickable SVG diagram

(function() {
  'use strict';

  // Parse YAML from the pre element (indent-stack parser, same shape as decision-tree.js)
  function parseContextMapYAML(yamlText) {
    const lines = yamlText.split('\n');
    const root = {};
    const stack = [{ node: root, indent: -1, key: null }];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim() || line.trim().startsWith('#')) continue;

      const indent = line.search(/\S/);
      const content = line.trim();

      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].node;

      if (content.includes(':')) {
        const colonIndex = content.indexOf(':');
        const key = content.substring(0, colonIndex).trim();
        let value = content.substring(colonIndex + 1).trim();

        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }

        if (value === '|') {
          const multiLineValue = [];
          i++;
          while (i < lines.length) {
            const nextLine = lines[i];
            if (nextLine.trim() === '') {
              i++;
              continue;
            }
            const nextIndent = nextLine.search(/\S/);
            if (nextIndent <= indent) break;
            multiLineValue.push(nextLine.trim());
            i++;
          }
          i--;
          value = multiLineValue.join(' ');
        }

        if (value === '') {
          const newObj = {};
          parent[key] = newObj;
          stack.push({ node: newObj, indent: indent, key: key });
        } else {
          parent[key] = value;
        }
      }
    }

    return root;
  }

  // Layout and shape constants
  const COL_WIDTH = 160;
  const ROW_HEIGHT = 150;
  const MARGIN_X = 55;
  const MARGIN_Y = 60;
  const LOOPBACK_GAP = 70;
  const EDGE_GAP = 8;

  const SHAPE_HALF = {
    process: { w: 55, h: 44 },
    decision: { w: 65, h: 58 },
    terminal: { w: 55, h: 38 }
  };

  function wrapText(text, maxChars) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + ' ' + word).trim().length <= maxChars) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  function svgEl(name, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', name);
    if (attrs) {
      Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
    }
    return el;
  }

  // Point where a ray from (cx, cy) in direction (dx, dy) exits an ellipse of the given half-extents
  function ellipseBoundaryPoint(cx, cy, halfW, halfH, dx, dy) {
    const denom = Math.sqrt((dx * dx) / (halfW * halfW) + (dy * dy) / (halfH * halfH));
    if (!denom) return { x: cx, y: cy };
    const t = 1 / denom;
    return { x: cx + dx * t, y: cy + dy * t };
  }

  // Joins basePath (e.g. "/" or "/docs/latest/") with a site-relative path authored in the
  // YAML (e.g. "/develop/ai/agent-builder"), so links resolve under whatever subpath this
  // build is actually deployed at.
  function resolveUrl(basePath, path) {
    if (!path) return path;
    return basePath.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  }

  function buildNodes(rawNodes, topOffset, basePath) {
    const nodes = {};
    Object.keys(rawNodes || {}).forEach(id => {
      const n = rawNodes[id];
      const shape = SHAPE_HALF[n.type] || SHAPE_HALF.process;
      const col = parseInt(n.col, 10) || 0;
      const row = parseInt(n.row, 10) || 0;
      const links = [];
      if (n.links) {
        Object.keys(n.links).forEach(linkId => {
          const link = n.links[linkId];
          if (link && link.url) links.push({ label: link.label || linkId, url: resolveUrl(basePath, link.url) });
        });
      }
      if (n.docsUrl) links.push({ label: 'Read more', url: resolveUrl(basePath, n.docsUrl) });

      nodes[id] = {
        id: id,
        label: n.label || id,
        type: n.type || 'process',
        description: n.description || '',
        links: links,
        halfW: shape.w,
        halfH: shape.h,
        cx: MARGIN_X + col * COL_WIDTH,
        cy: MARGIN_Y + topOffset + row * ROW_HEIGHT,
        row: row,
        col: col
      };
    });
    return nodes;
  }

  function drawNodeShape(svg, node) {
    const g = svgEl('g', {
      class: 'context-map-node context-map-node--' + node.type,
      tabindex: '0',
      role: 'button',
      'aria-expanded': 'false',
      'aria-label': node.label
    });

    if (node.description) {
      const title = svgEl('title');
      title.textContent = node.label + ': ' + node.description;
      g.appendChild(title);
    }

    let shape;
    if (node.type === 'decision') {
      const points = [
        [node.cx, node.cy - node.halfH],
        [node.cx + node.halfW, node.cy],
        [node.cx, node.cy + node.halfH],
        [node.cx - node.halfW, node.cy]
      ].map(p => p.join(',')).join(' ');
      shape = svgEl('polygon', { points: points });
    } else if (node.type === 'terminal') {
      shape = svgEl('rect', {
        x: node.cx - node.halfW,
        y: node.cy - node.halfH,
        width: node.halfW * 2,
        height: node.halfH * 2,
        rx: node.halfH
      });
    } else {
      shape = svgEl('rect', {
        x: node.cx - node.halfW,
        y: node.cy - node.halfH,
        width: node.halfW * 2,
        height: node.halfH * 2,
        rx: 6
      });
    }
    shape.setAttribute('class', 'context-map-shape');
    g.appendChild(shape);

    const maxCharsPerLine = Math.floor((node.halfW * 2 - 16) / 6.2);
    const lines = wrapText(node.label, maxCharsPerLine);
    const lineHeight = 14;
    const startY = node.cy - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, i) => {
      const text = svgEl('text', {
        x: node.cx,
        y: startY + i * lineHeight,
        class: 'context-map-label',
        'text-anchor': 'middle',
        'dominant-baseline': 'middle'
      });
      text.textContent = line;
      g.appendChild(text);
    });

    return g;
  }

  function drawStraightEdge(svg, from, to, edge) {
    const dx = to.cx - from.cx;
    const dy = to.cy - from.cy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const dirX = dx / len;
    const dirY = dy / len;

    const start = ellipseBoundaryPoint(from.cx, from.cy, from.halfW + EDGE_GAP, from.halfH + EDGE_GAP, dirX, dirY);
    const end = ellipseBoundaryPoint(to.cx, to.cy, to.halfW + EDGE_GAP, to.halfH + EDGE_GAP, -dirX, -dirY);

    const line = svgEl('line', {
      x1: start.x, y1: start.y, x2: end.x, y2: end.y,
      class: 'context-map-edge context-map-edge--' + (edge.kind || 'normal'),
      'marker-end': 'url(#context-map-arrow)'
    });
    svg.appendChild(line);

    if (edge.label) {
      drawEdgeLabel(svg, (start.x + end.x) / 2, (start.y + end.y) / 2, edge.label);
    }

    return line;
  }

  function drawLoopbackEdge(svg, from, to, edge, dipY, direction) {
    const sign = direction === 'top' ? -1 : 1;
    const start = { x: from.cx, y: from.cy + sign * (from.halfH + EDGE_GAP) };
    const end = { x: to.cx, y: to.cy + sign * (to.halfH + EDGE_GAP) };
    const d = 'M ' + start.x + ' ' + start.y +
      ' C ' + start.x + ' ' + dipY + ', ' + end.x + ' ' + dipY + ', ' + end.x + ' ' + end.y;

    const path = svgEl('path', {
      d: d,
      class: 'context-map-edge context-map-edge--loopback',
      'marker-end': 'url(#context-map-arrow)'
    });
    svg.appendChild(path);

    if (edge.label) {
      drawEdgeLabel(svg, (start.x + end.x) / 2, dipY + sign * 4, edge.label);
    }

    return path;
  }

  function drawEdgeLabel(svg, x, y, label) {
    const width = label.length * 6.5 + 10;
    const bg = svgEl('rect', {
      x: x - width / 2, y: y - 9, width: width, height: 14,
      class: 'context-map-edge-label-bg'
    });
    svg.appendChild(bg);

    const text = svgEl('text', {
      x: x, y: y + 1,
      class: 'context-map-edge-label',
      'text-anchor': 'middle'
    });
    text.textContent = label;
    svg.appendChild(text);
  }

  function renderContextMap(container, data, basePath) {
    const edges = data.edges || {};
    const hasTopLoopback = Object.keys(edges).some(id => edges[id].kind === 'loopback' && edges[id].route === 'top');
    const hasBottomLoopback = Object.keys(edges).some(id => edges[id].kind === 'loopback' && edges[id].route !== 'top');
    const topOffset = hasTopLoopback ? LOOPBACK_GAP : 0;

    const nodes = buildNodes(data.nodes, topOffset, basePath);

    let maxCol = 0;
    let maxRow = 0;
    Object.keys(nodes).forEach(id => {
      maxCol = Math.max(maxCol, nodes[id].col);
      maxRow = Math.max(maxRow, nodes[id].row);
    });

    const topDipY = topOffset - 55;
    const bottomDipY = MARGIN_Y + topOffset + maxRow * ROW_HEIGHT + (hasBottomLoopback ? LOOPBACK_GAP : 0);
    const width = MARGIN_X * 2 + maxCol * COL_WIDTH;
    const height = bottomDipY + MARGIN_Y;

    const svg = svgEl('svg', {
      width: width,
      height: height,
      viewBox: '0 0 ' + width + ' ' + height,
      class: 'context-map-diagram'
    });

    const defs = svgEl('defs');
    const marker = svgEl('marker', {
      id: 'context-map-arrow',
      viewBox: '0 0 10 10',
      refX: '8',
      refY: '5',
      markerWidth: '7',
      markerHeight: '7',
      orient: 'auto-start-reverse'
    });
    const arrowPath = svgEl('path', { d: 'M 0 0 L 10 5 L 0 10 z', class: 'context-map-arrowhead' });
    marker.appendChild(arrowPath);
    defs.appendChild(marker);

    const activeMarker = svgEl('marker', {
      id: 'context-map-arrow-active',
      viewBox: '0 0 10 10',
      refX: '8',
      refY: '5',
      markerWidth: '7',
      markerHeight: '7',
      orient: 'auto-start-reverse'
    });
    const activeArrowPath = svgEl('path', { d: 'M 0 0 L 10 5 L 0 10 z', class: 'context-map-arrowhead context-map-arrowhead--active' });
    activeMarker.appendChild(activeArrowPath);
    defs.appendChild(activeMarker);

    svg.appendChild(defs);

    // Draw edges first so node shapes render on top of their stubs.
    const edgeElements = {};
    Object.keys(edges).forEach(edgeId => {
      const edge = edges[edgeId];
      const from = nodes[edge.from];
      const to = nodes[edge.to];
      if (!from || !to) return;

      if (edge.kind === 'loopback') {
        const direction = edge.route === 'top' ? 'top' : 'bottom';
        edgeElements[edgeId] = drawLoopbackEdge(svg, from, to, edge, direction === 'top' ? topDipY : bottomDipY, direction);
      } else {
        edgeElements[edgeId] = drawStraightEdge(svg, from, to, edge);
      }
    });

    const nodeGroups = {};
    Object.keys(nodes).forEach(id => {
      const g = drawNodeShape(svg, nodes[id]);
      svg.appendChild(g);
      nodeGroups[id] = g;
    });

    container.appendChild(svg);

    // Scenario buttons: highlight every edge/node on a named path (e.g. cache hit vs. cache miss).
    const paths = data.paths || {};
    const pathButtons = {};
    if (Object.keys(paths).length) {
      const controls = document.createElement('div');
      controls.className = 'context-map-controls';
      Object.keys(paths).forEach(pathId => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'context-map-path-button';
        btn.textContent = paths[pathId].label;
        controls.appendChild(btn);
        pathButtons[pathId] = btn;
      });
      container.appendChild(controls);
    }

    // Shared description panel: one node or path selected at a time.
    const panel = document.createElement('div');
    panel.className = 'context-map-panel';
    panel.hidden = true;
    container.appendChild(panel);

    let current = { type: null, id: null };

    function showPanel(kind, title, description, links) {
      panel.textContent = '';
      panel.className = 'context-map-panel context-map-panel--' + kind;

      const eyebrow = document.createElement('span');
      eyebrow.className = 'context-map-panel-kind';
      eyebrow.textContent = kind === 'path' ? 'Scenario' : 'Component';
      panel.appendChild(eyebrow);

      const heading = document.createElement('strong');
      heading.textContent = title;
      panel.appendChild(heading);

      const desc = document.createElement('p');
      desc.textContent = description;
      panel.appendChild(desc);

      (links || []).forEach((link, i) => {
        if (i > 0) panel.appendChild(document.createTextNode(' · '));
        const a = document.createElement('a');
        a.href = link.url;
        a.textContent = link.label;
        panel.appendChild(a);
      });

      panel.hidden = false;
    }

    function pathEdgeMatches(edge, pathId) {
      if (!edge.path) return true;
      return edge.path.split(',').map(p => p.trim()).indexOf(pathId) !== -1;
    }

    function clearSelection() {
      if (current.type === 'node') {
        nodeGroups[current.id].classList.remove('is-selected');
        nodeGroups[current.id].setAttribute('aria-expanded', 'false');
      } else if (current.type === 'path') {
        Object.keys(edges).forEach(edgeId => {
          const edge = edges[edgeId];
          if (!pathEdgeMatches(edge, current.id)) return;
          const el = edgeElements[edgeId];
          if (el) {
            el.classList.remove('is-path-active');
            el.setAttribute('marker-end', 'url(#context-map-arrow)');
          }
          [edge.from, edge.to].forEach(nid => {
            if (nodeGroups[nid] && nodes[nid].type === 'terminal') {
              nodeGroups[nid].classList.remove('is-path-active');
            }
          });
        });
        pathButtons[current.id].classList.remove('is-active');
      }
      current = { type: null, id: null };
      panel.hidden = true;
      panel.textContent = '';
      panel.className = 'context-map-panel';
    }

    function selectNode(id) {
      if (current.type === 'node' && current.id === id) {
        clearSelection();
        return;
      }
      clearSelection();
      current = { type: 'node', id: id };
      nodeGroups[id].classList.add('is-selected');
      nodeGroups[id].setAttribute('aria-expanded', 'true');
      showPanel('node', nodes[id].label, nodes[id].description, nodes[id].links);
    }

    function selectPath(pathId) {
      if (current.type === 'path' && current.id === pathId) {
        clearSelection();
        return;
      }
      clearSelection();
      current = { type: 'path', id: pathId };
      Object.keys(edges).forEach(edgeId => {
        const edge = edges[edgeId];
        if (!pathEdgeMatches(edge, pathId)) return;
        const el = edgeElements[edgeId];
        if (el) {
          el.classList.add('is-path-active');
          el.setAttribute('marker-end', 'url(#context-map-arrow-active)');
        }
        [edge.from, edge.to].forEach(nid => {
          if (nodeGroups[nid] && nodes[nid].type === 'terminal') {
            nodeGroups[nid].classList.add('is-path-active');
          }
        });
      });
      pathButtons[pathId].classList.add('is-active');
      showPanel('path', paths[pathId].label, paths[pathId].description, []);
    }

    Object.keys(pathButtons).forEach(pathId => {
      pathButtons[pathId].addEventListener('click', () => selectPath(pathId));
    });

    Object.keys(nodeGroups).forEach(id => {
      const g = nodeGroups[id];

      g.addEventListener('click', () => selectNode(id));

      g.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectNode(id);
        }
      });

      g.addEventListener('mouseenter', () => g.classList.add('is-hovered'));
      g.addEventListener('mouseleave', () => g.classList.remove('is-hovered'));
      g.addEventListener('focus', () => g.classList.add('is-hovered'));
      g.addEventListener('blur', () => g.classList.remove('is-hovered'));
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    const sources = document.querySelectorAll('pre.context-map-source');

    sources.forEach(pre => {
      const yamlText = pre.textContent;
      const data = parseContextMapYAML(yamlText);
      const basePath = pre.getAttribute('data-base-path') || '/';

      const container = document.createElement('div');
      container.className = 'context-map-container';
      pre.parentNode.insertBefore(container, pre.nextSibling);

      renderContextMap(container, data, basePath);
    });
  });
})();
