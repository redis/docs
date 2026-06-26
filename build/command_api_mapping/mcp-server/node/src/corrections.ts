/**
 * Extraction Corrections Handler
 * 
 * Applies manual corrections to extracted data and fixes identified issues.
 */

import * as fs from 'fs';

export interface Correction {
  id: string;
  client_id: string;
  method_name: string;
  field: 'signature' | 'parameters' | 'return_type' | 'documentation';
  original_value: string;
  corrected_value: string;
  reason: string;
  applied: boolean;
  timestamp?: string;
}

export interface CorrectionLog {
  timestamp: string;
  total_corrections: number;
  applied_corrections: number;
  pending_corrections: number;
  corrections: Correction[];
}

/**
 * Create a new correction
 */
export function createCorrection(
  clientId: string,
  methodName: string,
  field: 'signature' | 'parameters' | 'return_type' | 'documentation',
  originalValue: string,
  correctedValue: string,
  reason: string
): Correction {
  return {
    id: `${clientId}-${methodName}-${field}-${Date.now()}`,
    client_id: clientId,
    method_name: methodName,
    field,
    original_value: originalValue,
    corrected_value: correctedValue,
    reason,
    applied: false,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Apply a correction
 */
export function applyCorrection(correction: Correction): Correction {
  return {
    ...correction,
    applied: true,
  };
}

/**
 * Generate correction log
 */
export function generateCorrectionLog(corrections: Correction[]): CorrectionLog {
  const appliedCount = corrections.filter(c => c.applied).length;
  const pendingCount = corrections.filter(c => !c.applied).length;

  return {
    timestamp: new Date().toISOString(),
    total_corrections: corrections.length,
    applied_corrections: appliedCount,
    pending_corrections: pendingCount,
    corrections,
  };
}

/**
 * Save correction log
 */
export function saveCorrectionLog(log: CorrectionLog, filePath: string): void {
  fs.writeFileSync(filePath, JSON.stringify(log, null, 2));
  console.log(`✅ Correction log saved to: ${filePath}`);
}

/**
 * Load correction log
 */
export function loadCorrectionLog(filePath: string): CorrectionLog {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as CorrectionLog;
}

/**
 * Get corrections for a specific client
 */
export function getClientCorrections(corrections: Correction[], clientId: string): Correction[] {
  return corrections.filter(c => c.client_id === clientId);
}

/**
 * Get corrections for a specific method
 */
export function getMethodCorrections(corrections: Correction[], clientId: string, methodName: string): Correction[] {
  return corrections.filter(c => c.client_id === clientId && c.method_name === methodName);
}

/**
 * Get pending corrections
 */
export function getPendingCorrections(corrections: Correction[]): Correction[] {
  return corrections.filter(c => !c.applied);
}

/**
 * Get applied corrections
 */
export function getAppliedCorrections(corrections: Correction[]): Correction[] {
  return corrections.filter(c => c.applied);
}

/**
 * Generate correction summary
 */
export function generateCorrectionSummary(log: CorrectionLog): string {
  let summary = '# Extraction Corrections Summary\n\n';
  summary += `Generated: ${log.timestamp}\n\n`;
  summary += `## Statistics\n`;
  summary += `- Total Corrections: ${log.total_corrections}\n`;
  summary += `- Applied: ${log.applied_corrections}\n`;
  summary += `- Pending: ${log.pending_corrections}\n\n`;

  // Group by client
  const byClient: Record<string, Correction[]> = {};
  for (const correction of log.corrections) {
    if (!byClient[correction.client_id]) {
      byClient[correction.client_id] = [];
    }
    byClient[correction.client_id].push(correction);
  }

  summary += `## Corrections by Client\n\n`;
  for (const [clientId, corrections] of Object.entries(byClient)) {
    summary += `### ${clientId}\n`;
    summary += `- Total: ${corrections.length}\n`;
    summary += `- Applied: ${corrections.filter(c => c.applied).length}\n`;
    summary += `- Pending: ${corrections.filter(c => !c.applied).length}\n\n`;

    for (const correction of corrections) {
      summary += `#### ${correction.method_name} (${correction.field})\n`;
      summary += `- Original: \`${correction.original_value}\`\n`;
      summary += `- Corrected: \`${correction.corrected_value}\`\n`;
      summary += `- Reason: ${correction.reason}\n`;
      summary += `- Status: ${correction.applied ? '✅ Applied' : '⏳ Pending'}\n\n`;
    }
  }

  return summary;
}

/**
 * Export corrections for review
 */
export function exportCorrectionsForReview(log: CorrectionLog): string {
  let report = '# Corrections for Review\n\n';
  
  const pending = log.corrections.filter(c => !c.applied);
  if (pending.length === 0) {
    report += 'No pending corrections.\n';
    return report;
  }

  report += `## Pending Corrections (${pending.length})\n\n`;
  for (const correction of pending) {
    report += `### ${correction.client_id} - ${correction.method_name}\n`;
    report += `**Field**: ${correction.field}\n`;
    report += `**Original**: \`${correction.original_value}\`\n`;
    report += `**Proposed**: \`${correction.corrected_value}\`\n`;
    report += `**Reason**: ${correction.reason}\n\n`;
  }

  return report;
}

