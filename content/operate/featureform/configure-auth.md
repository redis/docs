---
Title: Configure authentication and RBAC
aliases:
- /operate/featureform/auth/
alwaysopen: false
categories:
- docs
- operate
- featureform
description: Configure deployment-wide authentication and RBAC for Redis Feature Form.
linkTitle: Configure auth and RBAC
weight: 70
bannerText: Feature Form is currently in preview and subject to change. Feature Form Docker images are available on Docker Hub; contact your Redis account team for a license key to deploy.
bannerChildren: true
---

Redis Feature Form separates deployment-wide administration from workspace-scoped actions. A [workspace]({{< relref "/develop/ai/featureform/concepts#workspaces" >}}) isolates resources; RBAC bindings control who can act on it.

This page covers the built-in roles, the scope model, and the typical handoff between a global admin and a workspace admin. For the CLI commands that grant access and verify bindings, see [Manage workspaces]({{< relref "/develop/ai/featureform/manage-workspace" >}}).

## Built-in roles

Feature Form ships with five built-in RBAC roles. The role ID in the left column is the literal string used in `ff rbac grant`.

| Role ID | Scope | What it grants |
| --- | --- | --- |
| `viewer` | Workspace | Read-only access to workspace metadata, the resource graph, the catalog, providers, and serving metadata. |
| `operator` | Workspace | Everything a viewer has, plus writing providers, planning and applying changes, reading served features, and controlling scheduler workflows. |
| `workspace_admin` | Workspace | Full administration of a single workspace—membership, audit, updates, deletion—plus everything an operator has. |
| `global_admin` | Global | Workspace creation, plus full administration across every workspace in the deployment. |
| `model` | Resource-constrained | Read access to a specific set of feature views, training sets, and serving data—nothing else. Used for model-team service accounts. |

## Scope model

Feature Form has three scopes. Each role works at exactly one of them.

- **Global** Deployment-wide actions, such as creating workspaces. Only `global_admin` operates at this scope.
- **Workspace** Actions inside a single workspace: providers, secret providers, apply, graph, catalog, serving metadata, and audit. A binding at this scope applies to one workspace only—grant the role again on each workspace a user needs.
- **Resource-constrained** A narrower form of workspace scope that limits a binding to a specific set of resources. Used for the `model` role, which only sees serving and training-set reads for the resources it was bound to.

A binding pairs a role with a scope and a user, group, or service account. For example: "Alice has `workspace_admin` on workspace `7f2e4d8c-…`" or "the `payments-team` group has `global_admin`."

## Next steps

- [Manage workspaces]({{< relref "/develop/ai/featureform/manage-workspace" >}}) for the commands that create workspaces, grant roles, and verify bindings.
- [Concepts]({{< relref "/develop/ai/featureform/concepts" >}}) for background on workspaces and the resource graph.
