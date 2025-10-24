---
Title: RLEC 4.3.0-230 Release Notes (August 2, 2016)
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linkTitle: 4.3.0-230 (August 2, 2016)
weight: 96
---
If you are upgrading from a previous version, make sure to review the
[upgrade
instructions]({{< relref "/operate/rs/installing-upgrading/upgrading" >}})
before running through the upgrade process.

You can upgrade to this version from any 4.2 version. If you have a
version older than 4.2 you should first upgrade to 4.2 and only then
upgrade to this version.

### New features

- Various improvements to internal performance and stability were
    implemented.
- RLEC Flash functionality added. For additional details, refer to
    [Auto Tiering]({{< relref "/operate/rs/databases/flash/" >}})
    and contact <support@redislabs.com> if you are interested in this
    functionality.
- Support for Redis version 3.0 added. When you install or upgrade the
    cluster the new default version for Redis databases will be 3.0 and
    when you upgrade the databases they will be updated to this version.
    If you would like to change the default version to Redis 2.8 refer
    to the instruction in the [Upgrading
    databases]({{< relref "/operate/rs/installing-upgrading/upgrading" >}})
    section. If you would like to upgrade existing databases to the
    latest 2.8 minor version, refer to the Known Issues section below.
- Complete cluster failure recovery instructions added. For additional
    details, refer to [Cluster
    Recovery]({{< relref "/operate/rs/clusters/cluster-recovery.md" >}}).
- Major improvements made to database replication performance process
    by using diskless replication between master and replica shards. The
    data between the master and replica shards is streamed directly,
    instead of using the default file-on-disk mechanism. This behavior
    can be changed for the entire cluster or per database through
    rladmin.
- Major enhancements made to rladmin command line interface to add new
    administration functionalities.
- rlcheck installation verification utility added to facilitate
    checking node health. For additional details, refer to [rlcheck
    installation verification
    utility]({{< relref "/operate/rs/references/cli-utilities/rlcheck" >}}).
- Added the ability to allow the user to configure how machine IP
    addresses are used in Node Configuration setup in the management UI.
    For additional details, refer to [Initial setup - creating a new
    cluster.]({{< relref "/operate/rs/clusters/new-cluster-setup" >}})
- Connection to database endpoint can now be encrypted with SSL. For
    additional details, refer to [Securing client connection with
    SSL]({{< relref "/operate/rs/security/encryption/tls" >}}).
- Added support for running the cluster on the following operating
    systems and versions: RHEL/CentOS 6.6, 7.1, 7.2, RHEL 6.7, Oracle
    Linux 6.5.

### Changes

- Environment configuration profile with name "default" has been
    changed to "cloud" and the default value has been changed to
    "local-network". For additional details, refer to [Performance
    optimization]({{< relref "/operate/rs/clusters/optimize/optimization.md" >}})
    section.
- In the REST API, when creating a database and not setting the
    database replication parameter to "true", the default value assigned
    by the cluster has changed from "true" to "false".
- rladmin syntax updates can affect commands written for prior
    versions of RLEC. In this version commands that are run directly
    from the operating system CLI prompt (not through the rladmin
    prompt) no longer require quotation marks for text with special
    characters.
- Option added to the *Replica-of* process that allows gradual
    "shard-by- shard" replication of a sharded database, reducing the
    load on internal buffers. This optimization setting can be
    configured on the target database using the gradual_sync_mode
    parameter in rladmin.
- The functionality for taking a node offline was removed from the UI.

### Fixed issues

- RLEC-7110 - node does not recover properly after restart in case
    ephemeral storage is not available yet
- RLEC-7502 - log rotate job not working properly on RHEL operating
    system
- RLEC-7599 - issues running on a server with no IPv6 kernel support
- RLEC-7561, RLEC-7597 - issues connecting to database endpoint as
    result of cluster name containing capital letters
- RLEC-7245 - on machines with multiple IPs sometimes the wrong IP
    address is chosen for internal traffic
- RLEC-6815 - wrong log entry is added when enabling cluster alert
    regarding database version compatibility
- RLEC-7652 - database is down in certain failover scenarios only
    when the database is completely empty
- RLEC-7737 - issue where in a specific scenario after node restarts,
    a database with replication both master and replica shards are
    reported as down
- RLEC-7712 - in some cases, the Replica Of process may fail when
    Redis password is set
- RLEC-7726 - node object "avg_latency" statistic is not returned in
    the REST API
- RLEC-7358 - install script issue when running on LVM disks
- RLEC-8086 - port 9443 missing from redislabs-clients.xml
- RLEC-7281 - rotation of internal log files not working properly
- RLEC-8279 - updates to a user definition might cause password reset
    to be required
- RLEC-8512 - when upgrading an existing cluster that has uppercase
    letters in the cluster name (FQDN) the cluster might not function
    properly after the upgrade and attempts to connect to a database
    might fail
- RLEC-8371 - email alerts do not work when using Amazon SES service
- In certain scenarios the node upgrade process may fail if the node
    is in the offline state

### Known issues

- **Issue**: When upgrading to this version from a previous RLEC
    version, rladmin status output will show the database status as
    having an old version. When you upgrade the Redis database (using
    rladmin upgrade db command) the Redis version will be updated to 3.0
    even if you updated the cluster's Redis default version to
    2.8.
    
    **Workaround**: If you would like to cancel the old version
    indication in rladmin status without upgrading the Redis version to
    3.0 you should first change the cluster default version to 2.8
    (using rladmin tune cluster command), and then trigger the Redis
    process to be restarted by migrating the database shards (using
    rladmin migrate db command).

- **Issue**: RLEC-8486 - On Ubuntu, when uninstalling RLEC using the
    apt-get purge command, some of the Redis processes on the machine
    might continue running.
    
    **Workaround**: If you encounter this issue
    you must manually kill the Redis processes.

- **Issue**: RLEC-8283 - The cluster recovery process does not work
    properly when the cluster that needs to be recovered does not have a
    node with ID 1.
    
    **Workaround**: If you encounter this issue please
    [contact Redis support](https://redislabs.com/company/support/)

- **Issue**: In the Replica Of process, if the target database does
    not have replication enabled and it is restarted or fails for any
    reason, the data on the target database might not be in sync with
    the source database, although the status of the Replica Of process
    indicates that it is.
    
    **Workaround**: You must manually stop and
    restart the synchronization process in order to ensure the databases
    are in sync.

- **Issue**: In the Replica Of process, if the source database is
    resharded while the Replica Of process is active, the
    synchronization process will fail.

    **Workaround**: You must manually
    stop and restart the synchronization process after the resharding of
    the source database is done.

- **Issue**: In the Replica Of process, high database traffic might restart the Replica Of process due to the "replica buffer" being exceeded. In this case
    you will often see the status of the Replica Of process display as
    "Syncing".
    
    **Workaround**: You must manually increase the "replica
    buffer" size through rladmin. In order to find the appropriate
    buffer size please [contact Redis support](https://redislabs.com/company/support/)

- **Issue**: In a cluster that is configured to support rack-zone
    awareness, if the user forces migration of a master or replica shard
    through rladmin to a node on the same rack-zone as its corresponding
    master or replica shard, and later runs the rebalance process, the
    rebalance process will not migrate the shards to ensure rack-zone
    awareness compliance.
    
    **Workaround**: In the scenario described
    above, you must use rladmin to manually migrate the shard, to a node
    on a valid rack-zone in order to ensure rack-zone awareness
    compliance.
