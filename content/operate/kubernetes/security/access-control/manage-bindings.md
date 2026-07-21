---
Title: Manage role bindings
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Assign roles to users with RedisEnterpriseRoleBinding and RedisEnterpriseClusterRoleBinding resources.
linkTitle: Manage role bindings
weight: 40
---

A role binding assigns a role to one or more users. Redis Software for Kubernetes supports two binding kinds, one for database-scoped roles and one for cluster-scoped roles:

- `RedisEnterpriseRoleBinding` — binds a `RedisEnterpriseRole` (database-scoped) to users.
- `RedisEnterpriseClusterRoleBinding` — binds a `RedisEnterpriseClusterRole` (cluster-scoped) to users.

Both have the same two spec fields: `roleRef` points at a single role, and `subjects` lists the users who receive it. A user holds the permissions defined by every role bound to it across all bindings.

For the conceptual model and a complete end-to-end example, see [Roles and bindings]({{< relref "/operate/kubernetes/security/access-control/_index#roles-and-bindings" >}}).

## Common patterns

Each binding references exactly one role through `roleRef` and lists up to 100 subjects. A user can be the subject of many bindings, so you grant a user multiple roles by creating multiple bindings. Beyond that, the CRD model doesn't enforce a granularity — pick one of these patterns and stick with it across the namespace to make audits and reviews predictable:

- **One binding per role, many subjects** — every user with the role lives in one resource. A single apply changes access for every user at once, which can be either a feature or a hazard depending on the change.
- **One binding per user-role pair** — most verbose, but each grant is a discrete resource. Useful for attributing changes in GitOps and for scoping Kubernetes RBAC permissions on individual bindings.

## Before you start

- Requires Redis Software for Kubernetes operator 8.2.0-12 or later.
- The binding resource, the role it references, and any `RedisEnterpriseUser` subjects must all live in the operator namespace.
- Create the role before the binding when possible. The operator still admits a binding that references a missing role — the binding stays unresolved until the role lands.

## Create a database role binding

`RedisEnterpriseRoleBinding` references a `RedisEnterpriseRole` and a list of subjects:

```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseRoleBinding
metadata:
  name: alice-orders-viewer
spec:
  roleRef:
    kind: RedisEnterpriseRole
    name: orders-viewer
  subjects:
  - kind: RedisEnterpriseUser
    name: alice
```

`kind` on `roleRef` defaults to `RedisEnterpriseRole` and can be omitted. Subjects default to `RedisEnterpriseUser` the same way.

To grant the same role to several users, list them as separate subjects:

```yaml
spec:
  roleRef:
    name: orders-viewer
  subjects:
  - name: alice
  - name: bob
  - name: carol
```

### Apply order doesn't matter

The operator admits a binding even when the role it references doesn't exist yet. The binding stays unresolved until the role lands, and the user picks up the role on the next reconcile. This lets `kubectl apply -f manifests/` work regardless of file order.

While the role is missing, the affected user's `RolesBound` condition is `False` with reason `RoleNotFound`:

```sh
kubectl get redisenterpriseuser alice -o jsonpath='{.status.conditions[?(@.type=="RolesBound")]}'
```

The condition flips to `True` once the missing role exists and reconciles.

## Create a cluster role binding

`RedisEnterpriseClusterRoleBinding` has the same shape but references a `RedisEnterpriseClusterRole`:

```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseClusterRoleBinding
metadata:
  name: ops-admins
spec:
  roleRef:
    kind: RedisEnterpriseClusterRole
    name: cluster-admin
  subjects:
  - name: alice
  - name: bob
```

A cluster role binding grants the role across every REDB in the cluster, including REDBs represented by resources in other namespaces. Reserve cluster role bindings for administrators who need cluster-wide access.

## Subjects

Each entry in `spec.subjects` references a `RedisEnterpriseUser` in the operator namespace. `spec.subjects[].kind` can be left empty or set to `RedisEnterpriseUser`, and `name` is the resource's `metadata.name`:

