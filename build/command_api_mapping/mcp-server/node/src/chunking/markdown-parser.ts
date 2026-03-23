/**
 * Markdown Parser for RAG Quality Analysis
 * 
 * Parses Markdown content into a structural representation
 * that can be used for chunking and analysis.
 */

export interface Heading {
  level: number;          // 1-6
  text: string;
  startLine: number;
  endLine: number;        // Line before next heading or EOF
}

export interface CodeBlock {
  language: string | null;
  startLine: number;
  endLine: number;
  content: string;
}

export interface Table {
  startLine: number;
  endLine: number;
  rowCount: number;
}

export interface Section {
  headingPath: string[];  // e.g., ["Getting Started", "Installation"]
  headingLevel: number;
  startLine: number;
  endLine: number;
  content: string;
  hasCodeBlock: boolean;
  hasTable: boolean;
  hadOnlyMetadata?: boolean;  // True if section content was only a metadata block
}

export interface DocStructure {
  headings: Heading[];
  codeBlocks: CodeBlock[];
  tables: Table[];
  sections: Section[];
  totalLines: number;
}

/**
 * Parse Markdown content into a structural representation.
 */
export function parseMarkdownStructure(content: string): DocStructure {
  const lines = content.split('\n');
  const headings: Heading[] = [];
  const codeBlocks: CodeBlock[] = [];
  const tables: Table[] = [];
  
  let inCodeBlock = false;
  let codeBlockStart = -1;
  let codeBlockLang: string | null = null;
  let codeBlockContent: string[] = [];
  let codeBlockOpenLine: string | null = null;

  // Track metadata blocks to exclude from section content
  const metadataBlockRanges: Array<{ startLine: number; endLine: number }> = [];
  
  let inTable = false;
  let tableStart = -1;
  let tableRowCount = 0;
  
  // First pass: extract headings, code blocks, tables
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1; // 1-based line numbers
    
    // Code block detection
    if (line.match(/^```/)) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockStart = lineNum;
        codeBlockOpenLine = line;  // Store the full opening line
        // Check for language identifier (e.g., ```python, ```json metadata)
        const langMatch = line.match(/^```(\S+)?/);
        codeBlockLang = langMatch?.[1] || null;
        codeBlockContent = [];
      } else {
        inCodeBlock = false;
        // Skip "json metadata" blocks - these are for AI agents, not RAG chunking
        // The actual RAG pipeline uses structured JSON/NDJSON files
        // Check the opening line itself for "metadata" (e.g., "```json metadata")
        const isMetadataBlock = codeBlockLang === 'json' &&
          codeBlockOpenLine?.includes('metadata');

        if (isMetadataBlock) {
          // Track the range so we can exclude it from section content
          metadataBlockRanges.push({
            startLine: codeBlockStart,
            endLine: lineNum,
          });
        } else {
          codeBlocks.push({
            language: codeBlockLang,
            startLine: codeBlockStart,
            endLine: lineNum,
            content: codeBlockContent.join('\n'),
          });
        }
        codeBlockLang = null;
        codeBlockContent = [];
        codeBlockOpenLine = null;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }
    
    // Table detection (simple: lines with | that aren't in code blocks)
    if (line.includes('|') && line.trim().startsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableStart = lineNum;
        tableRowCount = 1;
      } else {
        tableRowCount++;
      }
    } else if (inTable) {
      // Table ended
      tables.push({
        startLine: tableStart,
        endLine: lineNum - 1,
        rowCount: tableRowCount,
      });
      inTable = false;
      tableRowCount = 0;
    }
    
    // Heading detection (ATX style: # Heading)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      headings.push({
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
        startLine: lineNum,
        endLine: lineNum, // Will be updated in second pass
      });
    }
  }
  
  // Close any unclosed table
  if (inTable) {
    tables.push({
      startLine: tableStart,
      endLine: lines.length,
      rowCount: tableRowCount,
    });
  }
  
  // Second pass: compute heading end lines
  for (let i = 0; i < headings.length; i++) {
    const nextHeading = headings[i + 1];
    headings[i].endLine = nextHeading ? nextHeading.startLine - 1 : lines.length;
  }
  
  // Build sections from headings
  const sections = buildSections(lines, headings, codeBlocks, tables, metadataBlockRanges);
  
  return {
    headings,
    codeBlocks,
    tables,
    sections,
    totalLines: lines.length,
  };
}

/**
 * Build sections from headings, tracking hierarchy.
 */
function buildSections(
  lines: string[],
  headings: Heading[],
  codeBlocks: CodeBlock[],
  tables: Table[],
  metadataBlockRanges: Array<{ startLine: number; endLine: number }>
): Section[] {
  // Helper to filter out metadata block lines from a range
  // Returns { content, hadOnlyMetadata }
  const getFilteredContent = (start: number, end: number): { content: string; hadOnlyMetadata: boolean } => {
    const filteredLines: string[] = [];
    let metadataLinesInRange = 0;
    let totalNonHeadingLines = 0;

    for (let lineNum = start; lineNum <= end; lineNum++) {
      const line = lines[lineNum - 1]; // lineNum is 1-based
      const isHeadingLine = lineNum === start && line.match(/^#+\s/);

      // Check if this line is inside a metadata block
      const isInMetadataBlock = metadataBlockRanges.some(
        range => lineNum >= range.startLine && lineNum <= range.endLine
      );

      if (isInMetadataBlock) {
        metadataLinesInRange++;
      }

      if (!isHeadingLine && line.trim().length > 0) {
        totalNonHeadingLines++;
      }

      if (!isInMetadataBlock) {
        filteredLines.push(line);
      }
    }

    // Section had only metadata if all non-heading content was metadata
    const hadOnlyMetadata = metadataLinesInRange > 0 &&
      totalNonHeadingLines > 0 &&
      metadataLinesInRange >= totalNonHeadingLines;

    return { content: filteredLines.join('\n'), hadOnlyMetadata };
  };

  if (headings.length === 0) {
    // No headings - entire doc is one section
    const { content, hadOnlyMetadata } = getFilteredContent(1, lines.length);
    return [{
      headingPath: ['(untitled)'],
      headingLevel: 0,
      startLine: 1,
      endLine: lines.length,
      content,
      hasCodeBlock: codeBlocks.length > 0,
      hasTable: tables.length > 0,
      hadOnlyMetadata,
    }];
  }

  const sections: Section[] = [];
  // Track both heading text and its level to handle skipped levels correctly
  const headingStack: Array<{ text: string; level: number }> = [];

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];

    // Pop headings that are at the same level or deeper than current heading
    // This correctly handles skipped levels (e.g., H2 followed by H2 when there's no H1)
    while (headingStack.length > 0 &&
           headingStack[headingStack.length - 1].level >= heading.level) {
      headingStack.pop();
    }
    headingStack.push({ text: heading.text, level: heading.level });

    // Extract content for this section (excluding metadata blocks)
    const startLine = heading.startLine;
    const endLine = heading.endLine;
    const { content, hadOnlyMetadata } = getFilteredContent(startLine, endLine);

    // Check if section contains code blocks or tables
    const hasCodeBlock = codeBlocks.some(
      cb => cb.startLine >= startLine && cb.endLine <= endLine
    );
    const hasTable = tables.some(
      t => t.startLine >= startLine && t.endLine <= endLine
    );

    sections.push({
      headingPath: headingStack.map(h => h.text),
      headingLevel: heading.level,
      startLine,
      endLine,
      content,
      hasCodeBlock,
      hasTable,
      hadOnlyMetadata,
    });
  }

  return sections;
}

