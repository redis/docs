---
title: Featureform gRPC services
description: Review the current public Featureform gRPC service surface, resource APIs, and major message types.
linkTitle: gRPC services
weight: 10
---

This page indexes the public gRPC API surface exposed by Featureform.

## Service index

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

## Notable service areas

- `WorkspaceService`: create, get, list, update, delete
- `ProviderService`: register, get, list, update, delete
- `SecretProviderService`: register, get, list, update, delete
- `ApplyService`: apply and plan
- `ResourceService`: per-resource get and list plus lineage, impact, versions, and workspace stats

## Important apply fields

- `workspace_id`
- `resources`
- `dry_run`
- `apply_strategy`
- `execution_mode`

## Common provider-related models

- `PostgresConfig`
- `SnowflakeConfig`
- `S3Config`
- `SparkProviderConfig`
- `ProviderHealth`
- `SecretRef`
