---
bannerText: The Redis Arrow Flight server is a pre-1.0 project that changes frequently. Behavior, storage formats, and supported SQL can change between releases.
bannerChildren: true
categories:
- docs
- integrate
- oss
- rs
- rc
description: Query Redis through the Arrow Flight server from Python and JDBC tools, and store named Arrow datasets.
group: service
linkTitle: Connect and query
summary: Query Redis through the Arrow Flight server from Python and JDBC tools, and store named Arrow datasets.
title: Connect and query
type: integration
weight: 3
---

This page shows how to connect to the Redis Arrow Flight server and use its two
interfaces: SQL tables through Flight SQL, and named Arrow datasets through
Arrow Flight. The examples assume the server is
[running](/content/integrate/redis-arrow-flight/install.md) at
`localhost:8815`.

## Query SQL tables from Python

Flight SQL clients use the SQL dialect of the
[Redis ADBC driver](/content/integrate/redis-adbc-driver/_index.md), which is
close to PostgreSQL.

1. Install the Flight SQL driver for Python and PyArrow:

    ```bash
    python -m pip install adbc-driver-flightsql pyarrow
    ```

1. Create a file named `flight_sql.py`:

    ```python
    import adbc_driver_flightsql.dbapi as flight_sql
    import pyarrow as pa

    with flight_sql.connect("grpc://localhost:8815", autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.adbc_ingest(
                "orders",
                pa.table({"id": [1, 2, 3], "country": ["JPN", "USA", "JPN"]}),
                mode="replace",
            )
            cur.execute(
                "SELECT country, COUNT(*) AS n FROM orders "
                "WHERE id >= ? GROUP BY country ORDER BY country",
                parameters=(2,),
            )
            print(cur.fetch_arrow_table())
    ```

1. Run it:

    ```bash
    python flight_sql.py
    ```

    ```text
    pyarrow.Table
    country: string
    n: int64
    ----
    country: [["JPN","USA"]]
    n: [[1,1]]
    ```

The `autocommit=True` argument matches how the server runs statements. Without
it, the driver prints a warning that it can't disable autocommit. Parameters
can be written as `?` or `$1`.

## Query SQL tables from JDBC tools

JDBC tools connect with the
[Arrow Flight SQL JDBC driver](https://arrow.apache.org/java/current/flight_sql_jdbc_driver.html),
`org.apache.arrow:flight-sql-jdbc-driver`. Use this URL, which turns encryption
off because the published server doesn't support TLS:

```text
jdbc:arrow-flight-sql://localhost:8815/?useEncryption=false
```

Recent Java versions need extra JVM options, or the driver fails before it
connects with an `ExceptionInInitializerError`:

| Java version | JVM options |
| :-- | :-- |
| 17 to 22 | `--add-opens=java.base/java.nio=ALL-UNNAMED` |
| 23 and later | `--add-opens=java.base/java.nio=ALL-UNNAMED --sun-misc-unsafe-memory-access=allow` |

Java 17 to 22 refuse to start with the second option, so add it only on
Java 23 or later. In DBeaver, add the options to `dbeaver.ini` after the
existing `-vmargs` line. For DBeaver driver setup, see the project's
[DBeaver guide](https://redis.github.io/redis-apache-arrow-flight/docs/dbeaver/).

Two limits of the JDBC driver affect queries. A statement that has no result
schema runs as an update and returns no rows, which happens with a script of
several statements that changes something, and with `SELECT ?`. Run such a
query as its own statement. An untyped parameter accepts only `null`.

## Store and read Arrow datasets

Datasets are named Arrow tables that you upload and download without
converting them to SQL rows. Each dataset has a path, such as `features/v1`.

1. Create a file named `datasets.py`:

    ```python
    import json

    import pyarrow as pa
    import pyarrow.flight as flight

    client = flight.connect("grpc://localhost:8815")
    table = pa.table({"id": [1, 2], "embedding": [[0.1, 0.2], [0.3, 0.4]]})
    desc = flight.FlightDescriptor.for_path("features", "v1")

    # Upload the dataset.
    writer, results = client.do_put(desc, table.schema)
    writer.write_table(table)
    writer.done_writing()
    print(json.loads(results.read().to_pybytes()))
    writer.close()

    # Download all of it. Read every endpoint of the FlightInfo.
    info = client.get_flight_info(desc)
    print(pa.concat_tables([client.do_get(ep.ticket).read_all() for ep in info.endpoints]))

    # Download only the embedding column of the first 10 batches.
    ticket = flight.Ticket(
        json.dumps({"dataset": "features/v1", "columns": ["embedding"], "batches": [0, 10]}).encode()
    )
    print(client.do_get(ticket).read_all())

    # List and drop datasets.
    print([f.descriptor.path for f in client.list_flights(b"features/")])
    list(client.do_action(flight.Action("drop_dataset", b"features/v1")))
    print([f.descriptor.path for f in client.list_flights(b"features/")])
    ```

1. Run it:

    ```bash
    python datasets.py
    ```

    ```text
    {'dataset': 'features/v1', 'generation': 1, 'rows': 2, 'batches': 1, 'bytes': 728, 'updated': '2026-11-11T09:41:37.087467801Z'}
    pyarrow.Table
    id: int64
    embedding: list<item: double>
      child 0, item: double
    ----
    id: [[1,2]]
    embedding: [[[0.1,0.2],[0.3,0.4]]]
    pyarrow.Table
    embedding: list<item: double>
      child 0, item: double
    ----
    embedding: [[[0.1,0.2],[0.3,0.4]]]
    [[b'features', b'v1']]
    []
    ```

The `generation`, `bytes`, and `updated` values in the first line can differ
on your system. The server keeps a generation count for each dataset path,
and it can carry over from earlier uploads to the same path.

A dataset has one endpoint unless you start the server with
`-dataset-endpoint-batches`, which splits it into one endpoint per that many
batches so that clients can read in parallel. For cancellation, sessions, and
the combined dataset and SQL workflow, see the project's
[data access reference](https://redis.github.io/redis-apache-arrow-flight/docs/data-access/).

## Next steps

- Read the [client guide](https://redis.github.io/redis-apache-arrow-flight/docs/client-guide/)
  for more examples.
- Read the [Flight SQL reference](https://redis.github.io/redis-apache-arrow-flight/docs/sql-reference/)
  for supported statements, streaming, and limits.
