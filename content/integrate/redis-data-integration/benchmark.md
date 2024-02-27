---
Title: Sizing and benchmarking
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how to use the Redis Data Integration Benchmark tool
group: di
headerRange: '[2]'
linkTitle: Sizing and benchmarking
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 80
---

The goal of Redis Data Integration (RDI) Benchmark Tool is to produce `INSERT` statements on the source database and calculate the lag between the time a key is inserted into the source database and the time at which the same key is stored in the target Redis database.

{{< image filename="/images/rdi/monitoring-grafana-dash-running.png" >}}

The databases that are supported by this tool are:

- MySQL
- Oracle
- PostgreSQL
- SQLServer

## Prerequisites

- An existing Redis Enterprise cluster version >= 6.2.
- [RedisGears](https://redis.com/modules/redis-gears/) >= 1.2.5 installed on the cluster. Note: RedisGears versions 2.0+ are not supported.
- A Source database server with `Bin Log` enabled.
  The database servers that are supported by this tool are : `MySQL`, `Oracle`, `PostgreSQL`, and `SQLServer`.
- A target Redis database.
- A RDI database that is connected to the target Redis database.
- [Debezium Server](https://debezium.io/documentation/reference/stable/operations/debezium-server.html) up and running and connected to the source database and to the RDI database.
- [Oracle Instant Client](https://www.oracle.com/il-en/database/technologies/instant-client.html) installed and configured for `Oracle` source databases.
  In case it's missing, follow this [guide](#installation-of-oracle-instant-client) to install it.

RDI Benchmark requires connectivity to the following endpoints:

- Redis Enterprise cluster admin API (port 9443).
- RDI database (default port 12001).
- The target Redis database (to which RDI is writing).
- The source database to which data will be written.

## Installation

## Download

### Ubuntu 20.04

```bash
wget https://qa-onprem.s3.amazonaws.com/redis-di/{{<param rdi_cli_latest>}}/redis-di-benchmark-ubuntu20.04-{{<param rdi_cli_latest>}}.tar.gz -O /tmp/redis-di-benchmark.tar.gz
```

### Ubuntu 18.04

```bash
wget https://qa-onprem.s3.amazonaws.com/redis-di/{{<param rdi_cli_latest>}}/redis-di-benchmark-ubuntu18.04-{{<param rdi_cli_latest>}}.tar.gz -O /tmp/redis-di-benchmark.tar.gz
```

### RHEL 8

```bash
wget https://qa-onprem.s3.amazonaws.com/redis-di/{{<param rdi_cli_latest>}}/redis-di-benchmark-rhel8-{{<param rdi_cli_latest>}}.tar.gz -O /tmp/redis-di-benchmark.tar.gz
```

### RHEL 7

```bash
wget https://qa-onprem.s3.amazonaws.com/redis-di/{{<param rdi_cli_latest>}}/redis-di-benchmark-rhel7-{{<param rdi_cli_latest>}}.tar.gz -O /tmp/redis-di-benchmark.tar.gz
```

## Install the RDI benchmark tool

Unpack the downloaded `redis-di-benchmark.tar.gz` into `/tmp` directory:

```bash
cd /tmp
sudo tar xvf /tmp/redis-di-benchmark.tar.gz -C /usr/local/bin/
```

> Note: Non-root users should unpack to a directory with write permissions and run `redis-di-benchmark` directly from it.

### Validate the install

Verify that `redis-di-benchmark` is installed by running:

```bash
redis-di-benchmark --help

Usage: redis_di_benchmark [OPTIONS] COMMAND [ARGS]...

Options:
--help Show this message and exit.

Commands:
bench
```

## Running the RDI benchmark tool

### Arguments

To get the list of arguments, run the following command on your terminal:

```bash
redis_di_benchmark.py bench --help
```

| Argument           | Description                                                               | Default             | Comments                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| rc-host            | Host/IP of RDI database                                                   | localhost           |
| rc-port            | Port of the RDI database                                                  | 12001               |
| rc-password        | Password for RDI database                                                 |                     |
| cluster-api-port   | API port of Redis Enterprise cluster                                      | 9443                |
| cluster-host       | Host/IP of Redis Enterprise cluster                                       | localhost           |
| cluster-user       | Redis Enterprise cluster username                                         |                     |
| cluster-password   | Password for the Redis Enterprise cluster username                        |                     |
| source-db-type     | Type of Database (mysql&#124;oracle&#124;postgresql&#124;sqlserver&#124;) |                     |
| source-db-host     | Host/IP of the source database                                            | localhost           |
| source-db-port     | Port of the source database                                               |                     |
| source-db-name     | The name of the database from which to stream the changes.                |                     | Do not pass for Oracle DB                                                                                                                          |
| source-db-schema   | Name of the schema from which to the stream the changes-                  |                     | Do not pass for MySQL DB                                                                                                                           |
| source-db-user     | Username to use when connecting to the source database                    |                     |
| source-db-password | Password to use when connecting to the source database                    |                     |
| target-db-host     | Host/IP of Redis target DB                                                |                     |
| target-db-port     | Port of Redis target DB                                                   |                     |
| number-cdc-events  | Number of `INSERT` statements the tool generates per each table           | 50000               |
| number-of-fields   | Number of fields per each table                                           | 5                   |
| no-bulk            | Single `INSERT` into the source DB in each transaction                    | True                |
| stream-name-prefix | The prefix with which the name of the stream(s) will be created           | data:`<serverName>` | The value of `<serverName>` should be taken from the property `debezium.source.database.server.name` from Debezium's `application.properties` file |

### Run the `redis-di-benchmark` tool

From your current directory, run:

```bash
redis-di-benchmark bench
```

> Note: Non-root users should run the tool from the directory where the file `redis-di-benchmark.tar.gz` was extracted.

### Output

For each key, RDI benchmark tool calculates the difference between the arrival time of the key to Redis target database and the time it was inserted to the source database.
When all the keys arrive to the Redis target database, the tool displays the following statistics:

Statistics with input argument `no-bulk = True`

```
End-to-end latency:
	Minimum latency: 0.885s
	Maximum latency: 6.343s
	Mean latency: 3.822s
	Median latency:  3.809s
	Standard deviation:  1.046s
```

Statistics with input argument `no-bulk = False`:

```
End-to-end latency:
	Minimum latency: 1.670s
	Maximum latency: 3.875s
	Mean latency: 2.743s
	Median latency:  2.739s
	Standard deviation:  0.877s
Throughput:
	Number of tables: 1
	Number of fields per each table: 5
	Size of field 10B
	Number of row in each table: 5000
	Number of events per second: 1233 eps
```

### Notes

- When `no-bulk = True`, the tool inserts one record at a time.
- When `no-bulk = False`, the tool inserts `5000` records at a time.

## Install Oracle Instant Client

- Create a dedicated `Oracle` folder:

  ```bash
  sudo mkdir /opt/oracle
  ```

- Download and unzip Oracle Instant Client:

  ```bash
  cd opt/oracle
  sudo wget https://download.oracle.com/otn_software/linux/instantclient/214000/instantclient-basic-linux.x64-21.4.0.0.0dbru.zip
  sudo unzip instantclient-basic-linux.x64-21.4.0.0.0dbru
  ```

- Install [libaio](https://pagure.io/libaio):

  - Ubuntu 18.04, Ubuntu 20.04:

    ```bash
    sudo apt update
    sudo apt install libaio1
    ```

  - RHEL 7, RHEL 8:

    ```bash
    sudo yum update
    sudo yum install libaio
    ```

- Install [unixODBC](http://www.unixodbc.org):

  - Ubuntu 18.04, Ubuntu 20.04:

    ```bash
    sudo apt install unixodbc
    ```

  - RHEL 7, RHEL 8:

    ```bash
    sudo yum install unixODBC
    ```

- Add and link system configuration for Oracle Instant Client path:

  ```bash
  sudo sh -c "echo /opt/oracle/instantclient_21_4 > /etc/ld.so.conf.d/oracle-instantclient.conf"
  sudo ldconfig
  ```
