---
Title: Manage ACLs
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Create and update RedisEnterpriseACL resources to control Redis data-path permissions on Kubernetes.
linkTitle: Manage ACLs
weight: 30
---

A `RedisEnterpriseACL` resource holds a Redis ACL rule that controls which commands, keys, and categories a user can access at the Redis data path. The operator reconciles the resource into a Redis Software ACL object that roles can reference.

ACLs are reusable: one `RedisEnterpriseACL` can be attached to any number of `RedisEnterpriseRole` or `RedisEnterpriseClusterRole` resources. The role decides which databases the ACL applies to; the ACL itself just defines the rule.

To grant a user the permissions in an ACL, reference the ACL from a role and bind the role to the user. See [Manage roles]({{< relref "/operate/kubernetes/security/access-control/manage-roles" >}}) and [Manage role bindings]({{< relref "/operate/kubernetes/security/access-control/manage-bindings" >}}).

## Before you start

- Requires Redis Software for Kubernetes operator 8.2.0-12 or later.
- The `RedisEnterpriseACL` resource must live in the operator namespace.
- The rule string uses Redis ACL syntax — key patterns, command categories, and explicit commands. See [Redis ACL overview]({{< relref "/operate/rs/security/access-control/redis-acl-overview" >}}) for the full syntax.

## Create an ACL

`spec.acl` is a single Redis ACL rule string.

```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseACL
metadata:
  name: read-only
spec:
  acl: "+@read ~*"
```

Apply the resource and confirm reconciliation:

```sh
kubectl apply -f read-only-acl.yaml
kubectl get redisenterpriseacl read-only -o yaml
```

`status.uid` holds the Redis Software ACL UID once the operator has created the object.

### Common rule patterns

| Use case | Rule |
| --- | --- |
| Read-only access to all keys | `+@read ~*` |
| Read and write access to all keys | `+@all ~*` |
| Read-only access to a key prefix | `+@read ~customer:*` |
| A specific command set | `+get +set +del ~app:*` |
| Block dangerous commands | `+@all -@dangerous ~*` |

For category names (`@read`, `@write`, `@admin`, `@dangerous`, etc.) and the full operator precedence rules, see [Redis ACL overview]({{< relref "/operate/rs/security/access-control/redis-acl-overview" >}}).

## Update an ACL

Edit `spec.acl` and re-apply. The operator updates the Redis Software ACL object in place, so the change immediately affects every database that uses the ACL through a role.

```sh
kubectl edit redisenterpriseacl read-only
```

`status.observedGeneration` reaches the resource's `metadata.generation` once the update has been applied.

An update changes effective permissions for every connected user. Treat ACL changes the same way as role changes: validate them on a non-production cluster first. For a safer rollout, create a new ACL and swap the role reference instead of editing the existing ACL in place.

## Inspect ACL status

The `status` block is minimal:

| Field | Meaning |
| --- | --- |
| `uid` | Internal Redis Software ACL UID. Present once reconciliation succeeds. |
| `observedGeneration` | The `metadata.generation` the operator last acted on. |

To find roles that reference this ACL, scan the role resources:

```sh
kubectl get redisenterpriserole -o yaml | \
  yq '.items[] | select(.spec.acl.name == "read-only") | .metadata.name'
kubectl get redisenterpriseclusterrole -o yaml | \
  yq '.items[] | select(.spec.acl.name == "read-only") | .metadata.name'
```

## Delete an ACL

Delete or modify any roles that reference the ACL first (modify them to no longer reference it), then delete the ACL itself:

```sh
kubectl delete redisenterpriseacl read-only
```

If a role still references the ACL, Redis Software may reject the deletion. The operator emits an `RSOperationFailed` event with the underlying message. Remove the reference (or delete the role) and retry.

## Troubleshoot

Watch reconciliation events with `kubectl describe redisenterpriseacl <name>`. Common events:

| Event | Meaning |
| --- | --- |
| `RSObjectNotFound` | The Redis Software ACL the resource previously resolved against no longer exists. The operator will recreate it on the next reconcile. |
| `RSOperationFailed` | A Redis Software API call failed. The message typically includes the syntax error or in-use conflict. |

Other things to check:

- **`status.uid` is empty** — The operator hasn't reconciled the ACL yet, or Redis Software rejected the rule. Check the events for an `RSOperationFailed` with the syntax message.
- **Rule parses but grants nothing** — A common cause is an explicit `-@all` later in the rule overriding earlier `+` clauses. Redis ACL evaluation is order-sensitive; see the [Redis ACL overview]({{< relref "/operate/rs/security/access-control/redis-acl-overview" >}}).
- **Delete is blocked** — A `RedisEnterpriseRole` or `RedisEnterpriseClusterRole` still references the ACL in `spec.acl`. Remove the reference or delete the role first.

For full field details, see the [`RedisEnterpriseACL`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_acl_api" >}}) API reference.

## Related topics

- [Redis ACL overview]({{< relref "/operate/rs/security/access-control/redis-acl-overview" >}}) — rule syntax, categories, and evaluation order.
- [Manage roles]({{< relref "/operate/kubernetes/security/access-control/manage-roles" >}}) — attach ACLs to `RedisEnterpriseRole` and `RedisEnterpriseClusterRole` resources.
- [Manage role bindings]({{< relref "/operate/kubernetes/security/access-control/manage-bindings" >}}) — grant the role to a user.
