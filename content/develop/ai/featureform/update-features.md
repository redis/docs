---
title: Update features
description: Iterate on a Redis Feature Form definitions file with plan, merge, and re-apply workflows.
linkTitle: Update features
weight: 50
---

Most Feature Form work after the first apply is iterative: edit the definitions file, preview the delta, apply, and verify. For the full apply mechanics and failure modes, see [Define and deploy features]({{< relref "/develop/ai/featureform/define-and-deploy-features" >}}).

## Typical cycle

1. Change a resource definition.
2. Run a plan.
3. Apply the change.
4. Verify the resulting graph or catalog state.

Preview the change first:

```bash
ff apply \
  --workspace <workspace-id> \
  --file examples/featureform/docs/resources.py \
  --plan
```

Then apply:

```bash
ff apply \
  --workspace <workspace-id> \
  --file examples/featureform/docs/resources.py \
  --wait \
  --wait-for finished
```

## When to use `--merge`

Use `--merge` when your file is intentionally partial and omitted resources should not be treated as deletions.

## Verify the outcome

```bash
ff graph workspace stats --workspace <workspace-id>
ff catalog list --workspace <workspace-id>
```
