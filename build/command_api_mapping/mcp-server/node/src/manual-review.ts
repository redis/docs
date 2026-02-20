/**
 * Manual Review Process
 * 
 * Samples and verifies extraction accuracy for each client.
 * Generates review checklist and tracks issues found.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

export interface ReviewSample {
  method_name: string;
  signature: string;
  has_docs: boolean;
  doc_quality: 'excellent' | 'good' | 'fair' | 'poor' | 'missing';
  issues: string[];
  verified: boolean;
  reviewer_notes?: string;
}

export interface ClientReview {
  client_id: string;
  client_name: string;
  language: string;
  total_methods: number;
  sample_size: number;
  samples: ReviewSample[];
  issues_found: number;
  quality_score: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ReviewReport {
  timestamp: string;
  total_clients: number;
  clients_reviewed: number;
  reviews: ClientReview[];
  summary: {
    total_methods_sampled: number;
    total_issues_found: number;
    average_quality_score: number;
    clients_with_issues: number;
  };
}

/**
 * Create a review template for a client
 */
export function createReviewTemplate(
  clientId: string,
  clientName: string,
  language: string,
  totalMethods: number
): ClientReview {
  const sampleSize = Math.min(Math.max(10, Math.ceil(totalMethods * 0.1)), 20);
  
  return {
    client_id: clientId,
    client_name: clientName,
    language,
    total_methods: totalMethods,
    sample_size: sampleSize,
    samples: [],
    issues_found: 0,
    quality_score: 0,
    status: 'pending',
  };
}

/**
 * Add a sample to review
 */
export function addReviewSample(
  review: ClientReview,
  sample: ReviewSample
): void {
  review.samples.push(sample);
  if (sample.issues.length > 0) {
    review.issues_found += sample.issues.length;
  }
}

/**
 * Calculate quality score for a review
 */
export function calculateQualityScore(review: ClientReview): number {
  if (review.samples.length === 0) return 0;

  const qualityMap = {
    excellent: 100,
    good: 80,
    fair: 60,
    poor: 30,
    missing: 0,
  };

  const totalScore = review.samples.reduce((sum, sample) => {
    return sum + qualityMap[sample.doc_quality];
  }, 0);

  return Math.round(totalScore / review.samples.length);
}

/**
 * Generate review report
 */
export function generateReviewReport(reviews: ClientReview[]): ReviewReport {
  const completedReviews = reviews.filter(r => r.status === 'completed');
  
  const totalMethodsSampled = reviews.reduce((sum, r) => sum + r.samples.length, 0);
  const totalIssuesFound = reviews.reduce((sum, r) => sum + r.issues_found, 0);
  const averageQualityScore = completedReviews.length > 0
    ? Math.round(completedReviews.reduce((sum, r) => sum + r.quality_score, 0) / completedReviews.length)
    : 0;
  const clientsWithIssues = reviews.filter(r => r.issues_found > 0).length;

  return {
    timestamp: new Date().toISOString(),
    total_clients: reviews.length,
    clients_reviewed: completedReviews.length,
    reviews,
    summary: {
      total_methods_sampled: totalMethodsSampled,
      total_issues_found: totalIssuesFound,
      average_quality_score: averageQualityScore,
      clients_with_issues: clientsWithIssues,
    },
  };
}

/**
 * Save review report to file
 */
export function saveReviewReport(report: ReviewReport, outputPath: string): void {
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`✅ Review report saved to: ${outputPath}`);
}

/**
 * Load review report from file
 */
export function loadReviewReport(filePath: string): ReviewReport {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as ReviewReport;
}

/**
 * Generate review checklist for manual review
 */
export function generateReviewChecklist(reviews: ClientReview[]): string {
  let checklist = '# Manual Review Checklist\n\n';
  checklist += `Generated: ${new Date().toISOString()}\n\n`;

  for (const review of reviews) {
    checklist += `## ${review.client_name} (${review.language})\n`;
    checklist += `- [ ] Review ${review.sample_size} samples\n`;
    checklist += `- [ ] Verify signature extraction accuracy\n`;
    checklist += `- [ ] Check documentation quality\n`;
    checklist += `- [ ] Document any issues found\n`;
    checklist += `- [ ] Verify quality score\n\n`;

    for (let i = 0; i < review.sample_size; i++) {
      checklist += `### Sample ${i + 1}\n`;
      checklist += `- [ ] Method name correct\n`;
      checklist += `- [ ] Signature accurate\n`;
      checklist += `- [ ] Documentation present\n`;
      checklist += `- [ ] Documentation quality acceptable\n\n`;
    }
  }

  return checklist;
}

/**
 * Export review data for analysis
 */
export function exportReviewData(report: ReviewReport, format: 'json' | 'csv' = 'json'): string {
  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }

  // CSV format
  let csv = 'Client,Language,Total Methods,Sample Size,Issues Found,Quality Score,Status\n';
  for (const review of report.reviews) {
    csv += `"${review.client_name}","${review.language}",${review.total_methods},${review.sample_size},${review.issues_found},${review.quality_score},"${review.status}"\n`;
  }
  return csv;
}

