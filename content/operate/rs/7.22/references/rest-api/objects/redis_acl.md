---
Title: Redis ACL object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents a Redis access control list (ACL)
linkTitle: redis_acl
weight: $weight
url: '/operate/rs/7.22/references/rest-api/objects/redis_acl/'
---

An API object that represents a Redis [access control list (ACL)]({{< relref "/operate/rs/7.22/security/access-control/create-db-roles" >}})

| Name | Type/Value | Description |
|------|------------|-------------|
| uid | integer | Object's unique ID |
| account_id | integer | SM account ID |
| acl | string | Redis ACL's string |
| action_uid | string | Action UID. If it exists, progress can be tracked by the `GET`&nbsp;`/actions/{uid}` API (read-only) |
| name | string | Redis ACL's name |
| min_version | string | Minimum database version that supports this ACL. Read only |
| max_version | string | Maximum database version that supports this ACL. Read only |

