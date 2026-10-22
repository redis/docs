---
alwaysopen: false
categories:
- docs
- operate
- iris
description: Check health, rotate credentials, watch the Gateway database, back up, and upgrade Context Gateway.
linkTitle: Operations
weight: 90
hideListLinks: true
---

## Check service health

Both planes serve `/v1/health/live` and `/v1/health/ready` without a credential. Readiness answers `503` while a token source cannot be read or is empty, or the license is not valid. The response does not name the failed check.

*Port-forward and curl commands for both planes.*

## Rotate credentials

| Credential | How to rotate |
| --- | --- |
| Upstream credential | Update the Upstream with a new value. After an in-place rotation in Vault or AWS Secrets Manager, refresh the Upstream's catalog so cached results stop being served. |
| Agent key | Rotate or revoke it through the Identity Service. A revoked key stops working within 300 seconds by default. |
| Admin, internal, or runtime token | Replace the Secret and restart the plane that reads it. Update the matching Identity Service value for the internal and runtime tokens. |
| Encrypted Redis keyring | Add a new key file, make it the active key for new writes, then remove the old key after credentials are rewritten. |

<!-- TODO: Confirm the keyring rotation procedure. -->

## Watch the Gateway database

When result handles are on, alert on `context_gateway_result_handles_creates_total{outcome="out_of_memory"}`. It means the Gateway database refused a handle write and the agent received the whole result. Raise `maxmemory`, shorten the handle lifetime, or move handles to a dedicated database.

Above 90 percent of `maxmemory`, the Data Plane pauses handle creation and counts `skipped_low_memory`. Creation resumes when the database has room.

## Update configuration and license Secrets

Replace the Secret, then roll out both planes. Set `checksum` on a file reference to trigger the rollout automatically.

## Back up the deployment

Back up metadata Redis and credential storage together. A Gateway record without its credentials cannot call its Upstreams.

<!-- TODO: Confirm supported backup and restore guarantees. -->

## Upgrade the chart

Upgrade both planes together and roll forward, not back. An older Data Plane cannot read tool policy members that a newer Control Plane wrote, and serves those tools uncached.

After an upgrade, refresh an Upstream's catalog when the release notes ask for it.

*`helm upgrade` command pinned to the new chart version.*
