---
title: RedisEnterpriseDatabase API Reference
alwaysopen: false
categories:
- docs
- operate
- kubernetes
aliases: /operate/kubernetes/reference/redis_enterprise_cluster_api
linkTitle: REDB API
weight: 30
---

apiVersion:


- [app.redislabs.com/v1alpha1](#appredislabscomv1alpha1)




# app.redislabs.com/v1alpha1




RedisEnterpriseDatabase is the Schema for the redisenterprisedatabases API

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
      <td>apiVersion</td>
      <td>string</td>
      <td>app.redislabs.com/v1alpha1</td>
      <td>true</td>
      </tr>
      <tr>
      <td>kind</td>
      <td>string</td>
      <td>RedisEnterpriseDatabase</td>
      <td>true</td>
      </tr>
      <tr>
      <td><a href="https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.27/#objectmeta-v1-meta">metadata</a></td>
      <td>object</td>
      <td>Refer to the Kubernetes API documentation for the fields of the `metadata` field.</td>
      <td>true</td>
      </tr><tr>
        <td><a href="#spec">spec</a></td>
        <td>object</td>
        <td>
          RedisEnterpriseDatabaseSpec defines the desired state of RedisEnterpriseDatabase<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#status">status</a></td>
        <td>object</td>
        <td>
          RedisEnterpriseDatabaseStatus defines the observed state of RedisEnterpriseDatabase<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec
<sup><sup>[↩ Parent](#)</sup></sup>

RedisEnterpriseDatabaseSpec defines the desired state of RedisEnterpriseDatabase

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specactiveactive">activeActive</a></td>
        <td>object</td>
        <td>
          Connection/ association to the Active-Active database.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specalertsettings">alertSettings</a></td>
        <td>object</td>
        <td>
          Settings for database alerts<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specbackup">backup</a></td>
        <td>object</td>
        <td>
          Target for automatic database backups.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>clientAuthenticationCertificates</td>
        <td>[]string</td>
        <td>
          The Secrets containing TLS Client Certificate to use for Authentication<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>dataInternodeEncryption</td>
        <td>boolean</td>
        <td>
          Internode encryption (INE) setting. An optional boolean setting, overriding a similar cluster-wide policy. If set to False, INE is guaranteed to be turned off for this DB (regardless of cluster-wide policy). If set to True, INE will be turned on, unless the capability is not supported by the DB ( in such a case we will get an error and database creation will fail). If left unspecified, will be disabled if internode encryption is not supported by the DB (regardless of cluster default). Deleting this property after explicitly setting its value shall have no effect.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>databasePort</td>
        <td>integer</td>
        <td>
          TCP port assigned to the database within the Redis Enterprise cluster. Must be unique across all databases in the Redis Enterprise cluster. Will be generated automatically if omitted. can not be changed after creation<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>databaseSecretName</td>
        <td>string</td>
        <td>
          Name of the secret containing the database password (Redis databases only). The secret is created automatically if it does not exist. The password is stored under the "password" key in the secret. If creating the secret manually, create an opaque secret with the password under the "password" key. To disable authentication, set the value of the "password" key in the secret to an empty string. Note: For Active-Active databases, this secret is not created automatically. For memcached databases, use memcachedSaslSecretName instead.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>databaseServicePort</td>
        <td>integer</td>
        <td>
          A custom port to be exposed by the database Services. Can be modified/added/removed after REDB creation. If set, it'll replace the default service port (namely, databasePort or defaultRedisPort).<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>defaultUser</td>
        <td>boolean</td>
        <td>
          Allows connections with the default user. When disabled, the DatabaseSecret is not created or updated.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>evictionPolicy</td>
        <td>string</td>
        <td>
          Database eviction policy. See https://redis.io/docs/latest/operate/rs/databases/memory-performance/eviction-policy/<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>isRof</td>
        <td>boolean</td>
        <td>
          Enables Auto Tiering (formerly Redis on Flash) for Redis databases only. Defaults to false.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>memcachedSaslSecretName</td>
        <td>string</td>
        <td>
          Name of the secret containing credentials for memcached database authentication. Store credentials in an opaque secret with "username" and "password" keys. Note: Connections are not encrypted.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>memorySize</td>
        <td>string</td>
        <td>
          Memory size for the database using formats like 100MB or 0.1GB. Minimum value is 100MB. For Auto Tiering (formerly Redis on Flash), this value represents RAM+Flash memory and must be at least 1GB.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specmoduleslist">modulesList</a></td>
        <td>[]object</td>
        <td>
          List of modules associated with the database. The list of valid modules for the specific cluster can be retrieved from the status of the REC object. Use the "name" and "versions" fields for the specific module configuration. If specifying an explicit version for a module, automatic modules versions upgrade must be disabled by setting the '.upgradeSpec.upgradeModulesToLatest' field in the REC to 'false'. Note that the option to specify module versions is deprecated, and will be removed in future releases.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>ossCluster</td>
        <td>boolean</td>
        <td>
          Enables OSS Cluster mode. Note: Not all client libraries support OSS cluster mode.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>persistence</td>
        <td>enum</td>
        <td>
          Database persistence policy for on-disk storage.<br/>
          <br/>
            <i>Enum</i>: disabled, aofEverySecond, aofAlways, snapshotEvery1Hour, snapshotEvery6Hour, snapshotEvery12Hour<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>proxyPolicy</td>
        <td>string</td>
        <td>
          Proxy policy for the database. Supported proxy policies are: single/all-master-shards/all-nodes When left blank, the default value will be chosen according to the value of ossCluster - single if disabled, all-master-shards when enabled<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>rackAware</td>
        <td>boolean</td>
        <td>
          Enables rack awareness for improved availability. See https://redis.io/docs/latest/operate/rs/clusters/configure/rack-zone-awareness/<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterprisecluster">redisEnterpriseCluster</a></td>
        <td>object</td>
        <td>
          Connection to the Redis Enterprise Cluster.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>redisVersion</td>
        <td>string</td>
        <td>
          Redis OSS version. Version can be specified via <major.minor> prefix, or via channels - for existing databases - Upgrade Redis OSS version. For new databases - the version which the database will be created with. If set to 'major' - will always upgrade to the most recent major Redis version. If set to 'latest' - will always upgrade to the most recent Redis version. Depends on 'redisUpgradePolicy' - if you want to set the value to 'latest' for some databases, you must set redisUpgradePolicy on the cluster before. Possible values are 'major' or 'latest' When using upgrade - make sure to backup the database before. This value is used only for database type 'redis'<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specreplicasources">replicaSources</a></td>
        <td>[]object</td>
        <td>
          What databases to replicate from<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>replication</td>
        <td>boolean</td>
        <td>
          Enables in-memory database replication for higher availability. Creates a replica shard for every master shard. Defaults to false.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>resp3</td>
        <td>boolean</td>
        <td>
          Whether this database supports RESP3 protocol. Note - Deleting this property after explicitly setting its value shall have no effect. Please view the corresponding field in RS doc for more info.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>rofRamSize</td>
        <td>string</td>
        <td>
          The size of the RAM portion of an Auto Tiering (formerly Redis on Flash) database. Similarly to "memorySize" use formats like 100MB, 0.1GB. It must be at least 10% of combined memory size (RAM and Flash), as specified by "memorySize".<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specrolespermissions">rolesPermissions</a></td>
        <td>[]object</td>
        <td>
          List of Redis Enteprise ACL and Role bindings to apply<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>shardCount</td>
        <td>integer</td>
        <td>
          Number of database server-side shards.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>shardingEnabled</td>
        <td>boolean</td>
        <td>
          Toggles database sharding for REAADBs (Active Active databases) and enabled by default. This field is blocked for REDB (non-Active Active databases) and sharding is toggled via the shardCount field - when shardCount is 1 this is disabled otherwise enabled.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>shardsPlacement</td>
        <td>enum</td>
        <td>
          Shard placement strategy: "dense" or "sparse". dense: Shards reside on as few nodes as possible. sparse: Shards are distributed across as many nodes as possible.<br/>
          <br/>
            <i>Enum</i>: dense, sparse<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>tlsMode</td>
        <td>enum</td>
        <td>
          Require TLS authenticated and encrypted connections to the database. enabled - all client and replication connections to the Database must use TLS. disabled - no incoming connection to the Database should use TLS. replica_ssl - databases that replicate from this one need to use TLS.<br/>
          <br/>
            <i>Enum</i>: disabled, enabled, replica_ssl<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>type</td>
        <td>enum</td>
        <td>
          Database type: redis or memcached.<br/>
          <br/>
            <i>Enum</i>: redis, memcached<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specupgradespec">upgradeSpec</a></td>
        <td>object</td>
        <td>
          Specifications for DB upgrade.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.activeActive
<sup><sup>[↩ Parent](#spec)</sup></sup>

Connection/ association to the Active-Active database.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          The the corresponding Active-Active database name, Redis Enterprise Active Active Database custom resource name, this Resource is associated with. In case this resource is created manually at the active active database creation this field must be filled via the user, otherwise, the operator will assign this field automatically. Note: this feature is currently unsupported.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>participatingClusterName</td>
        <td>string</td>
        <td>
          The corresponding participating cluster name, Redis Enterprise Remote Cluster custom resource name, in the Active-Active database, In case this resource is created manually at the active active database creation this field must be filled via the user, otherwise, the operator will assign this field automatically. Note: this feature is currently unsupported.<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.alertSettings
<sup><sup>[↩ Parent](#spec)</sup></sup>

Settings for database alerts

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specalertsettingsbdb_backup_delayed">bdb_backup_delayed</a></td>
        <td>object</td>
        <td>
          Periodic backup has been delayed for longer than specified threshold value [minutes]. -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specalertsettingsbdb_crdt_src_high_syncer_lag">bdb_crdt_src_high_syncer_lag</a></td>
        <td>object</td>
        <td>
          Active-active source - sync lag is higher than specified threshold value [seconds] -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specalertsettingsbdb_crdt_src_syncer_connection_error">bdb_crdt_src_syncer_connection_error</a></td>
        <td>object</td>
        <td>
          Active-active source - sync has connection error while trying to connect replica source -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specalertsettingsbdb_crdt_src_syncer_general_error">bdb_crdt_src_syncer_general_error</a></td>
        <td>object</td>
        <td>
          Active-active source - sync encountered in general error -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specalertsettingsbdb_high_latency">bdb_high_latency</a></td>
        <td>object</td>
        <td>
          Latency is higher than specified threshold value [micro-sec] -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specalertsettingsbdb_high_throughput">bdb_high_throughput</a></td>
        <td>object</td>
        <td>
          Throughput is higher than specified threshold value [requests / sec.] -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specalertsettingsbdb_long_running_action">bdb_long_running_action</a></td>
        <td>object</td>
        <td>
          An alert for state-machines that are running for too long -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specalertsettingsbdb_low_throughput">bdb_low_throughput</a></td>
        <td>object</td>
        <td>
          Throughput is lower than specified threshold value [requests / sec.] -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specalertsettingsbdb_ram_dataset_overhead">bdb_ram_dataset_overhead</a></td>
        <td>object</td>
        <td>
          Dataset RAM overhead of a shard has reached the threshold value [% of its RAM limit] -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specalertsettingsbdb_ram_values">bdb_ram_values</a></td>
        <td>object</td>
        <td>
          Percent of values kept in a shard's RAM is lower than [% of its key count] -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specalertsettingsbdb_replica_src_high_syncer_lag">bdb_replica_src_high_syncer_lag</a></td>
        <td>object</td>
        <td>
          Replica-of source - sync lag is higher than specified threshold value [seconds] -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specalertsettingsbdb_replica_src_syncer_connection_error">bdb_replica_src_syncer_connection_error</a></td>
        <td>object</td>
        <td>
          Replica-of source - sync has connection error while trying to connect replica source -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specalertsettingsbdb_shard_num_ram_values">bdb_shard_num_ram_values</a></td>
        <td>object</td>
        <td>
          Number of values kept in a shard's RAM is lower than [values] -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specalertsettingsbdb_size">bdb_size</a></td>
        <td>object</td>
        <td>
          Dataset size has reached the threshold value [% of the memory limit] expected fields: -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.alertSettings.bdb_backup_delayed
<sup><sup>[↩ Parent](#specalertsettings)</sup></sup>

Periodic backup has been delayed for longer than specified threshold value [minutes]. -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>enabled</td>
        <td>boolean</td>
        <td>
          Alert enabled or disabled<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.alertSettings.bdb_crdt_src_high_syncer_lag
<sup><sup>[↩ Parent](#specalertsettings)</sup></sup>

Active-active source - sync lag is higher than specified threshold value [seconds] -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>enabled</td>
        <td>boolean</td>
        <td>
          Alert enabled or disabled<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.alertSettings.bdb_crdt_src_syncer_connection_error
<sup><sup>[↩ Parent](#specalertsettings)</sup></sup>

Active-active source - sync has connection error while trying to connect replica source -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>enabled</td>
        <td>boolean</td>
        <td>
          Alert enabled or disabled<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.alertSettings.bdb_crdt_src_syncer_general_error
<sup><sup>[↩ Parent](#specalertsettings)</sup></sup>

Active-active source - sync encountered in general error -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>enabled</td>
        <td>boolean</td>
        <td>
          Alert enabled or disabled<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.alertSettings.bdb_high_latency
<sup><sup>[↩ Parent](#specalertsettings)</sup></sup>

Latency is higher than specified threshold value [micro-sec] -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>enabled</td>
        <td>boolean</td>
        <td>
          Alert enabled or disabled<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.alertSettings.bdb_high_throughput
<sup><sup>[↩ Parent](#specalertsettings)</sup></sup>

Throughput is higher than specified threshold value [requests / sec.] -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>enabled</td>
        <td>boolean</td>
        <td>
          Alert enabled or disabled<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.alertSettings.bdb_long_running_action
<sup><sup>[↩ Parent](#specalertsettings)</sup></sup>

An alert for state-machines that are running for too long -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>enabled</td>
        <td>boolean</td>
        <td>
          Alert enabled or disabled<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.alertSettings.bdb_low_throughput
<sup><sup>[↩ Parent](#specalertsettings)</sup></sup>

Throughput is lower than specified threshold value [requests / sec.] -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>enabled</td>
        <td>boolean</td>
        <td>
          Alert enabled or disabled<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.alertSettings.bdb_ram_dataset_overhead
<sup><sup>[↩ Parent](#specalertsettings)</sup></sup>

Dataset RAM overhead of a shard has reached the threshold value [% of its RAM limit] -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>enabled</td>
        <td>boolean</td>
        <td>
          Alert enabled or disabled<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.alertSettings.bdb_ram_values
<sup><sup>[↩ Parent](#specalertsettings)</sup></sup>

Percent of values kept in a shard's RAM is lower than [% of its key count] -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>enabled</td>
        <td>boolean</td>
        <td>
          Alert enabled or disabled<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.alertSettings.bdb_replica_src_high_syncer_lag
<sup><sup>[↩ Parent](#specalertsettings)</sup></sup>

Replica-of source - sync lag is higher than specified threshold value [seconds] -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>enabled</td>
        <td>boolean</td>
        <td>
          Alert enabled or disabled<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.alertSettings.bdb_replica_src_syncer_connection_error
<sup><sup>[↩ Parent](#specalertsettings)</sup></sup>

Replica-of source - sync has connection error while trying to connect replica source -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>enabled</td>
        <td>boolean</td>
        <td>
          Alert enabled or disabled<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.alertSettings.bdb_shard_num_ram_values
<sup><sup>[↩ Parent](#specalertsettings)</sup></sup>

Number of values kept in a shard's RAM is lower than [values] -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>enabled</td>
        <td>boolean</td>
        <td>
          Alert enabled or disabled<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.alertSettings.bdb_size
<sup><sup>[↩ Parent](#specalertsettings)</sup></sup>

Dataset size has reached the threshold value [% of the memory limit] expected fields: -Note threshold is commented (allow string/int/float and support backwards compatibility) but is required

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>enabled</td>
        <td>boolean</td>
        <td>
          Alert enabled or disabled<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.backup
<sup><sup>[↩ Parent](#spec)</sup></sup>

Target for automatic database backups.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specbackupabs">abs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specbackupftp">ftp</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specbackupgcs">gcs</a></td>
        <td>object</td>
        <td>
          GoogleStorage<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>interval</td>
        <td>integer</td>
        <td>
          Backup Interval in seconds<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specbackupmount">mount</a></td>
        <td>object</td>
        <td>
          MountPointStorage<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specbackups3">s3</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specbackupsftp">sftp</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specbackupswift">swift</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.backup.abs
<sup><sup>[↩ Parent](#specbackup)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>absSecretName</td>
        <td>string</td>
        <td>
          The name of the K8s secret that holds ABS credentials. The secret must contain the keys "AccountName" and "AccountKey", and these must hold the corresponding credentials<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>container</td>
        <td>string</td>
        <td>
          Azure Blob Storage container name.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>subdir</td>
        <td>string</td>
        <td>
          Optional. Azure Blob Storage subdir under container.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.backup.ftp
<sup><sup>[↩ Parent](#specbackup)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>url</td>
        <td>string</td>
        <td>
          a URI of the ftps://[USER[:PASSWORD]@]HOST[:PORT]/PATH[/]<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.backup.gcs
<sup><sup>[↩ Parent](#specbackup)</sup></sup>

GoogleStorage

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>bucketName</td>
        <td>string</td>
        <td>
          Google Storage bucket name.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>gcsSecretName</td>
        <td>string</td>
        <td>
          The name of the K8s secret that holds the Google Cloud Storage credentials. The secret must contain the keys "CLIENT_ID", "PRIVATE_KEY", "PRIVATE_KEY_ID", "CLIENT_EMAIL" and these must hold the corresponding credentials. The keys should correspond to the values in the key JSON.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>subdir</td>
        <td>string</td>
        <td>
          Optional. Google Storage subdir under bucket.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.backup.mount
<sup><sup>[↩ Parent](#specbackup)</sup></sup>

MountPointStorage

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>path</td>
        <td>string</td>
        <td>
          Path to the local mount point. You must create the mount point on all nodes, and the redislabs:redislabs user must have read and write permissions on the local mount point.<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.backup.s3
<sup><sup>[↩ Parent](#specbackup)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>awsSecretName</td>
        <td>string</td>
        <td>
          The name of the K8s secret that holds the AWS credentials. The secret must contain the keys "AWS_ACCESS_KEY_ID" and "AWS_SECRET_ACCESS_KEY", and these must hold the corresponding credentials.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>bucketName</td>
        <td>string</td>
        <td>
          Amazon S3 bucket name.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>subdir</td>
        <td>string</td>
        <td>
          Optional. Amazon S3 subdir under bucket.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.backup.sftp
<sup><sup>[↩ Parent](#specbackup)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>sftpSecretName</td>
        <td>string</td>
        <td>
          The name of the K8s secret that holds SFTP credentials. The secret must contain the "Key" key, which is the SSH private key for connecting to the sftp server.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>sftp_url</td>
        <td>string</td>
        <td>
          SFTP url<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.backup.swift
<sup><sup>[↩ Parent](#specbackup)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>auth_url</td>
        <td>string</td>
        <td>
          Swift service authentication URL.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>container</td>
        <td>string</td>
        <td>
          Swift object store container for storing the backup files.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>swiftSecretName</td>
        <td>string</td>
        <td>
          The name of the K8s secret that holds Swift credentials. The secret must contain the keys "Key" and "User", and these must hold the corresponding credentials: service access key and service user name (pattern for the latter does not allow special characters &,<,>,")<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>prefix</td>
        <td>string</td>
        <td>
          Optional. Prefix (path) of backup files in the swift container.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.modulesList[]
<sup><sup>[↩ Parent](#spec)</sup></sup>

Redis Enterprise module (see https://redis.io/docs/latest/develop/reference/modules/)

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          The name of the module, e.g. "search" or "ReJSON". The complete list of modules available in the cluster can be retrieved from the '.status.modules' field in the REC.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>config</td>
        <td>string</td>
        <td>
          Module command line arguments e.g. VKEY_MAX_ENTITY_COUNT 30 30<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>version</td>
        <td>string</td>
        <td>
          The semantic version of the module, e.g. '1.6.12'. Optional for REDB, must be set for REAADB. Note that this field is deprecated, and will be removed in future releases.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseCluster
<sup><sup>[↩ Parent](#spec)</sup></sup>

Connection to the Redis Enterprise Cluster.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          The name of the Redis Enterprise Cluster where the database should be stored.<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.replicaSources[]
<sup><sup>[↩ Parent](#spec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>replicaSourceName</td>
        <td>string</td>
        <td>
          The name of the resource from which the source database URI is derived. The type of resource must match the type specified in the ReplicaSourceType field.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>replicaSourceType</td>
        <td>string</td>
        <td>
          The type of resource from which the source database URI is derived. If set to 'SECRET', the source database URI is derived from the secret named in the ReplicaSourceName field. The secret must have a key named 'uri' that defines the URI of the source database in the form of 'redis://...'. The type of secret (kubernetes, vault, ...) is determined by the secret mechanism used by the underlying REC object. If set to 'REDB', the source database URI is derived from the RedisEnterpriseDatabase resource named in the ReplicaSourceName field.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>clientKeySecret</td>
        <td>string</td>
        <td>
          Secret that defines the client certificate and key used by the syncer in the target database cluster. The secret must have 2 keys in its map: "cert" which is the PEM encoded certificate, and "key" which is the PEM encoded private key.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>compression</td>
        <td>integer</td>
        <td>
          GZIP compression level (0-6) to use for replication.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>serverCertSecret</td>
        <td>string</td>
        <td>
          Secret that defines the server certificate used by the proxy in the source database cluster. The secret must have 1 key in its map: "cert" which is the PEM encoded certificate.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>tlsSniName</td>
        <td>string</td>
        <td>
          TLS SNI name to use for the replication link.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.rolesPermissions[]
<sup><sup>[↩ Parent](#spec)</sup></sup>

Redis Enterprise Role and ACL Binding

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>acl</td>
        <td>string</td>
        <td>
          Acl Name of RolePermissionType<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>role</td>
        <td>string</td>
        <td>
          Role Name of RolePermissionType<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>type</td>
        <td>string</td>
        <td>
          Type of Redis Enterprise Database Role Permission<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.upgradeSpec
<sup><sup>[↩ Parent](#spec)</sup></sup>

Specifications for DB upgrade.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>upgradeModulesToLatest</td>
        <td>boolean</td>
        <td>
          DEPRECATED Upgrades the modules to the latest version that supports the DB version during a DB upgrade action, to upgrade the DB version view the 'redisVersion' field. Notes - All modules must be without specifying the version. in addition, This field is currently not supported for Active-Active databases. The default is true<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### status
<sup><sup>[↩ Parent](#)</sup></sup>

RedisEnterpriseDatabaseStatus defines the observed state of RedisEnterpriseDatabase

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#statusactiveactive">activeActive</a></td>
        <td>object</td>
        <td>
          Connection/ association to the Active-Active database.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#statusbackupinfo">backupInfo</a></td>
        <td>object</td>
        <td>
          Information on the database's periodic backup<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>createdTime</td>
        <td>string</td>
        <td>
          Time when the database was created<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>databaseUID</td>
        <td>string</td>
        <td>
          Database UID provided by redis enterprise<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#statusinternalendpoints">internalEndpoints</a></td>
        <td>[]object</td>
        <td>
          Endpoints listed internally by the Redis Enterprise Cluster. Can be used to correlate a ReplicaSourceStatus entry.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>lastActionStatus</td>
        <td>string</td>
        <td>
          Status of the last action done by operator on this database<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>lastActionUid</td>
        <td>string</td>
        <td>
          UID of the last action done by operator on this database<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>lastUpdated</td>
        <td>string</td>
        <td>
          Time when the database was last updated<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>observedGeneration</td>
        <td>integer</td>
        <td>
          The generation (built in update counter of K8s) of the REDB resource that was fully acted upon, meaning that all changes were handled and sent as an API call to the Redis Enterprise Cluster (REC). This field value should equal the current generation when the resource changes were handled. Note: the lastActionStatus field tracks actions handled asynchronously by the Redis Enterprise Cluster.<br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>redisEnterpriseCluster</td>
        <td>string</td>
        <td>
          The Redis Enterprise Cluster Object this Resource is associated with<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#statusreplicasourcestatuses">replicaSourceStatuses</a></td>
        <td>[]object</td>
        <td>
          ReplicaSource statuses<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>shardStatuses</td>
        <td>map[string]integer</td>
        <td>
          Aggregated statuses of shards<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>specStatus</td>
        <td>string</td>
        <td>
          Whether the desired specification is valid<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>status</td>
        <td>string</td>
        <td>
          The status of the database<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>version</td>
        <td>string</td>
        <td>
          Database compatibility version<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### status.activeActive
<sup><sup>[↩ Parent](#status)</sup></sup>

Connection/ association to the Active-Active database.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          The the corresponding Active-Active database name, Redis Enterprise Active Active Database custom resource name, this Resource is associated with. In case this resource is created manually at the active active database creation this field must be filled via the user, otherwise, the operator will assign this field automatically. Note: this feature is currently unsupported.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>participatingClusterName</td>
        <td>string</td>
        <td>
          The corresponding participating cluster name, Redis Enterprise Remote Cluster custom resource name, in the Active-Active database, In case this resource is created manually at the active active database creation this field must be filled via the user, otherwise, the operator will assign this field automatically. Note: this feature is currently unsupported.<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### status.backupInfo
<sup><sup>[↩ Parent](#status)</sup></sup>

Information on the database's periodic backup

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>backupFailureReason</td>
        <td>string</td>
        <td>
          Reason of last failed backup process<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>backupHistory</td>
        <td>integer</td>
        <td>
          Backup history retention policy (number of days, 0 is forever)<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>backupInterval</td>
        <td>integer</td>
        <td>
          Interval in seconds in which automatic backup will be initiated<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>backupIntervalOffset</td>
        <td>integer</td>
        <td>
          Offset (in seconds) from round backup interval when automatic backup will be initiated (should be less than backup_interval)<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>backupProgressPercentage</td>
        <td>integer</td>
        <td>
          Database scheduled periodic backup progress (percentage)<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>backupStatus</td>
        <td>string</td>
        <td>
          Status of scheduled periodic backup process<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>lastBackupTime</td>
        <td>string</td>
        <td>
          Time of last successful backup<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### status.internalEndpoints[]
<sup><sup>[↩ Parent](#status)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>host</td>
        <td>string</td>
        <td>
          Hostname assigned to the database<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>port</td>
        <td>integer</td>
        <td>
          Database port name<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### status.replicaSourceStatuses[]
<sup><sup>[↩ Parent](#status)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>endpointHost</td>
        <td>string</td>
        <td>
          The internal host name of the replica source database. Can be used as an identifier. See the internalEndpoints list on the REDB status.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>lag</td>
        <td>integer</td>
        <td>
          Lag in millisec between source and destination (while synced).<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>lastError</td>
        <td>string</td>
        <td>
          Last error encountered when syncing from the source.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>lastUpdate</td>
        <td>string</td>
        <td>
          Time when we last receive an update from the source.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>rdbSize</td>
        <td>integer</td>
        <td>
          The source’s RDB size to be transferred during the syncing phase.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>rdbTransferred</td>
        <td>integer</td>
        <td>
          Number of bytes transferred from the source’s RDB during the syncing phase.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>status</td>
        <td>string</td>
        <td>
          Sync status of this source<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>
