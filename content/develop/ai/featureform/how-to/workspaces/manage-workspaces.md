---
title: Manage workspaces
description: List, inspect, update, and delete Featureform workspaces.
linkTitle: Manage workspaces
weight: 10
---

Use these commands when you need to inspect or change a workspace directly.

## Core commands

```bash
ff workspace list
ff workspace get --name demo-workspace
ff workspace update <workspace-id> \
  --name demo-workspace \
  --description "Updated description"
ff workspace delete <workspace-id> --force
```

## Workspace state to remember

- workspaces have unique names and descriptions
- each workspace tracks `last_applied_version`
- providers, secret providers, graph state, catalog entries, and serving metadata are workspace-scoped

Deleting a workspace removes its associated workspace-scoped data.
