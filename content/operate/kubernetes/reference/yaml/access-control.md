---
Title: Access control examples
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: YAML examples for managing Redis Software users, roles, role bindings, and ACLs with custom resources.
linkTitle: Access control
weight: 50
---

This page provides YAML examples for role-based access control (RBAC) in Redis Software for Kubernetes. These custom resources let you manage users, roles, and data access permissions declaratively, instead of configuring them through the Redis Software admin console or REST API.

For task instructions, see [Access control]({{< relref "/operate/kubernetes/security/access-control" >}}).

## Applying the configuration

Apply these resources in dependency order. Roles reference ACLs and databases, and bindings reference roles and users, so a resource that points at something not yet created stays unreconciled until it exists.

1. ACLs and users, in any order
2. Roles and cluster roles
3. Role bindings and cluster role bindings

```sh
kubectl apply -f <filename>
```

The examples on this page form one working configuration. Together they grant a read-only user access to a single database, and an admin user full access to the cluster:

| Resource | Name | Grants |
|---|---|---|
| `RedisEnterpriseACL` | `read-only` | Read commands on all keys |
| `RedisEnterpriseACL` | `full-access` | All commands on all keys |
| `RedisEnterpriseUser` | `some-db-user` | — |
| `RedisEnterpriseUser` | `some-admin-user` | — |
| `RedisEnterpriseRole` | `db-reader` | `DBViewer` on database `redb`, with the `read-only` ACL |
| `RedisEnterpriseClusterRole` | `cluster-admin` | `Admin` across the cluster, with the `full-access` ACL |
| `RedisEnterpriseRoleBinding` | `db-reader` | Binds `db-reader` to `some-db-user` |
| `RedisEnterpriseClusterRoleBinding` | `cluster-admin` | Binds `cluster-admin` to `some-admin-user` |

The role example scopes access to a database named `redb`, which the [basic deployment examples]({{< relref "/operate/kubernetes/reference/yaml/basic-deployment" >}}) create. Change the name to match your own database.

## ACL examples

A RedisEnterpriseACL defines data access permissions using [Redis ACL syntax]({{< relref "/operate/oss_and_stack/management/security/acl" >}}). Roles reference an ACL to grant those permissions to their subjects.

`redis-enterprise-acl.yaml` grants read-only access to all keys.

{{<embed-yaml "k8s/reacl.md" "redis-enterprise-acl.yaml">}}

`redis-enterprise-acl-full-access.yaml` grants all commands on all keys.

{{<embed-yaml "k8s/reacl_full_access.md" "redis-enterprise-acl-full-access.yaml">}}

### REACL configuration

- [spec.acl]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_acl_api#spec" >}}): The ACL expression that defines which commands and keys the ACL permits

## User examples

A RedisEnterpriseUser creates a user in the Redis Software cluster. The user has no permissions until a role binding assigns a role to it.

`redis-enterprise-user.yaml` creates the database user.

{{<embed-yaml "k8s/reuser.md" "redis-enterprise-user.yaml">}}

`redis-enterprise-user-admin.yaml` creates the admin user.

{{<embed-yaml "k8s/reuser_admin.md" "redis-enterprise-user-admin.yaml">}}

### REUSER configuration

- [spec.username]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_user_api#spec" >}}): The username used to connect to a database or sign in to Redis Software. Must be unique within the cluster. If you omit it, the operator assigns a default username, reported in the resource's status.
- [spec.email]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_user_api#spec" >}}): The user's email address. Optional.
- [spec.passwordSecrets]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_user_api#specpasswordsecrets" >}}): One or more secrets holding the user's password. Each secret must have a key named `password`.

Create the referenced secret before you apply the user. When a binding's `subjects` list refers to this user, it uses the resource name in `metadata.name`, not `spec.username`.

## Role examples

A RedisEnterpriseRole grants database-scoped permissions. It combines a management role, the databases it applies to, and an optional ACL for data access.

`redis-enterprise-role.yaml` grants read-only access to a single database.

{{<embed-yaml "k8s/rerole.md" "redis-enterprise-role.yaml">}}

### REROLE configuration

- [spec.managementRole]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_role_api#spec" >}}): The management permissions this role grants. RedisEnterpriseRole supports only database-scoped roles: `DBMember`, `DBViewer`, or `None`. Defaults to `None` if omitted.
- [spec.scopes]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_role_api#specscopes" >}}): The databases this role applies to. Reference them by name, or select them with a label selector.
- [spec.acl]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_role_api#specacl" >}}): The data access permissions the role grants within those databases

## Cluster role examples

A RedisEnterpriseClusterRole grants permissions across the whole cluster rather than specific databases. Its ACL, if set, applies to every database in the cluster.

`redis-enterprise-cluster-role.yaml` grants full administrative access.

{{<embed-yaml "k8s/recrole.md" "redis-enterprise-cluster-role.yaml">}}

### RECROLE configuration

- [spec.managementRole]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_role_api#spec" >}}): The management permissions this role grants. Cluster roles support the full set: `Admin`, `UserManager`, `ClusterMember`, `ClusterViewer`, `DBMember`, `DBViewer`, or `None`. Defaults to `None` if omitted.
- [spec.acl]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_role_api#specacl" >}}): The data access permissions the role grants across all databases in the cluster. Optional.

## Role binding examples

A RedisEnterpriseRoleBinding assigns a RedisEnterpriseRole to one or more subjects.

`redis-enterprise-role-binding.yaml` binds the `db-reader` role to the database user.

{{<embed-yaml "k8s/rerolebinding.md" "redis-enterprise-role-binding.yaml">}}

### REROLEBINDING configuration

- [spec.roleRef]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_role_binding_api#specroleref" >}}): The RedisEnterpriseRole this binding assigns
- [spec.subjects]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_role_binding_api#specsubjects" >}}): The users the role is assigned to, referenced by resource name

## Cluster role binding examples

A RedisEnterpriseClusterRoleBinding assigns a RedisEnterpriseClusterRole to one or more subjects.

`redis-enterprise-cluster-role-binding.yaml` binds the `cluster-admin` role to the admin user.

{{<embed-yaml "k8s/recrolebinding.md" "redis-enterprise-cluster-role-binding.yaml">}}

### RECROLEBINDING configuration

- [spec.roleRef]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_role_binding_api#specroleref" >}}): The RedisEnterpriseClusterRole this binding assigns
- [spec.subjects]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_role_binding_api#specsubjects" >}}): The users the role is assigned to, referenced by resource name

## Related documentation

- [Access control]({{< relref "/operate/kubernetes/security/access-control" >}})
- [Manage users]({{< relref "/operate/kubernetes/security/access-control/manage-users" >}})
- [Manage roles]({{< relref "/operate/kubernetes/security/access-control/manage-roles" >}})
- [Manage ACLs]({{< relref "/operate/kubernetes/security/access-control/manage-acls" >}})
- [Manage bindings]({{< relref "/operate/kubernetes/security/access-control/manage-bindings" >}})
- [REACL API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_acl_api" >}})
- [REUSER API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_user_api" >}})
- [REROLE API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_role_api" >}})
- [RECROLE API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_role_api" >}})
- [REROLEBINDING API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_role_binding_api" >}})
- [RECROLEBINDING API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_role_binding_api" >}})
