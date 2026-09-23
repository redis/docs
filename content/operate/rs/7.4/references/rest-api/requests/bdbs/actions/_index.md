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
url: '/operate/rs/7.4/references/rest-api/requests/bdbs/actions/'
---

## Backup

| Method | Path | Description |
|--------|------|-------------|
| [PUT](./backup_reset_status#put-bdbs-actions-backup-reset-status) | `/v1/bdbs/{uid}/actions/backup_reset_status` | Reset database backup status |

## Export

| Method | Path | Description |
|--------|------|-------------|
| [PUT](./export_reset_status#put-bdbs-actions-export-reset-status) | `/v1/bdbs/{uid}/actions/export_reset_status` | Reset database export status |
| [POST](./export#post-bdbs-actions-export) | `/v1/bdbs/{uid}/actions/export` | Initiate database export |

## Import

| Method | Path | Description |
|--------|------|-------------|
| [PUT](./import_reset_status#put-bdbs-actions-import-reset-status) | `/v1/bdbs/{uid}/actions/import_reset_status` | Reset database import status |
| [POST](./import#post-bdbs-actions-import) | `/v1/bdbs/{uid}/actions/import` | Initiate manual dataset import |

## Optimize shards placement

| Method | Path | Description |
|--------|------|-------------|
| [GET](./optimize_shards_placement#get-bdbs-actions-optimize-shards-placement) | `/v1/bdbs/{uid}/actions/optimize_shards_placement` | Get optimized shards placement for a database  |

## Recover

| Method | Path | Description |
|--------|------|-------------|
| [GET](/content/operate/rs/7.4/references/rest-api/requests/bdbs/actions/recover.md#get-bdbs-actions-recover) | `/v1/bdbs/{uid}/actions/recover` | Get database recovery plan  |
| [POST](/content/operate/rs/7.4/references/rest-api/requests/bdbs/actions/recover.md#post-bdbs-actions-recover) | `/v1/bdbs/{uid}/actions/recover` | Recover database  |
