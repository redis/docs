---
title: Secrets and secret references
description: Understand how Featureform separates secret-provider registration from data-provider configuration.
linkTitle: Secrets
weight: 30
---

Featureform stores secret references in provider configuration instead of storing plaintext secret values itself. A provider config can contain a reference like `env:PG_PASSWORD`, which Featureform resolves through a registered secret provider at runtime.

## Mental model

- a secret provider is a workspace-scoped backend such as `env`, Vault, Kubernetes, or AWS Secrets Manager
- a secret reference is the value stored in provider config
- data providers use secret references but do not own secret storage

## Default path for a new workspace

Every new workspace creates a built-in `env` secret provider. That makes references such as `env:PG_PASSWORD` valid as long as the runtime environment actually exposes `PG_PASSWORD`.

The important detail is runtime scope: in deployed environments, the resolving process is usually the Featureform server, not your local CLI shell.

## What Featureform stores

- secret provider metadata and configuration
- secret references embedded in provider configuration

## What Featureform does not store

- plaintext secret values from external backends

## Read next

- [Configure secret providers]({{< relref "/develop/ai/featureform/how-to/secrets/configure-secret-providers" >}})
- [Register providers]({{< relref "/develop/ai/featureform/how-to/providers/register-providers" >}})
