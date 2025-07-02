---
title: Redis products
description: Products, services, and tools to operate a Redis database.
linkTitle: Operate
hideListLinks: true
---

| {{<color-bubble color="bg-blue-bubble">}} Redis Cloud | {{<color-bubble color="bg-yellow-bubble">}} Redis Software |
|:-----------|:--------------|
| <ul><li> [Get started with Redis Cloud]({{< relref "/operate/rc/rc-quickstart" >}}) </li><li> [Create a database]({{< relref "/operate/rc/databases/create-database" >}}) </li><li> [Connect to your database]({{< relref "/operate/rc/databases/connect" >}}) </li><li> [Subscriptions]({{< relref "/operate/rc/subscriptions" >}}) </li><li>[REST API]({{< relref "/operate/rc/api/" >}})</li></ul> | <ul><li> [Install Redis Software]({{< relref "/operate/rs/installing-upgrading" >}}) </li><li> [Set up a new cluster]({{< relref "/operate/rs/clusters/new-cluster-setup" >}}) </li><li> [Create a database]({{< relref "/operate/rs/databases/create" >}}) </li><li> [Connect to your database]({{< relref "/operate/rs/databases/connect" >}}) </li><li>[REST API]({{< relref "/operate/rs/references/rest-api/" >}})</li></ul> |
| {{<color-bubble color="bg-purple-bubble">}} **Redis Open Source** | {{<color-bubble color="bg-gray-bubble">}} **Redis for Kubernetes** |
| <ul><li> [Install Redis 8 in Redis Open Source]({{< relref "/operate/oss_and_stack/install/install-stack" >}}) </li><li> [Install Redis Stack]({{< relref "/operate/oss_and_stack/install/archive/install-stack/" >}}) (&#8804; 7.4) </li><li> [Manage Redis]({{< relref "/operate/oss_and_stack/management" >}}) </li></ul> | <ul><li> [Deploy Redis for Kubernetes]({{< relref "/operate/kubernetes/deployment" >}}) </li><li> [Architecture]({{< relref "/operate/kubernetes/architecture" >}}) </li><li> [API Reference]({{< relref "/operate/kubernetes/reference" >}}) </li></ul> |
| {{<color-bubble color="bg-red-bubble">}} **Redis Insight** | |
| <ul><li> [Install Redis Insight]({{< relref "/operate/redisinsight/install" >}}) </li><li> [Use Redis Insight]({{< relref "/develop/tools/insight" >}}) </li><li> [Download Redis Insight](https://redis.io/downloads/#insight) </li></ul> | |

## Product features

### High availability and durability

<!-- | Feature | RC        | RS         | Open Source       | K8s          | -->
| | <nobr>{{<color-bubble color="bg-blue-bubble">}} Redis</nobr> Cloud | <nobr>{{<color-bubble color="bg-yellow-bubble">}} Redis</nobr> Software | <nobr>{{<color-bubble color="bg-purple-bubble">}} Redis</nobr> Open Source | <nobr>{{<color-bubble color="bg-gray-bubble">}} Redis for</nobr> Kubernetes |
|:-----------|:--------------|:-----------|:--------------|:--------------|
| Clustering | [Clustering]({{< relref "/operate/rc/databases/configuration/clustering" >}}) | [Clustering]({{<relref "/operate/rs/databases/durability-ha/clustering">}}) | [Scale with Redis Cluster]({{< relref "/operate/oss_and_stack/management/scaling" >}}) | [Redis Enterprise clusters (REC)]({{<relref "/operate/kubernetes/re-clusters">}}) |
| Replication | [Replication]({{< relref "/operate/rc/databases/configuration/high-availability" >}}) | [Replication]({{<relref "/operate/rs/databases/durability-ha/replication">}}) | [Replication]({{< relref "/operate/oss_and_stack/management/replication" >}}) | [Create replica databases]({{<relref "/operate/kubernetes/re-databases/replica-redb/">}})|
| Active-Active geo-distribution | [Active-Active Redis]({{< relref "/operate/rc/databases/configuration/active-active-redis" >}}) | [Active-Active Redis]({{<relref "/operate/rs/databases/active-active">}}) |  | [Active-Active databases]({{<relref "/operate/kubernetes/active-active/">}}) |
| Rolling upgrades | [Upgrade database version]({{< relref "/operate/rc/databases/upgrade-version" >}}) | [Upgrade Redis Software]({{<relref "/operate/rs/installing-upgrading/upgrading">}}) |  | [Upgrade Redis for K8s]({{<relref "/operate/kubernetes/upgrade/">}}) |
| Redis Flex/Auto tiering | [Create a Redis Flex database]({{< relref "/operate/rc/databases/create-database/create-flex-database" >}}) | [Auto Tiering]({{<relref "/operate/rs/databases/auto-tiering">}}) |  | [Auto Tiering]({{<relref "/operate/kubernetes/re-clusters/auto-tiering/">}}) |
| Persistence | [Data persistence]({{< relref "/operate/rc/databases/configuration/data-persistence" >}}) | [Persistence]({{<relref "/operate/rs/databases/configure/database-persistence">}}) | [Persistence]({{< relref "/operate/oss_and_stack/management/replication" >}}) | [Persistence volumes]({{<relref "/operate/kubernetes/recommendations/persistent-volumes/">}})|
| Recovery | Automatic | [Recover cluster]({{<relref "/operate/rs/clusters/cluster-recovery">}}) | [Manual failover]({{< relref "/operate/oss_and_stack/management/scaling#manual-failover" >}}) | [Cluster recovery]({{<relref "/operate/kubernetes/re-clusters/cluster-recovery/">}}) |
| Backups | [Back up a database]({{< relref "/operate/rc/databases/back-up-data" >}}) | [Schedule backups]({{<relref "/operate/rs/databases/import-export/schedule-backups">}}) | [Persistence]({{< relref "/operate/oss_and_stack/management/replication" >}}) | [REDB spec.backup]({{<relref "/operate/kubernetes/reference/redis_enterprise_database_api/#specbackup">}}) |

### Logging and monitoring

<!-- | Feature | RC        | RS         | Open Source       | K8s          | -->
| | <nobr>{{<color-bubble color="bg-blue-bubble">}} Redis</nobr> Cloud | <nobr>{{<color-bubble color="bg-yellow-bubble">}} Redis</nobr> Software | <nobr>{{<color-bubble color="bg-purple-bubble">}} Redis</nobr> Open Source | <nobr>{{<color-bubble color="bg-gray-bubble">}} Redis for</nobr> Kubernetes |
|:-----------|:--------------|:-----------|:--------------|:--------------|
| Monitoring | [Monitor performance]({{< relref "/operate/rc/databases/monitor-performance" >}}) | [Monitoring]({{<relref "/operate/rs/monitoring">}}) | [INFO]({{< relref "/commands/info" >}}), [MONITOR]({{< relref "/commands/monitor" >}}), and [LATENCY DOCTOR]({{< relref "/commands/latency-doctor" >}})<br/>[Analysis with Redis Insight]({{< relref "/develop/tools/insight#database-analysis" >}}) | [Export metrics to Prometheus]({{<relref "/operate/kubernetes/re-clusters/connect-prometheus-operator/">}}) |
| Logging | [System logs]({{< relref "/operate/rc/logs-reports/system-logs" >}}) | [Logging]({{<relref "/operate/rs/clusters/logging">}}) | `/var/log/redis/redis.log`<br/>[SLOWLOG]({{< relref "/commands/slowlog" >}})<br/>[Keyspace notifications]({{< relref "/develop/pubsub/keyspace-notifications" >}}) | [Logs]({{<relref "/operate/kubernetes/logs/">}}) |
| Alerts | [Alerts]({{< relref "/operate/rc/databases/view-edit-database#alerts-section" >}}) | [Alerts and events]({{<relref "/operate/rs/clusters/logging/alerts-events">}}) | [Pub/sub with Redis Sentinel]({{< relref "/operate/oss_and_stack/management/sentinel#pubsub-messages" >}}) | [REDB alertSettings]({{<relref "/operate/kubernetes/reference/redis_enterprise_database_api/#specalertsettings">}}) |
| Support | [Contact support](https://redis.io/support/) | [Create support package]({{<relref "/operate/rs/installing-upgrading/creating-support-package">}}) |  | [Contact support](https://redis.io/support/) |

### Security

<!-- | Feature | RC        | RS         | Open Source       | K8s          | -->
| | <nobr>{{<color-bubble color="bg-blue-bubble" >}} Redis</nobr> Cloud | <nobr>{{<color-bubble color="bg-yellow-bubble">}} Redis</nobr> Software | <nobr>{{<color-bubble color="bg-purple-bubble">}} Redis</nobr> Open Source | <nobr><div class="h-3 w-3 rounded-md border border-redis-pen-600 inline-block mr-1" style="background-color: #8A99A0"></div> Redis for</nobr> Kubernetes |
|:-----------|:--------------|:-----------|:--------------|:--------------|
| Transport Layer Security (TLS) | [TLS]({{<relref "/operate/rc/security/database-security/tls-ssl">}}) | [TLS]({{<relref "/operate/rs/security/encryption/tls">}}) | [TLS]({{< relref "/operate/oss_and_stack/management/security/encryption" >}}) | [REDB tlsMode]({{<relref "/operate/kubernetes/reference/redis_enterprise_database_api/#spec">}}) |
| Role-based access control (RBAC) | [Role-based access control]({{<relref "/operate/rc/security/access-control/data-access-control/role-based-access-control">}}) | [Access control]({{<relref "/operate/rs/security/access-control">}}) | [Access control list]({{< relref "/operate/oss_and_stack/management/security/acl" >}}) | [REC credentials]({{<relref "/operate/kubernetes/security/manage-rec-credentials/">}}) |
| Lightweight Directory Access Protocol (LDAP) |  | [LDAP authentication]({{<relref "/operate/rs/security/access-control/ldap">}}) |  | [Enable LDAP]({{<relref "/operate/kubernetes/security/ldap/">}}) |
| Single sign-on (SSO) | [SAML SSO]({{< relref "/operate/rc/security/access-control/saml-sso" >}}) |  |  |  |
| Self-signed certificates |  | [Certificates]({{<relref "/operate/rs/security/certificates">}}) | [Certificate configuration]({{< relref "/operate/oss_and_stack/management/security/encryption#certificate-configuration" >}}) | [REC certificates]({{<relref "operate/kubernetes/security/manage-rec-certificates/">}}) |
| Internode encryption | [Encryption at rest]({{< relref "/operate/rc/security/encryption-at-rest" >}}) | [Internode encryption]({{<relref "/operate/rs/security/encryption/internode-encryption">}}) |  | [Enable internode encryption]({{<relref "operate/kubernetes/security/internode-encryption/">}}) |
| Auditing |  | [Audit events]({{<relref "/operate/rs/security/audit-events">}}) | [Keyspace notifications]({{< relref "/develop/pubsub/keyspace-notifications" >}}) |  |

