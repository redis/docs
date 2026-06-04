---
Title: Manage roles
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Create RedisEnterpriseRole and RedisEnterpriseClusterRole resources to grant Redis Software permissions on Kubernetes.
linkTitle: Manage roles
weight: 20
---

A role defines a reusable set of Redis Software permissions — Cluster Manager and API access, Redis data-path access, or both — that you grant to users by creating a binding. Redis Software for Kubernetes supports two role kinds, one scoped to one or more databases, the other scoped to the entire cluster:

- `RedisEnterpriseRole` — applies to one or more REDBs selected by `spec.scopes`. Use when you want to grant access to a specific database or set of databases.
- `RedisEnterpriseClusterRole` — applies cluster-wide, across every REDB. Use for administrative access or for permissions you want everywhere.

For details on how roles and bindings work together, see [Roles and bindings]({{< relref "/operate/kubernetes/security/access-control/_index#roles-and-bindings" >}}). To assign a role to a user, see [Manage role bindings]({{< relref "/operate/kubernetes/security/access-control/manage-bindings" >}}).

## Before you start

- Requires Redis for Kubernetes operator 8.0.24-TBD or later.
- The role resource must live in the operator namespace. Database scopes resolve to REDBs in that namespace.
- Decide whether you need [management permissions](#choose-a-management-role), [data-path permissions](#attach-acls), or both.
- If the role references one or more `RedisEnterpriseACL` resources, create those first. See [Manage ACLs]({{< relref "/operate/kubernetes/security/access-control/manage-acls" >}}).

## Choose a management role

`spec.managementRole` picks a Redis Software built-in role that controls API and Cluster Manager UI permissions. The allowed values differ by CRD:

| CRD | Allowed `managementRole` values |
| --- | --- |
| `RedisEnterpriseRole` | `DBMember`, `DBViewer`, `None` |
| `RedisEnterpriseClusterRole` | `Admin`, `ClusterMember`, `ClusterViewer`, `DBMember`, `DBViewer`, `UserManager`, `None` |

`None` grants no management permissions and is the default when `managementRole` is omitted. For what each Redis Software role grants, see [Cluster-scoped role definitions]({{< relref "/operate/rs/security/access-control/create-cluster-roles" >}}) and [Database-scoped role definitions]({{< relref "/operate/rs/security/access-control/create-db-roles" >}}).

## Create a database role

A `RedisEnterpriseRole` must reference at least one database in `spec.scopes`. Each scope picks REDBs by name or by label selector — not both.

### Scope a role by REDB name

```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseRole
metadata:
  name: orders-viewer
spec:
  managementRole: DBViewer
  scopes:
  - kind: RedisEnterpriseDatabase
    name: orders
  acls:
  - kind: RedisEnterpriseACL
    name: read-only
```

`kind` defaults to `RedisEnterpriseDatabase` and can be omitted.

To scope a role to several databases by name, list each one as its own scope entry:

```yaml
spec:
  managementRole: DBViewer
  scopes:
  - name: orders
  - name: customers
  - name: inventory
  acls:
  - name: read-only
```

Every ACL in `spec.acls` applies to every REDB in `spec.scopes`. If a database needs a different ACL, create a separate role for it.

### Scope a role by label selector

Use a selector when you want the role to follow a set of REDBs that share labels, rather than naming each one:

```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseRole
metadata:
  name: prod-db-viewer
spec:
  managementRole: DBViewer
  scopes:
  - selector:
      matchLabels:
        environment: production
  acls:
  - name: read-only
```

`selector.matchExpressions` is also supported.

### Scope rules

- At least one entry in `spec.scopes` is required.
- Each scope must set `name` or `selector`, not both.
- `scopes[].kind` must be `RedisEnterpriseDatabase` or empty.

## Create a cluster-scoped role

A `RedisEnterpriseClusterRole` has no `scopes` field — it applies across every REDB in the Redis Software cluster.

```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseClusterRole
metadata:
  name: support-readonly
spec:
  managementRole: ClusterViewer
  acls:
  - name: read-only
```

Common patterns:

- **Read-only operator** — `managementRole: ClusterViewer`, no ACL.
- **Cluster admin** — `managementRole: Admin`, no ACL. Use sparingly; consider a [default-user]({{< relref "/operate/rs/security/access-control/manage-users/default-user" >}}) alternative for break-glass access.
- **User-manager-only** — `managementRole: UserManager`, no ACL. Lets a delegated administrator manage users without granting database access.
- **Cluster-wide data access** — `managementRole: None` (or omit) with one or more `acls`. The ACLs apply to every REDB in the cluster.

## Attach ACLs

Both role kinds carry a list of `RedisEnterpriseACL` references in `spec.acls`. Each ACL grants Redis data-path permissions (commands, key patterns, categories) to users who hold the role.

```yaml
spec:
  acls:
  - kind: RedisEnterpriseACL
    name: read-only
  - name: customer-data    # kind defaults to RedisEnterpriseACL
```

Rules:

- `acls[].kind` must be `RedisEnterpriseACL` or empty.
- Duplicate `name` entries are rejected.
- For a `RedisEnterpriseRole`, every referenced ACL applies to every database the role's scopes select. If you need different ACLs for different databases, create separate roles.
- For a `RedisEnterpriseClusterRole`, ACLs apply to every REDB in the cluster.

Set `spec.managementRole` alone, `spec.acls` alone, or both. A role with neither set effectively grants nothing.

## Update a role

`kubectl apply` (or `kubectl edit`) updates the underlying Redis Software role. The operator reconciles changes to:

- `managementRole` — replaces the management permission set on the Redis Software role.
- `scopes` — re-resolves which REDBs the role attaches to. REDBs that drop out of the scope have the role's permissions removed.
- `acls` — re-applies the data-path permissions to scoped REDBs (or cluster-wide for cluster roles).

`status.observedGeneration` reaches the resource's `metadata.generation` once the update has been applied.

## Inspect role status

The `status` block is intentionally minimal:

| Field | Meaning |
| --- | --- |
| `uid` | Internal Redis Software role UID. Present once the role has reconciled successfully. A role must have a `uid` before it can contribute permissions to any database. |
| `observedGeneration` | The `metadata.generation` the operator last acted on. Compare with `metadata.generation` to confirm the latest spec has been processed. |

To see which users currently hold the role, list bindings that reference it:

```sh
kubectl get redisenterpriserolebinding -o yaml | \
  yq '.items[] | select(.spec.roleRef.name == "orders-viewer")'
```

For cluster roles, replace `redisenterpriserolebinding` with `redisenterpriseclusterrolebinding`.

## Delete a role

Delete any bindings that reference the role first, then delete the role:

```sh
kubectl delete redisenterpriserolebinding --selector app=orders
kubectl delete redisenterpriserole orders-viewer
```

If a binding still references the role at the moment of deletion, Redis Software may reject the delete and the operator emits a `RoleDeletionBlocked` event. Resolve the blocking binding and retry.

## Troubleshoot

Watch reconciliation events with `kubectl describe redisenterpriserole <name>` (or `redisenterpriseclusterrole`). Common issues:

- **`status.uid` is empty** — The role hasn't reconciled. Check the events. Common causes: an ACL reference points to a non-existent `RedisEnterpriseACL`, or admission rejected the spec (missing scopes, scope with both `name` and `selector`, wrong `kind`).
- **Scope selector matches nothing** — A label-selector scope is valid even if no REDB currently matches. The role contributes permissions only to REDBs that match at reconcile time. Add the labels or fix the selector.
- **Permissions don't reach the database** — Check `status.uid` on the role, the matching REDB's `status.rolesPermissions`, and confirm a binding assigns the role to the user.
- **`RoleDeletionBlocked`** — A binding still references the role in Redis Software. Delete the binding first.

For full field details, see the [`RedisEnterpriseRole`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_role_api" >}}) and [`RedisEnterpriseClusterRole`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_role_api" >}}) API reference.

## Related topics

- [Roles and bindings]({{< relref "/operate/kubernetes/security/access-control/_index#roles-and-bindings" >}}) — the conceptual model.
- [Manage role bindings]({{< relref "/operate/kubernetes/security/access-control/manage-bindings" >}}) — assign a role to a user.
- [Manage ACLs]({{< relref "/operate/kubernetes/security/access-control/manage-acls" >}}) — define the data-path permissions a role references.
- [Manage users]({{< relref "/operate/kubernetes/security/access-control/manage-users" >}}) — create the users that bindings target.
- [Migrate from REDB rolesPermissions]({{< relref "/operate/kubernetes/security/access-control/migrate-rolespermissions" >}}) — move from the deprecated `RedisEnterpriseDatabase.spec.rolesPermissions` field to the new CRD model.
