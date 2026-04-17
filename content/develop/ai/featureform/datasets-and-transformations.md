---
title: Reference
description: Reference documentation for Featureform APIs, CLI commands, Python surfaces, and RBAC.
linkTitle: Reference
weight: 90
---

Use these pages when you need current interfaces rather than a guided workflow.

## Featureform gRPC services

```json metadata
{
  "title": "Featureform gRPC services",
  "description": "Review the current public Featureform gRPC service surface, resource APIs, and major message types.",
  "categories": null,
  "tableOfContents": {"sections":[{"id":"service-index","title":"Service index"},{"id":"notable-service-areas","title":"Notable service areas"},{"id":"important-apply-fields","title":"Important apply fields"},{"id":"common-provider-related-models","title":"Common provider-related models"}]}

,
  "codeExamples": []
}
```
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

## Feature Form CLI

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
- `--verbose`, `-v`
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

### Transport note

The CLI defaults to REST in code, but many operational examples use explicit gRPC. In memory-backed deployments, REST and gRPC do not share one durable state backend.

## Python client and DSL reference

```json metadata
{
  "title": "Python client and DSL reference",
  "description": "Review the main Featureform Python client APIs, resource types, helpers, and common authoring patterns.",
  "categories": null,
  "tableOfContents": {"sections":[{"id":"client-apis","title":"Client APIs"},{"id":"common-error-types","title":"Common error types"},{"id":"secret-provider-and-provider-helpers","title":"Secret-provider and provider helpers"},{"id":"core-resource-types","title":"Core resource types"},{"id":"common-pattern","title":"Common pattern"}]}

,
  "codeExamples": []
}
```
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

### Common pattern

```python
postgres = ff.get_postgres("demo_postgres")
transactions = postgres.dataset(name="transactions")
```

The onboarding quickstart in this repo uses an explicit `resources = [...]` list because it is easier to reason about during apply.

## RBAC roles and persmissions

# Roles and permissions

```json metadata
{
  "title": "Roles and permissions",
  "description": "Review the built-in Featureform RBAC roles, permission areas, and useful inspection commands.",
  "categories": null,
  "tableOfContents": {"sections":[{"id":"roles","title":"Roles"},{"id":"permission-areas","title":"Permission areas"},{"id":"useful-inspection-commands","title":"Useful inspection commands"}]}

,
  "codeExamples": []
}
```
This section summarizes the built-in RBAC catalog exposed by the current authorization service.

### Roles

- `viewer` for read-only workspace visibility
- `operator` for resource and scheduler operations
- `workspace_admin` for full workspace administration
- `global_admin` for deployment-wide administration
- `model` for constrained serving and training-set access

### Permission areas

- workspace
- graph
- catalog
- provider
- secret provider
- apply
- serving
- dataframe
- training set
- scheduler
- audit
- machine credential

`model` is not a reduced workspace-admin role. It depends on explicit resource bindings for the feature views or training sets it can read.

### Useful inspection commands

```bash
ff --transport grpc --grpc-server localhost:9090 --no-tls rbac roles
ff --transport grpc --grpc-server localhost:9090 --no-tls rbac permissions
```






