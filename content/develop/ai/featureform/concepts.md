---
title: Redis Feature Form concepts
description: Learn the workspace, resource graph, provider, secret, and serving model behind Redis Feature Form.
linkTitle: Concepts
weight: 30
---

Redis Feature Form is a feature platform. It turns raw data from your existing systems into the values your models read at inference time. This page introduces the core concepts behind that workflow.

## How the pieces fit together

A Feature Form deployment runs one or more [workspaces](#workspaces). Each workspace owns a versioned [resource graph](#the-resource-graph) that describes what features should exist, where their inputs live, and how they're served. You author that graph in a Python [definitions file](#definitions-files-and-ff-apply) and apply it with `ff apply`.

The graph itself is data, not credentials or connections. [Providers](#providers) connect the workspace to external systems (Postgres, Redis, S3, Spark, an Iceberg catalog), and [secret references](#secrets-and-secret-references) point to the backend that holds the credentials. At the end of the chain, a [feature view](#feature-views-and-serving) is the single resource the rest of your stack reads from to serve features online.

## Workspaces

A workspace is a self-contained environment in Feature Form. Each one owns its own resource graph, providers, secret references, and serving metadata. Nothing is shared between workspaces.

Use workspaces to keep environments such as dev, staging, and prod separate, or to give independent teams their own area on a shared deployment. Two workspaces can connect to the same external Postgres database and remain fully isolated, because each workspace tracks its own resources.

Every workspace also has a `last_applied_version` counter that increases each time you successfully apply a change. Read commands always return the latest committed version.

To create, inspect, update, or delete workspaces, see [Manage workspaces]({{< relref "/develop/ai/featureform/manage-workspace" >}}).

## The resource graph

The resource graph describes what a workspace should look like. Every feature, label, transformation, dataset, and feature view lives in this graph and refers to the others by name.

Two properties shape how you work with it:

- It is versioned as a whole. Each successful change creates a new version of the entire graph. Either every resource in the change lands together, or nothing does — you never end up with half-applied feature definitions.
- It is declarative. You describe what the graph should look like, not the steps to get there. Feature Form figures out the difference between the current graph and the new one and applies only what changed.

### Resource types

A graph is built from seven resource types. New users encountering Feature Form for the first time benefit from learning these as a vocabulary list — every other concept on this page builds on them.

- **Entities** identify the real-world objects features describe, such as a `customer` or `order`. Other resources join on the entity's key column.
- **Datasets** point at an existing table, view, or file on an offline store and make it visible to the graph. The data itself stays where it lives; Feature Form just registers a handle to it.
- **Transformations** produce new datasets from existing ones, expressed as SQL or as a Spark job. A transformation describes the shape of the output; the compute that runs it is supplied by a provider.
- **Features** are entity-keyed values that get served at inference time. A feature attaches to a column of a dataset, optionally applies an aggregation (such as `SUM` over a 7-day window), and declares which provider owns its computation.
- **Labels** look like features but feed offline training rather than online serving. They carry the value a model is trying to predict.
- **Training sets** join one or more features with a label on the entity key, so an offline training job reads a single time-aligned table instead of stitching things together by hand.
- **Feature views** are the online serving interface for a group of features. They are the only resource that downstream applications and model services interact with directly.

The following example definitions file shows how the vocabulary above appears as code.

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

The Python definitions file is the source of truth for what the graph should look like. The file uses Python to declare resources, not to run commands against Feature Form. When you run `ff apply`, Feature Form imports the file, collects those resources, and treats them as the workspace's desired state. Feature Form compares that set with the current graph and, if the change is accepted, commits a new graph version.

By default, `ff apply` replaces the workspace's current graph with the resources defined in the file. Any existing resource not in the file becomes a candidate for removal. To apply a partial set and leave missing resources untouched, run `ff apply --merge` instead.

{{< note >}}
Definitions files describe features, not infrastructure. Providers and secret backends are registered separately by a workspace admin. Definitions files reference providers by name and assume they already exist. This separation keeps feature authors away from credentials and infrastructure choices.
{{< /note >}}

For an end-to-end walkthrough of authoring a definitions file and applying it, see the [Quickstart]({{< relref "/develop/ai/featureform/quickstart" >}}). For the full apply lifecycle and editing loop, see [Define and deploy features]({{< relref "/develop/ai/featureform/define-and-deploy-features" >}}) and [Update features]({{< relref "/develop/ai/featureform/update-features" >}}).

## Providers

A provider is the workspace's connection to an external system. It carries the host, port, credentials reference, and any configuration Feature Form needs to talk to that system. Resources in the graph reference providers by name, so you must register a provider in the workspace before applying any resource that uses it.

Every provider fills one or more roles, which describe the kind of work it can do for the workspace:

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

Feature Form never stores plaintext credentials in the graph. A provider configuration carries a secret reference. Feature Form resolves it through a registered secret provider when the credential is needed.

Keeping credentials out of the graph has two important consequences:

- The graph is safe to inspect and export. Nothing in it contains a usable credential. You can hand the graph to another team, version it, or paste it into a ticket without leaking secrets.
- The process that resolves a reference is whichever process actually needs the credential. In a deployed environment, that's almost always the Feature Form server, not your local CLI shell. A reference such as `env:PG_PASSWORD` reads from the server's process environment, not yours.

Every new workspace is created with a built-in `env` secret provider, which makes `env:` references work out of the box for local development. Production deployments typically register a Vault, Kubernetes-secrets, or AWS Secrets Manager backend instead, because the `env` backend offers no rotation, no audit, and exposes values in process listings.

To register a secret provider for a workspace, see [Configure secret providers]({{< relref "/develop/ai/featureform/register-providers#configure-secret-providers" >}}).

## Feature views and serving

A feature view is the resource that everything else in the graph eventually feeds. Applications query it to get the latest features for an entity.

A feature view declares:

- The entity used as the lookup key (for example, `customer`).
- The list of features it exposes.
- The online provider that holds the materialized values — typically Redis.
- A materialization engine that produces those values from offline data.

For example:

```python
customer_risk_view = ff.FeatureView(
    name="customer_risk_feature_view",
    entity="customer",
    features=[customer_total_amount_7d, customer_transaction_count_7d],
    inference_store="demo_redis",
)
```

### Feature view requirements 

Before applications can read from a feature view:

- The online provider it points to must be registered and reachable.
- The graph version that introduced the feature view must be committed.
- Materialization must have populated values for the entities you want to query.

If any of those are missing, the read fails immediately rather than returning stale data.

### Serving interfaces

Applications can read feature values through any of three interfaces:

- A gRPC service (`ServingService.Serve` and `ServingService.GetServingMetadata`).
- A REST endpoint (`POST /api/v1/serve`).
- A Python client (`client.serve(...)`).

{{< note >}}
Reading feature values and reading serving metadata are governed by separate RBAC permissions. For example, a dashboard user can have access to feature view schemas without access to the actual values — or vice versa.
{{< /note >}}

To serve from a feature view in an application, see [Serve features]({{< relref "/develop/ai/featureform/serve-features" >}}). To inspect datasets, training sets, or feature views directly, see [Query data]({{< relref "/develop/ai/featureform/query-data" >}}).

## Next steps

- [Quickstart]({{< relref "/develop/ai/featureform/quickstart" >}}) — one end-to-end walkthrough that exercises every concept on this page.
- [Manage workspaces]({{< relref "/develop/ai/featureform/manage-workspace" >}}) — create, inspect, update, and delete workspaces.
- [Register providers]({{< relref "/develop/ai/featureform/register-providers" >}}) — connect the workspace to Postgres, Redis, S3, Spark, or an Iceberg catalog, and register secret backends.
- [Define and deploy features]({{< relref "/develop/ai/featureform/define-and-deploy-features" >}}) — author a definitions file and run `ff apply`.
- [Update features]({{< relref "/develop/ai/featureform/update-features" >}}) — iterate on a graph after the first apply.
- [Serve features]({{< relref "/develop/ai/featureform/serve-features" >}}) — read from a feature view in an application.
- [Query data]({{< relref "/develop/ai/featureform/query-data" >}}) — inspect datasets, training sets, and feature views directly.
