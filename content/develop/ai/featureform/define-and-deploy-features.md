---
title: Define and deploy features
description: Author a Python definitions file and apply it to a Redis Feature Form workspace.
linkTitle: Define and deploy features
weight: 40
aliases:
- /develop/ai/featureform/features-and-labels/
- /develop/ai/featureform/providers/
---

A feature workflow starts with a Python [definitions file]({{< relref "/develop/ai/featureform/concepts#definitions-files-and-ff-apply" >}}). This file declares the [entities, datasets, transformations, features, labels, training sets, and feature views]({{< relref "/develop/ai/featureform/concepts#resource-types" >}}) you want in a [workspace]({{< relref "/develop/ai/featureform/concepts#workspaces" >}}). Run `ff apply` to submit that file as the workspace's [desired state]({{< relref "/develop/ai/featureform/concepts#the-resource-graph" >}}). Feature Form compares the file with the workspace's current resource graph and applies only the differences. If Feature Form accepts the change, it commits a new graph version. The model is declarative — the file describes the end state, not the steps to get there. Re-applying the same file leaves the workspace unchanged.

## Author a definitions file

Redis Feature Form treats a Python definitions file as the source of a desired resource graph. The example below declares a single workflow end to end, from a Postgres dataset through to a Redis-backed feature view.

```python
import featureform as ff
from datetime import timedelta

postgres = ff.get_postgres("demo_postgres")

customer = ff.Entity(name="customer")

transactions = postgres.dataset(
    name="transactions_raw",
    table="transactions",
    timestamp_column="timestamp",
)

@postgres.sql_transformation(name="customer_daily_rollups", inputs=[transactions])
def customer_daily_rollups() -> str:
    return """
        SELECT customer_id,
               date_trunc('day', timestamp) AS event_day,
               SUM(transaction_amount) AS total_amount
        FROM {{transactions_raw}}
        GROUP BY 1, 2
    """

customer_total_amount_7d = (
    ff.Feature(name="customer_total_amount_7d")
    .from_dataset(customer_daily_rollups, entity="customer",
                  entity_column="customer_id", value="total_amount",
                  timestamp="event_day")
    .aggregate(function=ff.AggregateFunction.SUM, window=timedelta(days=7))
)

customer_risk_view = ff.FeatureView(
    name="customer_risk_feature_view",
    entity="customer",
    features=[customer_total_amount_7d],
    inference_store="demo_redis",
)

resources = [
    customer,
    transactions,
    customer_daily_rollups,
    customer_total_amount_7d,
    customer_risk_view,
]
```

### Typical file structure

A definitions file typically declares resources in this order:

1. **Import the module** with `import featureform as ff`, which exposes the resource builders and provider helpers.
2. **[Entities]({{< relref "/develop/ai/featureform/concepts#resource-types" >}})** — identify the real-world objects features describe, such as `customer` or `order`. Other resources join on the entity's key column.
3. **[Datasets]({{< relref "/develop/ai/featureform/concepts#resource-types" >}})** — point at an existing table, view, or file on an offline store. The data remains in its original location.
4. **[Transformations]({{< relref "/develop/ai/featureform/concepts#resource-types" >}})** — produce new datasets from existing ones, expressed as SQL or as a Spark job.
5. **[Features]({{< relref "/develop/ai/featureform/concepts#resource-types" >}}) and [labels]({{< relref "/develop/ai/featureform/concepts#resource-types" >}})** — entity-keyed values served at inference time (features) and used as the prediction target offline (labels).
6. **[Training sets]({{< relref "/develop/ai/featureform/concepts#resource-types" >}}) and [feature views]({{< relref "/develop/ai/featureform/concepts#feature-views-and-serving" >}})** — join features with a label on the entity key (training set) and expose features for online serving (feature view).
7. **Export a `resources = [...]` list** that names every resource above. See [Definitions files and `ff apply`]({{< relref "/develop/ai/featureform/concepts#definitions-files-and-ff-apply" >}}) for how the loader uses it.

{{< note >}}
If your file doesn't export `resources = [...]`, `ff apply` falls back to its auto-registration registry. Prefer the explicit list during onboarding; it's easier to reason about and is what the [Quickstart]({{< relref "/develop/ai/featureform/quickstart" >}}) uses.
{{< /note >}}

