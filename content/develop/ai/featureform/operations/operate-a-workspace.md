---
title: Operate a workspace
description: Run day-2 checks for Featureform connectivity, workspace state, providers, graph data, and catalog entries.
linkTitle: Operate a workspace
weight: 10
---

Use this page for routine operational checks after a workspace is already created and in use.

## Day-2 checklist

- verify connectivity with `ff ping`
- inspect workspace metadata and `last_applied_version`
- inspect providers and secret providers
- inspect graph overview and stats
- inspect catalog locations
- confirm serving and dataframe clients point at the expected transport and state backend

## Useful commands

```bash
ff ping
ff workspace get <workspace-id>
ff provider list --workspace <workspace-id>
ff secret-provider list --workspace <workspace-id>
ff graph workspace stats --workspace <workspace-id>
ff catalog list --workspace <workspace-id>
```

With memory-backed state, check transport mismatches first when users report missing workspaces, providers, or applied resources.
