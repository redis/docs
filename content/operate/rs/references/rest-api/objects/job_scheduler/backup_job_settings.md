---
Title: Backup job settings object
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the backup_job_settings object used with Redis Enterprise Software
  REST API calls.
linkTitle: backup_job_settings
weight: $weight
---

| Name | Type/Value | Description |
|------|------------|-------------|
| cron_expression | string | [CRON expression](https://en.wikipedia.org/wiki/Cron#CRON_expression) that defines the backup schedule |
| enabled | boolean (default: true) | Indicates whether this job is enabled |
