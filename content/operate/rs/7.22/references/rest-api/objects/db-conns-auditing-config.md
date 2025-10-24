---
Title: Database connection auditing configuration object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object for database connection auditing settings
linkTitle: db_conns_auditing_config
weight: $weight
url: '/operate/rs/7.22/references/rest-api/objects/db-conns-auditing-config/'
---

Database connection auditing configuration

| Name | Type/Value | Description |
|------|------------|-------------|
| audit_address | string | TCP/IP address where one can listen for notifications. |
| audit_port | integer | Port where one can listen for notifications. |
| audit_protocol | `TCP`<br />`local` | Protocol used to process notifications. For production systems, `TCP` is the only valid value. |
| audit_reconnect_interval | integer | Interval (in seconds) between attempts to reconnect to the listener. Default is 1 second. |
| audit_reconnect_max_attempts | integer | Maximum number of attempts to reconnect. Default is 0 (infinite). |
