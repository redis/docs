document.addEventListener('DOMContentLoaded', () => {
    const hierarchies = document.querySelectorAll('pre.hierarchy-source');
    console.log('Found', hierarchies.length, 'hierarchy(ies)');

    hierarchies.forEach(pre => {
        const hierarchyType = pre.getAttribute('data-hierarchy-type');
        const yamlContent = pre.textContent;
        console.log('Processing hierarchy:', hierarchyType);

        createHierarchyFromYAML(yamlContent, hierarchyType, pre);
    });
});

// Simple YAML parser for hierarchy format
function parseYAML(yamlText) {
    const lines = yamlText.split('\n');
    const root = {};
    const stack = [{ node: root, indent: -1 }];
    const skipLines = new Set(); // Track lines to skip

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];

        if (skipLines.has(lineIndex)) continue;
        if (!line.trim() || line.trim().startsWith('#')) continue;

        const indent = line.search(/\S/);
        const content = line.trim();

        // Remove trailing colon if present
        const keyMatch = content.match(/^"([^"]+)"|^([^:]+)/);
        if (!keyMatch) continue;

        const key = keyMatch[1] || keyMatch[2];
        const isMetaKey = key === '_meta';

        // Pop stack until we find the right parent
        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
            stack.pop();
        }

        const parent = stack[stack.length - 1].node;

        if (isMetaKey) {
            // Parse metadata object
            parent._meta = {};
            let i = lineIndex + 1;

            while (i < lines.length) {
                const nextLine = lines[i];
                if (!nextLine.trim()) {
                    i++;
                    continue;
                }
                const nextIndent = nextLine.search(/\S/);
                if (nextIndent <= indent) break;

                const metaMatch = nextLine.trim().match(/^([^:]+):\s*(.+)$/);
                if (metaMatch) {
                    const metaKey = metaMatch[1].trim();
                    let metaValue = metaMatch[2].trim();

                    // Remove surrounding quotes if present
                    if ((metaValue.startsWith('"') && metaValue.endsWith('"')) ||
                        (metaValue.startsWith("'") && metaValue.endsWith("'"))) {
                        metaValue = metaValue.slice(1, -1);
                        // Unescape escaped quotes
                        metaValue = metaValue.replace(/\\"/g, '"');
                        metaValue = metaValue.replace(/\\\\/g, '\\');
                    } else {
                        // Parse boolean values
                        if (metaValue === 'true') metaValue = true;
                        else if (metaValue === 'false') metaValue = false;
                        else if (!isNaN(metaValue)) metaValue = parseInt(metaValue);
                    }

                    parent._meta[metaKey] = metaValue;
                }
                skipLines.add(i); // Mark this line to skip in main loop
                i++;
            }
        } else {
            // Regular node
            parent[key] = {};
            stack.push({ node: parent[key], indent: indent });
        }
    }

    return root;
}

function createHierarchyFromYAML(yamlText, hierarchyType, preElement) {
    const data = parseYAML(yamlText);
    const rootKey = Object.keys(data)[0];

    if (!rootKey) return;

    // Build flat list of items with depth info
    const items = [];
    flattenHierarchy(rootKey, data[rootKey], 0, items);

    // Calculate SVG dimensions
    const lineHeight = 24;
    const charWidth = 8;
    const leftMargin = 20;
    const topMargin = 10;
    const indentWidth = 20;
    const commentGap = 40; // Gap between item name and comment

    // Find max depth and max text width
    let maxDepth = 0;
    let maxTextWidth = 0;
    let maxCommentWidth = 0;
    items.forEach(item => {
        maxDepth = Math.max(maxDepth, item.depth);
        maxTextWidth = Math.max(maxTextWidth, item.name.length);
        if (item.description) {
            maxCommentWidth = Math.max(maxCommentWidth, item.description.length);
        }
    });

    const svgWidth = leftMargin + (maxDepth + 1) * indentWidth + maxTextWidth * charWidth + commentGap + maxCommentWidth * charWidth + 20;
    const svgHeight = topMargin + items.length * lineHeight + 10;

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', svgWidth);
    svg.setAttribute('height', svgHeight);
    svg.setAttribute('class', 'hierarchy-diagram');
    svg.style.marginTop = '1em';
    svg.style.marginBottom = '1em';
    svg.style.fontFamily = '"Space Mono", monospace';
    svg.style.fontSize = '14px';

    // Draw items and tree lines
    items.forEach((item, index) => {
        const y = topMargin + index * lineHeight + 12; // Adjusted for middle alignment
        const x = leftMargin + item.depth * indentWidth;

        // Draw tree structure lines
        if (item.depth > 0) {
            drawTreeLines(svg, item, items, index, leftMargin, topMargin, lineHeight, indentWidth);
        } else if (item.depth === 0 && items.length > 1) {
            // For root item, draw a short horizontal line and pip if there are children
            drawRootConnector(svg, item, items, index, leftMargin, topMargin, lineHeight, indentWidth);
        }

        // Draw text for item name
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + 20);
        text.setAttribute('y', y);
        text.setAttribute('font-family', '"Space Mono", monospace');
        text.setAttribute('font-size', '14');
        text.setAttribute('fill', '#333');
        text.setAttribute('dominant-baseline', 'middle');
        text.textContent = item.name;
        svg.appendChild(text);

        // Draw description/comment if available
        if (item.description) {
            const comment = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            comment.setAttribute('x', x + 20 + item.name.length * charWidth + commentGap);
            comment.setAttribute('y', y);
            comment.setAttribute('font-family', '"Space Mono", monospace');
            comment.setAttribute('font-size', '12');
            comment.setAttribute('fill', '#999');
            comment.setAttribute('font-style', 'italic');
            comment.setAttribute('dominant-baseline', 'middle');
            comment.textContent = item.description;
            svg.appendChild(comment);
        }
    });

    // Replace the <pre> element with the SVG
    preElement.replaceWith(svg);
}

