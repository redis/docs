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
bannerText: Feature Form is currently in preview and subject to change. Feature Form Docker images are available on Docker Hub; contact your Redis account team for a license key to deploy.
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

For the workspace lifecycle—creating a workspace, granting access, joining as a member, and day-2 operations—see [Manage workspaces]({{< relref "/develop/ai/featureform/manage-workspace" >}}).
