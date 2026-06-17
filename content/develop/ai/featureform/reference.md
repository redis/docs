---
title: Redis Feature Form reference
description: Reference data for the ff CLI, Python client, gRPC API, and RBAC permissions.
linkTitle: Reference
weight: 100
aliases:
- /develop/ai/featureform/datasets-and-transformations/
---

This page collects raw reference data for Redis Feature Form. Use it as a lookup—conceptual material lives in the [Concepts]({{< relref "/develop/ai/featureform/concepts" >}}) page, and task-oriented procedures live in the other pages in this section.

## Permissions

Each built-in RBAC role is a fixed set of permissions. The role table on [Configure authentication and RBAC]({{< relref "/operate/featureform/configure-auth#built-in-roles" >}}) is the usual way to think about access; the catalog below is what the authorization service actually checks.

| Permission ID | Category | Resource scope | What it grants |
| --- | --- | --- | --- |
| `workspace.create` | workspace | deployment | Create new workspaces. |
| `workspace.read` | workspace | workspace | Read workspace metadata. |
| `workspace.list` | workspace | deployment | List visible workspaces. |
| `workspace.update` | workspace | workspace | Update workspace metadata. |
| `workspace.delete` | workspace | workspace | Delete a workspace. |
| `workspace.membership.manage` | workspace | workspace | Manage workspace RBAC bindings. |
| `graph.read` | graph | workspace | Read graph and resource metadata. |
| `catalog.read` | catalog | workspace | Read catalog metadata. |
| `provider.read` | infrastructure | workspace | Read provider definitions. |
| `provider.write` | infrastructure | workspace | Mutate provider definitions. |
| `secret_provider.read` | infrastructure | workspace | Read secret-provider definitions. |
| `secret_provider.write` | infrastructure | workspace | Mutate secret-provider definitions. |
| `apply.plan` | mutation | workspace | Run apply planning. |
| `apply.write` | mutation | workspace | Apply workspace changes. |
| `serving.metadata.read` | data | workspace or resource | Read serving metadata. |
| `serving.read` | data | workspace or resource | Read served feature values. |
| `dataframe.read` | data | workspace | Read dataframe data. |
| `training_set.read` | data | workspace or resource | Read training-set data. |
| `scheduler.read` | operations | workspace | Read scheduler state. |
| `scheduler.control` | operations | workspace | Control scheduler state. |
| `audit.read` | audit | workspace or deployment | Read audit logs. |
| `machine_credential.read` | machine credentials | workspace | Read machine credentials. |
| `machine_credential.write` | machine credentials | workspace | Create, rotate, and revoke machine credentials. |

## gRPC services

This section indexes the public gRPC API surface exposed by Feature Form.

### Service index

| Service | Purpose |
| --- | --- |
| `WorkspaceService` | Workspace CRUD and lookup |
| `ProviderService` | Workspace-scoped provider CRUD |
| `SecretProviderService` | Workspace-scoped secret-provider CRUD |
| `ApplyService` | Declarative graph apply and dry-run planning |
| `ResourceService` | Graph browsing, lineage, search, versions, and workspace stats |
| `CatalogService` | Physical catalog inspection |
| `ServingService` | Online serving and serving metadata |
| `DataframeService` | Dataframe plan resolution |
| `RbacService` | Roles, permissions, access, and bindings |
| `MachineCredentialService` | Machine credential lifecycle |
| `AuditService` | Audit log listing |
| `VersionService` | Version compatibility and auth discovery metadata |

### Notable service areas

- `WorkspaceService`: create, get, list, update, delete
- `ProviderService`: register, get, list, update, delete
- `SecretProviderService`: register, get, list, update, delete
- `ApplyService`: apply and plan
- `ResourceService`: per-resource get and list plus lineage, impact, versions, and workspace stats

### Important apply fields

- `workspace_id`
- `resources`
- `dry_run`
- `apply_strategy`
- `execution_mode`

### Common provider-related models

- `PostgresConfig`
- `SnowflakeConfig`
- `S3Config`
- `SparkProviderConfig`
- `ProviderHealth`
- `SecretRef`

## CLI

This section documents the current public `ff` CLI surface.

### Global flags

Connection and transport:

- `--server`, `-s`
- `--grpc-server`
- `--transport rest|grpc`
- `--timeout`, `-t`
- `--no-tls`

Authentication:

- `--token`
- `--client-id`
- `--client-secret`
- `--issuer-url`

CLI behavior:

- `--output`, `-o`
- `--config`
- `--no-color`
- `--skip-version-check`

### Top-level commands

- `ff version`
- `ff ping`
- `ff workspace`
- `ff provider`
- `ff secret-provider`
- `ff apply`
- `ff auth`
- `ff rbac`
- `ff machine-credential`
- `ff audit`
- `ff catalog`
- `ff graph`
- `ff scheduler`
- `ff dataframe`
- `ff config`

## Python client

This section indexes the main public Python surface exported from `featureform`.

### Client APIs

- `ff.Client`
- `ff.WorkspaceClient`
- `ff.ProviderClient`
- `ff.SecretProviderClient`
- `ff.ApplyResult`
- `ff.ApplyWaitResult`

### Common error types

- `ff.FeatureformError`
- `ff.ConnectionError`
- `ff.InvalidArgumentError`
- `ff.NotFoundError`
- `ff.TimeoutError`
- `ff.ValidationError`

### Secret-provider and provider helpers

- `ff.EnvSecretProvider`
- `ff.VaultSecretProvider`
- `ff.K8sSecretProvider`
- `ff.PostgresProvider`
- `ff.RedisProvider`
- `ff.S3Provider`
- `ff.SparkProvider`
- `ff.get_postgres(name)`
- `ff.get_provider(name)`

### Core resource types

- `ff.Entity`
- `ff.Dataset`
- `ff.Feature`
- `ff.Label`
- `ff.TrainingSet`
- `ff.FeatureView`
