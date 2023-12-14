---
Title: RLEC 4.2.1-30 Release Notes (October 18, 2015)
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linkTitle: 4.2.1-30 (October 18, 2015)
weight: 97
---
If you are upgrading from a previous version, make sure to review the
[upgrade
instructions](https://docs.redis.com/latest/rs/installing-upgrading/upgrading/)
before running through the upgrade process.

## New features

- rsyslog logging support - RLEC now writes by default to syslog,
    which enables monitoring through rsyslog.
- Profile support for tuning cloud and non-cloud environments --
    enables the administrator to configure RLEC to run with different
    performance profiles that are optimized for either cloud or
    non-cloud environments. For additional details, refer to the
    [Performance
    optimization]({{< relref "/operate/rs/clusters/optimize/optimization.md" >}})
    section.
- SLA for AOF rewrite - enables the administrator to configure
    database parameters, by running the rladmin tune command, related to
    when AOF rewrite is triggered based on the time it would take to
    load the database from the AOF file, and on the maximum AOF rewrite
    file size. In addition, updates to the AOF rewrite mechanism
    minimize chances of the disk getting full.
- New warning and alerts related to AOF rewrite mechanism - a warning
    is shown during the setup process in case the disk size is lower
    than twice the size of the RAM. New cluster level alerts added to
    alert when node available disk space is lower than the needed disk
    space for AOF rewrite purposes, and when node performance is
    degraded due to reaching disk I/O limits.
- Replica Of support for multiple sources - the Replica Of feature is
    enhanced to support creating a database that is a replica of
    multiple source databases. For additional details, refer to the Replica Of section.
- Cross cluster Replica Of - the Replica Of feature now supports
    defining a database that is a replica of databases that belong to a
    different RLEC cluster. For additional details, refer to the
    Replica Of section.
- Multi-IP support - on a node that has multiple IPs, enables the
    administrator to specify which IP address is used for internal
    traffic and which IP addresses are used for external traffic. For
    additional details, refer to [Multi-IP &
    IPv6]({{< relref "/operate/rs/networking/multi-ip-ipv6.md" >}})
    support.
- IPv6 support for external traffic - on a node that has multiple
    IPs, external IP addresses can be of IPv6 type. For additional
    details, refer to [Multi-IP &
    IPv6]({{< relref "/operate/rs/networking/multi-ip-ipv6.md" >}})
    support section.
- Support for OpenStack Object Store ("Swift") location for import /
    export / backup. For additional details, refer to [Database
    backup]({{< relref "/operate/rs/databases/import-export/schedule-backups.md" >}})
    and [Importing data to a
    database]({{< relref "/operate/rs/databases/import-export/import-data.md" >}})
    sections.
- Import of a sharded database - support for importing data of a
    sharded database by indicating multiple files paths. For additional
    details, refer to the [Importing data to a
    database]({{< relref "/operate/rs/databases/import-export/import-data.md" >}})
    section.
- Enable running the install script in silent mode using "-y"
    parameter for default answers ("Y") or "-c" for file path parameters
    for custom answers. For additional details, refer to [Accessing and
    installing the setup
    package]({{< relref "/operate/rs/installing-upgrading/_index.md" >}})
    section.
- New rladmin command-line-interface "info" command allows for
    fetching current value of tunable parameters.

## Changes

- rladmin command-line-interface can only be run under user root or
    redislabs. For additional details, refer to the [rladmin
    command-line
    interface (CLI)](https://docs.redis.com/latest/rs/references/rladmin/)
    section.
- Import / export / backup to/from Amazon S3 requires supplying the
    credentials per usage instance; it does not use central cloud
    credentials that used to be supplied in the Settings -\> General
    page.
- Fields related to storing Amazon S3 Cloud credentials have been
    removed from Settings -\> General page.
- Performance optimization in the database resharding mechanism.
- Persistent and ephemeral storage cluster level alerts are enabled by
    default and set to 70%.
- Various enhancements to rladmin command-line-interface (CLI) to
    support new commands.
- Redis version updated to 2.8.21 that addresses
    [CVE-2015-4335/DSA-3279 - Redis Lua Sandbox
    Escape](https://groups.google.com/forum/#!msg/redis-db/4Y6OqK8gEyk/Dg-5cejl-eUJ).
- Port 3336 added to the list of ports being used by RLEC.
- Node "Network utilization" alert measured in percentages (%) has
    been updated to "Network throughput" alert measured in MBps. If the
    alert was defined then it will be disabled when upgrading to this
    version and the user needs to reconfigure it with a new value.
- Performance improvements to the database Import to make the process
    much faster.
- Enhancements to the support package to include additional details.
- Removed support for SSL 2.0/3.0 protocols due to security
    vulnerabilities.
- Disabled "dofile" functionality in Redis to solve a possible
    security vulnerability.
- rladmin CLI "tune watchdog profile" command syntax updated to "tune
    cluster watchdog_profile".

## Fixed issues

- Support for relative path for backup and import functionalities.
- Fix issue with TLS configuration of email server settings.
- Email alerts not sent for database export and import processes.
- Fix erroneous entries in the Log page.
- Sometimes a wrong value is reported in the UI for node used
    ephemeral storage space.
- Sometime the wrong Replica Of Lag value is reported in the UI.
- RLEC-6875 - email server settings not working when using port 587.
- RLEC-5498 - Improve rladmin response time when a node is down.
- Validation of Replica Of source definition did not fail in the UI
    and would only fail in runtime if it was using the Cluster Name
    (FQDN) and the FQDN was not properly configured in the DNS.
- Various improvements to error messages reported by rladmin.

## Known issues

- **Issue**: Connecting from a client to a database endpoint with
    mixed upper case and lower case letters can result in a slow
    response from the database.
    
    **Workaround**: The cluster name (FQDN)
    should consist of only lower-case letters. When connecting from a
    client to a database endpoint, only lower case letters should be
    used in the endpoint.

- **Issue**: When upgrading a node to a new RLEC version (refer to
    [Upgrading
    nodes](https://docs.redis.com/latest/rs/installing-upgrading/upgrading/)
    while the node is in the offline state (refer to [Taking a node
    offline]({{< relref "/operate/rs/clusters/remove-node.md" >}}),
    the upgrade process succeeds but might result in an unstable
    cluster.
    
    **Workaround**: Do not try to upgrade a node while it is in
    the offline state.

- **Issue**: In Red Hat Enterprise Linux, and CentOS operating
    systems, the process used for cleaning up internal log files does
    not work, thereby allowing the log files to grow and possibly result
    in disk space issues.
    
    **Workaround**: On each machine that functions
    as a node in the cluster, create a file named "redislabs", and save
    it in the following location: "/etc/logrotate.d/" (e.g.
    "/etc/logrotate.d/redislabs").
    The file should contain the following text:
    ```
    /var/opt/redislabs/log/\*.log {
    daily
    missingok
    copytruncate
    rotate 7
    compress
    notifempty
    }
    ```
    The file's permissions should be root:root, 644.
    Afterwards, from the operating system command line interface (CLI)
    run the following commands:
    ```
    yum install policycoreutils-python
    semanage fcontext -a -t var_log_t '/var/opt/redislabs/log(/.\*)?'
    restsorecon -R /var/opt/redislabs/log
    ```

- **Issue**: In the Replica Of process, if the target database does
    not have replication enabled and it is restarted or fails for any
    reason, the data on target database might not be in sync with the
    source database, although the status of the Replica Of process
    indicates it is.
    
    **Workaround**: You need to manually stop and
    restart the synchronization process in order to ensure the databases
    are in sync.

- **Issue**: In the Replica Of process, if the source database is
    resharded while the replica of process is active, the
    synchronization process will fail.
    
    **Workaround**: You need to
    manually stop and restart the synchronization process after
    resharding of the source database is done.
- **Issue**: In the replica of process, high database traffic might restart the Replica of process as result of the "replica buffer" being exceeded. In this case you see
    the status of the replica of process as "Syncing"
    frequently.
    
    **Workaround**: You need to manually reconfigure the
    "replica buffer" through rladmin and set the buffer size to a new
    size. In order to find the appropriate buffer size please contact
    support at: <support@redislabs.com>.

- **Issue**: In a cluster that is configured to support rack-zone
    awareness, if the user forces migration of a master or replica shard,
    through rladmin, to a node on the same rack-zone as its
    corresponding master or replica shard, and later runs the rebalance
    process, the rebalance process will not migrate the shards to ensure
    rack-zone awareness compliance.
    
    **Workaround**: In the scenario
    described above, you need to manually migrate the shard, through
    rladmin, to a node on a valid rack-zone in order to ensure rack-zone
    awareness
    compliance.
