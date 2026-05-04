---
Title: Authentication and RBAC
alwaysopen: false
categories:
- docs
- operate
- featureform
description: Manage Feature Form auth and RBAC
linkTitle: Authentication and RBAC
weight: 70
bannerText: Feature Form is currently in preview and subject to change. To request access to the Feature Form Docker image, contact your Redis account team.
bannerChildren: true
---
Feature Form separates deployment-wide administration from workspace-scoped actions. A workspace is the isolation boundary, but membership and permissions are managed separately through RBAC bindings.

## Built-in roles

- `global_admin` for deployment-wide administration and workspace creation
- `workspace_admin` for workspace setup, membership, apply, and audit
- `operator` for operational workflows
- `viewer` for read-only workspace visibility
- `model` for constrained reads of feature views and training sets

## Typical handoff

1. A global admin creates the workspace.
2. The global admin grants `workspace_admin` to the intended principal.
3. That principal verifies access before registering providers or applying resources.

## Scope model

- Global scope controls deployment-wide actions.
- Workspace scope controls providers, secret providers, apply, graph, and audit inside one workspace.
- Resource-constrained scope is used for limited serving or training-set access.

## Create a workspace and grant access

Use this flow when a global admin is creating a new workspace and handing it off to the team that will manage it.

### 1. Create the workspace

```bash
ff workspace create demo-workspace \
  --description "Workspace for the feature workflow docs path"
```

### 2. Verify it exists

```bash
ff workspace get --name demo-workspace
ff workspace list
```

Capture the workspace ID from the result for later RBAC commands.

### 3. Grant workspace-admin access

```bash
ff rbac grant workspace_admin \
  --workspace <workspace-id> \
  --user alice@example.com
```

You can also bind a group or service account instead of a user.

### 4. Verify the binding

```bash
ff rbac list --workspace <workspace-id>
ff rbac subjects --workspace <workspace-id>
```

### Notes

- Creating the workspace does not automatically grant workspace membership to other principals.
- New workspaces create a built-in `env` secret provider, but it is still workspace-scoped.
- In-memory state can make gRPC and REST behave like separate state domains. Use durable PostgreSQL-backed state for shared environments.

## Join an existing workspace

Use this page when a workspace already exists and you need to confirm that the intended principal can proceed with setup, apply, or serving.

### 1. Verify identity

```bash
ff auth whoami
ff rbac whoami
```

### 2. Confirm the workspace is visible

```bash
ff workspace list
ff workspace get --name demo-workspace
```

### 3. Confirm the effective binding

```bash
ff rbac list --workspace <workspace-id>
```

You should see the expected user, group, or service-account binding for that workspace.

### Common failures

- `permission denied` on provider or apply commands usually means missing workspace write access.
- `workspace not found` usually means the wrong deployment, wrong transport, or wrong workspace name.
- Missing resources after apply can indicate transport or state-backend mismatch in non-durable environments.

