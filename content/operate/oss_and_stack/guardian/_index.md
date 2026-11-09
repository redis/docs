---
categories:
- docs
- operate
- stack
- oss
description: Protect Redis Open Source against known vulnerabilities with live rule updates, without upgrading Redis.
linkTitle: Guardian Community
title: Guardian Community
weight: 65
---

Guardian Community protects Redis Open Source against known vulnerabilities while you plan a
Redis upgrade. It's a Redis module that checks each command against protection rules and blocks
or monitors the requests that match. Redis publishes new rules as signed releases, and Guardian
applies them live, without a Redis restart or version change.

Guardian Community filters commands. It doesn't change Redis code, and it isn't a replacement
for upgrading to a fixed Redis version.

## How Guardian works

- **One module per node.** You load the Guardian module into every Redis node, including
  replicas. Each node polls the registry and enforces rules on its own.
- **Signed, complete releases.** A release is a complete set of rules, signed by Redis. Guardian
  verifies the signature, selects the rules for the node's Redis version, and activates them
  together. A failed update leaves the previous release in place.
- **Rules apply only where they match.** A rule is active only when the node's Redis version,
  commands, and other required facts match the vulnerability it targets. On a fixed Redis
  version, the matching rules stay loaded but inactive.
- **A private state directory.** Guardian keeps accepted releases, local Lua approvals, and its
  installation identity in a directory that only the Redis user can read. At startup, Guardian
  revalidates the cached release and restores protection even when the registry is unreachable.
- **Application access control lists (ACLs) stay in charge.** Guardian adds a small set of
  internal permissions to your application users. Their original command and key restrictions
  still apply.

## Supported platforms

<!-- TODO: Confirm the published support statement for Redis versions and base images before release. -->

| Platform | Support |
|---|---|
| Operating system | Linux with glibc on x86-64 (`amd64`) or AArch64 (`arm64`) |
| Qualified hosts | Ubuntu 24.04 with its distribution Redis, and the official Redis Docker image |
| Redis versions | Redis 6.2, 7.2, and 8.2 and later are tested. Redis 6.2 receives a smaller set of rules. |

Builds earlier than Redis 6.2, musl-based systems, and macOS aren't supported.

## Limits

- **Protection depends on each rule.** A rule covers the command paths it names. It doesn't
  cover loading a Redis Database (RDB) or append-only file (AOF) at startup, replication
  loading, offline tools, or an exploit that
  already happened.
- **Rule counts aren't coverage.** The number of active rules shows what's enforced on a node.
  It doesn't prove protection for every vulnerability or command path.
- **Redis 6.2 has a smaller set of rules.** Redis 6.2 lacks the module interfaces that some
  rules need, so those rules aren't sent to Redis 6.2 nodes. Lua approvals aren't available on
  Redis 6.2.
- **Every node needs its own setup.** Module configuration, ACL grants, and the state directory
  are local to each node. New and replacement nodes need the same setup.
- **Some rules can block legitimate requests.** Conservative Lua checks can refuse application
  scripts that are safe. See
  [Approve a Lua script or function](/content/operate/oss_and_stack/guardian/manage.md#approve-a-lua-script-or-function).

## Get started

- [Install Guardian Community](/content/operate/oss_and_stack/guardian/install.md)
- [Manage Guardian Community](/content/operate/oss_and_stack/guardian/manage.md)
- [Guardian telemetry](/content/operate/oss_and_stack/guardian/telemetry.md)
- [Guardian reference](/content/operate/oss_and_stack/guardian/reference.md)
- [Guardian and your application](/content/develop/using-commands/guardian.md), for application
  developers
