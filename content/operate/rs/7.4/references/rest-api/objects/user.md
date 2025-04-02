---
Title: User object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents a Redis Enterprise user
linkTitle: user
weight: $weight
url: '/operate/rs/7.4/references/rest-api/objects/user/'
---

An API object that represents a Redis Enterprise user.

| Name | Type/Value | Description |
|------|------------|-------------|
| uid | integer | User's unique ID |
| account_id | integer | SM account ID |
| action_uid | string | Action UID. If it exists, progress can be tracked by the `GET`&nbsp;`/actions/{uid}` API request (read-only) |
| auth_method | **'regular'** | User's authentication method (deprecated as of Redis Enterprise v7.2) |
| bdbs_email_alerts | complex object | UIDs of databases that user will receive alerts for |
| cluster_email_alerts | boolean | Activate cluster email alerts for a user |
| email | string | User's email (pattern matching only ASCII characters) |
| email_alerts | boolean (default:&nbsp;true) | Activate email alerts for a user |
| name | string | User's name (pattern does not allow non-ASCII and special characters &,\<,>,") |
| password | string | User's password. If `password_hash_method` is set to `1`, the password should be hashed using SHA-256. The format before hashing is `username:clustername:password`. | 
| password_hash_method | '1' | Used when password is passed pre-hashed to specify the hashing method |
| password_issue_date | string | The date in which the password was set (read-only) |
| role | 'admin'<br />'cluster_member'<br />'cluster_viewer'<br />'db_member'<br /> **'db_viewer'** <br />'none' | User's [role]({{< relref "/operate/rs/7.4/references/rest-api/permissions#roles" >}}) |
| role_uids | array of integers | UIDs of user's roles for role-based access control |
| status | 'active'<br />'locked' | User sign-in status (read-only)<br />**active**: able to sign in<br />**locked**: unable to sign in |
