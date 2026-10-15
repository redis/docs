---
Title: Prepare Google Cloud SQL for MySQL for RDI
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Prepare a Google Cloud SQL for MySQL database to work with RDI
group: di
linkTitle: Prepare Cloud SQL for MySQL
summary: Configure a Google Cloud SQL for MySQL instance for snapshot and change data capture with Redis Data Integration.
type: integration
weight: 12
---

[Google Cloud SQL for MySQL](https://cloud.google.com/sql/docs/mysql) is a
managed MySQL service on Google Cloud. RDI captures changes from an instance of Cloud SQL
for MySQL through its binary log (binlog), in the same way it would for a
self-managed MySQL server.

> [!NOTE]
> This page describes Cloud SQL for MySQL configured for a self-managed RDI
> deployment (VM or Kubernetes). The integration was validated with RDI 2.0.0
> and Cloud SQL for MySQL 8.0 on a Regional (high availability) instance, using
> a public IP connection with encrypted connections enforced. See
> [RDI in Redis Cloud](/content/integrate/redis-data-integration/_index.md#rdi-in-redis-cloud)
> for the source databases that the managed service supports.

Cloud SQL differs from a self-managed MySQL source in the following ways:

- You can't edit the MySQL configuration file. You enable binary logging as an
  instance setting and set other server variables as Cloud SQL
  [database flags](https://cloud.google.com/sql/docs/mysql/flags).
- Cloud SQL already sets `binlog_format` to `ROW` and enables GTIDs, so you don't
  need to change them.
- Cloud SQL can enforce encrypted connections. If it does, you must configure RDI
  to connect over TLS (Transport Layer Security), or the connection fails with an
  error that looks like a credentials problem.
- On a Regional instance, a failover moves the primary to another zone. RDI
  reconnects automatically, as described in
  [Failover on Regional instances](#failover-on-regional-instances).

The following checklist summarizes the steps to prepare Cloud SQL for MySQL to work with RDI:

```checklist {id="cloudsqlmysqllist"}
- [ ] [Enable binary logging](#1-enable-binary-logging)
- [ ] [Set the binlog row image](#2-set-the-binlog-row-image)
- [ ] [Check the binlog settings](#3-check-the-binlog-settings)
- [ ] [Allow network access from RDI](#4-allow-network-access-from-rdi)
- [ ] [Create a CDC user](#5-create-a-cdc-user)
- [ ] [Configure RDI](#6-configure-rdi)
```

## 1. Enable binary logging

RDI reads changes from the MySQL binlog, which Cloud SQL only writes when binary
logging is enabled. Binary logging requires automated backups.

To enable binary logging when you create an instance, pass `--enable-bin-log` to
[`gcloud sql instances create`](https://cloud.google.com/sdk/gcloud/reference/sql/instances/create).
The following example shows how to do this and also sets the binlog row image flag from
[step 2](#2-set-the-binlog-row-image) and enforces encrypted connections:

```bash
gcloud sql instances create <instance-name> \
  --database-version=MYSQL_8_0 \
  --region=<region> \
  --tier=<machine-tier> \
  --availability-type=REGIONAL \
  --enable-bin-log \
  --database-flags=binlog_row_image=full \
  --ssl-mode=ENCRYPTED_ONLY
```

To enable binary logging on an existing instance, run:

```bash
gcloud sql instances patch <instance-name> --enable-bin-log
```

In the Google Cloud console, binary logging is part of
[point-in-time recovery](https://cloud.google.com/sql/docs/mysql/backup-recovery/pitr).
You must therefore enable point-in-time recovery for the instance to enable binary logging.

## 2. Set the binlog row image

RDI requires the full row image. Set the `binlog_row_image` database flag to
`full`:

```bash
gcloud sql instances patch <instance-name> --database-flags=binlog_row_image=full
```

The flag value must be lowercase. Cloud SQL rejects `binlog_row_image=FULL` (that is with `FULL` in uppercase)
with the error `FULL was not an expected string`. MySQL reports the value as
`FULL` after you set it.

> [!WARNING]
> The `--database-flags` option replaces all the database flags that are
> currently set on the instance. If the instance already has other flags, include
> them in the same command. Changing database flags can restart the instance. See
> [Configure database flags](https://cloud.google.com/sql/docs/mysql/flags) for
> details.

You can also set the flag in the Google Cloud console, in the **Flags** section
when you edit the instance.

## 3. Check the binlog settings

Connect to the instance with the
[MySQL CLI client](https://dev.mysql.com/doc/refman/8.0/en/mysql.html) and run
the following query:

```sql
SHOW GLOBAL VARIABLES WHERE Variable_name IN
  ('log_bin', 'binlog_format', 'binlog_row_image', 'gtid_mode',
   'binlog_row_value_options');
```

Check that the result has the following values:

| Variable | Value |
| :-- | :-- |
| `log_bin` | `ON` |
| `binlog_format` | `ROW` |
| `binlog_row_image` | `FULL` |
| `gtid_mode` | `ON` |
| `binlog_row_value_options` | Empty (not `PARTIAL_JSON`) |

See
[Check `binlog_row_value_options`](/content/integrate/redis-data-integration/data-pipelines/prepare-dbs/my-sql-mariadb.md#6-check-binlog_row_value_options)
to learn why `PARTIAL_JSON` is a problem.

## 4. Allow network access from RDI

If RDI connects to the instance's public IP address, add the public egress IP
address of the RDI host or Kubernetes cluster to the instance's
[authorized networks](https://cloud.google.com/sql/docs/mysql/authorize-networks).
Use a `/32` CIDR for an individual IPv4 address:

```bash
gcloud sql instances patch <instance-name> --authorized-networks=<rdi-egress-ip>/32
```

The `--authorized-networks` option replaces the existing list, so include any
networks that are already authorized.

## 5. Create a CDC user

The Debezium connector needs a MySQL user account to connect to the instance.
Create the user with
[`gcloud sql users create`](https://cloud.google.com/sdk/gcloud/reference/sql/users/create)
and set `--host` explicitly:

```bash
gcloud sql users create <username> \
  --instance=<instance-name> \
  --host=% \
  --password=<password>
```

The value of `%` for `host` lets the user connect from any client address. To restrict the user
to the RDI host, use that host's IP address instead.

Then connect to the instance as an administrator user, such as `root`, and grant
the user the permissions that RDI needs. Use the same host value that you used
to create the user:

```sql
GRANT SELECT, RELOAD, SHOW DATABASES, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO '<username>'@'%';
FLUSH PRIVILEGES;
```

Note that the `GRANT` statement might fail with
`ERROR 1410 (42000): You are not allowed to create a user with GRANT`. This happens when the user
doesn't exist with that host, since Cloud SQL's administrator user can't create a user
implicitly with `GRANT`. Check the user's host with
`gcloud sql users list --instance=<instance-name>`, and either grant to the host
shown there or recreate the user with the `--host` value you want.

## 6. Configure RDI

Store the CDC user's credentials as RDI secrets. Pass the source name with
`--db` (the source in the following example is named `mysql`):

```bash
redis-di set-secret USERNAME --db mysql <username>
redis-di set-secret PASSWORD --db mysql <password>
```

Add a MySQL source to `config.yaml`. If the instance enforces encrypted
connections, set `database.ssl.mode` to `required` (or a stricter mode) in the
source's `advanced.source` section:

```yaml
sources:
  mysql:
    type: cdc
    connection:
      type: mysql
      host: <instance-ip-address>
      port: 3306
      user: ${MYSQL_DB_USERNAME}
      password: ${MYSQL_DB_PASSWORD}
    databases:
      - <database-name>
    advanced:
      source:
        database.ssl.mode: required
```

If you don't set `database.ssl.mode` and the instance only accepts encrypted
connections, the pipeline deployment fails with an error like
`Access denied for user '<username>'@'<ip-address>' (using password: YES)`. This
error looks like a credentials problem, but Cloud SQL is actually rejecting the
unencrypted connection.

The `required` mode encrypts the connection but doesn't verify the server
certificate. To verify the certificate as well, set the source's `CACERT` secret
to the instance's server CA certificate and choose a verifying mode, as described in
[Connect over TLS or mTLS](/content/integrate/redis-data-integration/data-pipelines/prepare-dbs/my-sql-mariadb.md#7-connect-over-tls-or-mtls).

## Failover on Regional instances

A Regional (high availability) Cloud SQL instance has a standby in a second
zone. During a failover, Cloud SQL promotes the standby to primary and keeps the
same IP address. Expect the following behavior when this happens:

- Clients, including your application, can't connect to the instance for up to
  about a minute while the failover runs. Use connection retry logic in your
  application to handle this.
- RDI doesn't need a restart or any manual step. The RDI collector detects that
  its binlog connection is no longer working, reconnects to the new primary, and
  then captures the changes that were committed while it was disconnected.
- Expect about one minute of extra change data capture (CDC) lag after the
  instance becomes available again, while the collector detects the lost
  connection and catches up.
