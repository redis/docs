---
title: Resources and the workspace graph
description: Understand how Featureform stores desired state and committed graph versions inside a workspace.
linkTitle: Workspace graph
weight: 10
---

A Featureform workspace owns one logical resource graph. When you run `ff apply`, Featureform compares the submitted desired state with the current graph and commits a new version if the change is accepted.

## Resource types in the graph

- entities
- datasets
- transformations
- features
- labels
- training sets
- feature views

## Why the graph matters

- it powers lineage and dependency views
- it tracks `last_applied_version`
- it feeds serving metadata from committed state

## Useful commands

```bash
ff graph workspace overview --workspace demo-workspace
ff graph workspace stats --workspace demo-workspace
ff graph dataset get demo_transactions --workspace demo-workspace
ff graph feature-view get demo_customer_feature_view --workspace demo-workspace
```
