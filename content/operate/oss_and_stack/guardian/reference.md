---
categories:
- docs
- operate
- stack
- oss
description: Module arguments, commands, command-line tools, and installed files for Guardian Community.
linkTitle: Reference
title: Guardian reference
weight: 40
---

Reference information for the Guardian Community module, its Redis commands, and its
command-line tools.

## Module arguments

Pass module arguments on the `MODULE LOAD` command or the `loadmodule` line, as `name=value`. You
can't change them while the module is loaded. Each argument can appear only once, except
`registry-key` and `registry-revoked-key`.

| Argument | Default | Description |
|---|---|---|
| `registry-url` | None (required) | HTTPS URL of the registry or mirror. Certificate and hostname checks are always on. |
| `registry-key` | None (required with signature checks) | Public signing key, as `<key-id>:<base64url-public-key>`. Repeat to trust more than one key. |
| `registry-revoked-key` | None | Key ID to stop trusting. Repeat for more than one key. |
| `registry-state-dir` | None (required) | Private directory for Guardian state. It must be owned by the Redis user with mode `0700`, and it must persist across restarts. |
| `registry-access` | `public` | Registry access mode. Use `public`. An unsigned registry requires `public`. |
| `registry-ca-file` | System certificate authorities | Absolute path to a certificate authority (CA) file, for a registry or mirror that uses a private CA. |
| `registry-verify-signatures` | `yes` | `yes` or `no`. Set `no` only for an [unsigned registry](/content/operate/oss_and_stack/guardian/manage.md#use-an-unsigned-registry), and leave out `registry-key`. |
| `registry-poll-seconds` | `60` | How often to check the registry for a new release, from `1` to `86400` seconds. |
| `registry-max-staleness-seconds` | `0` (off) | When the last successful registry check is older than this, `HOTPATCH.STATUS` reports `registry_stale=yes`. It's a warning only: protection stays active. |
| `telemetry` | `yes` | `yes` or `no`. See [Guardian telemetry](/content/operate/oss_and_stack/guardian/telemetry.md). |

<!-- TODO: Confirm whether registry-access=enrolled is a supported Community value. -->

## Commands

| Command | Description |
|---|---|
| `HOTPATCH.STATUS` | Reports module readiness, release state, rule counts, registry freshness and errors, and telemetry state. |
| `HOTPATCH.RULES [<rule-id>]` | Lists the loaded rules, including inactive ones, or shows one rule. |
| `HOTPATCH.LUA.ALLOW <rule-id> <source> [<min-keys> <max-keys> <min-args> <max-args>]` | Approves exact Lua script or function library source for one rule. Redis 7 and later only. |
| `HOTPATCH.LUA.LIST [<rule-id>]` | Lists Lua approvals, with digests, bounds, and whether each is active. |
| `HOTPATCH.LUA.REMOVE <rule-id> <sha256>` | Removes one Lua approval. Returns `1` if it removed an approval, or `0` if none matched. |

`HOTPATCH.STATUS` and `HOTPATCH.RULES` are read-only. Each command has its own Redis access
control list (ACL) permission. The `HOTPATCH.LUA.*` commands are administrative: they aren't replicated or written to
the append-only file (AOF), and application grants don't include them.

`HOTPATCH.RULES <rule-id>` returns these fields:

| Field | Description |
|---|---|
| `id` | Rule ID |
| `advisories` | Advisory and Common Vulnerabilities and Exposures (CVE) IDs the rule addresses |
| `severity` | Rule severity |
| `action` | `block` or `monitor` |
| `active` | Whether the rule applies to this node |
| `blocks`, `monitors` | Requests the rule blocked or monitored since the release was committed or Redis started |
| `last_reason` | Reason for the rule's most recent decision |
| `message` | The rule's impact description |
| `counter_scope` | What the counters cover |
| `local_lua_scope` | Nonempty when the rule accepts Lua approvals |

### Application permissions

Application users need internal permissions so that Guardian can dispatch their commands and
return rule denials. Don't call these commands directly. Grant them with the command that
`guardian-preflight` prints.

| Redis version | Grant |
|---|---|
| Redis 8 and later | The `@guardian-execution` ACL category |
| Redis 7 | `hotpatch._blocked`, `hotpatch._rules.read`, `hotpatch._rules.write`, `hotpatch._rules.admin` |
| Redis 6.2 | `hotpatch._blocked` |

## Command-line tools

The package installs three tools. They need Python 3.8 or later, which the package installs.

### Connection options

All three tools accept these options:

| Option | Default | Description |
|---|---|---|
| `--host` | `127.0.0.1` | Redis host |
| `--port` | `6379` | Redis port |
| `--unix-socket` | None | Unix socket path, instead of host and port |
| `--user` | `default` | Operator ACL user |
| `--password-env` | `REDISCLI_AUTH` | Environment variable that holds the operator password |
| `--tls` | Off | Connect with Transport Layer Security (TLS). Certificate and hostname checks stay on. |
| `--ca-file` | None | CA certificate file for TLS |
| `--server-name` | None | Server name to verify, when it differs from `--host` |
| `--cert-file`, `--key-file` | None | Client certificate and unencrypted private key, for mutual TLS |
| `--timeout` | `5` | Per-request timeout, in seconds |

### guardian-preflight

Checks module readiness and application user permissions. It only reads Redis metadata.

| Option | Description |
|---|---|
| `--application-user <user>` | Application user to check. Required. Repeat for each user. |
| `--require-active-rules` | Fail unless a committed release has at least one active rule. |
| `--json` | Print a `guardian.community-preflight/v1` JSON report. |

In scripts, use the JSON report and the exit code. The text output can change. The JSON report
includes readiness, missing permissions for each user, the proposed grant as `grant_argv` and
`grant_command`, ACL snapshot digests, rule counts, and persistence instructions. It never
contains passwords or password hashes.

One run checks up to 64 users, and up to 128 selectors for each user.

#### Exit codes

| Exit code | Meaning |
|---|---|
| `0` | All requested checks pass for the listed users. With `--require-active-rules`, at least one rule is also active. |
| `1` | Action needed: the module is missing or not ready, permissions are missing, a user is disabled or missing, or no rule is active when one is required. |
| `2` | The check couldn't finish: for example, an authentication, permission, TLS, or connection failure. |

### guardian-upgrade

Replaces the Guardian module on a running primary node. See
[Upgrade the Guardian module](/content/operate/oss_and_stack/guardian/manage.md#upgrade-the-guardian-module).

| Option | Default | Description |
|---|---|---|
| `--module <path>` | None (required) | Absolute path to the new module, as the Redis server sees it |
| `--expect-build <revision>` | None (required) | The new build's `source_revision`. It must differ from the current build. |
| `--acknowledge-client-disconnects` | None (required) | Confirms that every other client will be disconnected |
| `--old-module <path>` | None | Absolute path to the current module. Required on Redis 6.2. |
| `--module-arg <name=value>` | None | One original module argument. On Redis 6.2, repeat for every argument, in the original order. |
| `--stop-timeout` | `20` | Request timeout while Guardian stops and the module is swapped, from `--timeout` to `30` seconds |
| `--deadline` | `60` | Overall time limit, from `--stop-timeout` to `300` seconds |
| `--json` | Off | Print the result as JSON |

The tool exits with `0` and prints `GUARDIAN COMMUNITY UPGRADE: PASS` on success. It exits with
`1` on failure.

### guardian-lua

Manages Lua approvals. See
[Approve a Lua script or function](/content/operate/oss_and_stack/guardian/manage.md#approve-a-lua-script-or-function).

| Subcommand | Options |
|---|---|
| `allow` | `--rule <rule-id>` (required), `--file <path>` (required), `--min-keys`, `--max-keys`, `--min-args`, `--max-args`. Bounds default to `0` through `1048576`. |
| `list` | `--rule <rule-id>` to show one rule's approvals |
| `remove` | `--rule <rule-id>` and `--sha256 <digest>`, both required |

## Installed files

| File | Purpose |
|---|---|
| `/usr/lib/guardian/guardian-community.so` | The Guardian Community module |
| `/usr/bin/guardian-preflight` | Read-only installation and permission checker |
| `/usr/bin/guardian-upgrade` | Module upgrade tool for primary nodes |
| `/usr/bin/guardian-lua` | Lua approval tool |
| `/usr/share/guardian-community/` | Tool implementation |
| `/usr/share/guardian-community/INSTALL.md` | Installation guide shipped with the package |
| `/usr/share/guardian-community/build-info.json` | Build record: source revision, module hash, and dependencies |
