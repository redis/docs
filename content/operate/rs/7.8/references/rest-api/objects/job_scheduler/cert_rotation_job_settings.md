---
Title: Certificate rotation job settings object
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the cert_rotation_job_settings object used with Redis Enterprise
  Software REST API calls.
linkTitle: cert_rotation_job_settings
weight: $weight
url: '/operate/rs/7.8/references/rest-api/objects/job_scheduler/cert_rotation_job_settings/'
---

| Name | Type/Value | Description |
|------|------------|-------------|
| cron_expression              | string | [CRON expression](https://en.wikipedia.org/wiki/Cron#CRON_expression) that defines the certificate rotation schedule |
| expiry_days_before_rotation  | integer, (range:&nbsp;1-90) (default:&nbsp;60) | Number of days before a certificate expires before rotation |
