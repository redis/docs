---
title: Redis products
description: Products, services, and tools to operate a Redis database.
linkTitle: Operate
hideListLinks: true
---

## Core Redis deployment options

Choose one based on where you want Redis to run and how much of its deployment and management you want to handle yourself.

<div class="flex flex-col gap-4 my-6">
  <div class="relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/operate/rs/installing-upgrading" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-yellow-bubble border border-redis-pen-600 flex-shrink-0"></span>
        <span>Redis Software</span>
      </div>
      <ol class="flex flex-wrap items-center gap-x-2 gap-y-2 list-none m-0 px-6 py-4 text-sm text-redis-pen-600 font-geist">
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/rs/installing-upgrading" >}}">Install</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/rs/clusters/new-cluster-setup" >}}">Set up cluster</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/rs/databases/create" >}}">Create database</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/rs/databases/connect" >}}">Connect</a></li>
      </ol>
    </div>
  </div>
  <div class="relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/operate/rc/rc-quickstart" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-blue-bubble border border-redis-pen-600 flex-shrink-0"></span>
        <span>Redis Cloud</span>
      </div>
      <ol class="flex flex-wrap items-center gap-x-2 gap-y-2 list-none m-0 px-6 py-4 text-sm text-redis-pen-600 font-geist">
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/rc/rc-quickstart" >}}">Create account</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/rc/databases/create-database" >}}">Create a database</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/rc/databases/connect" >}}">Connect to your database</a></li>
      </ol>
    </div>
  </div>
  <div class="relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/operate/kubernetes/architecture" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-gray-bubble border border-redis-pen-600 flex-shrink-0"></span>
        <span>Redis for Kubernetes</span>
      </div>
      <ol class="flex flex-wrap items-center gap-x-2 gap-y-2 list-none m-0 px-6 py-4 text-sm text-redis-pen-600 font-geist">
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/kubernetes/architecture" >}}">Architecture</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/kubernetes/deployment" >}}">Deploy Redis for Kubernetes</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/kubernetes/reference" >}}">API Reference</a></li>
      </ol>
    </div>
  </div>
  <div class="relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/operate/oss_and_stack/install/install-stack" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-purple-bubble border border-redis-pen-600 flex-shrink-0"></span>
        <span>Redis Open Source</span>
      </div>
      <ol class="flex flex-wrap items-center gap-x-2 gap-y-2 list-none m-0 px-6 py-4 text-sm text-redis-pen-600 font-geist">
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/oss_and_stack/install/install-stack" >}}">Install Redis 8 in Redis Open Source</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/oss_and_stack/management" >}}">Manage Redis</a></li>
      </ol>
    </div>
  </div>
</div>

## AI and data services

These services build on Redis to support AI applications. Redis Iris context engine gives AI agents memory, semantic caching, and governed access to business data. Redis Feature Form defines, manages, and serves machine learning features. Redis Data Integration (RDI) keeps Redis in sync with a primary database in near real time, so your applications work with current data.

<div class="flex flex-col gap-4 my-6">
  <div class="relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/operate/iris" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-indigo-bubble border border-redis-pen-600 flex-shrink-0"></span>
        <span>Redis Iris context engine</span>
      </div>
      <ol class="flex flex-wrap items-center gap-x-2 gap-y-2 list-none m-0 px-6 py-4 text-sm text-redis-pen-600 font-geist">
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/iris" >}}">Overview</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/iris/agent-memory" >}}">Enable Agent Memory</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/iris/context-retriever" >}}">Enable Context Retriever</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/iris/langcache" >}}">Enable LangCache</a></li>
      </ol>
    </div>
  </div>
  <div class="relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/operate/featureform" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-blue-gray-bubble border border-redis-pen-600 flex-shrink-0"></span>
        <span>Redis Feature Form</span>
      </div>
      <ol class="flex flex-wrap items-center gap-x-2 gap-y-2 list-none m-0 px-6 py-4 text-sm text-redis-pen-600 font-geist">
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/featureform" >}}">Feature Form overview</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/featureform/deploy" >}}">Deploy Feature Form</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/featureform/configure-auth" >}}">Configure authentication</a></li>
      </ol>
    </div>
  </div>
  <div class="relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/integrate/redis-data-integration/" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-white-bubble border border-redis-pen-600 flex-shrink-0"></span>
        <span>Redis Data Integration</span>
      </div>
      <ol class="flex flex-wrap items-center gap-x-2 gap-y-2 list-none m-0 px-6 py-4 text-sm text-redis-pen-600 font-geist">
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/integrate/redis-data-integration/" >}}">RDI overview</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/integrate/redis-data-integration/installation" >}}">Install RDI</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/integrate/redis-data-integration/data-pipelines" >}}">RDI pipelines</a></li>
      </ol>
    </div>
  </div>
</div>

## Fleet management and developer tools

Use Redis Radar to monitor the status of every Redis cluster you run from one place. Use Redis Insight as a developer workbench to browse, query, and analyze your Redis data.

