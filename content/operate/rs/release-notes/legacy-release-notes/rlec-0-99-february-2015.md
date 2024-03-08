---
Title: RLEC 0.99.5-24 Release Notes (February 15, 2015)
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linkTitle: 0.99.5-24 (February 15, 2015)
weight: 99
---
If you are upgrading from a previous version, make sure to review the
[upgrade
instructions]({{< relref "/operate/rs/installing-upgrading/upgrading" >}})
before running through the upgrade process.

If you are upgrading from version 0.99.5-11:

1. You must restart the services after the upgrade by running the
    following command with user root (sudo su). From the operating
    system's CLI, run the following command:
    cnm_ctl restart
1. After the upgrade, rladmin status command will report that the
    databases are from an old version. It is recommended that you
    upgrade the databases as soon as possible, as described in the
    [upgrade
    instructions]({{< relref "/operate/rs/installing-upgrading/upgrading" >}}).

## New features

None.

## Changes

- Enhancements to memtier_benchmark tool that is included in the
    installation package. You can find more details in the [GitHub
    project.](https://github.com/RedisLabs/memtier_benchmark)

## Fixed issues

- Improvements and fixes related to node failover, remove node and
    take node offline functionality.

## Known issues

- **Issue:** When taking a node offline or removing a node, if the
    node being taken offline or removed is currently serving as the web
    server for the web browser being used to view the management UI, the
    management UI appears down while the node is down.
    **Workaround:** If you are using the cluster name in order to
    connect to the management UI in the browser, and the cluster name is
    registered in your external DNS or you are using the mDNS option,
    then the DNS entries will be updated to point to another node in the
    cluster after a few seconds and the UI will open properly. If you
    are not using the cluster name but rather the node IP in order to
    connect to the management UI in the web browser, you have to use the
    IP of another node in the cluster to access the management UI.
