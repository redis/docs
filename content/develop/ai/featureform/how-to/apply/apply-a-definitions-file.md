---
title: Apply a definitions file
description: Use ff apply to submit the desired Featureform resource graph for a workspace.
linkTitle: Apply a file
weight: 10
---

`ff apply` executes one Python entrypoint, collects the resources it defines, and submits that set as desired state for a single workspace.

## What `--file` can point to

- a Python file
- a package `__init__.py`
- a package directory that contains `__init__.py`

```bash
ff apply --workspace <workspace-id> --file examples/featureform/docs/resources.py --plan
```

## Loading order

`ff apply` loads resources in this order:

1. `resources = [...]` from the entry module, if present
2. the resource registry, if no explicit list exists

## Preview with `--plan`

```bash
ff apply \
  --workspace <workspace-id> \
  --file examples/featureform/docs/resources.py \
  --plan
```

Use this before large changes or whenever the file might be incomplete relative to the workspace's full desired state.

## Standard apply

```bash
ff apply \
  --workspace <workspace-id> \
  --file examples/featureform/docs/resources.py \
  --wait \
  --wait-for finished
```

## Apply modes

- default apply: replacement-oriented desired state
- `--merge`: safer for intentionally partial definition sets
- `--update`: exposed in the CLI, but treat as provisional
- `--full-rematerialize`: also exposed, but treat as provisional

Only one of `--merge`, `--update`, or `--full-rematerialize` can be used at a time.

If neither an explicit `resources` list nor any auto-registered resources are present after the entrypoint executes, `ff apply` fails.
