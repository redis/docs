---
Title: Log rotation job settings object
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the log_rotation_job_settings object used with Redis Enterprise
  Software REST API calls.
linkTitle: log_rotation_job_settings
weight: $weight
url: '/operate/rs/7.22/references/rest-api/objects/job_scheduler/log_rotation_job_settings/'
---

| Name | Type/Value | Description |
|------|------------|-------------|
| cron_expression | string | [CRON expression](https://en.wikipedia.org/wiki/Cron#CRON_expression) that defines the log rotation schedule |
| enabled | boolean (default: true) | Indicates whether this job is enabled |
