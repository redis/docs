---
Title: rladmin recover
alwaysopen: false
categories:
- docs
- operate
- rs
description: Recovers databases in recovery mode.
headerRange: '[1-2]'
linkTitle: recover
toc: 'true'
weight: $weight
url: '/operate/rs/7.22/references/cli-utilities/rladmin/recover/'
---

Recovers databases in recovery mode after events such as cluster failure, and restores the databases' configurations and data from stored persistence files. See [Recover a failed database]({{< relref "/operate/rs/7.22/databases/recover" >}}) for detailed instructions.

Database persistence files are stored in `/var/opt/redislabs/persist/redis/` by default, but you can specify a different directory to use for database recovery with [`rladmin node <id> recovery_path set <path>`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/node/recovery-path" >}}).

## `recover all`

Recovers all databases in recovery mode.

```sh
rladmin recover all
        [ only_configuration ]
```

### Parameters

| Parameters         | Type/Value | Description                                 |
|--------------------|------------|---------------------------------------------|
| only_configuration |            | Recover database configuration without data |

### Returns

Returns `Completed successfully` if the database was recovered. Otherwise, returns an error.

### Example

```
$ rladmin recover all
  0% [ 0 recovered | 0 failed ] |         | Elapsed Time: 0:00:00[first-db (db:1) recovery] Initiated.[second-db (db:2) recovery] Initiated.
 50% [ 0 recovered | 0 failed ] |###      | Elapsed Time: 0:00:04[first-db (db:1) recovery] Completed successfully
 75% [ 1 recovered | 0 failed ] |######   | Elapsed Time: 0:00:06[second-db (db:2) recovery] Completed successfully
100% [ 2 recovered | 0 failed ] |#########| Elapsed Time: 0:00:08
```

## `recover db`

Recovers a specific database in recovery mode.

```sh
rladmin recover db { db:<id> | <name> }
        [ only_configuration ]
```

### Parameters

| Parameters         | Type/Value           | Description                                 |
|--------------------|----------------------|---------------------------------------------|
| db                 | db:\<id\> <br />name | Database to recover                         |
| only_configuration |                      | Recover database configuration without data |

### Returns

Returns `Completed successfully` if the database was recovered. Otherwise, returns an error.

### Example

```
$ rladmin recover db db:1
  0% [ 0 recovered | 0 failed ] |      | Elapsed Time: 0:00:00[demo-db (db:1) recovery] Initiated.
 50% [ 0 recovered | 0 failed ] |###   | Elapsed Time: 0:00:00[demo-db (db:1) recovery] Completed successfully
100% [ 1 recovered | 0 failed ] |######| Elapsed Time: 0:00:02
```

## `recover list`

Shows a list of all databases that are currently in recovery mode.

```sh
rladmin recover list
```

### Parameters

None

### Returns

Displays a list of all recoverable databases. If no databases are in recovery mode, returns `No recoverable databases found`.

### Example

```sh
$ rladmin recover list
DATABASES IN RECOVERY STATE:
DB:ID  NAME  TYPE   SHARDS  REPLICATION  PERSISTENCE  STATUS
db:5   tr01  redis  1       enabled      aof          missing-files
db:6   tr02  redis  4       enabled      snapshot     ready
```

## `recover s3_import`

Imports current database snapshot files from an AWS S3 bucket to a directory on the node.

```sh
rladmin recover s3_import
                s3_bucket <bucket name>
                [ s3_prefix <prefix> ]
                s3_access_key_id <access key>
                s3_secret_access_key <secret access key>
                import_path <path>
```

### Parameters

| Parameters           | Type/Value | Description                                                      |
|----------------------|------------|------------------------------------------------------------------|
| s3_bucket            | string     | S3 bucket name                                                   |
| s3_prefix            | string     | S3 object prefix                                                 |
| s3_access_key_id     | string     | S3 access key ID                                                 |
| s3_secret_access_key | string     | S3 secret access key                                             |
| import_path           | filepath   | Local import path where all database snapshots will be imported  |

### Returns

Returns `Completed successfully` if the database files were imported. Otherwise, returns an error.

### Example

```sh
rladmin recover s3_import s3_bucket <bucket-name> s3_prefix <s3-prefix>/ s3_access_key_id <access-key> s3_secret_access_key <secret-access-key> import_path /tmp
```
