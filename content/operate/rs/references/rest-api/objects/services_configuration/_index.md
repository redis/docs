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
---

Optional cluster services settings

| Name | Type/Value | Description |
|------|------------|-------------|
| alert_mgr | [alert_mgr]({{< relref "/operate/rs/references/rest-api/objects/services_configuration/alert_mgr" >}}) object | Whether to enable/disable the alert manager processes |
| call_home_agent | [call_home_agent]({{< relref "/operate/rs/references/rest-api/objects/services_configuration/call_home_agent" >}}) object | Whether to enable/disable the call_home_agent process, which sends daily usage statistics to Redis |
| cm_server | [cm_server]({{< relref "/operate/rs/references/rest-api/objects/services_configuration/cm_server" >}}) object | Whether to enable/disable the CM server |
| crdb_coordinator | [crdb_coordinator]({{< relref "/operate/rs/references/rest-api/objects/services_configuration/crdb_coordinator" >}}) object | Whether to enable/disable the CRDB coordinator process |
| crdb_worker | [crdb_worker]({{< relref "/operate/rs/references/rest-api/objects/services_configuration/crdb_worker" >}}) object | Whether to enable/disable the CRDB worker processes |
| entraid_agent_mgr | [entraid_agent_mgr]({{< relref "/operate/rs/references/rest-api/objects/services_configuration/entraid_agent_mgr" >}}) object | Whether to enable/disable the Entra ID agent manager process |
| ldap_agent_mgr | [ldap_agent_mgr]({{< relref "/operate/rs/references/rest-api/objects/services_configuration/ldap_agent_mgr" >}}) object | Whether to enable/disable the LDAP agent manager processes |
| mdns_server | [mdns_server]({{< relref "/operate/rs/references/rest-api/objects/services_configuration/mdns_server" >}}) object | Whether to enable/disable the multicast DNS server |
| pdns_server | [pdns_server]({{< relref "/operate/rs/references/rest-api/objects/services_configuration/pdns_server" >}}) object | Whether to enable/disable the PDNS server |
| sentinel_service | [sentinel_service]({{< relref "/operate/rs/references/rest-api/objects/services_configuration/sentinel_service" >}}) object | Whether to enable/disable the Sentinel service process |
| stats_archiver | [stats_archiver]({{< relref "/operate/rs/references/rest-api/objects/services_configuration/stats_archiver" >}}) object | Whether to enable/disable the stats archiver service |
