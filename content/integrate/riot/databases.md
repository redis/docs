---
description: RIOT database import and export
linkTitle: Databases
title: Databases
type: integration
weight: 7
---

## Databases

RIOT can import from and export to databases.

### Drivers

RIOT relies on JDBC to interact with databases.
It includes JDBC drivers for the most common database systems:

* [Oracle](https://docs.oracle.com/cd/E11882_01/appdev.112/e13995/oracle/jdbc/OracleDriver.html)

  `jdbc:oracle:thin:@myhost:1521:orcl`
* [IBM Db2](https://www.ibm.com/support/knowledgecenter/en/SSEPGG_11.5.0/com.ibm.db2.luw.apdv.java.doc/src/tpc/imjcc_r0052342.html)

  `jdbc:db2://host:port/database`
* [MS SQL Server](https://docs.microsoft.com/en-us/sql/connect/jdbc/building-the-connection-url?view=sql-server-2017)

  `jdbc:sqlserver://[serverName[\instanceName][:portNumber]][;property=value[;property=value]]`
* [MySQL](https://dev.mysql.com/doc/connector-j/en/)

  `jdbc:mysql://[host]:[port][/database][?properties]`
* [PostgreSQL](https://www.postgresql.org/docs/7.4/jdbc-use.html)

  `jdbc:postgresql://host:port/database`
* [SQLite](https://www.sqlitetutorial.net/sqlite-java/sqlite-jdbc-driver/)

  `jdbc:sqlite:sqlite_database_file_path`

{{< tip >}}
For non-included databases you must install the corresponding JDBC driver under the `lib` directory and modify the `CLASSPATH`:

* *nix: `bin/riot` -> `CLASSPATH=$APP_HOME/lib/myjdbc.jar:$APP_HOME/lib/...`
* Windows: `bin\riot.bat` -> `set CLASSPATH=%APP_HOME%\lib\myjdbc.jar;%APP_HOME%\lib...`
{{< /tip >}}

## Database Import

The `db-import` command imports data from a relational database into Redis.

{{< note >}}
Ensure RIOT has the relevant JDBC driver for your database.
See the Drivers section above for more details.
{{< /note >}}

```
riot -h <redis host> -p <redis port> db-import --url <jdbc url> SQL [REDIS COMMAND...]
```

To show the full usage, run:

```
riot db-import --help
```

### Examples

**PostgreSQL Example**

```
riot db-import "SELECT * FROM orders" --url "jdbc:postgresql://host:port/database" --username appuser --password passwd hset --keyspace order --keys order_id
```

**Import from PostgreSQL to JSON strings**

```
riot db-import "SELECT * FROM orders" --url "jdbc:postgresql://host:port/database" --username appuser --password passwd set --keyspace order --keys order_id
```

This will produce Redis strings that look like this:

```json
{
  "order_id": 10248,
  "customer_id": "VINET",
  "employee_id": 5,
  "order_date": "1996-07-04",
  "required_date": "1996-08-01",
  "shipped_date": "1996-07-16",
  "ship_via": 3,
  "freight": 32.38,
  "ship_name": "Vins et alcools Chevalier",
  "ship_address": "59 rue de l'Abbaye",
  "ship_city": "Reims",
  "ship_postal_code": "51100",
  "ship_country": "France"
}
```

## Database Export

Use the `db-export` command to read from a Redis database and writes to a SQL database.

The general usage is:

```
riot -h <redis host> -p <redis port> db-export --url <jdbc url> SQL
```

To show the full usage, run:

```
riot db-export --help
```

### Redis reader options

* **`--scan-count`**\
    How many keys to read at once on each call to [SCAN]({{< baseurl >}}/commands/scan#the-count-option)
* **`--scan-match`**\
    Pattern of keys to scan for (default: `*` i.e. all keys)
* **`--scan-type`**\
    Type of keys to scan for (default: all types)  
* **`--key-include`**\
    Regular expressions for keys to whitelist.
    For example `mykey:.*` will only consider keys starting with `mykey:`.
* **`--key-exclude`**\
    Regular expressions for keys to blacklist.
    For example `mykey:.*` will not consider keys starting with `mykey:`.
* **`--key-slots`**\
    Ranges of key slots to consider for processing.
    For example `0:8000` will only consider keys that fall within the range `0` to `8000`.
* **`--read-threads`**\
    How many value reader threads to use in parallel
* **`--read-batch`**\
    Number of values each reader thread should read in a pipelined call
* **`--read-queue`**\
    Max number of items that reader threads can put in the shared queue.
    When the queue is full, reader threads wait for space to become available.
    Queue size should be at least `# threads * batch`, e.g., `--read-threads 4 --read-batch 500` => `--read-queue 2000`
* **`--read-pool`**\
    Size of the connection pool shared by reader threads.
    Can be smaller than the number of threads
* **`--read-from`**\
   Which Redis cluster nodes to read from: `master`, `master_preferred`, `upstream`, `upstream_preferred`, `replica_preferred`, `replica`, `lowest_latency`, `any`, `any_replica`. See [Read-From Settings](https://github.com/lettuce-io/lettuce-core/wiki/ReadFrom-Settings#read-from-settings) for more details.
* **`--mem-limit`**\
    Maximum memory usage in megabytes for a key to be read (default: 0). Use 0 to disable memory usage checks.
* **`--mem-samples`**\
    Number of memory usage samples for a key (default: 5).

### Example

**Export to PostgreSQL**

```
riot db-export "INSERT INTO mytable (id, field1, field2) VALUES (CAST(:id AS SMALLINT), :field1, :field2)" --url "jdbc:postgresql://host:port/database" --username appuser --password passwd --scan-match "gen:*" --key-regex "gen:(?<id>.*)"
```