function cleanDescription(text) {
    // The YAML parser already handles quote removal and unescaping,
    // so just return the text as-is
    return text || null;
}

function flattenHierarchy(name, nodeData, depth, items) {
    const isEllipsis = nodeData._meta?.ellipsis === true;

    items.push({
        name: name,
        depth: depth,
        description: cleanDescription(nodeData._meta?.description),
        isEllipsis: isEllipsis
    });

    // Only process children if this is not an ellipsis item
    if (!isEllipsis) {
        const children = Object.keys(nodeData).filter(k => k !== '_meta');
        children.forEach(childKey => {
            flattenHierarchy(childKey, nodeData[childKey], depth + 1, items);
        });
    }
}

function drawTreeLines(svg, item, items, itemIndex, leftMargin, topMargin, lineHeight, indentWidth) {
    const y = topMargin + itemIndex * lineHeight + 12; // Middle of text
    const x = leftMargin + item.depth * indentWidth;
    const parentX = x - indentWidth;
    const connectorX = parentX + 10; // Line comes from under first letter of parent

    // Find parent item to get its y position
    let parentY = null;
    for (let i = itemIndex - 1; i >= 0; i--) {
        if (items[i].depth === item.depth - 1) {
            parentY = topMargin + i * lineHeight + 12;
            break;
        }
    }

    // Check if this is the last child at this depth
    let isLastChild = true;
    let nextSiblingY = null;
    for (let i = itemIndex + 1; i < items.length; i++) {
        if (items[i].depth < item.depth) {
            isLastChild = true;
            break;
        }
        if (items[i].depth === item.depth) {
            isLastChild = false;
            nextSiblingY = topMargin + i * lineHeight + 12;
            break;
        }
    }

    // Draw vertical line from parent (connecting all siblings)
    if (itemIndex > 0) {
        // Find first sibling at this depth
        let firstSiblingY = y;
        for (let i = itemIndex - 1; i >= 0; i--) {
            if (items[i].depth < item.depth) break;
            if (items[i].depth === item.depth) {
                firstSiblingY = topMargin + i * lineHeight + 12;
            }
        }

        // Draw vertical line connecting all siblings, extending up to parent
        const verticalStartY = parentY !== null ? parentY : Math.min(firstSiblingY, y);
        const verticalEndY = nextSiblingY || y;

        const vline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vline.setAttribute('x1', connectorX);
        vline.setAttribute('y1', verticalStartY);
        vline.setAttribute('x2', connectorX);
        vline.setAttribute('y2', verticalEndY);
        vline.setAttribute('stroke', '#999');
        vline.setAttribute('stroke-width', '1');
        svg.appendChild(vline);
    }

    // Draw horizontal line from vertical to item, protruding slightly past the text
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', connectorX);
    line.setAttribute('y1', y);
    line.setAttribute('x2', x + 16); // Protrude slightly to point at text with gap
    line.setAttribute('y2', y);
    line.setAttribute('stroke', '#999');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);

    // For ellipsis items, draw a dotted vertical line segment
    if (item.isEllipsis) {
        const dotLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        dotLine.setAttribute('x1', connectorX);
        dotLine.setAttribute('y1', y);
        dotLine.setAttribute('x2', connectorX);
        dotLine.setAttribute('y2', y + lineHeight / 2);
        dotLine.setAttribute('stroke', '#999');
        dotLine.setAttribute('stroke-width', '1');
        dotLine.setAttribute('stroke-dasharray', '2,2');
        svg.appendChild(dotLine);
    }
}

function drawRootConnector(svg, item, items, itemIndex, leftMargin, topMargin, lineHeight, indentWidth) {
    const y = topMargin + itemIndex * lineHeight + 12; // Middle of text
    const x = leftMargin + item.depth * indentWidth;
    const connectorX = x + 10; // Vertical line position

    // Find the first child to determine where the vertical line should extend
    let firstChildY = null;
    for (let i = itemIndex + 1; i < items.length; i++) {
        if (items[i].depth > item.depth) {
            firstChildY = topMargin + i * lineHeight + 12;
            break;
        }
    }

    if (firstChildY !== null) {
        // Draw vertical line from root down to first child
        const vline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vline.setAttribute('x1', connectorX);
        vline.setAttribute('y1', y);
        vline.setAttribute('x2', connectorX);
        vline.setAttribute('y2', firstChildY);
        vline.setAttribute('stroke', '#999');
        vline.setAttribute('stroke-width', '1');
        svg.appendChild(vline);

        // Draw a small horizontal line from root to point at its text
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', connectorX);
        line.setAttribute('y1', y);
        line.setAttribute('x2', x + 16);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#999');
        line.setAttribute('stroke-width', '1');
        svg.appendChild(line);
    }
}

