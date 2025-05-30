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
url: '/operate/rs/7.8/references/rest-api/objects/services_configuration/'
---

Optional cluster services settings

| Name | Type/Value | Description |
|------|------------|-------------|
| alert_mgr | [alert_mgr]({{< relref "/operate/rs/7.8/references/rest-api/objects/services_configuration/alert_mgr" >}}) object | Whether to enable/disable the alert manager processes |
| cm_server | [cm_server]({{< relref "/operate/rs/7.8/references/rest-api/objects/services_configuration/cm_server" >}}) object | Whether to enable/disable the CM server |
| crdb_coordinator | [crdb_coordinator]({{< relref "/operate/rs/7.8/references/rest-api/objects/services_configuration/crdb_coordinator" >}}) object | Whether to enable/disable the CRDB coordinator process |
| crdb_worker | [crdb_worker]({{< relref "/operate/rs/7.8/references/rest-api/objects/services_configuration/crdb_worker" >}}) object | Whether to enable/disable the CRDB worker processes |
| entraid_agent_mgr | [entraid_agent_mgr]({{< relref "/operate/rs/7.8/references/rest-api/objects/services_configuration/entraid_agent_mgr" >}}) object | Whether to enable/disable the Entra ID agent manager process |
| ldap_agent_mgr | [ldap_agent_mgr]({{< relref "/operate/rs/7.8/references/rest-api/objects/services_configuration/ldap_agent_mgr" >}}) object | Whether to enable/disable the LDAP agent manager processes |
| mdns_server | [mdns_server]({{< relref "/operate/rs/7.8/references/rest-api/objects/services_configuration/mdns_server" >}}) object | Whether to enable/disable the multicast DNS server |
| pdns_server | [pdns_server]({{< relref "/operate/rs/7.8/references/rest-api/objects/services_configuration/pdns_server" >}}) object | Whether to enable/disable the PDNS server |
| stats_archiver | [stats_archiver]({{< relref "/operate/rs/7.8/references/rest-api/objects/services_configuration/stats_archiver" >}}) object | Whether to enable/disable the stats archiver service |
