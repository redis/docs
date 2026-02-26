---
Title: Query performance factor object
alwaysopen: false
categories:
- docs
- operate
- rs
description: Configuration object for query performance factor
linkTitle: query_performance_factor
weight: $weight
---

Configures [query performance factor]({{<relref "/operate/oss_and_stack/stack-with-enterprise/search/query-performance-factor">}}) and related fields.

| Field | Type/Value | Description |
|-------|------------|-------------|
| active | boolean (default: false) | If true, enables query performance factor for the database |
| scaling_factor | integer (range: 0-16) (default: 0) | Scales the magnitude of the query performance factor |

