---
title: RedisEnterpriseActiveActiveDatabase API Reference
alwaysopen: false
categories:
- docs
- operate
- kubernetes
linkTitle: REAADB API
weight: 30
---

apiVersion:


- [app.redislabs.com/v1alpha1](#appredislabscomv1alpha1)




# app.redislabs.com/v1alpha1




RedisEnterpriseActiveActiveDatabase is the Schema for the redisenterpriseactiveactivedatabase API

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
      <td>RedisEnterpriseActiveActiveDatabase</td>
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
          RedisEnterpriseActiveActiveDatabaseSpec defines the desired state of RedisEnterpriseActiveActiveDatabase<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#status">status</a></td>
        <td>object</td>
        <td>
          RedisEnterpriseActiveActiveDatabaseStatus defines the observed state of RedisEnterpriseActiveActiveDatabase<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec
<sup><sup>[↩ Parent](#)</sup></sup>

RedisEnterpriseActiveActiveDatabaseSpec defines the desired state of RedisEnterpriseActiveActiveDatabase

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
        <td><a href="#specparticipatingclusters">participatingClusters</a></td>
        <td>[]object</td>
        <td>
          The list of instances/ clusters specifications and configurations.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specglobalconfigurations">globalConfigurations</a></td>
        <td>object</td>
        <td>
          The Active-Active database global configurations, contains the global properties for each of the participating clusters/ instances databases within the Active-Active database.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterprisecluster">redisEnterpriseCluster</a></td>
        <td>object</td>
        <td>
          Connection to Redis Enterprise Cluster<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.participatingClusters[]
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
        <td>name</td>
        <td>string</td>
        <td>
          The name of the remote cluster CR to link.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>externalReplicationPort</td>
        <td>integer</td>
        <td>
          The desired replication endpoint's port number for users who utilize LoadBalancers for sync between AA replicas and need to provide the specific port number that the LoadBalancer listens to.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.globalConfigurations
<sup><sup>[↩ Parent](#spec)</sup></sup>

The Active-Active database global configurations, contains the global properties for each of the participating clusters/ instances databases within the Active-Active database.

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
        <td><a href="#specglobalconfigurationsactiveactive">activeActive</a></td>
        <td>object</td>
        <td>
          Connection/ association to the Active-Active database.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specglobalconfigurationsbackup">backup</a></td>
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
          Database port number. TCP port on which the database is available. Will be generated automatically if omitted. can not be changed after creation<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>databaseSecretName</td>
        <td>string</td>
        <td>
          The name of the secret that holds the password to the database (redis databases only). If secret does not exist, it will be created. To define the password, create an opaque secret and set the name in the spec. The password will be taken from the value of the 'password' key. Use an empty string as value within the secret to disable authentication for the database. Notes - For Active-Active databases this secret will not be automatically created, and also, memcached databases must not be set with a value, and a secret/password will not be automatically created for them. Use the memcachedSaslSecretName field to set authentication parameters for memcached databases.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>defaultUser</td>
        <td>boolean</td>
        <td>
          Is connecting with a default user allowed?  If disabled, the DatabaseSecret will not be created or updated<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>evictionPolicy</td>
        <td>string</td>
        <td>
          Database eviction policy. see more https://docs.redislabs.com/latest/rs/administering/database-operations/eviction-policy/<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>isRof</td>
        <td>boolean</td>
        <td>
          Whether it is an RoF database or not. Applicable only for databases of type "REDIS". Assumed to be false if left blank.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>memcachedSaslSecretName</td>
        <td>string</td>
        <td>
          Credentials used for binary authentication in memcached databases. The credentials should be saved as an opaque secret and the name of that secret should be configured using this field. For username, use 'username' as the key and the actual username as the value. For password, use 'password' as the key and the actual password as the value. Note that connections are not encrypted.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>memorySize</td>
        <td>string</td>
        <td>
          memory size of database. use formats like 100MB, 0.1GB. minimum value in 100MB. When redis on flash (RoF) is enabled, this value refers to RAM+Flash memory, and it must not be below 1GB.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specglobalconfigurationsmoduleslist">modulesList</a></td>
        <td>[]object</td>
        <td>
          List of modules associated with the database. The list of valid modules for the specific cluster can be retrieved from the status of the REC object. Use the "name" and "versions" fields for the specific module configuration. If specifying an explicit version for a module, automatic modules versions upgrade must be disabled by setting the '.upgradeSpec.upgradeModulesToLatest' field in the REC to 'false'. Note that the option to specify module versions is deprecated, and will be removed in future releases.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>ossCluster</td>
        <td>boolean</td>
        <td>
          OSS Cluster mode option. Note that not all client libraries support OSS cluster mode.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>persistence</td>
        <td>enum</td>
        <td>
          Database on-disk persistence policy<br/>
          <br/>
            <i>Enum</i>: disabled, aofEverySecond, aofAlways, snapshotEvery1Hour, snapshotEvery6Hour, snapshotEvery12Hour<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>proxyPolicy</td>
        <td>string</td>
        <td>
          The policy used for proxy binding to the endpoint. Supported proxy policies are: single/all-master-shards/all-nodes When left blank, the default value will be chosen according to the value of ossCluster - single if disabled, all-master-shards when enabled<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>rackAware</td>
        <td>boolean</td>
        <td>
          Whether database should be rack aware. This improves availability - more information: https://docs.redislabs.com/latest/rs/concepts/high-availability/rack-zone-awareness/<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specglobalconfigurationsredisenterprisecluster">redisEnterpriseCluster</a></td>
        <td>object</td>
        <td>
          Connection to Redis Enterprise Cluster<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>redisVersion</td>
        <td>string</td>
        <td>
          Redis OSS version. Version can be specified via <major.minor> prefix, or via channels - for existing databases - Upgrade Redis OSS version. For new databases - the version which the database will be created with. If set to 'major' - will always upgrade to the most recent major Redis version. If set to 'latest' - will always upgrade to the most recent Redis version. Depends on 'redisUpgradePolicy' - if you want to set the value to 'latest' for some databases, you must set redisUpgradePolicy on the cluster before. Possible values are 'major' or 'latest' When using upgrade - make sure to backup the database before. This value is used only for database type 'redis'. Note - Specifying Redis version is currently not supported for Active-Active database.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specglobalconfigurationsreplicasources">replicaSources</a></td>
        <td>[]object</td>
        <td>
          What databases to replicate from<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>replication</td>
        <td>boolean</td>
        <td>
          In-memory database replication. When enabled, database will have replica shard for every master - leading to higher availability. Defaults to false.<br/>
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
          The size of the RAM portion of an RoF database. Similarly to "memorySize" use formats like 100MB, 0.1GB It must be at least 10% of combined memory size (RAM+Flash), as specified by "memorySize".<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specglobalconfigurationsrolespermissions">rolesPermissions</a></td>
        <td>[]object</td>
        <td>
          List of Redis Enteprise ACL and Role bindings to apply<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>shardCount</td>
        <td>integer</td>
        <td>
          Number of database server-side shards<br/>
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
        <td>string</td>
        <td>
          Control the density of shards - should they reside on as few or as many nodes as possible. Available options are "dense" or "sparse". If left unset, defaults to "dense".<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>tlsMode</td>
        <td>enum</td>
        <td>
          Require SSL authenticated and encrypted connections to the database. enabled - all incoming connections to the Database must use SSL. disabled - no incoming connection to the Database should use SSL. replica_ssl - databases that replicate from this one need to use SSL.<br/>
          <br/>
            <i>Enum</i>: disabled, enabled, replica_ssl<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>type</td>
        <td>enum</td>
        <td>
          The type of the database.<br/>
          <br/>
            <i>Enum</i>: redis, memcached<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specglobalconfigurationsupgradespec">upgradeSpec</a></td>
        <td>object</td>
        <td>
          Specifications for DB upgrade.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.globalConfigurations.activeActive
<sup><sup>[↩ Parent](#specglobalconfigurations)</sup></sup>

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

### spec.globalConfigurations.backup
<sup><sup>[↩ Parent](#specglobalconfigurations)</sup></sup>

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
        <td><a href="#specglobalconfigurationsbackupabs">abs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specglobalconfigurationsbackupftp">ftp</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specglobalconfigurationsbackupgcs">gcs</a></td>
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
        <td><a href="#specglobalconfigurationsbackupmount">mount</a></td>
        <td>object</td>
        <td>
          MountPointStorage<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specglobalconfigurationsbackups3">s3</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specglobalconfigurationsbackupsftp">sftp</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specglobalconfigurationsbackupswift">swift</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.globalConfigurations.backup.abs
<sup><sup>[↩ Parent](#specglobalconfigurationsbackup)</sup></sup>



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
          The name of the secret that holds ABS credentials. The secret must contain the keys "AccountName" and "AccountKey", and these must hold the corresponding credentials<br/>
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


### spec.globalConfigurations.backup.ftp
<sup><sup>[↩ Parent](#specglobalconfigurationsbackup)</sup></sup>



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
          a URI of the "ftps://[USER[:PASSWORD]@]HOST[:PORT]/PATH[/]" format<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.globalConfigurations.backup.gcs
<sup><sup>[↩ Parent](#specglobalconfigurationsbackup)</sup></sup>

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
          The name of the secret that holds the Google Cloud Storage credentials. The secret must contain the keys "CLIENT_ID", "PRIVATE_KEY", "PRIVATE_KEY_ID", "CLIENT_EMAIL" and these must hold the corresponding credentials. The keys should correspond to the values in the key JSON.<br/>
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


### spec.globalConfigurations.backup.mount
<sup><sup>[↩ Parent](#specglobalconfigurationsbackup)</sup></sup>

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


### spec.globalConfigurations.backup.s3
<sup><sup>[↩ Parent](#specglobalconfigurationsbackup)</sup></sup>



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
          The name of the secret that holds the AWS credentials. The secret must contain the keys "AWS_ACCESS_KEY_ID" and "AWS_SECRET_ACCESS_KEY", and these must hold the corresponding credentials.<br/>
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


### spec.globalConfigurations.backup.sftp
<sup><sup>[↩ Parent](#specglobalconfigurationsbackup)</sup></sup>



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
          The name of the secret that holds SFTP credentials. The secret must contain the "Key" key, which is the SSH private key for connecting to the sftp server.<br/>
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


### spec.globalConfigurations.backup.swift
<sup><sup>[↩ Parent](#specglobalconfigurationsbackup)</sup></sup>



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
          The name of the secret that holds Swift credentials. The secret must contain the keys "Key" and "User", and these must hold the corresponding credentials: service access key and service user name (pattern for the latter does not allow special characters &,<,>,")<br/>
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


### spec.globalConfigurations.modulesList[]
<sup><sup>[↩ Parent](#specglobalconfigurations)</sup></sup>

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


### spec.globalConfigurations.redisEnterpriseCluster
<sup><sup>[↩ Parent](#specglobalconfigurations)</sup></sup>

Connection to Redis Enterprise Cluster

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


### spec.globalConfigurations.replicaSources[]
<sup><sup>[↩ Parent](#specglobalconfigurations)</sup></sup>



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


### spec.globalConfigurations.rolesPermissions[]
<sup><sup>[↩ Parent](#specglobalconfigurations)</sup></sup>

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
          Acl Name of RolePermissionType (note: use exact name of the ACL from the Redis Enterprise ACL list, case sensitive)<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>role</td>
        <td>string</td>
        <td>
          Role Name of RolePermissionType (note: use exact name of the role from the Redis Enterprise role list, case sensitive)<br/>
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


### spec.globalConfigurations.upgradeSpec
<sup><sup>[↩ Parent](#specglobalconfigurations)</sup></sup>

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
          Upgrades the modules to the latest version that supports the DB version during a DB upgrade action, to upgrade the DB version view the 'redisVersion' field. Note - This field is currently not supported for Active-Active databases.<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseCluster
<sup><sup>[↩ Parent](#spec)</sup></sup>

Connection to Redis Enterprise Cluster

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


### status
<sup><sup>[↩ Parent](#)</sup></sup>

RedisEnterpriseActiveActiveDatabaseStatus defines the observed state of RedisEnterpriseActiveActiveDatabase

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
        <td>clusterCertificatesGeneration</td>
        <td>integer</td>
        <td>
          Versions of the cluster's Proxy and Syncer certificates. In Active-Active databases, these are used to detect updates to the certificates, and trigger synchronization across the participating clusters. .<br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>guid</td>
        <td>string</td>
        <td>
          The active-active database corresponding GUID.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>lastTaskUid</td>
        <td>string</td>
        <td>
          The last active-active database task UID.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>linkedRedbs</td>
        <td>[]string</td>
        <td>
          The linked REDBs.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#statusparticipatingclusters">participatingClusters</a></td>
        <td>[]object</td>
        <td>
          The list of instances/ clusters statuses.<br/>
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
        <td>replicationStatus</td>
        <td>enum</td>
        <td>
          The overall replication status<br/>
          <br/>
            <i>Enum</i>: up, down<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#statussecretsstatus">secretsStatus</a></td>
        <td>[]object</td>
        <td>
          The status of the secrets<br/>
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
          The status of the active active database.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### status.participatingClusters[]
<sup><sup>[↩ Parent](#status)</sup></sup>

Status of participating cluster.

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
          The name of the remote cluster CR that is linked.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>id</td>
        <td>integer</td>
        <td>
          The corresponding ID of the instance in the active-active database.<br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>replicationStatus</td>
        <td>enum</td>
        <td>
          The replication status of the participating cluster<br/>
          <br/>
            <i>Enum</i>: up, down<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### status.secretsStatus[]
<sup><sup>[↩ Parent](#status)</sup></sup>

Status of secrets.

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
          The name of the secret.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>status</td>
        <td>enum</td>
        <td>
          The status of the secret.<br/>
          <br/>
            <i>Enum</i>: Valid, Invalid<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>
