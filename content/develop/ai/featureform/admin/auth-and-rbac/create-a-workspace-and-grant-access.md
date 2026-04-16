---
title: Create a workspace and grant access
description: Create a Featureform workspace and grant the initial workspace-admin binding.
linkTitle: Create a workspace
weight: 20
---

Use this flow when a global admin is creating a new workspace and handing it off to the team that will manage it.

## 1. Create the workspace

```bash
ff workspace create demo-workspace \
  --description "Workspace for the feature workflow docs path"
```

## 2. Verify it exists

```bash
ff workspace get --name demo-workspace
ff workspace list
```

Capture the workspace ID from the result for later RBAC commands.

## 3. Grant workspace-admin access

```bash
ff rbac grant workspace_admin \
  --workspace <workspace-id> \
  --user alice@example.com
```

You can also bind a group or service account instead of a user.

## 4. Verify the binding

```bash
ff rbac list --workspace <workspace-id>
ff rbac subjects --workspace <workspace-id>
```

## Notes

- Creating the workspace does not automatically grant workspace membership to other principals.
- New workspaces create a built-in `env` secret provider, but it is still workspace-scoped.
- In-memory state can make gRPC and REST behave like separate state domains. Use durable PostgreSQL-backed state for shared environments.

## Read next

[Join an existing workspace]({{< relref "/develop/ai/featureform/admin/auth-and-rbac/join-an-existing-workspace" >}})
