---
Title: Manage users
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Create and update Redis Software users on Kubernetes with the RedisEnterpriseUser custom resource.
linkTitle: Manage users
weight: 10
---

A `RedisEnterpriseUser` resource defines a Redis Software user. The operator creates the user in Redis Software and keeps it in sync with the resource. Passwords live in Kubernetes Secrets that the resource references by name.

This page covers creating users, changing passwords, and recovering locked accounts. To grant a user permissions, see [Manage role bindings]({{< relref "/operate/kubernetes/security/access-control/manage-bindings" >}}).

## Before you start

- Requires Redis Software for Kubernetes operator 8.0.24-TBD or later.
- The `RedisEnterpriseUser` resource and every referenced password Secret must live in the operator namespace.
- Passwords must satisfy the cluster's [password complexity rules]({{< relref "/operate/rs/security/access-control/manage-passwords/password-complexity-rules" >}}).
- To assign roles, you need a `RedisEnterpriseRole` or `RedisEnterpriseClusterRole` and a matching binding. See [Manage roles]({{< relref "/operate/kubernetes/security/access-control/manage-roles" >}}).

## Create a user

1. Create a Secret with the password under the key `password`:

    ```sh
    kubectl create secret generic alice-password \
      --from-literal=password='S0me-Str0ng-Passw0rd!'
    ```

