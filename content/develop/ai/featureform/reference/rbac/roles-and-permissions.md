---
title: Roles and permissions
description: Review the built-in Featureform RBAC roles, permission areas, and useful inspection commands.
linkTitle: Roles and permissions
weight: 10
---

This page summarizes the built-in RBAC catalog exposed by the current authorization service.

## Roles

- `viewer` for read-only workspace visibility
- `operator` for resource and scheduler operations
- `workspace_admin` for full workspace administration
- `global_admin` for deployment-wide administration
- `model` for constrained serving and training-set access

## Permission areas

- workspace
- graph
- catalog
- provider
- secret provider
- apply
- serving
- dataframe
- training set
- scheduler
- audit
- machine credential

`model` is not a reduced workspace-admin role. It depends on explicit resource bindings for the feature views or training sets it can read.

## Useful inspection commands

```bash
ff --transport grpc --grpc-server localhost:9090 --no-tls rbac roles
ff --transport grpc --grpc-server localhost:9090 --no-tls rbac permissions
```
