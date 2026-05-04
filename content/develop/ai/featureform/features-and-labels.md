---
title: Tutorials
description: Step through guided Feature Form workflows for definitions files and end-to-end resource setup.
linkTitle: Tutorials
weight: 50
---

Use these walkthroughs when you want more context than a short how-to provides.

## Work with a python definitions file

Featureform treats a Python definitions file as the source of a desired resource graph. The quickstart example in this repo is intentionally small so you can see how the pieces fit together.

### Typical file structure

- import `featureform as ff`
- define entities and datasets
- define transformations
- define features and labels
- define a training set and feature view
- export a `resources = [...]` list

### Supported loading patterns

`ff apply` loads resources from Python in this order:

1. an explicit `resources = [...]` list
2. the auto-registration registry, if no explicit list is present

The explicit list is the clearer onboarding pattern and is what the published quickstart uses.

### The file should reference

- registered provider names such as `demo_postgres` and `demo_redis`
- secret references such as `env:PG_PASSWORD`
- stable resource names that make sense across re-apply cycles

### The file should not do

- replace provider registration
- assume providers exist before the workspace registers them
- mix infrastructure provisioning into the definitions entrypoint

## Build your first feature workflow

Use this tutorial when you want a guided run through the core Featureform path rather than a short checklist.

### 1. Verify the workspace

```bash
ff workspace get --name <workspace-name>
ff secret-provider get env --workspace <workspace-id>
```

### 2. Register providers

Use the provider setup guides for:

- [Postgres]()
- [Redis]()

### 3. Review the definitions file

The quickstart definitions entrypoint is resources.py.

### 4. Apply the resources

```bash
ff apply \
  --workspace <workspace-id> \
  --file examples/featureform/docs/resources.py \
  --wait \
  --wait-for finished
```

### 5. Inspect the workspace

```bash
ff graph workspace stats --workspace <workspace-id>
ff graph feature list --workspace <workspace-id>
ff catalog list --workspace <workspace-id>
```

### 6. Iterate safely

```bash
ff apply \
  --workspace <workspace-id> \
  --file examples/featureform/docs/resources.py \
  --plan
```

### 7. Serve from the feature view

Continue with the Serve features how-to.

