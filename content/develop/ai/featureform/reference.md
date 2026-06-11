---
title: Redis Feature Form reference
description: Reference data for the ff CLI, Python client, gRPC API, and RBAC permissions.
linkTitle: Reference
weight: 100
---

This page collects raw reference data for Redis Feature Form. Use it as a lookup—conceptual material lives in the [Concepts]({{< relref "/develop/ai/featureform/concepts" >}}) page, and task-oriented procedures live in the other pages in this section.

## Permissions

Each built-in RBAC role is a fixed set of permissions. The role table on [Configure authentication and RBAC]({{< relref "/operate/featureform/configure-auth#built-in-roles" >}}) is the usual way to think about access; the catalog below is what the authorization service actually checks.

| Permission ID | Category | Resource scope | What it grants |
| --- | --- | --- | --- |
| `workspace.create` | workspace | deployment | Create new workspaces. |
| `workspace.read` | workspace | workspace | Read workspace metadata. |
| `workspace.list` | workspace | deployment | List visible workspaces. |
| `workspace.update` | workspace | workspace | Update workspace metadata. |
| `workspace.delete` | workspace | workspace | Delete a workspace. |
| `workspace.membership.manage` | workspace | workspace | Manage workspace RBAC bindings. |
| `graph.read` | graph | workspace | Read graph and resource metadata. |
| `catalog.read` | catalog | workspace | Read catalog metadata. |
| `provider.read` | infrastructure | workspace | Read provider definitions. |
| `provider.write` | infrastructure | workspace | Mutate provider definitions. |
| `secret_provider.read` | infrastructure | workspace | Read secret-provider definitions. |
| `secret_provider.write` | infrastructure | workspace | Mutate secret-provider definitions. |
| `apply.plan` | mutation | workspace | Run apply planning. |
| `apply.write` | mutation | workspace | Apply workspace changes. |
| `serving.metadata.read` | data | workspace or resource | Read serving metadata. |
| `serving.read` | data | workspace or resource | Read served feature values. |
| `dataframe.read` | data | workspace | Read dataframe data. |
| `training_set.read` | data | workspace or resource | Read training-set data. |
| `scheduler.read` | operations | workspace | Read scheduler state. |
| `scheduler.control` | operations | workspace | Control scheduler state. |
| `audit.read` | audit | workspace or deployment | Read audit logs. |
| `machine_credential.read` | machine credentials | workspace | Read machine credentials. |
| `machine_credential.write` | machine credentials | workspace | Create, rotate, and revoke machine credentials. |
