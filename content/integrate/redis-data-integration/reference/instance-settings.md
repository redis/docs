---
Title: RDI instance settings
categories:
  - docs
  - integrate
  - rs
  - rdi
description: Change the settings of an RDI instance while it runs
group: di
linkTitle: Instance settings
summary: Change the settings of an RDI instance while it runs, without a Helm upgrade.
type: integration
weight: 62
---

Instance settings control the behavior of a single RDI instance. You can change them while RDI
runs, without a Helm upgrade or a reinstallation, and changing them does not restart the RDI
operator or the RDI API. A setting that you set overrides the corresponding installation value
until you delete it.

Each instance has its own settings, even when two instances share the same RDI database in a
[high availability](/content/integrate/redis-data-integration/installation/install-vm.md#installing-with-high-availability)
setup. Run the commands, or send the API requests, to the instance that you want to change.

## Manage instance settings

Use the following CLI commands to manage the settings of an instance:

```bash
# List all the settings and their values
redis-di list-settings

# Show the value of one setting
redis-di get-setting standby_mode

# Set a setting
redis-di set-setting standby_mode true

# Delete a setting, so that the installation value applies again
redis-di delete-setting standby_mode
```

The CLI shows a setting that is not set as `<none>`. See
[`list-settings`](/content/integrate/redis-data-integration/reference/cli/redis-di-list-settings.md),
[`get-setting`](/content/integrate/redis-data-integration/reference/cli/redis-di-get-setting.md),
[`set-setting`](/content/integrate/redis-data-integration/reference/cli/redis-di-set-setting.md), and
[`delete-setting`](/content/integrate/redis-data-integration/reference/cli/redis-di-delete-setting.md)
for the command options.

With RDI API v2, `GET /api/v2/settings` returns all the settings of the instance, with `null` for
a setting that is not set. `PATCH /api/v2/settings` applies its body as a JSON merge patch: a
value sets a setting, `null` deletes it, and the settings that the body omits are unchanged. For
example, the following body sets `standby_mode`:

```json
{"standby_mode": true}
```

## Available settings

| Setting | Type | When not set |
| :-- | :-- | :-- |
| [`standby_mode`](#standby_mode) | Boolean | The `operator.leaderElection.standbyMode` Helm value, `false` by default |

### `standby_mode`

Controls whether the instance takes part in the leader election that decides which instance
runs the pipelines. Use it to fail over to another instance deliberately, for example before
maintenance. See [Trigger a failover manually](/content/integrate/redis-data-integration/installation/ha-test.md#trigger-a-failover-manually)
for the steps.

- `true`: The instance leaves the leader election. If it is the leader, it gives up the
  leadership, so that another instance can take over. Its pipelines change to the `standby`
  status, and RDI removes their collectors and stream processors from it.
- `false`: The instance takes part in the leader election, even if `operator.leaderElection.standbyMode`
  is `true` in its Helm values.
- Not set: The `operator.leaderElection.standbyMode` Helm value applies.

The operator applies a change on its next leader election check, within 10 seconds with the
default configuration. The setting has no effect while leader election is disabled.
