---
title: Work with a Python definitions file
description: Understand how a Featureform definitions entrypoint maps to workspace graph resources and how ff apply loads it.
linkTitle: Definitions file
weight: 10
---

Featureform treats a Python definitions file as the source of a desired resource graph. The quickstart example in this repo is intentionally small so you can see how the pieces fit together.

## Typical file structure

- import `featureform as ff`
- define entities and datasets
- define transformations
- define features and labels
- define a training set and feature view
- export a `resources = [...]` list

## Supported loading patterns

`ff apply` loads resources from Python in this order:

1. an explicit `resources = [...]` list
2. the auto-registration registry, if no explicit list is present

The explicit list is the clearer onboarding pattern and is what the published quickstart uses.

## The file should reference

- registered provider names such as `demo_postgres` and `demo_redis`
- secret references such as `env:PG_PASSWORD`
- stable resource names that make sense across re-apply cycles

## The file should not do

- replace provider registration
- assume providers exist before the workspace registers them
- mix infrastructure provisioning into the definitions entrypoint

## Read next

[Apply a definitions file]({{< relref "/develop/ai/featureform/how-to/apply/apply-a-definitions-file" >}})