```yaml
spec:
  subjects:
  - kind: RedisEnterpriseUser
    name: alice
  - name: bob    # kind defaults to RedisEnterpriseUser
```

A binding can list up to 100 subjects. To grant the role to more users, create additional bindings that reference the same role.

## Update a binding

Edit `spec.subjects` to add or remove users from the role, or change `roleRef` to point at a different role.

- **Add a user** — append a new entry to `subjects` and apply. The user picks up the role on the next reconcile.
- **Remove a user** — delete the entry from `subjects`. The user loses the role; other subjects in the binding keep their access.
- **Replace the role** — change `roleRef.name`. Subjects lose the old role and gain the new one. Consider creating a new binding instead if you need a staged rollout.

A user's effective roles appear in `status.roles` on the `RedisEnterpriseUser`.

## Find bindings that reference a role or user

Before renaming or deleting a role, find every binding that points at it:

```sh
kubectl get redisenterpriserolebinding -o json | \
  jq '.items[] | select(.spec.roleRef.name == "orders-viewer") | .metadata.name'
kubectl get redisenterpriseclusterrolebinding -o json | \
  jq '.items[] | select(.spec.roleRef.name == "orders-viewer") | .metadata.name'
```

To find every binding that grants a role to a specific user:

```sh
kubectl get redisenterpriserolebinding -o json | \
  jq '.items[] | select(.spec.subjects[]?.name == "alice") | .metadata.name'
kubectl get redisenterpriseclusterrolebinding -o json | \
  jq '.items[] | select(.spec.subjects[]?.name == "alice") | .metadata.name'
```

## Inspect binding status

The binding's own `status` block is empty. To see whether a binding has actually granted permissions, check the referenced user instead:

```sh
kubectl get redisenterpriseuser alice -o jsonpath='{.status.roles}'
```

## Delete a binding

```sh
kubectl delete redisenterpriserolebinding alice-orders-viewer
```

Removing the binding revokes the role from every subject listed in it. If you delete the only binding that granted a user any role, the operator falls back to assigning the `none` role so the user is never roleless.

## Troubleshoot

Watch reconciliation events with `kubectl describe redisenterpriserolebinding <name>` (or `redisenterpriseclusterrolebinding`). Since bindings are observed by the user controller, the most useful diagnostic signals appear on the user resource:

- **The user's `RolesBound` condition is `False` with reason `RoleNotFound`** — A binding references this user but points at a role that doesn't exist. Either create the missing role or fix `roleRef.name`. See [Apply order doesn't matter](#apply-order-doesnt-matter).
- **User has permissions you didn't expect** — Multiple bindings may be granting the same user different roles. Use the recipes in [Find bindings that reference a role or user](#find-bindings-that-reference-a-role-or-user) to list everything that targets the user.
- **`MissingRoleUIDs` event on a user** — Redis Software has role UIDs assigned to the user that the operator can't trace back to any Kubernetes role resource. This typically means roles were granted directly through the Redis Software REST API or Cluster Manager UI, bypassing the CRD model. Recreate the assignment as a `RedisEnterpriseRoleBinding` (or `RedisEnterpriseClusterRoleBinding`) so the CRD model is the source of truth, then revoke the direct assignment.

For full field details, see the [`RedisEnterpriseRoleBinding`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_role_binding_api" >}}) and [`RedisEnterpriseClusterRoleBinding`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_role_binding_api" >}}) API reference.

## Related topics

- [Roles and bindings]({{< relref "/operate/kubernetes/security/access-control/_index#roles-and-bindings" >}}) — the conceptual model and an end-to-end example.
- [Manage roles]({{< relref "/operate/kubernetes/security/access-control/manage-roles" >}}) — create the roles a binding references.
- [Manage users]({{< relref "/operate/kubernetes/security/access-control/manage-users" >}}) — create the users a binding lists as subjects.
