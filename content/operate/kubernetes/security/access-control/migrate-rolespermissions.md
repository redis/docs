---
Title: Migrate from REDB rolesPermissions
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Move database role assignments from the deprecated RedisEnterpriseDatabase.spec.rolesPermissions field to the RBAC CRD model.
linkTitle: Migrate from REDB rolesPermissions
weight: 50
---

`RedisEnterpriseDatabase.spec.rolesPermissions` assigns Redis Software role and ACL names directly to a database. The field is deprecated, replaced by the RBAC CRDs (`RedisEnterpriseRole`, `RedisEnterpriseACL`, and bindings), which let you manage roles, ACLs, and assignments as Kubernetes resources.

This page covers moving an existing database from `rolesPermissions` to the CRD model, then disabling the deprecated field at the cluster level.

## Before you start

- Every user who currently holds access through `rolesPermissions` must exist as a `RedisEnterpriseUser` resource before you can bind a CRD role to them. If you created users through the Redis Software REST API or Cluster Manager UI, migrate them first. See [Manage users]({{< relref "/operate/kubernetes/security/access-control/manage-users" >}}).
- List which Redis Software users hold each role. The CRD inventory only captures the database side of the assignment; the user-to-role mapping lives in Redis Software. Pull it from the Cluster Manager UI or the [Redis Software users REST API]({{< relref "/operate/rs/references/rest-api/objects/user" >}}).

## How the two sources interact

By default, the operator reconciles both sources of database role permissions:

- The deprecated `RedisEnterpriseDatabase.spec.rolesPermissions` list on each REDB.
- Permissions derived from `RedisEnterpriseRole` resources that scope to the REDB.

The operator merges and de-duplicates the two sets before sending them to Redis Software. `RedisEnterpriseDatabase.status.rolesPermissions` shows the merged result:

- Entries from the deprecated field use Redis Software's internal role and ACL names.
- Entries from CRDs reference `RedisEnterpriseRole` and `RedisEnterpriseACL` resources.

You can run both sources in parallel during migration. Once every database is completely migrated, disable the deprecated field cluster-wide (see [Disable the deprecated field](#disable-the-deprecated-field)).

## Migrate a database

For each database, capture what `rolesPermissions` currently grants, recreate it as CRDs, verify the result, then remove the deprecated field.

### 1. Inventory the existing entries

List the `rolesPermissions` entries on every REDB in the operator namespace:

```sh
kubectl get redisenterprisedatabase -o yaml | \
  yq '.items[] | {name: .metadata.name, rolesPermissions: .spec.rolesPermissions}'
```

Each entry has a `role` (Redis Software role name) and an `acl` (Redis Software ACL name). The `type` is always `redis-enterprise`.

### 2. Create RedisEnterpriseACL resources

For every distinct ACL name in the inventory, create a `RedisEnterpriseACL` resource that holds the same rule string. See [Manage ACLs]({{< relref "/operate/kubernetes/security/access-control/manage-acls" >}}).

```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseACL
metadata:
  name: read-only
spec:
  acl: "+@read ~*"
```

The resource `metadata.name` doesn't have to match the original Redis Software ACL name, but matching makes the merged `status.rolesPermissions` easier to read.

### 3. Create RedisEnterpriseRole resources

For each role-ACL-REDB combination in the inventory, create a `RedisEnterpriseRole` scoped to the target REDB. See [Manage roles]({{< relref "/operate/kubernetes/security/access-control/manage-roles" >}}).

```yaml
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
```

Set `managementRole` to match the Redis Software role's management level. If the original entry only granted data-path access, omit `managementRole` — it defaults to `None`.

If the same role-ACL pair applies to more than one REDB, collapse them into a single `RedisEnterpriseRole` with multiple `scopes` entries instead of creating one role per REDB:

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

### 4. Create bindings for affected users

For each user that previously gained access through `rolesPermissions`, create a `RedisEnterpriseRoleBinding` that references the new role. See [Manage role bindings]({{< relref "/operate/kubernetes/security/access-control/manage-bindings" >}}).

```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseRoleBinding
metadata:
  name: alice-orders-viewer
spec:
  roleRef:
    name: orders-viewer
  subjects:
  - name: alice
```

### 5. Verify

Confirm Redis Software still grants the expected access:

```sh
kubectl get redisenterprisedatabase orders -o yaml | \
  yq '.status.rolesPermissions'
```

The merged `status.rolesPermissions` shows entries from both sources. Before you remove the deprecated entries, authenticate as one of the affected users and run a Redis command the role allows:

```sh
redis-cli -h <db-endpoint> -p <db-port> --user alice --pass <password> GET some:key
```

Replace the endpoint and port with the values from the REDB's `status.publicService` (or `status.internalService`).

### 6. Remove the deprecated entries

Once verification passes, remove the migrated entries from `spec.rolesPermissions`:

```sh
kubectl edit redisenterprisedatabase orders
```

After the next reconcile, `status.rolesPermissions` should contain only CRD-derived entries. Repeat for every REDB.

## Disable the deprecated field

After every database is completely migrated, switch the cluster policy to ignore `spec.rolesPermissions` so no one can re-introduce it:

```yaml
apiVersion: app.redislabs.com/v1
kind: RedisEnterpriseCluster
metadata:
  name: rec
spec:
  accessControl:
    policy:
      allowREDBRolesPermissions: false
```

With `allowREDBRolesPermissions: false`:

- The operator stops reconciling `spec.rolesPermissions` on every REDB.
- The operator removes from Redis Software any permissions that came only from `spec.rolesPermissions`.
- The operator emits a `RolesPermissionsIgnored` event on any REDB that still has the deprecated field set.

The default is `true` (both sources reconciled). Set the flag back to `true` only as a rollback.

## Roll back

To revert to the deprecated field, set `allowREDBRolesPermissions: true` (or omit it) on the `RedisEnterpriseCluster` and re-add the previous entries to each REDB's `spec.rolesPermissions`. CRD-managed permissions continue to work in parallel.

## Troubleshoot

- **A user is missing access after you remove the deprecated entries** — A `RedisEnterpriseRole` or binding is missing for that user. Check `RedisEnterpriseUser.status.roles` against the original inventory and add the missing CRDs.
- **`status.rolesPermissions` is empty after migration** — The new roles haven't reconciled. Each `RedisEnterpriseRole` needs `status.uid` populated before it contributes to a REDB. Check the role's events.
- **`RolesPermissionsIgnored` event on a REDB after disabling the field** — A `spec.rolesPermissions` entry remains on the REDB. Edit the REDB and remove the field entirely.

## Related topics

- [Manage roles]({{< relref "/operate/kubernetes/security/access-control/manage-roles" >}}) — full details on `RedisEnterpriseRole` and `RedisEnterpriseClusterRole`.
- [Manage ACLs]({{< relref "/operate/kubernetes/security/access-control/manage-acls" >}}) — define the data-path permissions roles reference.
- [Manage role bindings]({{< relref "/operate/kubernetes/security/access-control/manage-bindings" >}}) — assign the new roles to users.
- [`RedisEnterpriseDatabase` API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api" >}}) — the source schema, including the deprecated `rolesPermissions` field.
- [`RedisEnterpriseCluster` API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api" >}}) — the `accessControl.policy.allowREDBRolesPermissions` flag.
