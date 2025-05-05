---
Title: Overview of Redis ACLs in Redis Enterprise Software
alwaysopen: false
categories:
- docs
- operate
- rs
description: An overview of Redis ACLs, syntax, and ACL command support in Redis Enterprise Software.
linkTitle: Redis ACL overview
weight: 17
aliases:
    - /operate/rs/security/access-control/rbac/configure-acl/
url: '/operate/rs/7.4/security/access-control/redis-acl-overview/'
---

Redis access control lists (Redis ACLs) allow you to define named permissions for specific Redis commands, keys, and pub/sub channels. You can use defined Redis ACLs for multiple databases and roles.

## Predefined Redis ACLs

Redis Enterprise Software provides one predefined Redis ACL named **Full Access**. This ACL allows all commands on all keys and cannot be edited.

## Redis ACL syntax

Redis ACLs are defined by a [Redis syntax]({{< relref "/operate/oss_and_stack/management/security/acl" >}}) where you specify the commands or command categories that are allowed for specific keys.

### Commands and categories

Redis ACL rules can allow or block specific [Redis commands]({{< relref "/commands" >}}) or [command categories]({{< relref "/operate/oss_and_stack/management/security/acl" >}}#command-categories).

- `+` includes commands

- `-` excludes commands

- `+@` includes command categories

- `-@` excludes command categories

The following example allows all `read` commands and the `SET` command:

```sh
+@read +SET
```

Module commands have several ACL limitations:

- [Redis modules]({{< relref "/operate/oss_and_stack/stack-with-enterprise" >}}) do not have command categories.

- Other [command category]({{< relref "/operate/oss_and_stack/management/security/acl" >}}#command-categories) ACLs, such as `+@read` and `+@write`, do not include Redis module commands. `+@all` is the only exception because it allows all Redis commands.

- You have to include individual module commands in a Redis ACL rule to allow them.

    For example, the following Redis ACL rule allows read-only commands and the RediSearch commands `FT.INFO` and `FT.SEARCH`:

    ```sh
    +@read +FT.INFO +FT.SEARCH
    ```

### Key patterns

To define access to specific keys or key patterns, use the following prefixes:

- `~` or `%RW~` allows read and write access to keys.

- `%R~` allows read access to keys.

- `%W~` allows write access to keys.

`%RW~`, `%R~`, and `%W~` are only supported for databases with Redis version 7.2 or later.

The following example allows read and write access to all keys that start with "app1" and read-only access to all keys that start with "app2":

```sh
~app1* %R~app2*
```

### Pub/sub channels

The `&` prefix allows access to [pub/sub channels]({{< relref "/develop/interact/pubsub" >}}) (only supported for databases with Redis version 6.2 or later).

To limit access to specific channels, include `resetchannels` before the allowed channels:

```sh
resetchannels &channel1 &channel2
```

### Selectors

[Selectors]({{< relref "/operate/oss_and_stack/management/security/acl" >}}#selectors) let you define multiple sets of rules in a single Redis ACL (only supported for databases with Redis version 7.2 or later). A command is allowed if it matches the base rule or any selector in the Redis ACL.

- `(<rule set>)` creates a new selector.

- `clearselectors` deletes all existing selectors for a user. This action does not delete the base ACL rule.

In the following example, the base rule allows `GET key1` and the selector allows `SET key2`:

```sh
+GET ~key1 (+SET ~key2)
```

## Default pub/sub permissions

Redis database version 6.2 introduced pub/sub ACL rules that determine which [pub/sub channels]({{< relref "/develop/interact/pubsub" >}}) a user can access.

The configuration option `acl-pubsub-default`, added in Redis Enterprise Software version 6.4.2, determines the cluster-wide default level of access for all pub/sub channels. Redis Enterprise Software uses the following pub/sub permissions by default:

- For versions 6.4.2 and 7.2, `acl-pubsub-default` is permissive (`allchannels` or `&*`) by default to accommodate earlier Redis versions.

- In future versions, `acl-pubsub-default` will change to restrictive (`resetchannels`). Restrictive permissions block all pub/sub channels by default, unless explicitly permitted by an ACL rule.

If you use ACLs and pub/sub channels, you should review your databases and ACL settings and plan to transition your cluster to restrictive pub/sub permissions in preparation for future Redis Enterprise Software releases.

### Prepare for restrictive pub/sub permissions

To secure pub/sub channels and prepare your cluster for future Redis Enterprise Software releases that default to restrictive pub/sub permissions:

1. Upgrade Redis databases:

    - For Redis Enterprise Software version 6.4.2, upgrade all databases in the cluster to Redis DB version 6.2.
    
    - For Redis Enterprise Software version 7.2, upgrade all databases in the cluster to Redis DB version 7.2 or 6.2.

1. Create or update ACLs with permissions for specific channels using the `resetchannels &channel` format.

1. Associate the ACLs with relevant databases.

1. Set default pub/sub permissions (`acl-pubsub-default`) to restrictive. See [Change default pub/sub permissions](#change-default-pubsub-permissions) for details.

1. If any issues occur, you can temporarily change the default pub/sub setting back to permissive. Resolve any problematic ACLs before making pub/sub permissions restrictive again.

{{<note>}}
When you change the cluster's default pub/sub permissions to restrictive, `&*` is added to the **Full Access** ACL. Before you make this change, consider the following:

- Because pub/sub ACL syntax was added in Redis 6.2, you can't associate the **Full Access** ACL with database versions 6.0 or lower after this change.

- The **Full Access** ACL is not reverted if you change `acl-pubsub-default` to permissive again.

- Every database with the default user enabled uses the **Full Access** ACL.
{{</note>}}

### Change default pub/sub permissions

As of Redis Enterprise version 6.4.2, you can configure `acl_pubsub_default`, which determines the default pub/sub permissions for all databases in the cluster. You can set `acl_pubsub_default` to the following values:

- `resetchannels` is restrictive and blocks access to all channels by default.

- `allchannels` is permissive and allows access to all channels by default. 

To make default pub/sub permissions restrictive:

1. [Upgrade all databases]({{< relref "/operate/rs/7.4/installing-upgrading/upgrading/upgrade-database" >}}) in the cluster to Redis version 6.2 or later.

1. Set the default to restrictive (`resetchannels`) using one of the following methods:

    - New Cluster Manager UI (only available for Redis Enterprise versions 7.2 and later):
    
        1. Navigate to **Access Control > Settings > Pub/Sub ACLs** and select **Edit**.
        
        1. For **Default permissions for Pub/Sub ACLs**, select **Restrictive**, then **Save**.

    - [`rladmin tune cluster`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/tune#tune-cluster" >}}):

        ```sh
        rladmin tune cluster acl_pubsub_default resetchannels
        ```

    - [Update cluster policy]({{< relref "/operate/rs/7.4/references/rest-api/requests/cluster/policy#put-cluster-policy" >}}) REST API request:

        ```sh
        PUT /v1/cluster/policy
        { "acl_pubsub_default": "resetchannels" }
        ```

## ACL command support

Redis Enterprise Software does not support certain Redis ACL commands. Instead, you can manage access controls from the Cluster Manager UI.

{{<embed-md "acl-command-compatibility.md">}}

Redis ACLs also have the following differences in Redis Enterprise Software:

- The `MULTI`, `EXEC`, `DISCARD` commands are always allowed, but ACLs are enforced on `MULTI` subcommands.

- Nested selectors are not supported.

    For example, the following selectors are not valid in Redis Enterprise: <nobr>`+GET ~key1 (+SET (+SET ~key2) ~key3)`</nobr>

- Key and pub/sub patterns do not allow the following characters: `'(', ')'`

- The following password configuration syntax is not supported: `'>', '<', '#!', 'resetpass'`

    To configure passwords in Redis Enterprise Software, use one of the following methods:

    - [`rladmin cluster reset_password`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/cluster/reset_password" >}}):
    
        ```sh
        rladmin cluster reset_password <user email>
        ```

    - REST API [`PUT /v1/users`]({{< relref "/operate/rs/7.4/references/rest-api/requests/users#put-user" >}}) request and provide `password`

