---
title: Featureform auth and RBAC overview
description: Understand how built-in Featureform roles map to workspace creation, administration, and serving access.
linkTitle: Overview
weight: 10
---

Featureform separates deployment-wide administration from workspace-scoped actions. A workspace is the isolation boundary, but membership and permissions are managed separately through RBAC bindings.

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

## Read next

- [Create a workspace and grant access]({{< relref "/develop/ai/featureform/admin/auth-and-rbac/create-a-workspace-and-grant-access" >}})
- [Join an existing workspace]({{< relref "/develop/ai/featureform/admin/auth-and-rbac/join-an-existing-workspace" >}})
- [Roles and permissions]({{< relref "/develop/ai/featureform/reference/rbac/roles-and-permissions" >}})
