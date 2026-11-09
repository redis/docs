---
categories:
- docs
- operate
- stack
- oss
description: What Guardian Community reports to Redis, what it never reports, and how to turn reporting off.
linkTitle: Telemetry
title: Guardian telemetry
weight: 30
---

<!-- TODO: Confirm whether this page needs privacy or legal review before release. -->

Guardian Community sends Redis a small usage report from each node. Telemetry is on by default,
and you can turn it off with `telemetry=no` without losing protection updates.

## What's reported

Each node sends a heartbeat about every 15 minutes by default. The receiving service can change
the interval to anywhere from 1 to 60 minutes. A heartbeat contains:

- **Guardian:** the module version, profile, and rule counts.
- **Redis:** the Redis version, mode, replication role, connected replica count, and replication
  link state.
- **Release:** whether a release is pending or committed, and which releases are accepted and
  active.
- **Topology:** the node's own cluster node ID, and a bounded list of known peers with their IDs,
  primaries, roles, and health.
- **Replication history:** the node's replication IDs and offsets, as Redis reports them in
  `INFO replication`.

Facts that Guardian can't read are reported as unknown.

## What's never reported

Reports never contain keys, values, command arguments, credentials, hostnames, IP addresses, or
complete `INFO` output.

The network that receives a report can still see the source IP address of the connection.

## Identities in a report

- **Installation ID.** Each node has a random, persistent installation universally unique
  identifier (UUID), saved in its state directory. It identifies the node, not a customer or
  organization.
- **Boot ID.** A new random ID for each Redis process start.

When telemetry is on, rule download requests also carry the installation ID as a label. Download
requests never carry a reporting credential.

## Turn off telemetry

Add `telemetry=no` to the module arguments, in both the `MODULE LOAD` command and the startup
`loadmodule` line:

```text
loadmodule /usr/lib/guardian/guardian-community.so registry-url=<registry-url> registry-key=<key-id>:<base64url-public-key> registry-state-dir=/var/lib/redis/guardian telemetry=no
```

You can't change the setting while the module is loaded. Set it when the module loads.

With telemetry off, Guardian collects nothing, sends no registration or heartbeat, and doesn't
label download requests. Rule downloads, signature checks, activation, and offline restore
work the same. `HOTPATCH.STATUS` shows `telemetry=off`.

Turning off telemetry doesn't hide downloads. The registry's servers can still log ordinary
anonymous download requests.
