---
Title: Access control
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Manage Redis Software users, roles, ACLs, and role bindings on Kubernetes with custom resources.
hideListLinks: true
linkTitle: Access control
weight: 20
---

Access control lets you manage Redis Software users, roles, ACLs, and role bindings as Kubernetes custom resources. The operator reconciles each resource into the corresponding Redis Software object, so you can use GitOps workflows and Kubernetes Secrets instead of working only through the Redis Software REST API or Cluster Manager UI.

## How access control works on Redis for Kubernetes

You declare these `app.redislabs.com/v1alpha1` custom resources:

| Resource | Purpose |
|---|---|
| `RedisEnterpriseUser` | A Redis Software user, with credentials in a Kubernetes Secret. |
| `RedisEnterpriseACL` | A Redis ACL rule, mapped to a Redis Software ACL object. |
| `RedisEnterpriseDatabaseRole` | A database-scoped role (management role and optional ACL) applied to selected REDBs. |
| `RedisEnterpriseDatabaseRoleBinding` | Assigns a `RedisEnterpriseDatabaseRole` to a user. |
| `RedisEnterpriseClusterRole` | A cluster-scoped role (management role and optional ACL) applied across all REDBs. |
| `RedisEnterpriseClusterRoleBinding` | Assigns a `RedisEnterpriseClusterRole` to a user. |

When you apply one of these resources, the operator:

1. Validates the spec.
2. Creates or updates the matching object in Redis Software.
3. Reports the resolved Redis Software UID and other state in the resource's `status`.
4. Emits Kubernetes events on reconciliation problems.

## What's the same as Redis Software

The underlying Redis Software behavior is unchanged. For concepts and reference details, see the existing Redis Software docs:

- [Cluster-scoped role definitions]({{< relref "/operate/rs/security/access-control/create-cluster-roles" >}}) — what `Admin`, `ClusterMember`, `ClusterViewer`, and `UserManager` grant.
- [Database-scoped role definitions]({{< relref "/operate/rs/security/access-control/create-db-roles" >}}) — what `DBMember` and `DBViewer` grant.
- [Combined cluster and database roles]({{< relref "/operate/rs/security/access-control/create-combined-roles" >}}) — when a role grants both planes.
- [Redis ACL syntax]({{< relref "/operate/rs/security/access-control/redis-acl-overview" >}}) — rule format for `RedisEnterpriseACL` resources.
- [Login lockout and unlock]({{< relref "/operate/rs/security/access-control/manage-users/login-lockout" >}}) — how locked users are recovered.
- [Password complexity rules]({{< relref "/operate/rs/security/access-control/manage-passwords/password-complexity-rules" >}}) and [password expiration]({{< relref "/operate/rs/security/access-control/manage-passwords/password-expiration" >}}) — applied by Redis Software regardless of how the password is delivered.
- [Default user]({{< relref "/operate/rs/security/access-control/manage-users/default-user" >}}) — the built-in cluster admin account.

## What's different on Kubernetes

- **Resources are declarative.** You define users, roles, ACLs, and bindings in YAML and let the operator apply them. The Cluster Manager UI and REST API still work but are no longer the source of truth.
- **Role assignment uses separate Binding resources.** In Redis Software, you assign roles by editing the user. On Kubernetes, `RedisEnterpriseUser.spec` has no role references. You create `RedisEnterpriseDatabaseRoleBinding` or `RedisEnterpriseClusterRoleBinding` resources instead.
- **Passwords live in Kubernetes Secrets.** Each `RedisEnterpriseUser` references one or more Secrets. A `Rotatable` mode supports two Secrets at once for zero-downtime rotation. The operator marks Kubernetes Secrets immutable to prevent in-place edits.
- **A user with no binding still gets a role.** The operator assigns the Redis Software `none` role, which grants no permissions, so every user has at least one role. Permissions take effect only after you add a binding.

## Known limitations

- Access control resources are reconciled only in the operator namespace. Password Secrets must live in the same namespace, and database scopes resolve to REDBs in that namespace.
- A `RedisEnterpriseClusterRole` grants access cluster-wide, including to REDBs represented by resources in other namespaces. The access flows through Redis Software, not through explicit REDB references.
- A role can reference at most one `RedisEnterpriseACL`. To apply different ACLs to different databases, create separate roles.

## In this section

- [Manage users]({{< relref "/operate/kubernetes/security/access-control/manage-users" >}}) — create `RedisEnterpriseUser` resources, rotate passwords, recover from lockouts.
- [Manage roles]({{< relref "/operate/kubernetes/security/access-control/manage-roles" >}}) — create database and cluster roles with the right scope and management permissions.
- [Manage ACLs]({{< relref "/operate/kubernetes/security/access-control/manage-acls" >}}) — create and update `RedisEnterpriseACL` resources used by roles.
- [Manage role bindings]({{< relref "/operate/kubernetes/security/access-control/manage-bindings" >}}) — assign roles to users with `RedisEnterpriseDatabaseRoleBinding` and `RedisEnterpriseClusterRoleBinding`.
- [Migrate from REDB rolesPermissions]({{< relref "/operate/kubernetes/security/access-control/migrate-rolespermissions" >}}) — move from the deprecated `RedisEnterpriseDatabase.spec.rolesPermissions` field to the new CRD model.

## Related topics

- [Redis for Kubernetes operator API reference]({{< relref "/operate/kubernetes/reference/api" >}}) — field-by-field specification for every CRD in the `app.redislabs.com/v1alpha1` group.
- [Redis databases (REDB)]({{< relref "/operate/kubernetes/re-databases" >}}) — the resources that role scopes resolve against.
