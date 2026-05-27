---
title: How-to guides
description: Register offline providers and Redis online stores for Feature Form workflows.
linkTitle: How-to guides
weight: 40
---

Perform common Feature Form tasks for secrets, providers, apply, catalog inspection, and serving.

## Apply a definitions file

`ff apply` executes one Python entrypoint, collects the resources it defines, and submits that set as desired state for a single workspace.

### What `--file` can point to

- a Python file
- a package `__init__.py`
- a package directory that contains `__init__.py`

```bash
ff apply --workspace <workspace-id> --file examples/featureform/docs/resources.py --plan
```

### Loading order

`ff apply` loads resources in this order:

1. `resources = [...]` from the entry module, if present
2. the resource registry, if no explicit list exists

### Preview with `--plan`

```bash
ff apply \
  --workspace <workspace-id> \
  --file examples/featureform/docs/resources.py \
  --plan
```

Use this before large changes or whenever the file might be incomplete relative to the workspace's full desired state.

### Standard apply

```bash
ff apply \
  --workspace <workspace-id> \
  --file examples/featureform/docs/resources.py \
  --wait \
  --wait-for finished
```

### Apply modes

- default apply: replacement-oriented desired state
- `--merge`: safer for intentionally partial definition sets
- `--update`: exposed in the CLI, but treat as provisional
- `--full-rematerialize`: also exposed, but treat as provisional

Only one of `--merge`, `--update`, or `--full-rematerialize` can be used at a time.

If neither an explicit `resources` list nor any auto-registered resources are present after the entrypoint executes, `ff apply` fails.

## Update resources and rematerialize

After the first successful apply, most Feature Form work is an iteration loop: edit the definitions file, preview the delta, apply the change, and inspect the resulting graph or catalog state.

### Typical cycle

1. Change a resource definition.
2. Run a plan.
3. Apply the change.
4. Verify the resulting graph or catalog state.

```bash
ff apply \
  --workspace <workspace-id> \
  --file examples/featureform/docs/resources.py \
  --plan
```

### When to use `--merge`

Use `--merge` when the file you are applying is intentionally partial and omitted resources should not be treated as deletions.

### Caution with `--update` and `--full-rematerialize`

The CLI exposes both flags, but the current user-facing workflow is not as mature or as well documented as normal apply and merge. Use them only when your deployment has already validated that behavior.

### Verify the outcome

```bash
ff graph workspace overview --workspace <workspace-id>
ff catalog list --workspace <workspace-id>
```

## Inspect materialized locations

The Feature Form catalog records where resources managed by Feature Form physically landed after apply and materialization. It is distinct from systems such as Unity Catalog, Glue, or an Iceberg catalog.

### List catalog entries

```bash
ff catalog list --workspace <workspace-id>
```

### Inspect one resource

```bash
ff catalog get demo_transactions --workspace <workspace-id>
```

### The catalog shows

- logical resource name
- owning provider
- status
- physical table, path, or namespace
- update timestamps

Use the catalog together with graph views: graph explains why a resource exists; catalog shows where it landed.

## Query datasets and training sets

Use this command when the target dataset, training set, or feature view already exists and you want to inspect rows directly.

### Query a dataset

```bash
ff dataframe query demo_transactions \
  --workspace demo-workspace \
  --server localhost:9090 \
  --kind dataset \
  --limit 10 \
  --insecure
```

### Supported kinds

- `dataset`
- `training_set`
- `feature_view`

### Useful flags

- `--columns`
- `--filter`
- `--limit`
- `--output table|json|csv`

The dataframe command talks to the Flight endpoint on the gRPC side, so transport and endpoint mismatches are common troubleshooting points.

## Serve feature view

Use this page after a feature view already exists and the online store is ready. In the quickstart flow, that means `demo_customer_feature_view` has already been applied successfully.

### Verify the feature view exists

```bash
ff graph feature-view get demo_customer_feature_view --workspace demo-workspace
```

### Minimal Python workflow

```python
import featureform as ff

client = ff.Client(host="127.0.0.1:9090", insecure=True, workspace="demo-workspace")
features = client.serve("demo_customer_feature_view", entity="C1001")
print(features)
```

### Operational checks

- if the feature view is not ready, serving fails
- if the online provider is unavailable or unsupported, serving fails
- serving-metadata permissions and serving-read permissions are separate RBAC checks


## Operate a workspace 
Use this how-to for routine operational checks after a workspace is already created and in use.

### Day-2 checklist

- verify connectivity with `ff ping`
- inspect workspace metadata and `last_applied_version`
- inspect providers and secret providers
- inspect graph overview and stats
- inspect catalog locations
- confirm serving and dataframe clients point at the expected transport and state backend

### Useful commands

```bash
ff ping
ff workspace get <workspace-id>
ff provider list --workspace <workspace-id>
ff secret-provider list --workspace <workspace-id>
ff graph workspace stats --workspace <workspace-id>
ff catalog list --workspace <workspace-id>
```

With memory-backed state, check transport mismatches first when users report missing workspaces, providers, or applied resources.