### The file should reference

- Registered [provider names]({{< relref "/develop/ai/featureform/register-providers" >}}) such as `demo_postgres` and `demo_redis`. Providers must already exist in the workspace before they're referenced.
- [Secret references]({{< relref "/develop/ai/featureform/concepts#secrets-and-secret-references" >}}) such as `env:PG_PASSWORD`, resolved at runtime by a [secret provider]({{< relref "/develop/ai/featureform/register-providers#configure-secret-providers" >}}) registered in the workspace.
- Stable resource names that make sense across re-apply cycles, since the graph compares the file to current state by name.

### The file should not do

- Don't replace provider registration.
- Don't assume providers exist before the workspace registers them.
- Don't mix infrastructure provisioning into the definitions entrypoint.

## Apply a definitions file

`ff apply` reads the file you pass with `--file` and submits its resources to a workspace. `--file` accepts a Python file, a package `__init__.py`, or a package directory containing one.

Get the workspace ID with `ff workspace list`. See [Manage workspaces]({{< relref "/develop/ai/featureform/manage-workspace" >}}) for the full workspace lifecycle.

### Preview with `--plan`

Preview the change without applying it:

```bash
ff apply \
  --workspace <workspace-id> \
  --file examples/featureform/docs/resources.py \
  --plan
```

Use this before large changes or whenever the file might be incomplete relative to the workspace's full desired state.

### Standard apply

Apply the file and wait for it to finish:

```bash
ff apply \
  --workspace <workspace-id> \
  --file examples/featureform/docs/resources.py \
  --wait \
  --wait-for finished
```

Without `--wait`, `ff apply` returns as soon as the server accepts the request and runs the job asynchronously. `--wait` blocks until the job reaches a target state: `--wait-for finished` waits for terminal success; `--wait-for running` returns as soon as the job is actively running.

If you skip `--wait`, the response includes a job ID. Check the job's status and per-task progress with:

```bash
ff scheduler job get <job-id>
```

### Apply modes

- **Default apply** replaces the workspace's current resource graph with the file.
- **`--merge`** applies a partial definition file without treating omitted resources as deletions.
- **`--update`** is an advanced scheduler-backed mode that re-runs supported resources' normal update or incremental path, even when the graph definition is unchanged.
- **`--full-rematerialize`** is an advanced scheduler-backed mode that forces full-refresh behavior on supported materialized resources.

Use only one of `--merge`, `--update`, or `--full-rematerialize` at a time. Support for `--update` and `--full-rematerialize` is resource-family dependent — run `--plan` first to inspect the planned job, and pair them with `--wait` to see the outcome.

## Verify the apply

After apply finishes, confirm the change with:

```bash
ff graph workspace stats --workspace <workspace-id>
ff graph feature list --workspace <workspace-id>
ff catalog list --workspace <workspace-id>
```

The graph commands show the resources Feature Form recognizes; `ff catalog` shows where each materialized resource physically landed. See [Query data]({{< relref "/develop/ai/featureform/query-data" >}}) for more inspection options.

## If apply fails

Common reasons:

- **Provider not registered.** A resource references a provider name the workspace doesn't know. Confirm with `ff provider list --workspace <workspace-id>` and register the missing provider per [Register providers]({{< relref "/develop/ai/featureform/register-providers" >}}).
- **Secret can't be resolved.** A provider config uses a reference such as `env:PG_PASSWORD`, but the Feature Form server's environment doesn't expose that variable. Check the secret provider with `ff secret-provider get env --workspace <workspace-id>`.
- **No resources to apply.** The entrypoint produced no resources. Make sure your file exports a `resources = [...]` list, or that auto-registration finds the resources you declared.
- **Validation error.** The CLI prints the specific resource and field that failed; fix the file and re-run with `--plan`.

For more detail, re-run with `--verbose` to enable debug logging to stderr. For most failures, though, the apply job itself surfaces clearer errors than the debug log — let `--wait` finish, or run `ff scheduler job get <job-id>`, before reaching for `--verbose`.
