---
Title: Database actions requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Database action requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: actions
weight: $weight
url: '/operate/rs/7.8/references/rest-api/requests/bdbs/actions/'
---

## Backup

| Method | Path | Description |
|--------|------|-------------|
| [PUT](./backup_reset_status.md#put-bdbs-actions-backup-reset-status) | `/v1/bdbs/{uid}/actions/backup_reset_status` | Reset database backup status |

## Export

| Method | Path | Description |
|--------|------|-------------|
| [PUT](./export_reset_status.md#put-bdbs-actions-export-reset-status) | `/v1/bdbs/{uid}/actions/export_reset_status` | Reset database export status |
| [POST](./export.md#post-bdbs-actions-export) | `/v1/bdbs/{uid}/actions/export` | Initiate database export |

## Import

| Method | Path | Description |
|--------|------|-------------|
| [PUT](./import_reset_status.md#put-bdbs-actions-import-reset-status) | `/v1/bdbs/{uid}/actions/import_reset_status` | Reset database import status |
| [POST](./import.md#post-bdbs-actions-import) | `/v1/bdbs/{uid}/actions/import` | Initiate manual dataset import |

## Optimize shards placement

| Method | Path | Description |
|--------|------|-------------|
| [GET](./optimize_shards_placement.md#get-bdbs-actions-optimize-shards-placement) | `/v1/bdbs/{uid}/actions/optimize_shards_placement` | Get optimized shards placement for a database  |

## Rebalance

| Method | Path | Description |
|--------|------|-------------|
| [PUT](/content/operate/rs/7.8/references/rest-api/requests/bdbs/actions/rebalance.md#put-bdbs-actions-rebalance) | `/v1/bdbs/{uid}/actions/rebalance` | Rebalance database shards |

## Recover

| Method | Path | Description |
|--------|------|-------------|
| [GET](/content/operate/rs/7.8/references/rest-api/requests/bdbs/actions/recover.md#get-bdbs-actions-recover) | `/v1/bdbs/{uid}/actions/recover` | Get database recovery plan  |
| [POST](/content/operate/rs/7.8/references/rest-api/requests/bdbs/actions/recover.md#post-bdbs-actions-recover) | `/v1/bdbs/{uid}/actions/recover` | Recover database  |

## Resume traffic
| Method | Path | Description |
|--------|------|-------------|
| [POST](/content/operate/rs/7.8/references/rest-api/requests/bdbs/actions/resume_traffic.md#post-bdbs-actions-resume-traffic) | `/v1/bdbs/{uid}/actions/resume_traffic` | Resume database traffic |

## Stop traffic
| Method | Path | Description |
|--------|------|-------------|
| [POST](/content/operate/rs/7.8/references/rest-api/requests/bdbs/actions/stop_traffic.md#post-bdbs-actions-stop-traffic) | `/v1/bdbs/{uid}/actions/stop_traffic` | Stop database traffic |
