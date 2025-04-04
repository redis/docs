---
Title: Role object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents a role
linkTitle: role
weight: $weight
url: '/operate/rs/7.4/references/rest-api/objects/role/'
---

An API object that represents a role.

| Name | Type/Value | Description |
|------|------------|-------------|
| uid | integer | Role's unique ID |
| account_id | integer | SM account ID |
| action_uid | string | Action UID. If it exists, progress can be tracked by the GET /actions/{uid} API (read-only) |
| management | 'admin'<br />'db_member'<br />'db_viewer'<br />'cluster_member'<br />'cluster_viewer'<br />'none' | [Management role]({{< relref "/operate/rs/7.4/references/rest-api/permissions#roles" >}}) |
| name | string | Role's name |
