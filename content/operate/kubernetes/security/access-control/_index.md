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

## How access control works on Redis Software for Kubernetes

You declare these `app.redislabs.com/v1alpha1` custom resources:

| Resource | Scope | Purpose |
| --- | --- | --- |
| `RedisEnterpriseUser` | — | A Redis Software user, with credentials in a Kubernetes Secret. |
| `RedisEnterpriseACL` | — | A Redis ACL rule, mapped to a Redis Software ACL object. |
| `RedisEnterpriseRole` | Database | A management role and/or ACL applied to one or more REDBs selected by `spec.scopes`. |
| `RedisEnterpriseRoleBinding` | Database | Assigns a `RedisEnterpriseRole` to a user. |
| `RedisEnterpriseClusterRole` | Cluster | A management role and/or ACL applied across every REDB in the cluster. |
| `RedisEnterpriseClusterRoleBinding` | Cluster | Assigns a `RedisEnterpriseClusterRole` to a user. |

When you apply one of these resources, the operator:

1. Validates the spec.
2. Creates or updates the matching object in Redis Software.
3. Reports the resolved Redis Software UID and other state in the resource's `status`.
4. Emits Kubernetes events on reconciliation problems.

## Roles and bindings

The role and binding CRDs follow the same pattern as Kubernetes' own RBAC: a `Role` paired with a `RoleBinding` for the narrower scope, and a `ClusterRole` paired with a `ClusterRoleBinding` for cluster-wide access. The narrower scope is the unqualified default — that's why `RedisEnterpriseRole` (no qualifier) is the database-scoped kind, while `RedisEnterpriseClusterRole` carries the explicit `Cluster` prefix.

### Database scope vs. cluster scope

| | `RedisEnterpriseRole` | `RedisEnterpriseClusterRole` |
| --- | --- | --- |
| Scope | One or more REDBs | Every REDB in the cluster |
| Selects targets via | `spec.scopes` (REDB name or label selector) — required | No selector; applies cluster-wide |
| `managementRole` values | `DBMember`, `DBViewer`, `None` | `Admin`, `ClusterMember`, `ClusterViewer`, `DBMember`, `DBViewer`, `UserManager`, `None` |
| Binding kind | `RedisEnterpriseRoleBinding` | `RedisEnterpriseClusterRoleBinding` |

A `RedisEnterpriseClusterRole` applies to REDBs even when they're represented by resources in other namespaces — the access flows through Redis Software, not through explicit REDB references.

### What a role grants

Every role carries permissions on two independent planes. Set either, or both:

- **`spec.managementRole`** — Redis Software API and Cluster Manager UI permissions, chosen from the built-in roles listed in the table above. Same set of roles you'd assign in Cluster Manager today.
- **`spec.acls`** — a list of `RedisEnterpriseACL` references. Each ACL controls Redis data-path access (commands, key patterns, categories). Duplicate references are rejected; for different ACLs on different databases, create separate roles.

### How a user gets permissions

`RedisEnterpriseUser.spec` has no role references. Permissions reach a user through a binding:

1. Create a `RedisEnterpriseACL` if you need data-path access.
2. Create a `RedisEnterpriseRole` or `RedisEnterpriseClusterRole` that sets `managementRole`, references the ACL, or both.
3. Create a `RedisEnterpriseRoleBinding` or `RedisEnterpriseClusterRoleBinding` whose `roleRef` points at the role and whose `subjects` list includes the user.

The user's effective roles appear in `status.roles`. A user with no binding gets the Redis Software `none` role so it's never roleless, but it has zero permissions until a binding lands.

### Worked example

End-to-end: an ACL, a database-scoped role that uses it, a binding that hands the role to a user, and the user itself. All four resources live in the operator namespace.

```yaml
---
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseACL
metadata:
  name: read-only
spec:
  acl: "+@read ~*"
---
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseRole
metadata:
  name: orders-viewer
spec:
  managementRole: DBViewer
  scopes:
  - name: orders
  acls:
  - name: read-only
---
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseRoleBinding
metadata:
  name: alice-orders-viewer
spec:
  roleRef:
    name: orders-viewer
  subjects:
  - name: alice
---
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseUser
metadata:
  name: alice
spec:
  email: alice@example.com
  username: alice
  passwordSecrets:
  - name: alice-password
```

After applying this and a Secret named `alice-password` with a `password` key, Alice can sign in to Redis Software with `DBViewer` permissions on the `orders` REDB and run read-only Redis commands on every key in that database.

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
- **Role assignment lives on the binding, not the user.** In Redis Software, you assign roles by editing the user. On Kubernetes, you create a separate `RedisEnterpriseRoleBinding` or `RedisEnterpriseClusterRoleBinding`. See [Roles and bindings](#roles-and-bindings).
- **Passwords live in Kubernetes Secrets.** Each `RedisEnterpriseUser` references one or more Secrets. A `Rotatable` mode supports two Secrets at once for zero-downtime rotation. The operator marks Kubernetes Secrets immutable to prevent in-place edits.

## Known limitations

Access control resources are reconciled only in the operator namespace. Password Secrets must live in the same namespace, and database scopes resolve to REDBs in that namespace.

## In this section

- [Manage users]({{< relref "/operate/kubernetes/security/access-control/manage-users" >}}) — create `RedisEnterpriseUser` resources, rotate passwords, recover from lockouts.
- [Manage roles]({{< relref "/operate/kubernetes/security/access-control/manage-roles" >}}) — create database and cluster roles with the right scope and management permissions.
- [Manage ACLs]({{< relref "/operate/kubernetes/security/access-control/manage-acls" >}}) — create and update `RedisEnterpriseACL` resources used by roles.
- [Manage role bindings]({{< relref "/operate/kubernetes/security/access-control/manage-bindings" >}}) — assign roles to users with `RedisEnterpriseRoleBinding` and `RedisEnterpriseClusterRoleBinding`.
- [Migrate from REDB rolesPermissions]({{< relref "/operate/kubernetes/security/access-control/migrate-rolespermissions" >}}) — move from the deprecated `RedisEnterpriseDatabase.spec.rolesPermissions` field to the new CRD model.

## Related topics

- [Redis Software for Kubernetes operator API reference]({{< relref "/operate/kubernetes/reference/api" >}}) — field-by-field specification for every CRD in the `app.redislabs.com/v1alpha1` group.
- [Redis databases (REDB)]({{< relref "/operate/kubernetes/re-databases" >}}) — the resources that role scopes resolve against.
