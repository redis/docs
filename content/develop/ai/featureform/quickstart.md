---
title: Redis Feature Form quickstart
description: Register providers, define a feature, materialize it to Redis, and serve it.
linkTitle: Quickstart
weight: 20
---
Use this quickstart when you want one end-to-end proof that the main Feature Form path works in your environment. It assumes the workspace already exists and that sample data matching the quickstart definitions file is already loaded.

## Before you begin

- A running Feature Form deployment with durable state
- An existing workspace
- A working auth path for `ff`
- Reachable Postgres and Redis endpoints for `demo_postgres` and `demo_redis`

## 1. Confirm identity and workspace access

```bash
ff rbac whoami
ff workspace get --name <workspace-name>
```

Use the returned workspace ID in later commands.

## 2. Confirm the built-in `env` secret provider

```bash
ff secret-provider list --workspace <workspace-id>
```

If your Postgres provider uses `env:PG_PASSWORD`, make sure that variable exists in the runtime environment that resolves secrets.

## 3. Register the demo providers

See the Providers and workpsaces page for steps to register the offline and online providers before applying resources.

## 4. Review the quickstart definitions file

The published example definitions entrypoint is the resource definitions file.

That file defines:

- one entity
- one primary dataset
- two SQL transformations
- three features
- one label
- one training set
- one feature view

## 5. Apply the file

```bash
ff apply \
  --workspace <workspace-id> \
  --file examples/featureform/docs/resources.py \
  --wait \
  --wait-for finished
```

For a dry run first:

```bash
ff apply \
  --workspace <workspace-id> \
  --file examples/featureform/docs/resources.py \
  --plan
```

## 6. Inspect the results

```bash
ff graph workspace stats --workspace <workspace-id>
ff graph feature list --workspace <workspace-id>
ff catalog list --workspace <workspace-id>
```

You should see the expected graph entries plus the catalog locations created by the applied resources.

## 7. Serve from the feature view

```python
import featureform as ff

client = ff.Client(host="127.0.0.1:9090", insecure=True, workspace="<workspace>")
features = client.serve("demo_customer_feature_view", entity="C1001")
print(features)
```


## What to read next

- [Connect providers]({{< relref "/develop/ai/featureform/providers" >}})
- [Define datasets and transformations]({{< relref "/develop/ai/featureform/datasets-and-transformations" >}})
- [Define features and labels]({{< relref "/develop/ai/featureform/features-and-labels" >}})
