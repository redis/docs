---
Title: Supported data types by source
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn about supported data types for each source database.
group: di
linkTitle: Supported data types
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 80
---

This page describes the source data types that RDI captures for the
[Oracle](#oracle), [MySQL/MariaDB](#mysql-and-mariadb),
[PostgreSQL](#postgresql-supabase-and-alloydb), [SQL Server](#sql-server),
[MongoDB](#mongodb), and [Spanner](#spanner) source databases, and how they are
represented in Redis. There are also some
[cross-cutting considerations](#cross-cutting-considerations) that apply to all
source databases.

## How RDI captures and represents data

For most source databases, RDI uses an embedded
[Debezium](https://debezium.io/) connector as its change data capture (CDC)
*collector*. RDI ships a Debezium 3.x–based collector, so the collector-level
mappings on this page follow the
[Debezium connector reference](https://debezium.io/documentation/reference/).
[Google Cloud Spanner](#spanner) is the exception: it uses a Flink-based collector
that reads Spanner change streams rather than Debezium (see the
[Spanner section](#spanner) for details).

{{< note >}}**RDI does not always pass the collector value through unchanged.** RDI's
processors normalize several Debezium logical types before they reach your jobs and
Redis, and drop a few that they cannot represent. The collector-level representations
in the tables below are therefore the *input* to RDI's processing, not always the
final Redis value — the per-type notes and [cross-cutting considerations](#cross-cutting-considerations)
call out where RDI transforms or drops a value.{{< /note >}}

It helps to think of the data flow in two layers:

1. **What the collector emits.** Debezium converts each source column to a
   Kafka Connect value with a *literal type* (for example, `STRING`, `INT64`,
   `BYTES`, `STRUCT`) and an optional *semantic type* (for example,
   `io.debezium.time.MicroTimestamp`). Several of these conversions are controlled
   by connector properties such as
   [`decimal.handling.mode`](#decimal-and-numeric-values),
   [`binary.handling.mode`](#binary-values), and
   [`time.precision.mode`](#temporal-values). The tables below show the
   representation that each connector produces with its **default** settings.
2. **How RDI writes it to Redis.** RDI's processors take the collector value,
   normalize some logical types (and drop a few unsupported ones), then write each
   record to a Redis [Hash]({{< relref "/develop/data-types/hashes" >}}) (the default)
   or, if you set `target_data_type: json`, to a
   [JSON]({{< relref "/develop/data-types/json" >}}) document. For Hash targets,
   every field value is stored as a string; for JSON targets, numbers and booleans
   are stored as native JSON values.

When you need to reformat a value in a job, see
[Formatting date and time values]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples/formatting-date-and-time-values" >}})
for worked examples.

### Setting collector properties

Where the sections below recommend a Debezium property (for example,
`decimal.handling.mode` or `lob.enabled`), set it in the `advanced.source` block of
the source in your pipeline `config.yaml` file. These properties are passed
through to the underlying Debezium connector. For example:

```yaml
sources:
  my-source:
    # ...connection details...
    advanced:
      source:
        decimal.handling.mode: double
        binary.handling.mode: base64
```

See [Pipeline configuration]({{< relref "/integrate/redis-data-integration/data-pipelines/pipeline-config" >}})
for more about the `advanced` section.

## Quick configuration summary

The lists below summarize the extra configuration you may need for each source
database. Each database has its own section with full detail.

[**Oracle**](#oracle)

- Enable [supplemental logging]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/oracle" >}}) on the tables/schemas you capture.
- Set `lob.enabled: true` if you need `CLOB`, `NCLOB`, `BLOB`, or `XMLTYPE`.
- Choose `binary.handling.mode` for `RAW`/`BLOB` (default is `bytes`).
- `decimal.handling.mode` defaults to `string` in RDI; set `double` for numeric `NUMBER`/`DECIMAL` values.
- Avoid unsupported types (`LONG`, `LONG RAW`, `BFILE`, `UROWID`, `VECTOR`, UDTs, spatial) or cast them upstream.

[**MySQL/MariaDB**](#mysql-and-mariadb)

- Enable the binary log in **ROW** mode.
- Choose `decimal.handling.mode` to balance precision against convenience.
- For `BOOLEAN`/`TINYINT(1)` fidelity, consider the `TinyIntOneToBooleanConverter`.
- Be aware that spatial and `VECTOR` types arrive as structured values, not scalars.

[**PostgreSQL/Supabase/AlloyDB**](#postgresql-supabase-and-alloydb)

- Ensure WAL/logical replication settings match the connector's needs.
- `decimal.handling.mode` defaults to `string` in RDI; set `double` for numeric values.
- Use a RedisJSON target to get the most value from `JSON`/`JSONB`.

[**SQL Server**](#sql-server)

- Enable CDC at both the database and table level.
- Choose `decimal.handling.mode` for `MONEY`/`DECIMAL` precision.
- Choose `time.precision.mode` if you need predictable temporal precision.

[**MongoDB**](#mongodb)

- Ensure a replica set and change streams are configured.
- Use a RedisJSON target to preserve document structure.
- Choose `capture.mode` to control whether updates include the full document.

[**Spanner**](#spanner)

- Spanner uses the Flink-based collector (not Debezium) and is supported only on Kubernetes/Helm.

## Cross-cutting considerations

The settings below apply to all of the Debezium-based source connectors. They are
the most common cause of "the value in Redis doesn't look like the value in my
database", so review them before reading the per-database sections.

### Decimal and numeric values

`DECIMAL`, `NUMERIC`, `MONEY`, and similar types are controlled by
`decimal.handling.mode`. **RDI's effective default is `string`** — the RDI collector
templates set `debezium.source.decimal.handling.mode=string` before your
`advanced.source` overrides apply, so decimals reach Redis as readable strings rather
than Debezium's own `precise` binary default:

| `decimal.handling.mode` | Representation                                                              |
|-------------------------|----------------------------------------------------------------------------|
| `string` (RDI default)  | The exact decimal as a `STRING`.                                            |
| `double`                | A `FLOAT64` number (may lose precision for very large/precise values).      |
| `precise`               | A Kafka Connect `Decimal` (`BYTES`) — a base64-encoded, scaled binary value. This is Debezium's default but not RDI's. |

Leave the default (`string`) for exact decimal fidelity, or set
`decimal.handling.mode: double` if you want numeric values and can accept double
precision.

### Temporal values

Temporal types are controlled by `time.precision.mode`. The default is `adaptive`
for Oracle, PostgreSQL, and SQL Server, and `adaptive_time_microseconds` for MySQL
and MariaDB. In adaptive modes, the precision of the emitted value depends on the
column's declared precision:

- `DATE` columns are emitted as **days since epoch** (an `INT32`), *not*
  milliseconds at midnight.
- `TIME`/`DATETIME`/`TIMESTAMP` columns are emitted as milliseconds, **microseconds**,
  or **nanoseconds** since epoch (or since midnight for time-of-day types) depending
  on their precision. For example, an Oracle `TIMESTAMP(6)` or a PostgreSQL
  `timestamp` is emitted as microseconds.

RDI's processors may normalize these Debezium temporal types before they reach your
jobs and Redis (for example, converting a `Date` to epoch milliseconds). See
[Formatting date and time values]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples/formatting-date-and-time-values" >}})
for worked examples of converting temporal values in an RDI job.

### Time zones

Time zone–aware types (for example, Oracle `TIMESTAMP WITH TIME ZONE`, PostgreSQL
`timestamptz`, SQL Server `datetimeoffset`, and MySQL `TIMESTAMP`) are **not**
converted to epoch milliseconds. They are emitted as **ISO 8601 strings**
(semantic type `io.debezium.time.ZonedTimestamp`), normalized to UTC/GMT — for
example, `2025-06-07T10:15:00.000000Z`.

### Binary values

Binary columns are controlled by `binary.handling.mode`. The default is **`bytes`**
(raw bytes), *not* base64. The options are:

- `bytes` (default) — raw byte array.
- `base64` — base64-encoded string.
- `base64-url-safe` — URL-safe base64 string.
- `hex` — hex string.

Set `binary.handling.mode: base64` (or `hex`) if your consumers expect an encoded
string rather than raw bytes. Make sure your consumer understands the encoding you
choose.

### Large objects (LOBs) and unavailable values

When a connector captures large objects (for example, Oracle `CLOB`/`BLOB`), an
update event never contains the value of an *unchanged* LOB column. Instead, the
column carries a placeholder. The default placeholder is `__debezium_unavailable_value`,
which you can change with `advanced.source.unavailable.value.placeholder` on the
source (the Helm chart exposes this as `processor.lob.placeholder`). RDI skips these
placeholder values rather than writing them to Redis as user data.

### Nullability

- **Redis Hashes**: null values are not stored (the field is absent).
- **RedisJSON**: null values become JSON `null`. Note that if you use the native
  `JSON.MERGE` command (the default from RDI 1.15.0, controlled by
  `use_native_json_merge`), merging a `null` value *removes* the field rather than
  storing it, following [RFC 7396](https://datatracker.ietf.org/doc/html/rfc7396).
  See [Pipeline configuration]({{< relref "/integrate/redis-data-integration/data-pipelines/pipeline-config" >}}).

### Structured values (structs, arrays, and maps)

Some source types are emitted as Kafka Connect `STRUCT`, `ARRAY`, or `MAP` values
rather than scalars — for example, spatial types (a struct of `srid` + `wkb`) and
vector types (an array of floats).

**RDI does not support every complex logical type.** In particular, RDI treats
`io.debezium.data.Bits` (from `BIT(>1)`/`BIT VARYING`) and the interval logical types
as **unsupported**: the classic processor maps them to `None` and the Flink processor
removes the field (via `RemovalConverter`), so they do not reach Redis. Other
structured values (spatial `Geometry`, pgvector) pass through to RDI's processors,
but how they are rendered into a Redis Hash or JSON document is noted per type below.

## Oracle

RDI captures Oracle changes via the
[Debezium Oracle connector](https://debezium.io/documentation/reference/3.0/connectors/oracle.html).
See [Prepare Oracle for RDI]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/oracle" >}})
for the required supplemental-logging setup.

### Supported types

| Oracle type | Collector representation (default settings) | Notes |
|-------------|---------------------------------------------|-------|
| `NUMBER`, `DECIMAL`, `NUMERIC`, `INT`, `INTEGER`, `SMALLINT` | Kafka Connect `Decimal` (`BYTES`) | Controlled by `decimal.handling.mode`. See [Decimal and numeric values](#decimal-and-numeric-values). |
| `NUMBER(p,*)`, `FLOAT`, `REAL`, `DOUBLE PRECISION` | `VariableScaleDecimal` (`STRUCT`) | Variable-scale decimal. |
| `BINARY_FLOAT` | `FLOAT32` | |
| `BINARY_DOUBLE` | `FLOAT64` | |
| `CHAR`, `VARCHAR`, `VARCHAR2`, `NCHAR`, `NVARCHAR2` | `STRING` | UTF-8 preserved. |
| `DATE` | `Timestamp` (`INT64`, ms since epoch) | |
| `TIMESTAMP(0-3)` | `Timestamp` (ms) | Precision depends on the column; see [Temporal values](#temporal-values). |
| `TIMESTAMP(4-6)` | `MicroTimestamp` (µs) | A bare `TIMESTAMP` defaults to precision 6 (microseconds). |
| `TIMESTAMP(7-9)` | `NanoTimestamp` (ns) | |
| `TIMESTAMP WITH TIME ZONE` | `ZonedTimestamp` (`STRING`, ISO 8601) | See [Time zones](#time-zones). |
| `TIMESTAMP WITH LOCAL TIME ZONE` | `ZonedTimestamp` (`STRING`, UTC) | |
| `INTERVAL YEAR TO MONTH`, `INTERVAL DAY TO SECOND` | `MicroDuration` (`INT64`) | **Not supported by RDI** — interval types are dropped before reaching Redis. See [Structured values](#structured-values-structs-arrays-and-maps). |
| `CLOB`, `NCLOB` | `STRING` | Requires `lob.enabled: true`. |
| `BLOB` | `BYTES` | Requires `lob.enabled: true`; encoded per `binary.handling.mode`. |
| `RAW` | `BYTES` | Encoded per `binary.handling.mode`. |
| `XMLTYPE` | `Xml` (`STRING`) | **Incubating** in Debezium. Requires `lob.enabled: true` and a non-hybrid mining strategy. |
| `ROWID` | `STRING` | Supported in LogMiner mode only; not exposed when using XStream. |

### Configuration notes

- **LOBs**: set `lob.enabled: true` (default `false`) to capture `CLOB`, `NCLOB`,
  `BLOB`, and `XMLTYPE`. You cannot use the *hybrid* mining strategy with
  `lob.enabled: true` — use `online_catalog` or `redo_log_catalog` instead.
- **Extended strings**: if the database parameter `max_string_size` is `EXTENDED`,
  set `lob.enabled: true` to capture `VARCHAR2`/`NVARCHAR2` values over 4000 bytes
  and `RAW` values over 2000 bytes.
- **XMLTYPE**: requires `lob.enabled: true` and a non-hybrid mining strategy
  (`online_catalog` or `redo_log_catalog`). The connector emits the XML as text
  (`STRING`). XMLTYPE support also requires the Oracle **XDB library** and the
  **`xmlparserv2`** dependency in addition to the standard `ojdbc11.jar` driver. If
  the runtime selects Oracle's `xmlparserv2` SAX parser, you may need to set the JVM
  option `-Djavax.xml.parsers.SAXParserFactory=com.sun.org.apache.xerces.internal.jaxp.SAXParserFactoryImpl`.

### Not captured

The Debezium Oracle connector does not support `LONG`, `LONG RAW`, `BFILE`,
`UROWID`, `VECTOR`, the native Oracle 23 `BOOLEAN` column type, user-defined/object
types (objects, `REF`, `VARRAY`, nested tables), or Oracle spatial types. Cast these
to a supported type upstream if you need them. A `NumberOneToBooleanConverter` is
available to map `NUMBER(1)` columns to booleans.

## MySQL and MariaDB

RDI captures both `mysql` and `mariadb` sources with the
[Debezium MySQL connector](https://debezium.io/documentation/reference/stable/connectors/mysql.html)
(`io.debezium.connector.mysql.MySqlConnector`) — it does not use Debezium's separate
MariaDB connector. The mappings below therefore apply to both source types. See
[Prepare MySQL/MariaDB for RDI]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/my-sql-mariadb" >}})
for setup. Enable the binary log in **ROW** mode.

### Supported types

| MySQL/MariaDB type | Collector representation (default settings) | Notes |
|--------------------|---------------------------------------------|-------|
| `TINYINT`, `SMALLINT`, `MEDIUMINT`, `INT`, `BIGINT` | `INT8`/`INT16`/`INT32`/`INT64` | |
| `BIT(1)` | `BOOLEAN` | A single bit is mapped to a boolean. |
| `BIT(>1)` | `Bits` (`BYTES`) | **Not supported by RDI** — dropped before reaching Redis. See [Structured values](#structured-values-structs-arrays-and-maps). |
| `DECIMAL`, `NUMERIC` | Kafka Connect `Decimal` (`BYTES`) | Controlled by `decimal.handling.mode`. See [Decimal and numeric values](#decimal-and-numeric-values). |
| `FLOAT(0-23)`, `REAL` | `FLOAT32` | |
| `FLOAT(24-53)`, `DOUBLE` | `FLOAT64` | |
| `CHAR`, `VARCHAR`, `TINYTEXT`, `TEXT`, `MEDIUMTEXT`, `LONGTEXT` | `STRING` | |
| `BINARY`, `VARBINARY`, `TINYBLOB`, `BLOB`, `MEDIUMBLOB`, `LONGBLOB` | `BYTES` | Encoded per `binary.handling.mode`. Up to 2 GB; use the claim-check pattern for large values. |
| `DATE` | `Date` (days since epoch) | See [Temporal values](#temporal-values). |
| `TIME` | `MicroTime` (µs since midnight) | Default `time.precision.mode` is `adaptive_time_microseconds`. |
| `DATETIME` | `Timestamp`/`MicroTimestamp` by precision | |
| `TIMESTAMP` | `ZonedTimestamp` (`STRING`, ISO 8601, UTC) | Not epoch ms. See [Time zones](#time-zones). |
| `YEAR` | `io.debezium.time.Year` (`INT32`) | |
| `BOOLEAN`, `BOOL` | `BOOLEAN` | During snapshots the connector sees `TINYINT(1)`; use `TinyIntOneToBooleanConverter` for consistent boolean fidelity. |
| `ENUM` | `io.debezium.data.Enum` (`STRING`) | The `allowed` schema parameter lists the permitted values. |
| `SET` | `io.debezium.data.EnumSet` (`STRING`) | Comma-separated selected values. |
| `JSON` | `io.debezium.data.Json` (`STRING`) | Parsed into a nested structure on a RedisJSON target. |
| `VECTOR` | `ARRAY (FLOAT32)`, `io.debezium.data.FloatVector` | See [Structured values](#structured-values-structs-arrays-and-maps). |
| Spatial: `GEOMETRY`, `POINT`, `LINESTRING`, `POLYGON`, `MULTIPOINT`, `MULTILINESTRING`, `MULTIPOLYGON`, `GEOMETRYCOLLECTION` | `io.debezium.data.geometry.Geometry` (`STRUCT`) | A struct with `srid` (`INT32`) and `wkb` (`BYTES`, Well-Known Binary). |

### Booleans

MySQL and MariaDB both represent `BOOLEAN`/`BOOL` as `TINYINT(1)`. Because RDI uses
the MySQL connector for both, the connector may report these columns as `TINYINT(1)`
rather than `BOOLEAN` (especially during snapshots). Use the
`TinyIntOneToBooleanConverter` for consistent boolean fidelity.

## PostgreSQL, Supabase, and AlloyDB

RDI captures PostgreSQL changes via the
[Debezium PostgreSQL connector](https://debezium.io/documentation/reference/3.0/connectors/postgresql.html)
using logical replication. **Supabase** and **AlloyDB** are PostgreSQL-compatible
and use the same connector, so the mappings below apply to all three. See
[Prepare PostgreSQL for RDI]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/postgresql" >}}).

### Supported types

| PostgreSQL type | Collector representation (default settings) | Notes |
|-----------------|---------------------------------------------|-------|
| `SMALLINT`, `INTEGER`, `BIGINT` | `INT16`/`INT32`/`INT64` | `SMALLSERIAL`/`SERIAL`/`BIGSERIAL` map the same as their integer base. |
| `OID` | `INT64` | |
| `NUMERIC`, `DECIMAL` | Kafka Connect `Decimal` (`BYTES`), or `VariableScaleDecimal` when unscaled | Controlled by `decimal.handling.mode`. See [Decimal and numeric values](#decimal-and-numeric-values). |
| `MONEY` | Kafka Connect `Decimal` (`BYTES`) | Scale set by `money.fraction.digits`. |
| `REAL` | `FLOAT32` | |
| `DOUBLE PRECISION` | `FLOAT64` | |
| `BOOLEAN` | `BOOLEAN` | |
| `BIT(1)` | `BOOLEAN` | |
| `BIT(>1)`, `BIT VARYING` | `Bits` (`BYTES`) | **Not supported by RDI** — dropped before reaching Redis. See [Structured values](#structured-values-structs-arrays-and-maps). |
| `CHAR`, `VARCHAR`, `TEXT`, `CITEXT` | `STRING` | |
| `BYTEA` | `BYTES` | Encoded per `binary.handling.mode`. Requires `bytea_output = hex` in PostgreSQL. |
| `DATE` | `Date` (days since epoch) | See [Temporal values](#temporal-values). |
| `TIME` | `MicroTime` (µs since midnight) | |
| `TIME WITH TIME ZONE` (`TIMETZ`) | `ZonedTime` (`STRING`, GMT) | For example, `07:15:00Z`. |
| `TIMESTAMP` | `MicroTimestamp` (µs since epoch) | See [Temporal values](#temporal-values). |
| `TIMESTAMP WITH TIME ZONE` (`TIMESTAMPTZ`) | `ZonedTimestamp` (`STRING`, GMT) | See [Time zones](#time-zones). |
| `INTERVAL` | `MicroDuration` (`INT64`) | **Not supported by RDI** — interval types are dropped before reaching Redis. See [Structured values](#structured-values-structs-arrays-and-maps). |
| `UUID` | `io.debezium.data.Uuid` (`STRING`) | |
| `INET`, `CIDR`, `MACADDR`, `MACADDR8` | `STRING` | |
| `JSON`, `JSONB` | `io.debezium.data.Json` (`STRING`) | Parsed into a nested structure on a RedisJSON target. |
| `HSTORE` | `io.debezium.data.Json` (`STRING`) | Default `hstore.handling.mode` is `json` (for example, `{"key":"val"}`); set `map` for a `MAP` value. |
| `XML` | `io.debezium.data.Xml` (`STRING`) | |
| `LTREE` | `io.debezium.data.Ltree` (`STRING`) | |
| `TSVECTOR` | `io.debezium.data.Tsvector` (`STRING`) | |
| Range types (`INT4RANGE`, `INT8RANGE`, `NUMRANGE`, `TSRANGE`, `TSTZRANGE`, `DATERANGE`) | `STRING` | |
| `ENUM` | `io.debezium.data.Enum` (`STRING`) | |
| pgvector `VECTOR` | `ARRAY (FLOAT64)`, `io.debezium.data.DoubleVector` | Supabase and AlloyDB commonly enable pgvector. |
| pgvector `HALFVEC` | `ARRAY (FLOAT32)`, `io.debezium.data.FloatVector` | |
| pgvector `SPARSEVEC` | `STRUCT`, `io.debezium.data.SparseVector` | `dimensions` (`INT16`) + `vector` (`MAP(INT16, FLOAT64)`). |
| PostGIS `GEOMETRY` | `io.debezium.data.geometry.Geometry` (`STRUCT`) | `srid` (`INT32`) + `wkb` (`BYTES`). |
| PostGIS `GEOGRAPHY` | `io.debezium.data.geometry.Geography` (`STRUCT`) | |
| Native `POINT` | `io.debezium.data.geometry.Point` (`STRUCT`) | Two `FLOAT64` fields (`x`, `y`). |

Domain types (user-defined types based on an underlying type) are captured using
their base type's representation.

The Debezium 3.0 PostgreSQL reference does not explicitly document how native array
columns (for example, `int[]` or `text[]`) are captured — the Kafka Connect `ARRAY`
literal type is used in the reference only for the pgvector types above. In practice,
the connector represents arrays of supported primitive types as `ARRAY` values, but
this is not stated in the reference.

### Not captured

The connector does not capture the native geometric types `LINE`, `LSEG`, `BOX`,
`PATH`, `POLYGON`, and `CIRCLE`, or true composite/row types. Cast these upstream if
you need them.

## SQL Server

RDI captures SQL Server changes via the
[Debezium SQL Server connector](https://debezium.io/documentation/reference/3.0/connectors/sqlserver.html).
CDC must be enabled at both the database and table level. See
[Prepare SQL Server for RDI]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/sql-server" >}}).

### Supported types

| SQL Server type | Collector representation (default settings) | Notes |
|-----------------|---------------------------------------------|-------|
| `TINYINT`, `SMALLINT`, `INT`, `BIGINT` | `INT16`/`INT16`/`INT32`/`INT64` | |
| `BIT` | `BOOLEAN` | |
| `DECIMAL`, `NUMERIC` | Kafka Connect `Decimal` (`BYTES`) | Controlled by `decimal.handling.mode`. See [Decimal and numeric values](#decimal-and-numeric-values). |
| `MONEY`, `SMALLMONEY` | Kafka Connect `Decimal` (`BYTES`) | |
| `REAL` | `FLOAT32` | |
| `FLOAT[(N)]` | `FLOAT64` | |
| `CHAR`, `VARCHAR`, `NCHAR`, `NVARCHAR`, `TEXT`, `NTEXT` | `STRING` | |
| `XML` | `io.debezium.data.Xml` (`STRING`) | |
| `DATE` | `Date` (days since epoch) | Not "ms at midnight". See [Temporal values](#temporal-values). |
| `TIME(0-3)` | `Time` (ms since midnight) | |
| `TIME(4-6)` | `MicroTime` (µs since midnight) | |
| `TIME(7)` | `NanoTime` (ns since midnight) | |
| `DATETIME`, `SMALLDATETIME` | `Timestamp` (ms since epoch) | |
| `DATETIME2(0-3)` | `Timestamp` (ms) | |
| `DATETIME2(4-6)` | `MicroTimestamp` (µs) | |
| `DATETIME2(7)` | `NanoTimestamp` (ns) | |
| `DATETIMEOFFSET` | `ZonedTimestamp` (`STRING`, GMT) | See [Time zones](#time-zones). |
| `BINARY`, `VARBINARY` | `BYTES` | Encoded per `binary.handling.mode` (default `bytes`). Not in the reference's mapping tables, but handled via the `binary.handling.mode` property. |

### Types requiring confirmation

The previous version of this page documented `UNIQUEIDENTIFIER`,
`ROWVERSION`/`TIMESTAMP` (the row-version column type), `sql_variant`, `hierarchyid`,
`IMAGE`, and the spatial types (`geometry`, `geography`) for SQL Server. None of these
appear in the Debezium 3.0 SQL Server connector reference's data type mapping tables.

Note that *absence from the reference's tables does not necessarily mean a type is
unsupported* — `BINARY` and `VARBINARY`, for example, are handled via the
`binary.handling.mode` property even though they have no mapping-table row. So these
types should be confirmed empirically rather than assumed unsupported.

## MongoDB

RDI captures MongoDB changes via the
[Debezium MongoDB connector](https://debezium.io/documentation/reference/3.0/connectors/mongodb.html),
which works differently from the relational connectors. See
[Prepare MongoDB for RDI]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/mongodb" >}}).

### What the collector emits

The MongoDB connector does **not** map each BSON field to a separate typed value.
Instead, it emits the whole document as a **single JSON string** using MongoDB
[extended JSON, strict mode](https://www.mongodb.com/docs/manual/reference/mongodb-extended-json/).
BSON values appear inside that string using extended-JSON wrappers, for example:

| BSON type | Extended-JSON representation |
|-----------|------------------------------|
| `ObjectId` | `{"$oid": "596e275826f08b2730779e1f"}` |
| `Int32` / `Int64` | `1234` / `{"$numberLong": "1234"}` |
| `Double` | a JSON number |
| `Decimal128` | `{"$numberDecimal": "..."}` |
| `Date` | `{"$date": ...}` |
| `Timestamp` (BSON) | `{"$timestamp": {"t": ..., "i": ...}}` |
| `Binary` | `{"$binary": "...", "$type": "00"}` |
| `Boolean` | `true` / `false` |
| `Null` | `null` |
| Regular expression | `{"$regularExpression": {"pattern": "...", "options": "..."}}` |
| JavaScript | `{"$code": "..."}` |
| `MinKey` / `MaxKey` | `{"$minKey": 1}` / `{"$maxKey": 1}` |

The document's `_id` is placed in the change event **key** (as an extended-JSON
string). It can be any BSON type — it is only a 24-character hex value when it is an
`ObjectId`.

What is available for updates depends on `capture.mode`:

- A *create* event always includes the full document.
- An *update* event includes the full document only when `capture.mode` is
  `change_streams_update_full`; otherwise it carries only the changed fields
  (`updatedFields`/`removedFields`). A `*_with_pre_image` mode is required to include
  the prior document state.

Documents larger than the 16 MB BSON limit require `oversize.handling.mode` (and
MongoDB 6.0.9+).

### How RDI maps it to Redis

RDI parses the collector's JSON string and writes the result to your Redis target:

- With a RedisJSON target, the document structure (nested objects and arrays) is
  preserved.
- With a Hash target, nested objects and arrays are stored as stringified JSON.
- RDI typically derives the Redis key (in whole or in part) from the document's
  `_id`.

## Spanner

RDI supports [Google Cloud Spanner](https://cloud.google.com/spanner) as a source,
but **Spanner does not use Debezium**. During the snapshot phase RDI reads Spanner
directly over JDBC, and during streaming it consumes
[Spanner change streams](https://cloud.google.com/spanner/docs/change-streams) via a
Flink-based collector (`type: flink`). Spanner is supported only when RDI is deployed
on Kubernetes/Helm. See
[Prepare Spanner for RDI]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/spanner" >}})
for setup.

Because Spanner uses a different collector, its data type handling is not governed by
the Debezium settings described elsewhere on this page. There is no Debezium or Flink
type-mapping reference to consult: Flink is only the stream-processing runtime, and
neither Flink core nor Flink CDC provides a Spanner connector. The representation of
each value comes from Spanner itself.

### Supported types

During the streaming phase, values arrive in Spanner's
[change stream record format](https://cloud.google.com/spanner/docs/change-streams/details),
in which each value is JSON-encoded according to the Spanner
[`TypeCode`](https://cloud.google.com/spanner/docs/reference/rest/v1/Type) reference
(the same encoding that the record's `column_types` metadata points to). The table
below uses GoogleSQL type names; the PostgreSQL dialect uses different type names
(for example, `bigint`, `bytea`, `timestamptz`, `jsonb`) but the same value encoding.

| Spanner type (GoogleSQL) | Change-stream representation |
|--------------------------|------------------------------|
| `BOOL` | JSON `true`/`false`. |
| `INT64` | A `STRING` in decimal format (not a JSON number). |
| `FLOAT32`, `FLOAT64` | A JSON number, or the strings `"NaN"`, `"Infinity"`, `"-Infinity"`. |
| `NUMERIC` | A `STRING` in decimal or scientific notation. |
| `STRING` | A `STRING`. |
| `BYTES` | A base64-encoded `STRING` (RFC 4648). |
| `JSON` | A JSON-formatted `STRING` (RFC 7159). |
| `TIMESTAMP` | A `STRING` in RFC 3339 format, time zone `Z` (UTC). |
| `DATE` | A `STRING` in RFC 3339 date format. |
| `UUID` | A lower-case hexadecimal `STRING` (RFC 9562). |
| `ENUM` | A `STRING` in decimal format. |
| `ARRAY` | A JSON list of elements encoded per the element type. |
| `STRUCT` | A JSON list of field values encoded per the field types. |

This table shows the **raw change-stream representation** only. RDI's Spanner
collector parses some of these values before they become change events — for
example, the string-encoded `INT64` values are parsed to numbers — and the snapshot
phase reads through the Spanner JDBC path, which may not match the change-stream
encoding. The RDI job/target representation is therefore not always identical to the
raw encoding above.

