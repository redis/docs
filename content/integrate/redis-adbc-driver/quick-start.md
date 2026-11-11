---
bannerText: The Redis ADBC driver is a pre-1.0 project that changes frequently. Behavior, storage formats, and supported SQL can change between releases.
bannerChildren: true
categories:
- docs
- integrate
- oss
- rs
- rc
description: Create a table, load Arrow data, and query Redis with SQL from Python.
group: library
linkTitle: Query Redis with SQL and Arrow
summary: Create a table, load Arrow data, and query Redis with SQL from Python.
title: Query Redis with SQL and Arrow
type: integration
weight: 3
---

This page shows how to create a SQL table in Redis, load Arrow data into it,
query it, and read the results into pandas and Polars.

## Before you start

1. [Install the driver and check your connection](/content/integrate/redis-adbc-driver/install.md).
   Keep `REDIS_URI` set in your environment.

1. Install pandas and Polars for the last step:

    ```bash
    python -m pip install pandas polars
    ```

The examples create a table named `orders` in the `public` schema. If your
database already has a table with that name, the first step replaces it.

## Create a table and insert rows

Create a file named `create_table.py`:

```python
import os

from adbc_driver_redis import dbapi

with dbapi.connect(os.environ["REDIS_URI"]) as conn:
    with conn.cursor() as cur:
        cur.execute("DROP TABLE IF EXISTS orders")
        cur.execute(
            "CREATE TABLE orders ("
            "order_id INT, country TEXT, product TEXT, "
            "quantity INT, unit_price NUMERIC(10,2))"
        )
        cur.execute(
            "INSERT INTO orders VALUES "
            "(1, 'JPN', 'keyboard', 2, 49.90), "
            "(2, 'USA', 'monitor', 1, 189.00), "
            "(3, 'JPN', 'monitor', 3, 189.00)"
        )
```

Run it:

```bash
python create_table.py
```

The driver creates a Query Engine index for the table and stores each row as a
Redis hash. Every statement commits on its own.

## Load an Arrow table

To load many rows, pass an Arrow table to `adbc_ingest`. Create a file named
`ingest.py`:

```python
import os

import pyarrow as pa
from adbc_driver_redis import dbapi

more_orders = pa.table(
    {
        "order_id": pa.array([4, 5], pa.int32()),
        "country": ["USA", "DEU"],
        "product": ["keyboard", "mouse"],
        "quantity": pa.array([5, 10], pa.int32()),
        "unit_price": pa.array([49.90, 12.50]).cast(pa.decimal128(10, 2)),
    }
)

with dbapi.connect(os.environ["REDIS_URI"]) as conn:
    with conn.cursor() as cur:
        cur.adbc_ingest("orders", more_orders, mode="append")
```

Run it:

```bash
python ingest.py
```

The `mode` argument controls how the load treats the table:

| Mode | Behavior |
| :-- | :-- |
| `append` | Add the rows to an existing table. |
| `create` | Create the table from the Arrow schema, then load the rows. |
| `create_append` | Create the table if it doesn't exist, then add the rows. |
| `replace` | Replace the table's rows with the new data. |

## Query the table

Create a file named `query.py`:

```python
import os

from adbc_driver_redis import dbapi

with dbapi.connect(os.environ["REDIS_URI"]) as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM orders ORDER BY order_id")
        print(cur.fetch_arrow_table())

        cur.execute(
            "SELECT country, COUNT(*) AS orders, SUM(quantity) AS units "
            "FROM orders GROUP BY country ORDER BY units DESC"
        )
        print(cur.fetch_arrow_table())
```

Run it. The results come back as Arrow tables:

```bash
python query.py
```

```text
pyarrow.Table
order_id: int32
country: string
product: string
quantity: int32
unit_price: decimal128(10, 2)
----
order_id: [[1,2,3,4,5]]
country: [["JPN","USA","JPN","USA","DEU"]]
product: [["keyboard","monitor","monitor","keyboard","mouse"]]
quantity: [[2,1,3,5,10]]
unit_price: [[49.90,189.00,189.00,49.90,12.50]]
pyarrow.Table
country: string
orders: int64
units: int64
----
country: [["DEU","USA","JPN"]]
orders: [[1,2,2]]
units: [[10,6,5]]
```

## Read the results into pandas and Polars

Because the driver returns Arrow data, DataFrame libraries can read it without
extra conversion code. Create a file named `dataframes.py`:

```python
import os

import pandas as pd
import polars as pl
from adbc_driver_redis import dbapi

uri = os.environ["REDIS_URI"]
query = (
    "SELECT country, "
    "CAST(SUM(quantity * unit_price) AS NUMERIC(12,2)) AS revenue "
    "FROM orders GROUP BY country ORDER BY revenue DESC"
)

with dbapi.connect(uri) as conn:
    print(pd.read_sql(query, conn))

print(pl.read_database_uri(query, uri, engine="adbc"))
```

Run it:

```bash
python dataframes.py
```

```text
  country revenue
0     JPN  666.80
1     USA  438.50
2     DEU  125.00
shape: (3, 2)
┌─────────┬───────────────┐
│ country ┆ revenue       │
│ ---     ┆ ---           │
│ str     ┆ decimal[12,2] │
╞═════════╪═══════════════╡
│ JPN     ┆ 666.80        │
│ USA     ┆ 438.50        │
│ DEU     ┆ 125.00        │
└─────────┴───────────────┘
```

The query casts the sum to `NUMERIC(12,2)`. Without the cast, the driver
returns a 256-bit decimal whose precision depends on the data, and some
readers, including Polars, can't import it.

## Clean up

To remove the table, run:

```bash
python -c "
import os
from adbc_driver_redis import dbapi
with dbapi.connect(os.environ['REDIS_URI']) as conn, conn.cursor() as cur:
    cur.execute('DROP TABLE orders')
"
```

The table stops existing immediately, and queries against it fail. The driver
releases the table's rows and index in the background rather than during the
statement, so Redis memory use doesn't drop right away. The project's
`redis-adbc sweep` tool reclaims leftover rows. See
[Sweep leftover rows](https://redis.github.io/redis-adbc-driver/docs/driver-reference/#sweep-leftover-rows)
in the driver reference.

## Next steps

- Read the [driver reference](https://redis.github.io/redis-adbc-driver/docs/driver-reference/)
  for the supported SQL, connection options, and ACL requirements.
- Connect other [data tools](/content/integrate/redis-adbc-driver/_index.md#data-tools).
