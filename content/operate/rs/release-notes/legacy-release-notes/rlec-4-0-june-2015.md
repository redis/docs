---
Title: RLEC 4.0.0-49 Release Notes (June 18, 2015)
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linkTitle: 4.0.0-49 (June 18, 2015)
weight: 98
---
If you are upgrading from a previous version, make sure to review the
[upgrade
instructions](https://docs.redis.com/latest/rs/installing-upgrading/upgrading/)
before running through the upgrade process.

In addition, when running the install.sh script to upgrade the software,
you might be prompted to approve changes to a configuration file named
ccs-redis.conf. It is crucial that you choose Yes when asked whether to
update this file.

## New features

- Support for Red Hat Enterprise Linux (RHEL) and CentOS 6.5 and 7
    operating systems.
- Support for additional AWS AMIs for Ubuntu and Amazon Linux, on
    multiple AWS regions.
- Support for additional browsers and operating systems for the
    management UI.
- Replica Of feature which enables creating a Redis database that
    keeps synchronizing data from another Redis database.
- Rack-zone awareness feature which enables mapping nodes to
    racks/zones to ensure a more sophisticated high-availability
    mechanism.
- Database-related alerts and email alerts.
- Auto-configuration of synchronization of cluster server clocks with
    NTP as part of installation script.
- Database Export functionality.
- Email alerts on database Export and Import.

## Changes

- Database Backup Now functionality replaced with Export
    functionality.
- Database performance improvements to increase throughput and reduce
    latency.
- Improvement to AOF rewrite mechanism to deal with extreme-write
    scenarios and limited disk space configurations.
- Enhancements to rladmin CLI to support additional commands.

## Fixed issues

- Cluster stability improvements related to removing nodes and taking
    nodes offline.
- rladmin CLI bug fixes.

## Known issues

- **Issue**: RLEC-6819 - Uninstall on Red Hat Enterprise Linux does
    not stop all services and if you try to install the software again
    on the same machine the new installation might use prior
    installation data.
    
    **Workaround**: Before installing the software
    again restart the machine or verify that all services are down.

- **Issue**: In the replica of process, if the source database is
    resharded while the replica of process is active, the
    synchronization process will fail.
    
    **Workaround**: You need to
    manually stop and restart the synchronization process after
    resharding of the source database is done.

- **Issue**: In the replica of process, high database traffic might cause the replica of process to restart frequently
    as result of the "replica buffer" being exceeded. In this case you see
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
    awareness compliance.

- **Issue**: In case you deploy a cluster and use the DNS option for
    the cluster name (see details in [How to set the Cluster Name
    (FQDN)]({{< relref "/operate/rs/networking/cluster-dns" >}}),
    do not configure the DNS entries for the cluster nodes, and try to
    configure a database that is a replica of another database within
    the cluster, then the UI allows you to configure the source database
    but the replica of process fails in runtime.
    
    **Workaround**: The
    configuration indicated in this issue is not a valid cluster
    configuration. If you choose to use the DNS option for the cluster
    name then you must configure DNS entries for the nodes, otherwise
    the cluster does not operate correctly. You have to either update
    the DNS accordingly, or recreate the cluster and use the mDNS option
    for the cluster name as described in [How to set the Cluster Name
    (FQDN)]({{< relref "/operate/rs/networking/cluster-dns" >}}).
    
- **Issue**: When taking a node offline or removing a node, if the
    node being taken offline or removed is currently serving as the web
    server for the web browser being used to view the management UI,
    then the management UI appears down while the node is
    down.
    
    **Workaround**: If you are using the cluster name in order to
    connect to the management UI in the browser, and the cluster name is
    registered in your external DNS or you are using the mDNS option,
    then the DNS entries will be updated to point to another node in the
    cluster after a few seconds and the UI will open properly. If you
    are not using the cluster name but rather the node IP in order to
    connect to the management UI in the web browser, you have to use the
    IP of another node in the cluster to access the management UI.
