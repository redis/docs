---
title: Manage workspaces
description: Create, verify access to, monitor, and delete Redis Feature Form workspaces with the ff CLI.
linkTitle: Manage workspaces
weight: 20
---

A workspace is a self-contained environment in Redis Feature Form. Each workspace owns its own resource graph, providers, secret references, catalog entries, and serving metadata—nothing is shared between workspaces. Use workspaces to keep environments such as dev, staging, and prod separate, or to give independent teams their own isolated area on a shared deployment.

Each workspace has:

- A unique name and an optional description.
- A `last_applied_version` that tracks the most recently applied resource graph.
- A built-in `env` secret provider, created automatically.

The tasks on this page require one of two roles:

- A global admin (`global_admin`) creates workspaces and grants access.
- A workspace admin (`workspace_admin`) verifies their access, runs health checks, and updates or deletes the workspace.

For the full list of built-in roles and the scope model, see [Authentication and RBAC]({{< relref "/operate/featureform/auth" >}}).

Most commands on this page identify a workspace by its UUID, either as a positional argument or via the `--workspace` flag. Find the UUID with `ff workspace create` or `ff workspace list`. The examples below use `<workspace-id>`, substitute the actual UUID.

## Create a workspace and grant access

A global admin creates a workspace and hands it off to the workspace admin who will manage it.

### 1. Create the workspace

```bash
ff workspace create demo-workspace \
  --description "Workspace for the feature workflow docs path"
```

The command returns a table with the new workspace's ID, name, description, version, and timestamps:

```text
ID                                    NAME            DESCRIPTION                              VERSION  CREATED              UPDATED
7f2e4d8c-3a91-4b6d-9f0a-5e8c1b2d3f4a  demo-workspace  Workspace for the feature workflow ...   0        2026-05-12 14:03:21  2026-05-12 14:03:21
```

Save the ID—you'll need it for the RBAC commands below.

### 2. Grant workspace-admin access

```bash
ff rbac grant workspace_admin \
  --workspace <workspace-id> \
  --user alice@example.com
```

To bind a group or service account instead, use `--group <group-id>` or `--service-account <service-account-id>`. Exactly one of `--user`, `--group`, or `--service-account` is required.

### 3. Verify the binding

```bash
ff rbac list --workspace <workspace-id>
```

You should see the new role bound to the user, group, or service account you specified. For an alternate view that groups bindings by user, group, or service account instead of one row per binding, use `ff rbac subjects --workspace <workspace-id>`.

Creating a workspace does not automatically grant other users access—each member needs their own binding.

## Confirm access to a workspace

Use these checks when a workspace already exists and you need to confirm you can register providers, apply resources, or serve features.

```bash
# Verify your identity.
ff auth whoami
ff rbac whoami

# Confirm the workspace is visible to you.
ff workspace list
ff workspace get --name demo-workspace

# Confirm your binding.
ff rbac list --workspace <workspace-id>
```

You should see your user, group, or service-account binding listed. If you don't, ask a global admin to grant access using the steps above.

## Check workspace health

Run these commands routinely, or whenever something looks wrong, to confirm a workspace is healthy:

```bash
# Confirm the CLI can reach the deployment.
ff ping

# Inspect workspace metadata, including last_applied_version.
ff workspace get <workspace-id>

# List configured providers and secret providers.
ff provider list --workspace <workspace-id>
ff secret-provider list --workspace <workspace-id>

# Inspect graph overview and stats.
ff graph workspace stats --workspace <workspace-id>

# List catalog locations for materialized resources.
ff catalog list --workspace <workspace-id>
```

Also confirm that your serving and dataframe clients point at the expected transport and state backend.

## Update a workspace

Change a workspace's name or description:

```bash
ff workspace update <workspace-id> \
  --name demo-workspace \
  --description "Updated description"
```

Update affects metadata only—it doesn't touch providers, the resource graph, or catalog entries.

## Delete a workspace

{{< warning >}}
Deleting a workspace permanently removes all workspace-scoped data: providers, secret references, the resource graph, catalog entries, and serving metadata. This cannot be undone.
{{< /warning >}}

```bash
ff workspace delete <workspace-id> --force
```

`--force` skips the interactive confirmation prompt. Omit it for a safer, interactive delete.

## Troubleshooting

- **`permission denied` on provider or apply commands.** Your account is missing workspace write access. Run `ff rbac list --workspace <workspace-id>` to confirm the binding, and ask a global admin to grant the appropriate role if it's missing.
- **`workspace not found`.** Usually means the wrong deployment, the wrong transport, or a typo in the workspace name. Try `ff workspace list` to see what's actually visible.
- **Missing workspaces, providers, or resources after apply.** With memory-backed state, gRPC and REST can behave like separate state domains. Check for transport mismatches first, and use durable PostgreSQL-backed state for shared environments.

## Next steps

- [Register providers]({{< relref "/develop/ai/featureform/register-providers" >}}) to connect a workspace to its storage, compute, and catalog systems.
- See [Authentication and RBAC]({{< relref "/operate/featureform/auth" >}}) for the deployment-wide role and scope model.
- See [Concepts]({{< relref "/develop/ai/featureform/concepts" >}}) for the workspace, resource graph, and serving model.
