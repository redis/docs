---
categories:
- docs
- operate
- stack
- oss
description: Check Guardian status, approve Lua code that a rule blocks, choose a registry, and upgrade the Guardian module.
linkTitle: Manage
title: Manage Guardian Community
weight: 20
---

After installation, Guardian updates its rules without your help. You check its status, approve
Lua code that a rule blocks, and upgrade the module itself when a new version ships.

## Check status and rules

Run `HOTPATCH.STATUS` on each node. Check every node: a peer that appears in cluster or
replication details isn't proof that Guardian is installed on that peer.

```sh
redis-cli HOTPATCH.STATUS
```

The reply is one line of `name=value` fields. These fields answer the usual questions:

| Field | What it tells you |
|---|---|
| `ready` | Has a value of `1` when the module is ready |
| `release_state` | Whether a release is `committed`, `pending`, or `none` |
| `release_sequence`, `release_id` | Which release is active |
| `signed_rules_loaded`, `signed_rules_active` | How many rules are loaded, and how many apply to this node |
| `registry_stale`, `registry_freshness_age_seconds` | Whether the node has checked the registry recently. See `registry-max-staleness-seconds` in [Module arguments](/content/operate/oss_and_stack/guardian/reference.md#module-arguments). |
| `registry_error` | The most recent delivery error, or `none` |
| `registry_signature_verification` | `required` for signed registries, `disabled` for an unsigned registry |
| `telemetry`, `telemetry_status` | Whether reporting is `on` or `off`, and its health |

Reported failures never stop rule downloads or activation.

To list the loaded rules, including inactive ones, run `HOTPATCH.RULES`. To see one rule, pass its
ID:

```sh
redis-cli HOTPATCH.RULES <rule-id>
```

The reply includes the rule's advisory and CVE (Common Vulnerabilities and Exposures) IDs,
severity, action, whether it's active, its impact message, and its block and monitor counters.
Counters reset when a new release is committed and when Redis restarts.

When a rule blocks a request, the client receives an error that names the rule and the reason:

```text
ERR blocked by signed Redis hotpatch policy rule=<rule-id> reason=<reason>
```

Look up that rule ID with `HOTPATCH.RULES` to see the rule's impact message. The error never
repeats the application's command arguments.

## Approve a Lua script or function

Guardian's Lua checks are conservative and can refuse legitimate application code. On Redis 7 and
later, you can approve exact script or function library code for one rule. The approval waives
only that rule's check. Redis access control lists (ACLs) and every other Guardian rule still apply. Approvals aren't
available on Redis 6.2.

Before you start, make sure the operator account has `+hotpatch.lua.allow`,
`+hotpatch.lua.list`, and `+hotpatch.lua.remove`. Application grants don't include them.

1. Find the rule ID in the denial error, and inspect the rule:

   ```sh
   redis-cli HOTPATCH.RULES <rule-id>
   ```

   The rule's `local_lua_scope` must be nonempty. If it's empty, you can't approve code for this
   rule.
1. Review the script and the rule's impact message. An approval is a decision that this code is
   safe. Guardian doesn't check that for you.
1. Approve the code. For a function, pass the complete library source file:

   ```sh
   guardian-lua --host <host> --port <port> \
     allow --rule <rule-id> --file <reviewed-script.lua> \
     --min-keys <n> --max-keys <n> --min-args <n> --max-args <n>
   ```

   The key and argument bounds limit how the approved code can be called. Without them, any count
   from 0 to 1048576 is allowed. The command prints the code's SHA-256 digest once the approval is
   saved.
1. List approvals to confirm:

   ```sh
   guardian-lua --host <host> --port <port> list
   ```

   The output is JSON with the rule, code digests, bounds, and an `active` flag.
1. Repeat on every node that runs this code.

To revoke an approval, pass the digest that `allow` printed:

```sh
guardian-lua --host <host> --port <port> remove --rule <rule-id> --sha256 <digest>
```

Approvals are saved in the state directory and survive restarts and new releases that keep the
same rule. Changed code needs a new approval. If a release changes or removes the rule, its
approvals go dormant (`active` is `0`); review the rule before you approve the code again. Each
node holds up to 256 approvals.

You can also use the Redis commands directly: `HOTPATCH.LUA.ALLOW`, `HOTPATCH.LUA.LIST`, and
`HOTPATCH.LUA.REMOVE`. See [Commands](/content/operate/oss_and_stack/guardian/reference.md#commands).

## Use a mirror or your own registry

By default, nodes download signed releases from the registry you configured at installation. You
can serve the same releases from your own HTTPS mirror, or run an unsigned registry with rules you
edit yourself.

### Use a signed mirror

A mirror serves copies of the signed release files. Signatures, not the mirror, authorize the
content, so the mirror doesn't need a signing key.

1. Set `registry-url` to the mirror URL.
1. Keep `registry-key` set to the original public signing key.
1. If the mirror uses a private certificate authority, add `registry-ca-file=<absolute-path-to-ca.pem>`.

<!-- TODO: Document how to copy signed releases to a mirror once the export tool ships to customers. -->

### Use an unsigned registry

An unsigned registry lets you edit rules yourself. For example, you can remove a rule, or change
its action from `block` to `monitor` to observe matching requests while allowing them.

<!-- TODO: The tool that builds and publishes unsigned releases isn't in the package. Document how customers get it before release. -->

1. Use a separate state directory for the unsigned registry. Signed and unsigned registries can't
   share a state directory.
1. Load the module with `registry-verify-signatures=no` and `registry-access=public`, and leave
   out `registry-key`:

   ```text
   loadmodule /usr/lib/guardian/guardian-community.so registry-url=<your-registry-url> registry-verify-signatures=no registry-access=public registry-state-dir=<separate-state-dir>
   ```

1. Run `HOTPATCH.STATUS` and confirm `registry_signature_verification=disabled`.

The node still checks rule schemas, file hashes, release sequence, and HTTPS certificates. It
doesn't authenticate the publisher. Denials from an unsigned registry read
`blocked by customer Redis hotpatch policy`.

Every release is a complete set of rules. Publish each change as a new release with a higher
sequence, and include every rule you want to keep: a rule you leave out is withdrawn. Don't edit
a published release in place.

## Upgrade the Guardian module

New rules don't need a module upgrade. Upgrade the module only when a new Guardian Community
version ships. `guardian-upgrade` replaces the module on a running primary node without
restarting Redis or reloading the dataset.

The upgrade affects clients:

- The client that requested the upgrade remains connected. All other clients, including replicas, are disconnected and must reconnect.
- Queued transactions, Pub/Sub subscriptions, and other per-connection state are lost.
- Protection is off between unloading the old module and activating the new one.

Schedule a maintenance window, and make sure clients reconnect and retry.

### Before you upgrade

1. Install the new module at a different absolute path from the current one. Don't overwrite or
   delete the current module file: `guardian-upgrade` uses it to roll back.
1. Keep the startup configuration pointing at the current module until the upgrade succeeds.
1. On Redis 8 and later, make sure application ACLs use `+@guardian-execution` rather than exact
   `+hotpatch.*` command names. Run `guardian-preflight` to get the current grants.
1. On Redis 7, `guardian-upgrade` refuses to run if any ACL names an exact `HOTPATCH.*` command.
   Redis 7 has no `@guardian-execution` category, so restricted application users need those
   names. Upgrade those nodes with a controlled restart instead.
1. Find the new build's `source_revision` in its `/usr/share/guardian-community/build-info.json`.

### Run the upgrade

1. Run `guardian-upgrade` on the primary node. On Redis 7 and later, it reads the current module
   path and arguments from `MODULE LIST`:

   ```sh
   guardian-upgrade --host <host> --port <port> \
     --module <absolute-path-to-new-module> \
     --expect-build <source-revision> \
     --acknowledge-client-disconnects
   ```

   On Redis 6.2, also pass the current module path and every original module argument, in
   their original order:

   ```sh
   guardian-upgrade --host <host> --port <port> \
     --module <absolute-path-to-new-module> \
     --expect-build <source-revision> \
     --old-module <absolute-path-to-current-module> \
     --module-arg registry-url=<registry-url> \
     --module-arg registry-key=<key-id>:<base64url-public-key> \
     --module-arg registry-state-dir=/var/lib/redis/guardian \
     --module-arg registry-access=public \
     --acknowledge-client-disconnects
   ```

1. Wait for `GUARDIAN COMMUNITY UPGRADE: PASS`. If the new module fails to load, the tool
   reloads the current one.
1. Update the `loadmodule` path in the startup configuration to the new module.
1. Restart one test node through your normal deployment process, and run
   `guardian-preflight --require-active-rules`.
1. Keep the old module file until your rollback window ends.

Until you update the startup configuration, an unexpected restart loads the old module.

`guardian-upgrade` refuses to run on replicas. Upgrade a replica by replacing its process with a
controlled restart, or promote it to primary and then upgrade it.
