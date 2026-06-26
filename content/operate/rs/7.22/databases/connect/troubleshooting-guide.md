---
Title: Troubleshooting pocket guide for Redis Enterprise Software
alwaysopen: false
categories:
- docs
- operate
- rs
description: Troubleshoot issues with Redis Enterprise Software, including connectivity
  issues between the database and clients or applications.
linktitle: Troubleshoot
toc: 'true'
weight: 90
url: '/operate/rs/7.22/databases/connect/troubleshooting-guide/'
---

If your client or application cannot connect to your database, verify the following.

## Identify Redis host issues

#### Check resource usage

- Used disk space should be less than `90%`. To check the host machine's disk usage, run the [`df`](https://man7.org/linux/man-pages/man1/df.1.html) command:

    ```sh
    $ df -h
    Filesystem      Size  Used Avail Use% Mounted on
    overlay          59G   23G   33G  41% /
    /dev/vda1        59G   23G   33G  41% /etc/hosts
    ```

- RAM and CPU utilization should be less than `80%`, and host resources must be available exclusively for Redis Enterprise Software. You should also make sure that swap memory is not being used or is not configured.

    1. Run the [`free`](https://man7.org/linux/man-pages/man1/free.1.html) command to check memory usage:

        ```sh
        $ free
                  total        used        free      shared  buff/cache   available
        Mem:        6087028     1954664      993756      409196     3138608     3440856
        Swap:       1048572           0     1048572
        ```

    1. Used CPU should be less than `80%`. To check CPU usage, use `top` or `vmstat`.

        Run [`top`](https://man7.org/linux/man-pages/man1/top.1.html):

        ```sh
        $ top
        Tasks:  54 total,   1 running,  53 sleeping,   0 stopped,   0 zombie
       %Cpu(s):  1.7 us,  1.4 sy,  0.0 ni, 96.8 id,  0.0 wa,  0.0 hi,  0.1 si,  0.0 st
       KiB Mem :  6087028 total,   988672 free,  1958060 used,  3140296 buff/cache
       KiB Swap:  1048572 total,  1048572 free,        0 used.  3437460 avail Mem 
       ```

        Run [`vmstat`](https://man7.org/linux/man-pages/man8/vmstat.8.html):

        ```sh
        $ vmstat
        procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
        r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
        2  0      0 988868 177588 2962876    0    0     0     6    7   12  1  1 99  0  0
       ```

    1. If CPU or RAM usage is greater than 80%, ask your system administrator which process is the culprit. If the process is not related to Redis, terminate it.

#### Sync clock with time server

It is recommended to sync the host clock with a time server.

Verify that time is synchronized with the time server using one of the following commands:

- `ntpq -p`

- `chronyc sources`

- [`timedatectl`](https://man7.org/linux/man-pages/man1/timedatectl.1.html)

#### Remove https_proxy and http_proxy variables

1. Run [`printenv`](https://man7.org/linux/man-pages/man1/printenv.1.html) and check if `https_proxy` and `http_proxy` are configured as environment variables:

    ```sh
    printenv | grep -i proxy
    ```

1. If `https_proxy` or `http_proxy` exist, remove them:

    ```sh
    unset https_proxy
    ```
    ```sh
    unset http_proxy
    ```

#### Review system logs

Review system logs including the syslog or journal for any error messages, warnings, or critical events. See [Logging]({{< relref "/operate/rs/7.22/clusters/logging" >}}) for more information.

## Identify issues caused by security hardening

- Temporarily deactivate any security hardening tools (such as selinux, cylance, McAfee, or dynatrace), and check if the problem is resolved. 

- The user `redislabs` must have read and write access to `/tmp` directory. Run the following commands to verify.

    1. Create a test file in `/tmp` as the `redislabs` user:
        ```sh
        $ su - redislabs -s /bin/bash -c 'touch /tmp/test'
        ```

    1. Verify the file was created successfully:
        ```sh
        $ ls -l /tmp/test
        -rw-rw-r-- 1 redislabs redislabs 0 Aug 12 02:06 /tmp/test
        ```

- Using a non-permissive file mode creation mask (`umask`) can cause issues.

    1. Check the output of `umask`:

        ```sh
        $ umask
        0022
        ```

    1. If `umask`'s output differs from the default value `0022`, it might prevent normal operation. Consult your system administrator and revert to the default `umask` setting.

## Identify cluster issues

- Use `supervisorctl status` to verify all processes are in a `RUNNING` state:

    ```sh
    supervisorctl status
    ```

- Run `rlcheck` and verify no errors appear:

    ```sh
    rlcheck
    ```

- Run [`rladmin status issues_only`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/status" >}}) and verify that no issues appear:

    ```sh
    $ rladmin status issues_only
    CLUSTER NODES:
    NODE:ID ROLE ADDRESS EXTERNAL_ADDRESS HOSTNAME SHARDS CORES FREE_RAM PROVISIONAL_RAM VERSION STATUS

    DATABASES:
    DB:ID  NAME        TYPE  STATUS  SHARDS  PLACEMENT   REPLICATION    PERSISTENCE    ENDPOINT  

    ENDPOINTS:
    DB:ID               NAME             ID          NODE             ROLE             SSL       

    SHARDS:
    DB:ID      NAME     ID        NODE     ROLE     SLOTS      USED_MEMORY            STATUS     

    ```

- Run [`rladmin status shards`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/status#status-shards" >}}). For each shard, `USED_MEMORY` should be less than 25 GB.

    ```sh
    $ rladmin status shards
    SHARDS:
    DB:ID    NAME         ID          NODE      ROLE      SLOTS       USED_MEMORY       STATUS   
    db:1     db1          redis:1     node:1    master    0-16383     2.13MB            OK  
    ```

- Run [`rladmin cluster running_actions`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/cluster/running_actions" >}}) and confirm that no tasks are currently running (active):

    ```sh
    $ rladmin cluster running_actions
    No active tasks
    ```

## Troubleshoot connectivity

#### Database endpoint resolution

1. On the client machine, check if the database endpoint can be resolved:

    ```sh
    dig <endpoint>
    ```

1. If endpoint resolution fails on the client machine, check on one of the cluster nodes:

    ```sh
    dig @localhost <endpoint>
    ```

1. If endpoint resolution succeeds on the cluster node but fails on the client machine, review the DNS configuration and fix any errors.

1. If the endpoint can’t be resolved on the cluster node, [contact support](https://redis.com/company/support/).

#### Client application issues

1. To identify possible client application issues, test connectivity from the client machine to the database using [`redis-cli`]({{< relref "/operate/rs/7.22/references/cli-utilities/redis-cli" >}}):

    [`INFO`]({{< relref "/commands/info" >}}):

    ```sh
    redis-cli -h <endpoint> -p <port> -a <password> INFO
    ```

    [`PING`]({{< relref "/commands/ping" >}}):

    ```sh
    redis-cli -h <endpoint> -p <port> -a <password> PING
    ```
   
    or if TLS is enabled:
    
    ```sh
    redis-cli -h <endpoint> -p <port> -a <password> --tls --insecure --cert --key PING
    ```

1. If the client machine cannot connect, try to connect to the database from one of the cluster nodes:

    ```sh
    redis-cli -h <node IP or hostname> -p <port> -a <password> PING
    ```

1. If the cluster node is also unable to connect to the database, [contact Redis support](https://redis.com/company/support/).

1. If the client fails to connect, but the cluster node succeeds, perform health checks on the client and network.

#### Firewall access

1. Run one of the following commands to verify that database access is not blocked by a firewall on the client machine or cluster:

    ```sh
    iptables -L
    ```

    ```sh
    ufw status
    ```

    ```sh
    firewall-cmd –list-all
    ```

1. To resolve firewall issues:

    1. If a firewall is configured for your database, add the client IP address to the firewall rules.

    1. Configure third-party firewalls and external proxies to allow the cluster FQDN, database endpoint IP address, and database ports.

## Troubleshoot latency

#### Server-side latency

- Make sure the database's used memory does not reach the configured database max memory limit. For more details, see [Database memory limits]({{< relref "/operate/rs/7.22/databases/memory-performance/memory-limit" >}}).

- Try to correlate the time of the latency with any surge in the following metrics:

    - Number of connections

    - Used memory

    - Evicted keys

    - Expired keys 

- Run [`SLOWLOG GET`]({{< relref "/commands/slowlog-get" >}}) using [`redis-cli`]({{< relref "/operate/rs/7.22/references/cli-utilities/redis-cli" >}}) to identify slow commands such as [`KEYS`]({{< relref "/commands/keys" >}}) or [`HGETALL`]({{< relref "/commands/hgetall" >}}:

    ```sh
    redis-cli -h <endpoint> -p <port> -a <password> SLOWLOG GET <number of entries>
    ```

    Consider using alternative commands such as [`SCAN`]({{< relref "/commands/scan" >}}), [`SSCAN`]({{< relref "/commands/sscan" >}}), [`HSCAN`]({{< relref "/commands/hscan" >}}) and [`ZSCAN`]({{< relref "/commands/zscan" >}})

- Keys with large memory footprints can cause latency. To identify such keys, compare the keys returned by [`SLOWLOG GET`]({{< relref "/commands/slowlog-get" >}}) with the output of the following commands:

    ```sh
    redis-cli -h <endpoint> -p <port> -a <password> --memkeys
    ```

    ```sh
    redis-cli -h <endpoint> -p <port> -a <password> --bigkeys
    ```

- For additional diagnostics, see:

    - [Diagnosing latency issues]({{< relref "/operate/oss_and_stack/management/optimization/latency" >}})

    - [View Redis slow log]({{< relref "/operate/rs/7.22/clusters/logging/redis-slow-log" >}})

#### Client-side latency

Verify the following:

- There is no memory or CPU pressure on the client host.

- The client uses a connection pool instead of frequently opening and closing connections.

- The client does not erroneously open multiple connections that can pressure the client or server.
