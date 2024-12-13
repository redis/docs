---
Title: Redis Cloud changelog (December 2024)
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  December 2024.
highlights: Logs Viewer API role
linktitle: December 2024
weight: 38
---

## New features

### Logs Viewer role

You can now add a user with the **Logs Viewer** role in the [Access Management]({{< relref "/operate/rc/security/access-control/access-management" >}}) screen. Logs Viewers can only use the [Redis Cloud API]({{< relref "/operate/rc/api" >}}) [`GET logs/`](https://api.redislabs.com/v1/swagger-ui/index.html#/Account/getAccountSystemLogs) endpoint. 

See [Team Management roles]({{< relref "/operate/rc/security/access-control/access-management#team-management-roles" >}}) to see an overview of user roles and their permissions.