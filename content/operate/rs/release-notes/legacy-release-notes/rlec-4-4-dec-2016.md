---
Title: RLEC 4.4 Release Notes (December 2016)
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linkTitle: 4.4 (December 2016)
weight: 95
---
If you are upgrading from a previous version, make sure to review the
[upgrade
instructions](https://docs.redis.com/latest/rs/installing-upgrading/upgrading/)
before beginning the upgrade process.

You can upgrade to this version from any 4.3 version. If you have a
version older than 4.3 you must first upgrade to 4.3 and only then
upgrade to this version.

## New features

- Databases can now be configured to have multiple proxies for
    improved performance. Note that when you upgrade the cluster to this
    version and then upgrade existing databases, the databases will be
    updated to use the Single proxy policy and Dense shard placement
    policy. For additional details, refer to [Multiple active
    proxies]({{< relref "/operate/rs/databases/configure/proxy-policy.md" >}}).
- Support for Redis version 3.2 added. When you install or upgrade the
    cluster the new default version for Redis databases will be 3.2 and
    when you upgrade the databases they will be updated to this version.
    If you would like to change the default version to Redis 3.0, refer
    to the instruction in the [Upgrading
    databases](https://docs.redis.com/latest/rs/installing-upgrading/upgrading/)
    If you would like to upgrade existing databases to the latest 3.0
    minor version, refer to the Known Issues section below.
- The cluster can now be configured to support both private and public
    IPs to connect to database endpoints through both public and private
    networks. For additional details, refer to [Private and Public
    Endpoints]({{< relref "/operate/rs/networking/private-public-endpoints.md" >}}).
- **rladmin status** command output has been enhanced to include an
    indication on which node rladmin is running by adding the '\*' sign
    next to the node entry, and to show the host name of the machine the
    node is running on.
- Users can now be assigned security roles to control what level of
    the databases or cluster the users can view and/or edit.

## Changes

- As result of adding the support for multiple proxies for a database,
    the following changes have been made:
    - When you upgrade the cluster to this version and then upgrade
          existing databases, the databases will be updated to use the
          Single proxy policy and Dense shard placement policy.
    - **rladmin status** command output has been updated.
    - **failover \[db \<db:id \| name\>\] endpoint \<id1 .. idN\>**
          and **migrate \[db \<db:id \| name\> \| node \<origin
          node:id\>\] endpoint \<id\> target_node \<id\>** commands are
          no longer relevant for databases using the **single \|
          all-master-shards \| all-nodes** proxy policy. Instead proxies
          can be bound or unbounded to databases as needed.
    - New **rladmin** commands were added, such as **bind** and
          **placement**.
- RLEC has been updated to remove the need to use **sudo** in runtime.
    You still need to be root or use **sudo** when initially installing
    RLEC.
- You no longer need to be root or use **sudo** to run the rladmin
    command, now it is preferred to be a non-privileged user that is
    member of the *redislabs* group to run the command.
- All cluster services are now run using the supervisor mechanism. As
    a result starting, stopping and restarting RLEC services should be
    done using **supervisorctl** command from the OS CLI.
- Linux OS vm.swappiness is now advised to be set to zero, for more
    information see [Disabling Swap in
    Linux]({{< relref "/operate/rs/installing-upgrading/configuring/linux-swap.md" >}}).

## Important fixed issues since 4.3.0

- RLEC-7542 - Add ability to create and manage role based user
    security
- RLEC-8283 - The cluster recovery process does not work properly
    when the cluster that needs to be recovered does not have a node
    with ID 1.
- RLEC-8284 - Add functionality to rladmin to mark a node as a quorum
    only node
- RLEC-8498 - Backup fails under rare conditions
- RLEC-8579 - rladmin supports uppercase for external_addr value
- RLEC-8656 - Fixed conflict with SELinux
- RLEC-8687 - Fixed issue where strong password requirements were not
    honored correctly.
- RLEC-8694 - DMC failed while creating DB with 75 (150 replicated)
    shards
- RLEC-8700 - Fixed issue with network split scenario
- RLEC-8833 - Fixed issue where in some cases endpoint were not
    getting new IPs after node replacement.
- RLEC-9069 - Fixed issue related to RHEL 7 and IPv6.
- RLEC-9156 - Fixed issue causing a full resync of data when a source
    or destination failure occurred.
- RLEC-9173 - Issue with writing data after master and replica failed
- RLEC-9235 - Issue with SSL connection error and self signed
    certificates
- RLEC-9491 - Fixed alerting issue due to incorrect measurement
- RLEC-9534 - Fixed issue with node remove command after RLEC
    uninstalled
- RLEC-9658 - Failed to import backup file from FTP server.
- RLEC-9737 - Fixed issue with backup process to use ephemeral
    storage when needed
- RLEC-9761 - UI had incorrect value increments
- RLEC-9827 - Server with a high number of cores and running RHEL can
    have issues running systune.sh
- RLEC-9853 - Fixed issues with logrotate on RHEL 7.1 so it runs as
    non-privileged user
- RLEC-9858 - If proxy crashed, in some cases this would prevent
    completion of redis failover process
- RLEC-9893 - DB recovery process doesn't recognize original rack
    name when in uppercase
- RLEC-9905 - x.509 certificate signed by custom CA cannot be loaded
    in UI
- RLEC-9925 - master endpoint and shards goes down if co-hosted with
    master of the cluster and the node goes down (single proxy policy)
- RLEC-9926 - Master shard could remain down if on the same node as
    the master of the cluster and the entire node goes down
- RLEC-10340 - Fixed a typo that crashed rladmin status output in
    some cases

Changes in 4.4.2-42:

- RLEC-11941 - Upgrade to 4.4.2-35 on RHEL6 - leash failed when
    python2.6 is installed
- RLEC-11994 - RLEC 4.4.2-35: the UI doesn't display the DBs with
    replication

Changes in 4.4.2 - 49

- RLEC-11209 - Unable to run upgrade due to running_actions check
- RLEC-12647 - Backup to S3 with periods in bucket name are failing
    in some cases

## Known issues

- **Issue:** When upgrading to this version from a previous RLEC
    version, **rladmin status** output will show the database status as
    having an old version. When you upgrade the Redis database (using
    **rladmin upgrade db** command) the Redis version will be updated to
    3.2 even if you updated the cluster's Redis default version to 3.0.
    **Workaround:** If you would like to cancel the old version
    indication in **rladmin status** without upgrading the Redis version
    to 3.2 you should run the **rladmin upgrade db** command with the
    **keep_current_version** flag which will ensure the database is
    upgraded to the latest 3.0 version supported by RLEC.
- **Issue:** RLEC-9200 - in a database configured with multiple
    proxies, if a client sends the MONITOR, CLIENT LIST or CLIENT KILL
    commands, only commands from clients connected from the same proxy
    are returned instead of all commands from all connections.
    **Workaround:** If you would like to get a result across all
    clients, you need to send the monitor command to all proxies and
    aggregate them.
- **Issue:** RLEC-9296 - Different actions in the cluster, like node
    failure or taking a node offline, might cause the Proxy policy to
    change Manual.
    **Workaround:** You can use the **rladmin bind \[db \<db:id \|
    name\>\] endpoint \<id\> policy \<single \| all-master-shards \|
    all-nodes\>** command to set the policy back to the required policy,
    which will ensure all needed proxies are bounded. Note that existing
    client connections might disconnected as result of this process.
- **Issue:** RLEC-8787 - In some cases when using the replica-of
    feature, if the source database(s) are larget than the target
    database, the memory limit on the target database is not enforced
    and that used memory of the target database can go over the memory
    limit set.
    **Workaround:** You should make sure that the total memory limit of all
    source databases is not bigger than the memory limit of the target
    database.
- **Issue:** RLEC-8487 - Some Redis processes stay running after
    purging RLEC from the machine and causes an attempt to reinstall
    RLEC to fail.
    **Workaround:** Run the purge process for a second time and ensure
    that the Redis processes were removed.
- **Issue:** RLEC-8747 - When upgrading to this version, if the UI is
    open in the browser the UI might not work properly after the
    upgrade.
    **Workaround:** Refresh the browser and the UI will return to work
    properly.
- **Issue:** In the Replica Of process, if the target database does
    not have replication enabled and it is restarted or fails for any
    reason, the data on the target database might not be in sync with
    the source database, although the status of the Replica Of process
    indicates that it is.
    **Workaround:** You must manually stop and restart the
    synchronization process in order to ensure the databases are in
    sync.
- **Issue:** In the Replica Of process, if the source database is
    resharded while the Replica Of process is active, the
    synchronization process will fail.
    **Workaround:** You must manually stop and restart the
    synchronization process after the resharding of the source database
    is done.
- **Issue:** In the Replica Of process, if there is very high
    traffic on the database the Replica Of process might be restarted
    frequently due to the "replica buffer" being exceeded. In this case,
    you will often see the status of the Replica Of process display as
    "Syncing".
    **Workaround:** You must manually increase the "replica buffer" size
    through rladmin. To find the appropriate buffer size please contact
    support at: <support@redislabs.com>.
- **Issue:** In a cluster that is configured to support rack-zone
    awareness, if the user forces migration of a master or replica shard
    through rladmin to a node on the same rack-zone as its corresponding
    master or replica shard, and later runs the rebalance process, the
    rebalance process will not migrate the shards to ensure rack-zone
    awareness compliance.
    **Workaround:** In the scenario described above, you must use
    rladmin to manually migrate the shard to a node on a valid rack-zone
    in order to ensure rack-zone awareness compliance.
- **Issue:** DNS doesn't change after having removed the external IP
    address.
    **Workaround:** Unbind IP from affected node and then bind it back.
- **Issue**: CCS gets an error and won't start
    if /var/opt/redislabs/persist/ does not exist.
    **Workaround**: Make sure this directory is not deleted and
    continues to exist.
