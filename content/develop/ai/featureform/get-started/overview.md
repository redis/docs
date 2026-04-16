---
title: Featureform get started overview
description: Follow the recommended path from a new Featureform workspace to an applied and ready feature workflow.
linkTitle: Overview
weight: 10
---

This page maps the standard Featureform onboarding path: workspace creation, access handoff, secrets, providers, definitions, apply, and serving. Use it as the high-level sequence before you dive into task-specific guides.

## Who this is for

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

## Read next

- [Quickstart feature workflow]({{< relref "/develop/ai/featureform/get-started/quickstart-feature-workflow" >}})
- [Create a workspace and grant access]({{< relref "/develop/ai/featureform/admin/auth-and-rbac/create-a-workspace-and-grant-access" >}})
- [Configure secret providers]({{< relref "/develop/ai/featureform/how-to/secrets/configure-secret-providers" >}})
- [Register providers]({{< relref "/develop/ai/featureform/how-to/providers/register-providers" >}})
