---
title: Update resources and rematerialize
description: Reapply changed Featureform definitions safely and choose the right apply strategy for iterative work.
linkTitle: Update and rematerialize
weight: 20
---

After the first successful apply, most Featureform work is an iteration loop: edit the definitions file, preview the delta, apply the change, and inspect the resulting graph or catalog state.

## Typical cycle

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

## When to use `--merge`

Use `--merge` when the file you are applying is intentionally partial and omitted resources should not be treated as deletions.

## Caution with `--update` and `--full-rematerialize`

The CLI exposes both flags, but the current user-facing workflow is not as mature or as well documented as normal apply and merge. Use them only when your deployment has already validated that behavior.

## Verify the outcome

```bash
ff graph workspace overview --workspace <workspace-id>
ff catalog list --workspace <workspace-id>
```
