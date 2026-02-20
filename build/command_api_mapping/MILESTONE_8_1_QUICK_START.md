# Milestone 8.1 Quick Start Guide

## Running the Tests

```bash
cd mcp-server/node
npm run test-scaling-tools
```

Expected output: **16/16 tests passed ✅**

## Using the Modules

### 1. Client Quirks

```typescript
import { getClientQuirks, getAllQuirks, getQuirksByLanguage } from './client-quirks.js';

// Get quirks for a specific client
const quirks = getClientQuirks('redis_py');
console.log(quirks.quirks.naming_conventions);

// Get all quirks
const allQuirks = getAllQuirks();

// Get quirks by language
const pythonClients = getQuirksByLanguage('Python');
```

### 2. Manual Review

```typescript
import { createReviewTemplate, calculateQualityScore, generateReviewReport } from './manual-review.ts';

// Create a review template
const review = createReviewTemplate('redis_py', 'redis-py', 'Python', 100);

// Add samples
review.samples.push({
  method_name: 'get',
  signature: 'def get(key)',
  has_docs: true,
  doc_quality: 'excellent',
  issues: [],
  verified: true
});

// Calculate quality score
const score = calculateQualityScore(review);

// Generate report
const report = generateReviewReport([review]);
```

### 3. Corrections

```typescript
import { createCorrection, applyCorrection, generateCorrectionLog } from './corrections.ts';

// Create a correction
const correction = createCorrection(
  'redis_py',
  'get',
  'signature',
  'def get(key)',
  'def get(key: str) -> Any',
  'Added type hints'
);

// Apply the correction
const applied = applyCorrection(correction);

// Generate log
const log = generateCorrectionLog([applied]);
```

### 4. Final Mapping

```typescript
import { createInitialMapping, createClientMapping, calculateStatistics, saveMappingToFile } from './final-mapping-generator.ts';

// Create mapping
const mapping = createInitialMapping();

// Add clients
const clientMapping = createClientMapping('redis_py', 'redis-py', 'Python');
mapping.clients.push(clientMapping);

// Calculate statistics
calculateStatistics(mapping);

// Save to file
saveMappingToFile(mapping, 'commands_api_mapping.json');
```

### 5. Quality Report

```typescript
import { createClientQualityMetrics, generateQualityReport, generateQualityReportMarkdown } from './quality-report-generator.ts';

// Create metrics
const metrics = createClientQualityMetrics('redis_py', 'redis-py', 'Python');
metrics.metrics.overall_quality = 90;

// Generate report
const report = generateQualityReport([metrics]);

// Generate markdown
const markdown = generateQualityReportMarkdown(report);
console.log(markdown);
```

## Extraction Script

```bash
cd mcp-server/node
npm run extract-all-clients
```

This will:
1. Load all 14 clients
2. Extract signatures and docs
3. Aggregate results
4. Generate `extraction-results.json`
5. Print summary statistics

## File Locations

```
mcp-server/node/src/
├── extract-all-clients.ts
├── client-quirks.ts
├── manual-review.ts
├── corrections.ts
├── final-mapping-generator.ts
├── quality-report-generator.ts
└── test-scaling-tools.ts
```

## Output Files

After running extraction and generation:

```
project-root/
├── extraction-results.json (extraction statistics)
├── commands_api_mapping.json (final mapping)
├── QUALITY_REPORT.md (quality metrics)
└── corrections-log.json (applied corrections)
```

## Workflow Example

```typescript
// 1. Extract from all clients
const extractionResults = await extractAllClients();

// 2. Review samples
const reviews = [];
for (const client of clients) {
  const review = createReviewTemplate(client.id, client.name, client.language, 100);
  // ... add samples and verify
  reviews.push(review);
}

// 3. Apply corrections
const corrections = [];
// ... create and apply corrections

// 4. Generate final mapping
const mapping = createInitialMapping();
// ... add clients and methods
calculateStatistics(mapping);
saveMappingToFile(mapping, 'commands_api_mapping.json');

// 5. Generate quality report
const metrics = reviews.map(r => createClientQualityMetrics(...));
const report = generateQualityReport(metrics);
const markdown = generateQualityReportMarkdown(report);
```

## Supported Clients

All 14 clients are supported:

**Python**: redis-py, redis_vl
**TypeScript**: node-redis, ioredis
**Java**: jedis, lettuce_sync, lettuce_async, lettuce_reactive
**Go**: go-redis
**PHP**: php
**Rust**: redis_rs_sync, redis_rs_async
**C#**: nredisstack_sync, nredisstack_async

## Next Steps

1. Connect extraction tools to actual client repositories
2. Run extraction on sample clients
3. Perform manual review
4. Apply corrections
5. Generate final mapping
6. Create quality report

---

**For detailed documentation**: See MILESTONE_8_1_IMPLEMENTATION.md
**For architecture details**: See MILESTONE_8_1_ARCHITECTURE.md

