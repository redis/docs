// Decision tree rendering engine
// Parses YAML decision trees and renders them as tree structure diagrams

(function() {
  'use strict';

  // Parse YAML from the pre element
  function parseDecisionTreeYAML(yamlText) {
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

  // Flatten decision tree into a list for tree rendering
  function flattenDecisionTree(questions, rootId) {
    const items = [];
    const visited = new Set();

    function traverse(nodeId, depth) {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const question = questions[nodeId];
      if (!question) return;

      items.push({
        id: nodeId,
        depth: depth,
        type: 'question',
        text: question.text || '',
        whyAsk: question.whyAsk || ''
      });

      if (question.answers) {
        // Process yes answer
        if (question.answers.yes) {
          if (question.answers.yes.nextQuestion) {
            traverse(question.answers.yes.nextQuestion, depth + 1);
          } else if (question.answers.yes.outcome) {
            items.push({
              id: question.answers.yes.outcome.id,
              depth: depth + 1,
              type: 'outcome',
              text: question.answers.yes.outcome.label || '',
              answer: 'Yes'
            });
          }
        }

        // Process no answer
        if (question.answers.no) {
          if (question.answers.no.nextQuestion) {
            traverse(question.answers.no.nextQuestion, depth + 1);
          } else if (question.answers.no.outcome) {
            items.push({
              id: question.answers.no.outcome.id,
              depth: depth + 1,
              type: 'outcome',
              text: question.answers.no.outcome.label || '',
              answer: 'No'
            });
          }
        }
      }
    }

    traverse(rootId, 0);
    return items;
  }

  // Wrap text to fit within a maximum width
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

  // Render decision tree as SVG with tree structure and boxes
  function renderDecisionTree(container, treeData) {
    const rootId = treeData.rootQuestion;
    const questions = treeData.questions;

    if (!rootId || !questions[rootId]) {
      container.textContent = 'Error: Invalid decision tree structure';
      return;
    }

    const items = flattenDecisionTree(questions, rootId);

    const lineHeight = 24;
    const charWidth = 8;
    const leftMargin = 20;
    const topMargin = 10;
    const indentWidth = 40; // Increased from 24 for wider indent
    const boxPadding = 8;
    const maxBoxWidth = 280; // Max width for text in box
    const maxCharsPerLine = Math.floor(maxBoxWidth / charWidth);

    // Calculate box dimensions for each item
    items.forEach(item => {
      const lines = wrapText(item.text, maxCharsPerLine);
      item.lines = lines;
      item.boxHeight = lines.length * lineHeight + boxPadding * 2;
      item.boxWidth = Math.min(maxBoxWidth, Math.max(...lines.map(l => l.length)) * charWidth + boxPadding * 2);
    });

    // Calculate SVG dimensions
    let maxDepth = 0;
    items.forEach(item => {
      maxDepth = Math.max(maxDepth, item.depth);
    });

    const svgWidth = leftMargin + (maxDepth + 1) * indentWidth + 320;
    const svgHeight = topMargin + items.reduce((sum, item) => sum + item.boxHeight + 20, 0) + 10;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', svgWidth);
    svg.setAttribute('height', svgHeight);
    svg.setAttribute('class', 'decision-tree-diagram');
    svg.style.marginTop = '1em';
    svg.style.marginBottom = '1em';
    svg.style.fontFamily = '"Space Mono", monospace';
    svg.style.fontSize = '13px';

    let currentY = topMargin;

    items.forEach((item, index) => {
      const x = leftMargin + item.depth * indentWidth;
      const y = currentY + item.boxHeight / 2;

      if (item.depth > 0) {
        drawTreeLines(svg, item, items, index, leftMargin, topMargin, lineHeight, indentWidth, currentY, item.boxHeight);
      }

      // Draw box with different styling for outcomes vs questions
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x + 10);
      rect.setAttribute('y', currentY);
      rect.setAttribute('width', item.boxWidth);
      rect.setAttribute('height', item.boxHeight);

      if (item.type === 'outcome') {
        // Outcomes: lighter background, dashed border
        rect.setAttribute('fill', '#f9f9f9');
        rect.setAttribute('stroke', '#ccc');
        rect.setAttribute('stroke-width', '1');
        rect.setAttribute('stroke-dasharray', '3,3');
      } else {
        // Questions: standard styling
        rect.setAttribute('fill', '#f5f5f5');
        rect.setAttribute('stroke', '#999');
        rect.setAttribute('stroke-width', '1');
      }
      rect.setAttribute('rx', '4');
      svg.appendChild(rect);

      // Draw text lines
      item.lines.forEach((line, lineIndex) => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + 10 + boxPadding);
        text.setAttribute('y', currentY + boxPadding + (lineIndex + 1) * lineHeight - 6);
        text.setAttribute('font-family', '"Space Mono", monospace');
        text.setAttribute('font-size', '13');
        text.setAttribute('fill', item.type === 'outcome' ? '#666' : '#333');
        text.textContent = line;
        svg.appendChild(text);
      });

      currentY += item.boxHeight + 20;
    });

    const jsonScript = document.createElement('script');
    jsonScript.type = 'application/json';
    jsonScript.className = 'decision-tree-data';
    jsonScript.textContent = JSON.stringify(treeData, null, 2);

    container.appendChild(svg);
    container.parentNode.insertBefore(jsonScript, container.nextSibling);
  }

  function drawTreeLines(svg, item, items, itemIndex, leftMargin, topMargin, lineHeight, indentWidth, currentY, boxHeight) {
    const y = currentY + boxHeight / 2;
    const x = leftMargin + item.depth * indentWidth;
    const parentX = x - indentWidth;
    const connectorX = parentX + 10; // Left edge of parent box (vertical line position)

    // Find parent item and its Y position, and determine the answer (Yes/No)
    let parentY = null;
    let parentBoxHeight = 0;
    let parentCurrentY = null;
    let answerLabel = '';

    for (let i = itemIndex - 1; i >= 0; i--) {
      if (items[i].depth === item.depth - 1) {
        // Calculate parent's Y position
        let calcY = topMargin;
        for (let j = 0; j < i; j++) {
          calcY += items[j].boxHeight + 20;
        }
        parentCurrentY = calcY;
        parentY = calcY + items[i].boxHeight / 2;
        parentBoxHeight = items[i].boxHeight;

        // Determine if this is a Yes or No answer by checking the parent's answers
        // Count how many siblings come before this item
        let siblingCount = 0;
        for (let k = i + 1; k < itemIndex; k++) {
          if (items[k].depth === item.depth) {
            siblingCount++;
          }
        }

        // If this is the first child of the parent, it's the "yes" path, otherwise "no"
        answerLabel = siblingCount === 0 ? 'Yes' : 'No';
        break;
      }
    }

    if (parentY !== null) {
      // Vertical line starts from bottom of parent box
      const verticalStartY = parentCurrentY + parentBoxHeight;

      // Vertical line from parent box bottom
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', connectorX);
      line.setAttribute('y1', verticalStartY);
      line.setAttribute('x2', connectorX);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#999');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);

      // Horizontal line to child (extended to match wider indent)
      const boxX = x + 10;
      const hlineExtension = 15; // Extra space for label
      const hline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hline.setAttribute('x1', connectorX);
      hline.setAttribute('y1', y);
      hline.setAttribute('x2', boxX + hlineExtension);
      hline.setAttribute('y2', y);
      hline.setAttribute('stroke', '#999');
      hline.setAttribute('stroke-width', '1');
      svg.appendChild(hline);

      // Add answer label on the horizontal line, positioned below it to avoid boxes
      const labelX = connectorX + (boxX + hlineExtension - connectorX) / 2;
      const labelY = y + 10;

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', labelX);
      label.setAttribute('y', labelY);
      label.setAttribute('font-family', '"Space Mono", monospace');
      label.setAttribute('font-size', '11');
      label.setAttribute('fill', '#666');
      label.setAttribute('text-anchor', 'middle');
      label.textContent = answerLabel;
      svg.appendChild(label);
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    const sources = document.querySelectorAll('pre.decision-tree-source');

    sources.forEach(pre => {
      const yamlText = pre.textContent;
      const treeData = parseDecisionTreeYAML(yamlText);

      const container = document.createElement('div');
      container.className = 'decision-tree-container';
      pre.parentNode.insertBefore(container, pre.nextSibling);

      renderDecisionTree(container, treeData);
    });
  });
})();
