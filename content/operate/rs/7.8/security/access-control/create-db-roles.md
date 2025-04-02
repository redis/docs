---
Title: Create roles with database access only 
alwaysopen: false
categories:
- docs
- operate
- rs
description: Create roles with database access only.
linkTitle: Create roles with database access only 
weight: 15
url: '/operate/rs/7.8/security/access-control/create-db-roles/'
---

Roles with database access grant the ability to access and interact with a database's data. Database access privileges are determined by defining [Redis ACLs]({{<relref "/operate/rs/7.8/security/access-control/redis-acl-overview">}}) and adding them to roles.

To create a role that grants database access without granting access to the Redis Enterprise Cluster Manager UI and REST API:

1. [Define Redis ACLs](#define-redis-acls) that determine database access privileges.

1. [Create a role with ACLs](#create-roles-with-acls) added and leave the **Cluster management role** as **None**.

## Define Redis ACLs

You can use the [Cluster Manager UI](#define-acls-ui) or the [REST API](#define-acls-rest-api) to define Redis ACL rules that you can assign to roles.

### Cluster Manager UI method {#define-acls-ui}

To define a Redis ACL rule using the Cluster Manager UI:

1. From **Access Control > Redis ACLs**, you can either:

    - Point to a Redis ACL and select {{< image filename="/images/rs/buttons/edit-button.png#no-click" alt="The Edit button" width="25px" class="inline" >}} to edit an existing Redis ACL.

    - Select **+ Add Redis ACL** to create a new Redis ACL.

1. Enter a descriptive name for the Redis ACL. This will be used to associate the ACL rule with the role.

1. Define the ACL rule. For more information about Redis ACL rules and syntax, see the [Redis ACL overview]({{<relref "/operate/rs/7.8/security/access-control/redis-acl-overview">}}).

    {{<note>}}
The **ACL builder** does not support selectors and key permissions. Use **Free text command** to manually define them instead.
    {{</note>}}

1. Select **Save**.

{{<note>}}
For multi-key commands on multi-slot keys, the return value is `failure`, but the command runs on the keys that are allowed.
{{</note>}}

### REST API method {#define-acls-rest-api}

To define a Redis ACL rule using the REST API, use a [create Redis ACL]({{<relref "/operate/rs/7.8/references/rest-api/requests/redis_acls#post-redis_acl">}}) request. For more information about Redis ACL rules and syntax, see the [Redis ACL overview]({{<relref "/operate/rs/7.8/security/access-control/redis-acl-overview">}}).

Example request:

```sh
POST /v1/redis_acls
{ 
  "name": "Test_ACL_1",
  "acl": "+@read +FT.INFO +FT.SEARCH"
}
```

Example response body:

```json
{ 
  "acl": "+@read +FT.INFO +FT.SEARCH",
  "name": "Test_ACL_1",
  "uid": 11
}
```

To associate the Redis ACL with a role and database, use the `uid` from the response as the `redis_acl_uid` when you add `roles_permissions` to the database. See [Associate a database with roles and Redis ACLs](#associate-roles-acls-rest-api) for an example request.

## Create roles with ACLs

To create a role that grants database access to users but blocks access to the Redis Enterprise Cluster Manager UI and REST API, set the **Cluster management role** to **None**.

### Cluster Manager UI method {#create-roles-ui}

To define a role for database access using the Cluster Manager UI:

1. From **Access Control** > **Roles**, you can:

    - Point to a role and select {{< image filename="/images/rs/buttons/edit-button.png#no-click" alt="The Edit button" width="25px" class="inline" >}} to edit an existing role.

    - Select **+ Add role** to create a new role.

    {{<image filename="images/rs/access-control-role-panel.png" alt="Add role with name" >}}

1. Enter a descriptive name for the role. This will be used to reference the role when configuring users.

1. Leave **Cluster management role** as the default **None**.

    {{<image filename="images/rs/access-control-role-name.png" alt="Add role with name" >}}
    
1. Select **+ Add ACL**.

    {{<image filename="images/rs/access-control-role-acl.png" alt="Add role database acl" >}}

1.  Choose a Redis ACL and databases to associate with the role.

    {{<image filename="images/rs/screenshots/access-control/access-control-role-databases.png" alt="Add databases to access" >}}

1. Select the check mark {{< image filename="/images/rs/buttons/checkmark-button.png#no-click" alt="The Check button" width="25px" class="inline" >}} to confirm.

1. Select **Save**.

    {{<image filename="images/rs/access-control-role-save.png" alt="Add databases to access" >}}

You can [assign the new role to users]({{<relref "/operate/rs/7.8/security/access-control/create-users#assign-roles-to-users">}}) to grant database access.

### REST API method {#define-roles-rest-api}

To define a role for database access using the REST API:

1. [Create a role.](#create-role-rest-api)

1. [Associate a database with roles and Redis ACLs.](#associate-roles-acls-rest-api)

#### Create a role {#create-role-rest-api}

To [create a role]({{<relref "/operate/rs/7.8/references/rest-api/requests/roles#post-role">}}) using the REST API:

```sh
POST /v1/roles
{ 
  "name": "<role-name>",
  "management": "none" 
}
```

Example response body:

```json
{ 
  "management": "none",
  "name": "<role-name>",
  "uid": 7
}
```

To associate the role with a Redis ACL and database, use the `uid` from the response as the `role_uid` when you add `roles_permissions` to the database. See [Associate a database with roles and Redis ACLs](#associate-roles-acls-rest-api) for an example request.


#### Associate a database with roles and Redis ACLs {#associate-roles-acls-rest-api}

[Update a database's configuration]({{<relref "/operate/rs/7.8/references/rest-api/requests/bdbs#put-bdbs">}}) to add `roles_permissions` with the role and Redis ACL:

```sh
POST /v1/bdbs/<database-id>
{
  "roles_permissions":
  [
    {
      "role_uid": <integer>,
      "redis_acl_uid": <integer>
    }
  ]
}
```
