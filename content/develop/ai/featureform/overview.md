---
title: Redis Feature Form overview
description: Learn what Redis Feature Form is, who it is for, and how it fits into Redis-based ML workflows.
linkTitle: Overview
weight: 10
---

This page describes the standard Feature Form onboarding path: workspace creation, access handoff, secrets, providers, definitions, apply, and serving. Use it as the high-level sequence before you dive into task-specific guides.

## Audience

- Global admins creating and handing off workspaces
- Workspace admins wiring secrets and providers
- Feature engineers authoring definitions files
- Application or model teams serving ready feature views

## Recommended path

1. Create the workspace and grant initial access.
2. Confirm the intended principal can see the workspace.
3. Reuse the built-in `env` secret provider or register another backend.
4. Register the providers the workspace will reference.
5. Author a definitions file and run `ff apply`.
6. Inspect the graph and catalog, then serve from a feature view.

## What to verify before the first apply

- The workspace exists and the right principal can access it.
- Secret references such as `env:PG_PASSWORD` resolve from the runtime environment.
- Providers are already registered by the names the definitions file expects.
- The team understands whether the definitions file represents complete desired state or a partial subset.

## Latest updates

The latest release adds enterprise-oriented capabilities:

- **Unified batch and streaming pipelines**: Support for tiling, backfills, and incremental updates reduces custom pipeline work.
- **Workspaces for multi-tenancy**: Isolate providers, data, authentication, and observability at the workspace level.
- **Fine-grained job control**: Planning, impact analysis, split materializations, and queue-based job management provide visibility into changes before they affect production systems.
- **Atomic DAG updates**: Manage graph-level changes atomically instead of versioning individual resources, which simplifies rollback and change history.
- **Enhanced RBAC and security**: Workspace-scoped access controls, API key pairs, a granular role model, audit logs, secret-provider improvements, mTLS, and encrypted internal transport.
- **Two-service deployment model**: A simplified deployment architecture that reduces operational complexity.
- **Redesigned dashboard**: Configure workspaces and providers directly from the UI.

## What to read next

- [Quickstart]({{< relref "/develop/ai/featureform/quickstart" >}})
- [Connect providers]({{< relref "/develop/ai/featureform/streaming" >}})
