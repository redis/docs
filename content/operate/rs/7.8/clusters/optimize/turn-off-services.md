---
Title: Turn off services to free system memory
alwaysopen: false
categories:
- docs
- operate
- rs
description: Turn off services to free memory and improve performance.
linktitle: Free system memory
weight: $weight
url: '/operate/rs/7.8/clusters/optimize/turn-off-services/'
---
The Redis Enterprise Software cluster nodes host a range of services that support the cluster processes.
In most deployments, either all of these services are required,
or there are enough memory resources on the nodes for the database requirements.

In a deployment with limited memory resources, certain services can be disabled from API endpoint to free system memory or using the `rladmin` command.
Before you turn off a service, make sure that your deployment does not depend on that service.
After you turn off a service, you can re-enable in the same way.

The services that you can turn off are:

- RS Admin Console - `cm_server`
- Logs in CSV format - `stats_archiver`
- [LDAP authentication]({{< relref "/operate/rs/7.8/security/access-control/ldap" >}}) - `saslauthd`
- [Discovery service]({{< relref "/operate/rs/7.8/networking/cluster-dns.md" >}})- `mdns_server`, `pdns_server`
- [Active-Active databases]({{< relref "/operate/rs/7.8/databases/active-active" >}}) - `crdb_coordinator`, `crdb_worker`
- Alert Manager - `alert_mgr` (For best results, disable only if you have an alternate alert system.)

To turn off a service with the `rladmin cluster config` command, use the `services` parameter and the name of the service, followed by `disabled`.
```text
 rladmin cluster config
        [ services <service_name> <enabled | disabled> ]
```

To turn off a service with the API, use the [`PUT /v1/services_configuration`]({{< relref "/operate/rs/7.8/references/rest-api/requests/cluster/services_configuration#put-cluster-services_config" >}}) endpoint
with the name of the service and the operating mode (enabled/disabled) in JSON format.

For example:
- To turn off the Redis Enterprise Cluster Manager UI, use this PUT request:

    ```sh
    PUT https://[host][:9443]/v1/cluster/services_configuration
    '{
        "cm_server":{
            "operating_mode":"disabled"
        }
    }'
    ```

- To turn off the CRDB services and enable the `stats_archiver` for cluster component statistics, use this PUT request:

    ```sh
    PUT https://[host][:9443]/v1/cluster/services_configuration
    '{
        "crdb_coordinator":{
            "operating_mode":"disabled"
        },
        "crdb_worker":{
            "operating_mode":"disabled"
        },
        "stats_archiver":{
            "operating_mode":"enabled"
        }
    }'
    ```
