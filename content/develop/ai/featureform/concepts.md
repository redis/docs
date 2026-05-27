---
title: Redis Feature Form concepts
description: Learn the workspace, resource graph, provider, secret, and serving model behind Redis Feature Form.
linkTitle: Concepts
weight: 30
---

Redis Feature Form is a feature platform. It turns raw data from your existing systems into the values your models read at inference time. This page introduces the core concepts behind that workflow.

## How the pieces fit together

A Feature Form deployment runs one or more **[workspaces](#workspaces)**. Each workspace owns a versioned **[resource graph](#the-resource-graph)** that describes what features should exist, where their inputs live, and how they're served. You author that graph in a Python **[definitions file](#definitions-files-and-ff-apply)** and submit it with `ff apply`.

The graph itself is data, not credentials or connections. **[Providers](#providers)** connect the workspace to external systems (Postgres, Redis, S3, Spark, an Iceberg catalog), and **[secret references](#secrets-and-secret-references)** point to the backend that holds the credentials. At the end of the chain, a **[feature view](#feature-views-and-serving)** is the single resource the rest of your stack reads from to serve features online.

Each of these terms is unpacked in the rest of this page.

## Workspaces

A workspace is the tenant boundary for everything Feature Form manages. The graph, the providers, the secret references, the catalog of materialized locations, and the serving metadata all live inside one workspace and cannot leak across to another.

That isolation is the unit you use to separate environments — dev, staging, prod — or to give independent teams their own slice of a shared deployment. Two workspaces can point at the same external Postgres database and still not see each other's resources, because the graph that names those resources is workspace-scoped.

A workspace also tracks `last_applied_version`, a counter that advances each time the graph commits a new version. Inspection and serving commands always read from the latest committed version, not from a draft.

To create, inspect, update, or delete workspaces, see [Manage workspaces]({{< relref "/develop/ai/featureform/manage-workspace" >}}).

## The resource graph

The resource graph is the single object that represents the desired state of a workspace. Every feature, label, transformation, dataset, and feature view belongs to that graph and references the others by name.

Two properties make the graph the right mental model:

- **It is versioned as a whole.** When you submit a change, Feature Form commits a new graph version atomically. Either everything in the change lands together or nothing does. You don't end up with half-applied feature definitions.
- **It is declarative.** You describe what the graph should look like, not the sequence of steps to get there. Feature Form is responsible for figuring out the delta between what exists and what you've asked for.

### Resource types

A graph is built from seven resource types. New users encountering Feature Form for the first time benefit from learning these as a vocabulary list — every other concept on this page builds on them.

- **Entities** identify the real-world objects features describe, such as a `customer` or `order`. Other resources join on the entity's key column.
- **Datasets** point at an existing table, view, or file on an offline store and make it visible to the graph. The data itself stays where it lives; Feature Form just registers a handle to it.
- **Transformations** produce new datasets from existing ones, expressed as SQL or as a Spark job. A transformation describes the shape of the output; the compute that runs it is supplied by a provider.
- **Features** are entity-keyed values that get served at inference time. A feature attaches to a column of a dataset, optionally applies an aggregation (such as `SUM` over a 7-day window), and declares which provider owns its computation.
- **Labels** look like features but feed offline training rather than online serving. They carry the value a model is trying to predict.
- **Training sets** join one or more features with a label on the entity key, so an offline training job reads a single time-aligned table instead of stitching things together by hand.
- **Feature views** are the online serving interface for a group of features. They are the only resource that downstream applications and model services interact with directly.

A short definitions file makes the shape concrete. The reader shouldn't worry about syntax yet — the point is to see how the vocabulary above appears as code.

```python
import featureform as ff
from datetime import timedelta

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
```

### Definitions files and `ff apply` {#definitions-files-and-ff-apply}

The Python file above is the source of truth for what the graph should look like — not a script that mutates Feature Form imperatively. When you run `ff apply`, Feature Form imports the file, collects the resources it defines, and treats that set as the workspace's desired state. A planner compares the submission with the current graph, and if the change is accepted, a new graph version is committed.

By default, an apply is replacement-oriented: a resource that exists in the workspace but is not in the submitted set is a candidate for removal. That behavior is what makes the file a true source of truth. When you intentionally submit a partial set and want missing resources to stay untouched, you can apply in merge mode instead.

{{< note >}}
**Definitions files describe features, not infrastructure.** Providers and secret backends are registered separately by a workspace admin. Definitions files reference providers by name and assume they already exist. This separation keeps feature authors away from credentials and infrastructure choices.
{{< /note >}}

For an end-to-end walkthrough of authoring a definitions file and applying it, see the [Quickstart]({{< relref "/develop/ai/featureform/quickstart" >}}). For the full apply lifecycle and editing loop, see [Define and deploy features]({{< relref "/develop/ai/featureform/define-and-deploy-features" >}}) and [Update features]({{< relref "/develop/ai/featureform/update-features" >}}).

## Providers

A provider is the workspace's connection to an external system. It carries the host, port, credentials reference, and any backend-specific configuration Feature Form needs to talk to that system. Resources in the graph reference providers by name, so a provider must be registered in the workspace before any resource that uses it can be applied.

Every provider fills one or more **roles**, which describe the kind of work it can do for the workspace:

| Role            | What it does                                                            |
| --------------- | ----------------------------------------------------------------------- |
| `offline-store` | Holds batch data and materialized datasets the graph reads from.        |
| `online-store`  | Serves materialized feature values to applications at low latency.      |
| `compute`       | Runs transformations and materialization jobs.                          |
| `streaming`     | Connects the workspace to streaming sources.                            |

One provider often fills more than one role. Postgres, for example, is commonly registered as both `offline-store` and `compute` because the same instance that holds datasets can run SQL transformations against them. The documented integrations and their typical roles:

| Provider          | Typical roles                  |
| ----------------- | ------------------------------ |
| Postgres          | `offline-store`, `compute`     |
| Redis             | `online-store`                 |
| S3                | `offline-store`                |
| Spark             | `compute`                      |
| Iceberg catalog   | `offline-store`                |

The role model is what lets a graph stay portable: a feature definition doesn't care that compute happens to be Postgres in dev and Spark in prod, only that some provider fills the `compute` role.

To register providers in a workspace, see [Register providers]({{< relref "/develop/ai/featureform/register-providers" >}}).

## Secrets and secret references

Feature Form never stores plaintext credentials in the graph. A provider configuration carries a **secret reference** that looks like `env:PG_PASSWORD`, and Feature Form resolves that reference through a registered **secret provider** at the moment the credential is needed.

Two consequences are worth internalizing as a new user:

- **The graph is safe to inspect and export.** Nothing in it contains a usable credential. You can hand the graph to another team, version it, or paste it into a ticket without leaking secrets.
- **The process that resolves a reference is whichever process actually needs the credential.** In a deployed environment, that's almost always the Feature Form server, not your local CLI shell. A reference such as `env:PG_PASSWORD` reads from the server's process environment, not yours.

Every new workspace is created with a built-in `env` secret provider, which makes `env:` references work out of the box for local development. Production deployments typically register a Vault, Kubernetes-secrets, or AWS Secrets Manager backend instead, because the `env` backend offers no rotation, no audit, and exposes values in process listings.

To register a secret provider for a workspace, see [Configure secret providers]({{< relref "/develop/ai/featureform/register-providers#configure-secret-providers" >}}).

## Feature views and serving

A feature view is the resource that everything else in the graph eventually feeds. It is the online serving interface — the single name an application or model service uses when it asks Feature Form for the latest features about a particular entity.

A feature view declares:

- The entity it is keyed by (for example, `customer`).
- The list of features it exposes.
- The online provider that holds the materialized values — typically Redis.
- A materialization engine that produces those values from offline data.

```python
customer_risk_view = ff.FeatureView(
    name="customer_risk_feature_view",
    entity="customer",
    features=[customer_total_amount_7d, customer_transaction_count_7d],
    inference_store="demo_redis",
)
```

For a feature view to actually serve, three things must line up: the online provider it points to must be registered and reachable, the graph version that introduced the feature view must be committed, and materialization must have populated values for the entities you want to query. If any of those are missing, serving fails immediately rather than returning stale data.

The same logical operation is reachable through three surfaces, so applications can pick whichever fits their stack:

- A gRPC service (`ServingService.Serve` and `ServingService.GetServingMetadata`).
- A REST endpoint (`POST /api/v1/serve`).
- A Python client (`client.serve(...)`).

One subtle but important detail: reading feature values and reading serving metadata are governed by **separate** RBAC permissions. A dashboard or diagnostic principal can be allowed to inspect what a feature view looks like without also being allowed to read live feature values, and vice versa.

To serve from a feature view in an application, see [Serve features]({{< relref "/develop/ai/featureform/serve-features" >}}). To inspect datasets, training sets, or feature views directly, see [Query data]({{< relref "/develop/ai/featureform/query-data" >}}).

## Next steps

Now that the vocabulary is in place, the rest of the documentation maps cleanly onto these concepts:

- [Quickstart]({{< relref "/develop/ai/featureform/quickstart" >}}) — one end-to-end walkthrough that exercises every concept on this page.
- [Manage workspaces]({{< relref "/develop/ai/featureform/manage-workspace" >}}) — create, inspect, update, and delete workspaces.
- [Register providers]({{< relref "/develop/ai/featureform/register-providers" >}}) — connect the workspace to Postgres, Redis, S3, Spark, or an Iceberg catalog, and register secret backends.
- [Define and deploy features]({{< relref "/develop/ai/featureform/define-and-deploy-features" >}}) — author a definitions file and run `ff apply`.
- [Update features]({{< relref "/develop/ai/featureform/update-features" >}}) — iterate on a graph after the first apply.
- [Serve features]({{< relref "/develop/ai/featureform/serve-features" >}}) — read from a feature view in an application.
- [Query data]({{< relref "/develop/ai/featureform/query-data" >}}) — inspect datasets, training sets, and feature views directly.