<div class="flex flex-col gap-4 my-6">
  <div class="relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/operate/radar" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-green-bubble border border-redis-pen-600 flex-shrink-0"></span>
        <span>Redis Radar</span>
      </div>
      <ol class="flex flex-wrap items-center gap-x-2 gap-y-2 list-none m-0 px-6 py-4 text-sm text-redis-pen-600 font-geist">
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/radar" >}}">Radar overview</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/radar/install" >}}">Install Radar</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/radar/connect" >}}">Connect clusters</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/radar/monitor" >}}">Monitor</a></li>
      </ol>
    </div>
  </div>
  <div class="relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/operate/redisinsight/install" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-red-bubble border border-redis-pen-600 flex-shrink-0"></span>
        <span>Redis Insight</span>
      </div>
      <ol class="flex flex-wrap items-center gap-x-2 gap-y-2 list-none m-0 px-6 py-4 text-sm text-redis-pen-600 font-geist">
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="https://redis.io/downloads/#insight">Download Redis Insight</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/operate/redisinsight/install" >}}">Install</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/tools/insight" >}}">Use</a></li>
      </ol>
    </div>
  </div>
</div>

## Product features

### High availability and durability

<!-- | Feature | RC        | RS         | Open Source       | K8s          | -->
<div class="overflow-x-auto">

| | <nobr>{{<color-bubble color="bg-blue-bubble">}} Redis</nobr> Cloud | <nobr>{{<color-bubble color="bg-yellow-bubble">}} Redis</nobr> Software | <nobr>{{<color-bubble color="bg-purple-bubble">}} Redis</nobr> Open Source | <nobr>{{<color-bubble color="bg-gray-bubble">}} Redis for</nobr> Kubernetes |
|:-----------|:--------------|:-----------|:--------------|:--------------|
| Clustering | [Clustering]({{< relref "/operate/rc/databases/configuration/clustering" >}}) | [Clustering]({{<relref "/operate/rs/databases/durability-ha/clustering">}}) | [Scale with Redis Cluster]({{< relref "/operate/oss_and_stack/management/scaling" >}}) | [Redis Enterprise clusters (REC)]({{<relref "/operate/kubernetes/re-clusters">}}) |
| Replication | [Replication]({{< relref "/operate/rc/databases/configuration/high-availability" >}}) | [Replication]({{<relref "/operate/rs/databases/durability-ha/replication">}}) | [Replication]({{< relref "/operate/oss_and_stack/management/replication" >}}) | [Create replica databases]({{<relref "/operate/kubernetes/re-databases/replica-redb/">}})|
| Active-Active geo-distribution | [Active-Active Redis]({{< relref "/operate/rc/databases/active-active" >}}) | [Active-Active Redis]({{<relref "/operate/rs/databases/active-active">}}) |  | [Active-Active databases]({{<relref "/operate/kubernetes/active-active/">}}) |
| Rolling upgrades | [Upgrade database version]({{< relref "/operate/rc/databases/version-management/upgrade-version" >}}) | [Upgrade Redis Software]({{<relref "/operate/rs/installing-upgrading/upgrading">}}) |  | [Upgrade Redis for K8s]({{<relref "/operate/kubernetes/upgrade/">}}) |
| Redis Flex/Auto tiering | [Create a Redis Flex database]({{< relref "/operate/rc/databases/create-database/create-flex-database" >}}) | [Redis Flex]({{<relref "/operate/rs/databases/flash">}}) |  | [Redis Flex]({{<relref "/operate/kubernetes/flex/">}}) |
| Persistence | [Data persistence]({{< relref "/operate/rc/databases/configuration/data-persistence" >}}) | [Persistence]({{<relref "/operate/rs/databases/configure/database-persistence">}}) | [Persistence]({{< relref "/operate/oss_and_stack/management/replication" >}}) | [Persistence volumes]({{<relref "/operate/kubernetes/recommendations/persistent-volumes/">}})|
| Recovery | Automatic | [Recover cluster]({{<relref "/operate/rs/clusters/cluster-recovery">}}) | [Manual failover]({{< relref "/operate/oss_and_stack/management/scaling#manual-failover" >}}) | [Cluster recovery]({{<relref "/operate/kubernetes/re-clusters/cluster-recovery/">}}) |
| Backups | [Back up a database]({{< relref "/operate/rc/databases/back-up-data" >}}) | [Schedule backups]({{<relref "/operate/rs/databases/import-export/schedule-backups">}}) | [Persistence]({{< relref "/operate/oss_and_stack/management/replication" >}}) | [REDB spec.backup]({{<relref "/operate/kubernetes/reference/api/redis_enterprise_database_api/#specbackup">}}) |

</div>

### Logging and monitoring

<!-- | Feature | RC        | RS         | Open Source       | K8s          | -->
<div class="overflow-x-auto">

