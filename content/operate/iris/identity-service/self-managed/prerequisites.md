---
Title: Self-managed Identity Service prerequisites
alwaysopen: false
categories:
- docs
- operate
- iris
description: Check the metadata Redis, Secrets, network access, and values you need before you install the Identity Service with the redis-iris suite chart.
linkTitle: Prerequisites
weight: 20
hideListLinks: true
---

The Identity Service depends on a metadata Redis and Secrets that you set up first. This page lists what the Identity Service needs, in addition to the [suite prerequisites](/content/operate/iris/self-managed/_index.md#prerequisites), before you [install it](/content/operate/iris/identity-service/self-managed/deploy.md).

## What you need

| Requirement | Detail |
| --- | --- |
| Suite chart | `redis-iris` chart `1.0.1` in the Redis AI Helm repository, `https://helm.redis.io/ai`. The suite prerequisites list the Kubernetes, Helm, and Metrics API versions. |
| Namespace | A namespace that holds only this release. The examples use `<namespace-name>`. |
| Metadata Redis | A Redis database for the Identity Service, as described in [Metadata Redis](#metadata-redis). |
| `kubectl`, `curl` | For the install and administration examples. |
| Identity provider (IdP) | Optional. An OpenID Connect (OIDC) IdP for operator sign-in. See [Operator sign-in](/content/operate/iris/identity-service/self-managed/authentication.md#operator-sign-in-with-your-identity-provider). |

`redis-iris` `1.0.0` is a new installation. There is no in-place move from the standalone product charts. See [Move from a preview or standalone install](/content/operate/iris/self-managed/_index.md#move-from-a-preview-or-standalone-install).

## Metadata Redis

The metadata Redis holds every agent key and grant. If you lose it, every agent loses access. The chart never deploys it.

- Turn on persistence, with an append-only file (AOF) or RDB snapshots, and keep the data directory on durable storage. Without persistence, a restart of that Redis deletes every key and grant.
- Back it up on a schedule. See [Back up and restore](/content/operate/iris/identity-service/self-managed/operations.md#back-up-and-restore).
- Protect access to it. A caller that can write to it can create an agent key with any grant. Give the Identity Service its own Redis user, and give no other user access to the Identity Service keys: `iris:apikey:*`, `iris:subject-grants:*`, and `iris:subject-grant-sets:*`.
- The Identity Service always uses database 0, and ignores a `/<db>` index in the URL.

## Network access

| From | To | Why |
| --- | --- | --- |
| Operators, the Iris console, and automation | Identity Service `9200` | Manage agent keys. |
| Service data planes | Identity Service `9200` | Check agent keys. |
| Identity Service | Service control planes | Validate grants. |
| Identity Service | Metadata Redis | Storage. |
| Identity Service | Your IdP's JSON Web Key Set (JWKS) URI | Only when you turn on operator sign-in. |

The chart renders no NetworkPolicy and no Ingress for the Identity Service. Let only the services, the console, and your operators reach port `9200`.

## Secrets

Create the metadata Secret before you install. [Deploy](/content/operate/iris/identity-service/self-managed/deploy.md#2-create-the-metadata-secret) shows the command.

| Secret | Key | Holds |
| --- | --- | --- |
| `ids-metadata` | `metadata.yaml` | The metadata Redis connection. |

By default, the chart generates every other Identity Service credential: the control token, and a runtime credential and an internal token for each enabled service. To supply them yourself, see [Supply your own credentials](/content/operate/iris/identity-service/self-managed/deploy.md#supply-your-own-credentials).

The suite also needs the shared Secrets that the [suite install](/content/operate/iris/self-managed/_index.md#2-create-the-shared-secrets) lists, such as the license and the CA bundle.

## Helm values that stop an install

The suite derives the Identity Service's name, port, tenant, service registration, and operator sign-in from `global.iris`. Rendering fails and names the field when:

- `identityService.metadata.existingSecret` is missing.
- A value under `identityService` differs from the value the suite derives from `global.iris`. Remove the field the message names.
- `global.security.profile` is `fips`. The suite chart doesn't support the Federal Information Processing Standards (FIPS) profile.
- In GitOps mode, the two `global.iris.secrets.*` Secrets have the same name.

The Identity Service also refuses to start when two of its credentials have the same value: the control token, the runtime credentials, and the internal tokens. The first error line of the pod log names the field.
