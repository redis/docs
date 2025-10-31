---
Title: Node checks job settings object
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the node_checks_job_settings object used with Redis Enterprise
  Software REST API calls.
linkTitle: node_checks_job_settings
weight: $weight
url: '/operate/rs/7.22/references/rest-api/objects/job_scheduler/node_checks_job_settings/'
---

| Name | Type/Value | Description |
|------|------------|-------------|
| cron_expression | string | [CRON expression](https://en.wikipedia.org/wiki/Cron#CRON_expression) that defines the node checks schedule |
| enabled | boolean (default: true) | Indicates whether this job is enabled |