| | <nobr>{{<color-bubble color="bg-blue-bubble">}} Redis</nobr> Cloud | <nobr>{{<color-bubble color="bg-yellow-bubble">}} Redis</nobr> Software | <nobr>{{<color-bubble color="bg-purple-bubble">}} Redis</nobr> Open Source | <nobr>{{<color-bubble color="bg-gray-bubble">}} Redis for</nobr> Kubernetes |
|:-----------|:--------------|:-----------|:--------------|:--------------|
| Monitoring | [Monitor performance]({{< relref "/operate/rc/databases/monitor-performance" >}}) | [Monitoring]({{<relref "/operate/rs/monitoring">}}) | [INFO]({{< relref "/commands/info" >}}), [MONITOR]({{< relref "/commands/monitor" >}}), and [LATENCY DOCTOR]({{< relref "/commands/latency-doctor" >}})<br/>[Analysis with Redis Insight]({{< relref "/develop/tools/insight#database-analysis" >}}) | [Export metrics to Prometheus]({{<relref "/operate/kubernetes/re-clusters/connect-prometheus-operator/">}}) |
| Logging | [System logs]({{< relref "/operate/rc/logs-reports/system-logs" >}}) | [Logging]({{<relref "/operate/rs/clusters/logging">}}) | `/var/log/redis/redis.log`<br/>[SLOWLOG]({{< relref "/commands/slowlog" >}})<br/>[Keyspace notifications]({{< relref "/develop/pubsub/keyspace-notifications" >}}) | [Logs]({{<relref "/operate/kubernetes/logs/">}}) |
| Alerts | [Alerts]({{< relref "/operate/rc/databases/monitor-performance#configure-metric-alerts" >}}) | [Alerts and events]({{<relref "/operate/rs/clusters/logging/alerts-events">}}) | [Pub/sub with Redis Sentinel]({{< relref "/operate/oss_and_stack/management/sentinel#pubsub-messages" >}}) | [REDB alertSettings]({{<relref "/operate/kubernetes/reference/api/redis_enterprise_database_api/#specalertsettings">}}) |
| Support | [Contact support](https://redis.io/support/) | [Create support package]({{<relref "/operate/rs/installing-upgrading/creating-support-package">}}) |  | [Contact support](https://redis.io/support/) |

</div>

### Security

<!-- | Feature | RC        | RS         | Open Source       | K8s          | -->
<div class="overflow-x-auto">

| | <nobr>{{<color-bubble color="bg-blue-bubble" >}} Redis</nobr> Cloud | <nobr>{{<color-bubble color="bg-yellow-bubble">}} Redis</nobr> Software | <nobr>{{<color-bubble color="bg-purple-bubble">}} Redis</nobr> Open Source | <nobr><div class="h-3 w-3 rounded-md border border-redis-pen-600 inline-block mr-1" style="background-color: #8A99A0"></div> Redis for</nobr> Kubernetes |
|:-----------|:--------------|:-----------|:--------------|:--------------|
| Transport Layer Security (TLS) | [TLS]({{<relref "/operate/rc/security/database-security/tls-ssl">}}) | [TLS]({{<relref "/operate/rs/security/encryption/tls">}}) | [TLS]({{< relref "/operate/oss_and_stack/management/security/encryption" >}}) | [REDB tlsMode]({{<relref "/operate/kubernetes/reference/api/redis_enterprise_database_api/#spec">}}) |
| Role-based access control (RBAC) | [Role-based access control]({{<relref "/operate/rc/security/access-control/data-access-control/role-based-access-control">}}) | [Access control]({{<relref "/operate/rs/security/access-control">}}) | [Access control list]({{< relref "/operate/oss_and_stack/management/security/acl" >}}) | [REC credentials]({{<relref "/operate/kubernetes/security/authentication/manage-rec-credentials/">}}) |
| Lightweight Directory Access Protocol (LDAP) |  | [LDAP authentication]({{<relref "/operate/rs/security/access-control/ldap">}}) |  | [Enable LDAP]({{<relref "/operate/kubernetes/security/authentication/ldap/">}}) |
| Single sign-on (SSO) | [SAML SSO]({{< relref "/operate/rc/security/access-control/saml-sso" >}}) |  |  |  |
| Self-signed certificates |  | [Certificates]({{<relref "/operate/rs/security/certificates">}}) | [Certificate configuration]({{< relref "/operate/oss_and_stack/management/security/encryption#certificate-configuration" >}}) | [REC certificates]({{<relref "operate/kubernetes/security/certificates/manage-rec-certificates/">}}) |
| Internode encryption | [Encryption at rest]({{< relref "/operate/rc/security/encryption-at-rest" >}}) | [Internode encryption]({{<relref "/operate/rs/security/encryption/internode-encryption">}}) |  | [Enable internode encryption]({{<relref "operate/kubernetes/security/certificates/internode-encryption/">}}) |
| Auditing |  | [Audit events]({{<relref "/operate/rs/security/audit-events">}}) | [Keyspace notifications]({{< relref "/develop/pubsub/keyspace-notifications" >}}) |  |

</div>
