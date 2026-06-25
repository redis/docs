---
title: Redis Feature Form quickstart
description: Register providers, define a feature, materialize it to Redis, and serve it.
linkTitle: Quickstart
weight: 20
---
Redis Feature Form is a feature platform for defining, deploying, and serving machine learning features, with Redis as the low-latency online store at inference time. This quickstart covers one workflow end to end — register providers, apply a definitions file, and read back the result — to confirm Feature Form is set up correctly in your environment.

## Before you begin

Before you begin, you'll need: 

- A running [Feature Form deployment]({{< relref "/operate/featureform/deploy" >}}) with durable state
- An existing [workspace]({{< relref "/develop/ai/featureform/manage-workspace" >}})
- A working [auth path]({{< relref "/operate/featureform/configure-auth" >}}) for `ff`
- Reachable Postgres and Redis endpoints for your offline-store and online-store [providers]({{< relref "/develop/ai/featureform/register-providers" >}})
- Sample data loaded that matches the quickstart definitions file

## Install the `ff` CLI

The Feature Form CLI ships as the `redis-featureform` package on PyPI. **Do not run `pip install featureform`** — that's an unrelated upstream project. Install into a virtual environment:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install redis-featureform
ff --help
```

## 1. Confirm identity and workspace access

If you haven't yet, log in with `ff auth login`. Then:

```bash
ff rbac whoami
ff workspace get --name <workspace-name>
```

Use the returned workspace ID in later commands.

## 2. Confirm the built-in `env` secret provider

```bash
ff secret-provider list --workspace <workspace-id>
```

If a provider uses a secret reference like `env:VAR_NAME`, make sure `VAR_NAME` exists in the runtime environment that resolves secrets.

## 3. Register your providers

See [Register providers]({{< relref "/develop/ai/featureform/register-providers" >}}) for steps to register the offline and online providers before applying resources.

## 4. Review your definitions file

Open the Python definitions file you plan to apply and confirm it declares the resources you want in the workspace. See [Typical file structure]({{< relref "/develop/ai/featureform/define-and-deploy-features#typical-file-structure" >}}) for the canonical shape.

## 5. Apply the file

```bash
ff apply \
  --workspace <workspace-id> \
  --file path/to/your/definitions.py \
  --wait \
  --wait-for finished
```

For a dry run first:

```bash
ff apply \
  --workspace <workspace-id> \
  --file path/to/your/definitions.py \
  --plan
```

## 6. Inspect the results

```bash
ff graph workspace stats --workspace <workspace-id>
ff graph feature list --workspace <workspace-id>
ff catalog list --workspace <workspace-id>
```

You should see the expected graph entries plus the catalog locations created by the applied resources.

## 7. Query the materialized data

Read sampled rows from a dataset, training set, or feature view in your applied graph. Use a resource name from the `ff graph feature list` or `ff catalog list` output in step 6:

```bash
ff dataframe query <resource-name> \
  --workspace <workspace-id> \
  --kind dataset \
  --limit 5 \
  --insecure
```

See [Query data]({{< relref "/develop/ai/featureform/query-data" >}}) for the full set of flags and supported kinds.

## Next steps

- [Serve features]({{< relref "/develop/ai/featureform/serve-features" >}}) at inference time from a feature view in your graph.
- [Update features]({{< relref "/develop/ai/featureform/update-features" >}}) to iterate on a definitions file you've already applied.



