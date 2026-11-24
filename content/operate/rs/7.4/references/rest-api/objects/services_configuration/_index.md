---
Title: Services configuration object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object for optional cluster services settings
hideListLinks: true
linkTitle: services_configuration
weight: $weight
url: '/operate/rs/7.4/references/rest-api/objects/services_configuration/'
---

Optional cluster services settings

| Name | Type/Value | Description |
|------|------------|-------------|
| alert_mgr | [alert_mgr](/content/operate/rs/7.4/references/rest-api/objects/services_configuration/alert_mgr.md) object | Whether to enable/disable the alert manager processes |
| cm_server | [cm_server](/content/operate/rs/7.4/references/rest-api/objects/services_configuration/cm_server.md) object | Whether to enable/disable the CM server |
| crdb_coordinator | [crdb_coordinator](/content/operate/rs/7.4/references/rest-api/objects/services_configuration/crdb_coordinator.md) object | Whether to enable/disable the CRDB coordinator process |
| crdb_worker | [crdb_worker](/content/operate/rs/7.4/references/rest-api/objects/services_configuration/crdb_worker.md) object | Whether to enable/disable the CRDB worker processes |
| mdns_server | [mdns_server](/content/operate/rs/7.4/references/rest-api/objects/services_configuration/mdns_server.md) object | Whether to enable/disable the multicast DNS server |
| pdns_server | [pdns_server](/content/operate/rs/7.4/references/rest-api/objects/services_configuration/pdns_server.md) object | Whether to enable/disable the PDNS server |
| stats_archiver | [stats_archiver](/content/operate/rs/7.4/references/rest-api/objects/services_configuration/stats_archiver.md) object | Whether to enable/disable the stats archiver service |