2. Create the `RedisEnterpriseUser` resource:

    ```yaml
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

3. Apply the resource and confirm the operator created the user:

    ```sh
    kubectl apply -f alice.yaml
    kubectl get redisenterpriseuser alice -o yaml
    ```

    `status.uid` holds the Redis Software user ID once reconciliation succeeds. `status.signinStatus` reports the user's current sign-in state.

The new user has no permissions until you create a role binding. The operator assigns the Redis Software `none` role so the user is never roleless.

### Required and optional fields

| Field | Required | Notes |
| --- | --- | --- |
| `spec.email` | Yes | Must be unique in the cluster. |
| `spec.username` | No | Defaults to a generated value. ASCII only, excluding `&`, `<`, `>`, `"`. The effective value appears in `status.username`. |
| `spec.passwordSecrets` | Yes | At least one Secret. Each Secret must have a `password` key. |
| `spec.passwordMode` | No | `Single` (default) or `Rotatable`. See [Choose a password mode](#choose-a-password-mode). |
| `spec.alerts` | No | Email alert settings. Effective only when [cluster alerts]({{< relref "/operate/rs/clusters/configure/cluster-settings#alert-settings" >}}) are configured. |

For the full schema, see [`RedisEnterpriseUser`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_user_api" >}}).

### Use a generated username

If you omit `spec.username`, the operator assigns one and reports it in `status.username`. Read it with:

```sh
kubectl get redisenterpriseuser alice -o jsonpath='{.status.username}'
```

Use that value when you reference the user from a binding's `subjects` list or when you sign in to Redis Software.

## Choose a password mode

`spec.passwordMode` controls how passwords change.

- **`Single`** (default) — Exactly one entry in `passwordSecrets`. To change the password, update the value in the Secret or point the resource at a different Secret. Suitable for interactive users.
- **`Rotatable`** — One or two entries in `passwordSecrets`. The operator marks each referenced Kubernetes Secret immutable so the password can't be edited in place. Suitable for service accounts that need zero-downtime credential rotation. Vault-backed secrets are treated as immutable but aren't modified by the operator.

You can't switch modes while the user has two password secrets. Reduce to one secret first.

## Change a password

### Single mode

Edit the Secret value, then re-apply it. The operator detects the new version and updates the user's password.

```sh
kubectl create secret generic alice-password \
  --from-literal=password='N3w-Str0ng-Passw0rd!' \
  --dry-run=client -o yaml | kubectl apply -f -
```

Alternatively, create a new Secret and update `spec.passwordSecrets[0].name` to point at it.

### Rotatable mode (zero-downtime rotation)

In Rotatable mode the operator makes referenced Kubernetes Secrets immutable, so you rotate by adding a new Secret alongside the old one.

1. Create a new Secret with the next password.
2. Add it to `spec.passwordSecrets`. Both passwords now authenticate.
3. Update clients to use the new password.
4. Remove the old Secret from `spec.passwordSecrets`. Only the new password authenticates.
5. Delete the old Secret when nothing else references it.

`status.passwordSecrets` lists each active Secret with its resolved version.

## Update the email address

You can change `spec.email` only while `passwordSecrets` contains exactly one entry. If a Rotatable rotation is in progress, reduce to a single secret first, change the email, then add the second secret back.

## Configure email alerts

Email alerts deliver only when the cluster has alert email settings configured. The user's alerts have two layers: a master `enabled` toggle for the whole user, and a per-category toggle for cluster alerts. Database alerts are configured by listing the databases the user should receive alerts for:

```yaml
spec:
  alerts:
    enabled: true            # master toggle; required for any alert to deliver
    clusterAlerts:
      enabled: true          # opt in to cluster-level alerts
    databaseAlerts:
      databases:             # list specific databases, or omit to receive all
      - name: my-database
```

Omit `databaseAlerts.databases` to receive alerts for every database.

## Inspect user status

The `status` block reports observed state from Redis Software:

| Field | Meaning |
| --- | --- |
| `uid` | Internal Redis Software user ID. Appears once the user is reconciled. |
| `username` | Effective username, including any default the operator assigned. |
| `roles` / `rolesDisplay` | Roles currently bound to the user. |
| `signinStatus` | `Unknown`, `Active`, `Locked`, or `PasswordExpired`. |
| `passwordIssueDate` | When Redis Software last accepted the user's password. |
| `passwordSecrets` | Each referenced Secret with the resolved version the operator reconciled. |
| `observedGeneration` | The `metadata.generation` the operator last acted on. Compare with `metadata.generation` to confirm reconciliation has caught up. |
| `conditions` | The `RolesBound` condition reports whether every bound role resolves. |

## Recover a locked user

`status.signinStatus: Locked` means the user failed too many sign-in attempts. The operator skips password changes while the user is locked, so you must update the resource before unlocking — otherwise the operator can later reconcile the old desired password back onto the user.

1. Update the password in the `RedisEnterpriseUser` source of truth: change the referenced Secret value (Single mode) or add a new Secret reference (Rotatable mode).
2. Follow the [Redis Software unlock procedure]({{< relref "/operate/rs/security/access-control/manage-users/login-lockout#unlock-locked-user-accounts" >}}) to reset and unlock the account in the cluster.

`status.signinStatus: PasswordExpired` clears once you set a new password through the resource.

## Delete a user

Delete every binding that references the user before deleting the user itself. Use the recipes in [Find bindings that reference a role or user]({{< relref "/operate/kubernetes/security/access-control/manage-bindings#find-bindings-that-reference-a-role-or-user" >}}) to list them, delete each by name, then delete the user:

```sh
kubectl delete redisenterpriserolebinding alice-orders-viewer
kubectl delete redisenterpriseuser alice
```

The operator removes the user from Redis Software. A finalizer keeps the Kubernetes resource until the Redis Software user and any related Secret finalizers are cleaned up; deletion may take longer or stall if the Redis Software API is unavailable.

Password Secrets aren't deleted — remove them separately when nothing else references them.

## Troubleshoot

Watch reconciliation events with `kubectl describe redisenterpriseuser <name>`. Common events:

| Event | Meaning |
| --- | --- |
| `PasswordSecretMissing` | A name in `passwordSecrets` doesn't exist in the operator namespace. |
| `PasswordSecretInvalid` | The Secret exists but has no `password` key, or the value is empty. |
| `UserPasswordAdded` / `UserPasswordReplaced` / `UserPasswordDeleted` | Normal reconciliation actions. Useful for confirming a rotation step. |
| `UserLocked` | Password operations are skipped because the user is locked. See [Recover a locked user](#recover-a-locked-user). |
| `MissingRoleUIDs` | The user has Redis Software role UIDs that no longer map back to a Kubernetes role resource. |
| `RSObjectNotFound` | A Redis Software object the user previously resolved against is gone. |
| `RSOperationFailed` | A Redis Software API call failed; check the message for details. |

Other things to check:

- **`status.signinStatus: Unknown`** — The operator hasn't reconciled the user yet, or it can't read the referenced Secret. Check `PasswordSecretMissing` and `PasswordSecretInvalid` events.
- **`RolesBound` condition is `False` with reason `RoleNotFound`** — A binding references this user but points at a role that doesn't exist. Create the role or fix the binding.
- **Secret edit rejected** — In Rotatable mode the operator sets `immutable: true` on the Secret. Create a new Secret instead of editing an existing one.
- **Cluster Manager UI shows a different role than expected** — Roles come from `RedisEnterpriseRoleBinding` and `RedisEnterpriseClusterRoleBinding` resources, not from the user spec. Check the bindings, not the user.

## Related topics

- [Manage role bindings]({{< relref "/operate/kubernetes/security/access-control/manage-bindings" >}}) — assign roles to this user.
- [Default user]({{< relref "/operate/rs/security/access-control/manage-users/default-user" >}}) — the built-in cluster admin account, managed outside the CRD model.
- [Password complexity rules]({{< relref "/operate/rs/security/access-control/manage-passwords/password-complexity-rules" >}}) and [password expiration]({{< relref "/operate/rs/security/access-control/manage-passwords/password-expiration" >}}).
- [`RedisEnterpriseUser` API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_user_api" >}}).
