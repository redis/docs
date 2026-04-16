---
title: Build your first feature workflow
description: Follow an end-to-end Featureform walkthrough from workspace verification to apply, inspection, and serving.
linkTitle: First workflow
weight: 20
---

Use this tutorial when you want a guided run through the core Featureform path rather than a short checklist.

## 1. Verify the workspace

```bash
ff workspace get --name <workspace-name>
ff secret-provider get env --workspace <workspace-id>
```

## 2. Register providers

Use the provider setup guides for:

- [Postgres]({{< relref "/develop/ai/featureform/how-to/providers/provider-specific-setup/postgres" >}})
- [Redis]({{< relref "/develop/ai/featureform/how-to/providers/provider-specific-setup/redis" >}})

## 3. Review the definitions file

The quickstart definitions entrypoint is [resources.py](/Users/erik.eppel/workspace/docs/examples/featureform/docs/resources.py).

## 4. Apply the resources

```bash
ff apply \
  --workspace <workspace-id> \
  --file examples/featureform/docs/resources.py \
  --wait \
  --wait-for finished
```

## 5. Inspect the workspace

```bash
ff graph workspace stats --workspace <workspace-id>
ff graph feature list --workspace <workspace-id>
ff catalog list --workspace <workspace-id>
```

## 6. Iterate safely

```bash
ff apply \
  --workspace <workspace-id> \
  --file examples/featureform/docs/resources.py \
  --plan
```

## 7. Serve from the feature view

Continue with [Serve features in Python]({{< relref "/develop/ai/featureform/how-to/serve/serve-features-in-python" >}}).
