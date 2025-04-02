---
Title: Manage logs
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linktitle: Manage logs
weight: 50
url: '/operate/rs/7.4/clusters/logging/log-security/'
---
Redis Enterprise comes with [a set of logs]({{< relref "/operate/rs/7.4/clusters/logging" >}}) on the server and available through the user interface to assist users in investigating actions taken on the server and to troubleshoot issues.

## Send logs to a remote logging server

Redis Enterprise sends logs to syslog by default. You can send these logs to a remote logging server by configuring syslog.

To do this, modify the syslog or rsyslog configuration on your operating system to send logs in the `$logdir` directory (`/var/opt/redislabs/log` in default installations) to a remote monitoring server of your choice. See [rsyslog logging]({{< relref "/operate/rs/7.4/clusters/logging/rsyslog-logging/" >}}) for additional details.

## Log rotation

Redis Enterprise Software's job scheduler runs `logrotate` every five minutes to examine logs stored on the operating system and rotate them based on the log rotation configuration. You can find the log rotation configuration file at `$pkgconfdir/logrotate.conf` as of Redis Enterprise Software version 7.2 (`pkgconfdir` is `/opt/redislabs/config` by default, but can be changed in a custom installation).

By default, log rotation occurs when a log exceeds 200 MB. We recommend sending log files to a remote logging server so you can maintain them more effectively.

The following log rotation policy is enabled by default in Redis Enterprise Software, but you can modify it as needed.

```sh
/var/opt/redislabs/log/*.log {
    su ${osuser} ${osgroup}
    size 200M
    missingok
    copytruncate
    # 2000 is logrotate's way of saying 'infinite'
    rotate 2000
    maxage 7
    compress
    notifempty
    nodateext
    nosharedscripts
    prerotate
        # copy cluster_wd log to another file that will have longer retention
        if [ "\$1" = "/var/opt/redislabs/log/cluster_wd.log" ]; then
        	cp -p /var/opt/redislabs/log/cluster_wd.log /var/opt/redislabs/log/cluster_wd.log.long_retention
        fi
    endscript
}
/var/opt/redislabs/log/cluster_wd.log.long_retention {
    su ${osuser} ${osgroup}
    daily
    missingok
    copytruncate
    rotate 30
    compress
    notifempty
    nodateext
}
```

- `/var/opt/redislabs/log/*.log` - `logrotate` checks the files under the `$logdir` directory (`/var/opt/redislabs/log/`) and rotates any files that end with the extension `.log`.

- `/var/opt/redislabs/log/cluster_wd.log.long_retention` - The contents of `cluster_wd.log` is copied to `cluster_wd.log.long_retention` before rotation, and this copy is kept for longer than normal (30 days).

- `size 200M` - Rotate log files that exceed 200 MB.

- `missingok` - If there are missing log files, do nothing.

- `copytruncate` - Truncate the original log file to zero sizes after creating a copy.

- `rotate 2000` - Keep up to 2000 (effectively infinite) log files.

- `compress` - gzip log files.

- `maxage 7` - Keep the rotated log files for 7 days.

- `notifempty` - Don't rotate the log file if it is empty.

{{<note>}}
For large scale deployments, you might need to rotate logs at faster intervals than daily. You can also use a cronjob or external vendor solutions.
{{</note>}}
