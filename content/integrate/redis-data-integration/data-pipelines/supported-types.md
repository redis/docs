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

The sections below describe the data types supported by RDI for each source database.
There are also some cross‑cutting considerations that apply to all source databases.

## Oracle

### Core Supported Types

RDI (via the Debezium Oracle connector) supports Oracle’s core scalar types:

- **Numeric**: `NUMBER`, `DECIMAL`
- **Character**: `CHAR`, `VARCHAR2`, `NCHAR`, `NVARCHAR2`
- **Temporal**: `DATE`, `TIMESTAMP`, `TIMESTAMP WITH TIME ZONE`, `TIMESTAMP WITH LOCAL TIME ZONE`

**Behavior & mapping:**

- `NUMBER(p,s)` / `DECIMAL(p,s)`  
  - Ingested with full precision and scale.  
  - **Redis Hash**: stored as a string, e.g. `4521398.56` → `"4521398.56"`.  
  - **RedisJSON**: stored as a numeric JSON value by default, or as a string if configured.

- `CHAR` / `VARCHAR2` / `NCHAR` / `NVARCHAR2`  
  - Stored as plain strings in Redis (UTF‑8 preserved).

- `DATE`, `TIMESTAMP`  
  - Converted to epoch **milliseconds**.  
  - **Redis Hash**: stored as a string, e.g. `"1529507596945"`.  
  - **RedisJSON**: stored as a number.  

- `TIMESTAMP WITH TIME ZONE`  
  - Normalized to UTC, then converted to epoch milliseconds.

### Large Objects (LOBs)

Oracle LOBs are supported **with additional configuration**:

- **Types**: `CLOB`, `NCLOB`, `BLOB` (and LOB‑backed `XMLTYPE`).
- By default, Debezium does **not** send full LOB contents in change events.

**Required config (RDI / Debezium side):**

```properties
# In the Oracle source connector / RDI advanced properties
lob.enabled=true
```

- When `lob.enabled=true`:
  - New values for `CLOB` / `NCLOB` / `BLOB` / `XMLTYPE` are sent in events.
  - Unchanged LOB values in update events may be represented by placeholders (connector optimization).

**Mapping:**

- `CLOB` / `NCLOB` → Unicode string (entire text) in Redis.
- `BLOB` → Base64‑encoded string (by default).  
- In Redis Hashes, these are string fields; in RedisJSON they are JSON strings.

### Binary & RAW

- **Types**: `BLOB`, `RAW`, `LONG RAW` (see unsupported below).

By default, Debezium uses a **binary handling mode** (commonly `base64`):

```properties
binary.handling.mode=base64   # typical default
```

- Oracle `RAW` / `BLOB` values:
  - Emitted as Base64 strings (e.g. `"hello"` bytes → `"aGVsbG8="`).
  - Stored as those encoded strings in Redis Hash fields or RedisJSON string properties.

### XMLTYPE

Oracle `XMLTYPE` is backed by LOBs and **needs extra setup**:

1. Enable LOB support:

   ```properties
   lob.enabled=true
   ```

2. Add Oracle XML libraries to the Debezium/RDI runtime image, e.g.:

   - `xdb.jar`
   - `xmlparserv2.jar`  

   (Exact JARs and versions depend on Oracle client/driver.)

3. After this:
   - `XMLTYPE` values are captured as XML **text**.
   - Redis stores them as strings (Hash or JSON). If desired, you can post‑process XML into JSON with an RDI job.

### Unsupported / Special Oracle Types

Not supported (or skipped) by the Debezium Oracle connector and therefore by RDI:

- `LONG`, `LONG RAW` – legacy LOB types.
- `BFILE` – external file LOBs.
- `UROWID` – universal ROWIDs.
- PL/SQL `BOOLEAN` – not a SQL column type.
- Complex object / user‑defined types (UDTs), nested tables.
- Oracle spatial / locator types.
- Oracle vector/AI types (unless explicitly cast to supported text/binary forms).

**ROWID**:

- In **LogMiner** mode, `ROWID` is supported and captured as a string.
- In **XStream** mode, `ROWID` is not exposed.

### Oracle → Redis Mapping Summary

| Oracle type               | Support level      | Notes / requirements                                       |
|---------------------------|--------------------|------------------------------------------------------------|
| `NUMBER`, `DECIMAL`       | ✅ Supported        | Full precision; string in Hash, numeric in JSON.          |
| `CHAR`, `VARCHAR2`, `N*`  | ✅ Supported        | Straightforward string mapping.                            |
| `DATE`, `TIMESTAMP`       | ✅ Supported        | Epoch ms; UTC‑normalized when time zone aware.            |
| `CLOB`, `NCLOB`           | ✅ Supported (cfg)  | Requires `lob.enabled=true`. Stored as text.              |
| `BLOB`, `RAW`             | ✅ Supported (cfg)  | `lob.enabled` + `binary.handling.mode`. Stored as Base64. |
| `XMLTYPE`                 | ✅ Supported (extra)| Needs Oracle XML JARs + `lob.enabled`. Text XML in Redis. |
| `ROWID` (LogMiner)        | ✅ Supported        | String identifier.                                         |
| `LONG`, `LONG RAW`        | ❌ Not supported    | Legacy types.                                              |
| `BFILE`, `UROWID`         | ❌ Not supported    | Skipped.                                                   |
| Object/UDT, spatial, etc. | ❌ Not supported    | Must be transformed/cast upstream.                         |

---

## MySQL & MariaDB

### Core Types

RDI (via Debezium MySQL) supports all common MySQL and MariaDB types:

- **Numeric**: `TINYINT`, `SMALLINT`, `MEDIUMINT`, `INT`, `BIGINT`, `DECIMAL`, `NUMERIC`, `FLOAT`, `DOUBLE`.
- **Strings**: `CHAR`, `VARCHAR`, `TINYTEXT`, `TEXT`, `MEDIUMTEXT`, `LONGTEXT`.
- **Binary**: `BINARY`, `VARBINARY`, `TINYBLOB`, `BLOB`, `MEDIUMBLOB`, `LONGBLOB`.
- **Temporal**: `DATE`, `TIME`, `DATETIME`, `TIMESTAMP`, `YEAR`.
- **Booleans**: emulated via `TINYINT(1)`.

**Mapping:**

- Integers & floats: string in Hash, numeric in JSON.
- `DECIMAL` / `NUMERIC`:
  - Default: preserved precision via `decimal.handling.mode`.
  - Recommended: treat high‑precision values as strings to avoid rounding.
- Text types: stored as strings.
- Temporal:
  - `DATE`: days since epoch → epoch ms at 00:00 UTC.
  - `TIME`: time of day → milliseconds from midnight.
  - `DATETIME` / `TIMESTAMP`: epoch ms (with `TIMESTAMP` in UTC).

### JSON

MySQL `JSON` (and MariaDB’s JSON, usually `LONGTEXT` + JSON semantics):

- Debezium emits JSON values as **JSON text**.
- RDI behaves as:

  - **Hash target**: a single field containing the JSON string.  
  - **RedisJSON target**: parsed into a nested JSON structure.

No special configuration is required.

### ENUM, SET, YEAR

- `ENUM('a','b',...)`  
  - Mapped to its **string** label (e.g. `'small'`, `'large'`).

- `SET('a','b',...)`  
  - Mapped to a comma‑separated string of selected values, e.g. `'a,b'`.

- `YEAR`  
  - Treated as integer year (e.g. `2025`).  
  - String in Hash, numeric in JSON.

### Binary & BLOBs

- `BINARY`, `VARBINARY`, `BLOB` variants:
  - Debezium emits bytes using configured `binary.handling.mode` (Base64 by default).
  - RDI stores the resulting encoded string.

### Unsupported / Partial Types

- **Spatial / GIS types**: `GEOMETRY`, `POINT`, `LINESTRING`, `POLYGON`, etc.  
  - Not supported out of the box. Columns with these types are skipped.
- **BIT**:
  - Debezium may represent it as raw bytes.
  - RDI stores as an encoded binary string; no automatic boolean conversion.

### MySQL/MariaDB → Redis Mapping Summary

| MySQL/MariaDB type      | Support level  | Notes                                                     |
|-------------------------|----------------|-----------------------------------------------------------|
| Integer types           | ✅ Supported    | String in Hash, numeric in JSON.                         |
| `DECIMAL`, `NUMERIC`    | ✅ Supported    | Configure `decimal.handling.mode` as needed.             |
| `FLOAT`, `DOUBLE`       | ✅ Supported    | Beware of precision if using JSON numbers.               |
| Text types (`*TEXT`)    | ✅ Supported    | Large text handled; stored as strings.                   |
| Binary / BLOB types     | ✅ Supported    | Base64 (or configured) encoded strings in Redis.         |
| `DATE`, `TIME`, `DATETIME`, `TIMESTAMP`, `YEAR` | ✅ Supported | Epoch‑based or integer representations.      |
| `JSON`                  | ✅ Supported    | Text in Hash; native JSON in RedisJSON.                  |
| `ENUM`, `SET`           | ✅ Supported    | Saved as strings.                                        |
| Spatial (`GEOMETRY`…)   | ❌ Not supported| Must be converted upstream if needed.                    |
| `BIT`                   | ⚠️ Partial      | Comes through as binary; no built‑in boolean mapping.    |

---

## PostgreSQL, Supabase & AlloyDB

### Core Types

Supported PostgreSQL scalar types:

- **Numeric**: `SMALLINT`, `INTEGER`, `BIGINT`, `NUMERIC`, `DECIMAL`, `REAL`, `DOUBLE PRECISION`, `MONEY`.
- **Strings**: `CHAR`, `VARCHAR`, `TEXT`.
- **Binary**: `BYTEA`.
- **Temporal**: `DATE`, `TIME`, `TIMESTAMP`, `TIMESTAMPTZ`.
- **Boolean**: `BOOLEAN`.
- **Identifiers & network**: `UUID`, `INET`, `CIDR`, `MACADDR`.
- **Enums**: PostgreSQL `ENUM`.

**Mapping:**

- Numeric types: string in Hash, numeric in JSON.
- `NUMERIC`/`DECIMAL`/`MONEY`: high‑precision decimal; best treated as strings when precision matters.
- `BOOLEAN`: boolean → `"1"`/`"0"` in Hash, true/false in JSON.
- `UUID`, `INET`, `CIDR`, `MACADDR`: stored as strings.
- `BYTEA`: binary encoded according to Debezium’s binary handling mode (Base64 by default).

### JSON / JSONB / HSTORE

- `JSON`, `JSONB`:
  - Debezium captures JSON values directly.
  - **Hash target**: JSON text string in a field.  
  - **RedisJSON target**: nested JSON structure.

- `HSTORE`:
  - Stored as a key/value representation (e.g. `'"k1"=>"v1","k2"=>"v2"'`) as a string by default.
  - You can post‑process to a JSON object with an RDI job if desired.

### Unsupported / Complex Types

Not supported in Debezium’s PostgreSQL connector (and thus RDI):

- **Arrays**: `text[]`, `int[]`, etc. – skipped.
- **Composite types / UDTs**: not captured.
- **Geometric / spatial types**:
  - `POINT`, `LINE`, `LSEG`, `BOX`, `PATH`, `POLYGON`, `CIRCLE`, PostGIS `GEOMETRY`, `GEOGRAPHY`.
- **`INTERVAL`**: not emitted.
- **BIT/VARBIT**: bitstring types are not handled as first‑class booleans.

If these are present, the connector generally skips those fields and logs warnings.

### Supabase & AlloyDB Notes

- **Supabase**: is PostgreSQL; all behavior above applies.
- **AlloyDB**: also PostgreSQL‑compatible; same behavior for standard types.
  - Newer types like vector/embedding columns are generally not handled unless explicitly cast (e.g. to `TEXT`).

### PostgreSQL → Redis Mapping Summary

| PostgreSQL type         | Support level | Notes                                                      |
|-------------------------|---------------|------------------------------------------------------------|
| `SMALLINT/INT/BIGINT`   | ✅ Supported   | Integers as strings (Hash) or numbers (JSON).             |
| `NUMERIC`, `DECIMAL`    | ✅ Supported   | Full precision; prefer strings for exactness.             |
| `REAL`, `DOUBLE PREC.`  | ✅ Supported   | Floating point; watch precision in JSON.                  |
| `BOOLEAN`               | ✅ Supported   | `"1"`/`"0"` in Hash, true/false in JSON.                  |
| `CHAR`, `VARCHAR`, `TEXT` | ✅ Supported | Strings.                                                  |
| `BYTEA`                 | ✅ Supported   | Encoded binary (Base64, etc.).                            |
| `DATE`, `TIMESTAMP`, `TIMESTAMPTZ`, `TIME` | ✅ Supported | Epoch‑style conversion.                     |
| `UUID`                  | ✅ Supported   | Text UUID.                                                |
| `JSON`, `JSONB`         | ✅ Supported   | Text in Hash, native JSON in RedisJSON.                   |
| `HSTORE`                | ✅ Supported   | String map; can be transformed to JSON.                   |
| Arrays (`*_array`)      | ❌ Not supported | Skipped.                                                 |
| Composite/UDT           | ❌ Not supported | Skipped.                                                 |
| Geometric/PostGIS types | ❌ Not supported | Skipped.                                                 |
| `INTERVAL`, `BIT`       | ❌ Not supported | Must be converted upstream.                              |

---

## SQL Server

### Core Types

Supported SQL Server scalar types:

- **Numeric**: `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `DECIMAL`, `NUMERIC`, `MONEY`, `SMALLMONEY`, `FLOAT`, `REAL`.
- **Strings**: `CHAR`, `VARCHAR`, `NCHAR`, `NVARCHAR`.
- **Legacy text**: `TEXT`, `NTEXT`.
- **Binary**: `BINARY`, `VARBINARY`, `IMAGE`.
- **Temporal**: `DATE`, `TIME`, `DATETIME`, `SMALLDATETIME`, `DATETIME2`, `DATETIMEOFFSET`.
- **Boolean‑like**: `BIT`.
- **Identifier**: `UNIQUEIDENTIFIER`.
- **Row version**: `ROWVERSION` / `TIMESTAMP` (SQL Server’s version column).

**Mapping:**

- Numeric: precise decimals are best kept as strings; integers as strings in Hash, numbers in JSON.
- `MONEY`, `SMALLMONEY`: treated as decimal with scale 4; string in Hash.
- `BIT`: mapped to boolean; string `"0"`/`"1"` in Hash, boolean in JSON.
- `UNIQUEIDENTIFIER`: UUID string.
- `ROWVERSION/TIMESTAMP`:
  - 8‑byte binary value.
  - Debezium usually exposes this as hex; RDI stores a hex string.

### Temporal Types

- `DATETIME`, `SMALLDATETIME`:
  - Converted to epoch ms (with `SMALLDATETIME` rounded to minute).
- `DATETIME2`:
  - High precision; converted to microseconds/epoch ms with fractional part.
- `DATETIMEOFFSET`:
  - Time zone–aware; normalized to UTC epoch ms.
- `DATE`, `TIME`:
  - `DATE`: ms at midnight.
  - `TIME`: ms from midnight.

### LOBs & Binary

- `VARBINARY(MAX)`, `IMAGE`:
  - Captured as bytes and encoded (Base64, etc.).
  - Stored as encoded strings.

- `TEXT`, `NTEXT`:
  - Treated as CLOB‑like text; stored as strings.

No special connector tuning is usually required beyond standard CDC configuration.

### Unsupported / Special Types

- `sql_variant`: not supported.
- `hierarchyid`: not supported.
- Spatial types:
  - `geometry`, `geography` – not supported; columns are skipped.
- Table‑valued types: not applicable as column types in normal tables.

### SQL Server → Redis Mapping Summary

| SQL Server type           | Support level | Notes                                                       |
|---------------------------|---------------|-------------------------------------------------------------|
| `INT`, `BIGINT`, etc.     | ✅ Supported   | String in Hash, numeric in JSON.                           |
| `BIT`                     | ✅ Supported   | `"0"`/`"1"` in Hash, boolean in JSON.                      |
| `DECIMAL`, `NUMERIC`      | ✅ Supported   | Full precision; string recommended.                        |
| `MONEY`, `SMALLMONEY`     | ✅ Supported   | Decimal monetary values.                                   |
| Text types (`VARCHAR`, `NVARCHAR`, `TEXT`, `NTEXT`) | ✅ Supported | Strings.                               |
| `VARBINARY`, `IMAGE`      | ✅ Supported   | Encoded binary strings.                                    |
| `DATE`, `DATETIME*`, `TIME`, `DATETIMEOFFSET` | ✅ Supported | Epoch‑based, timezone‑aware where applicable. |
| `UNIQUEIDENTIFIER`        | ✅ Supported   | UUID string.                                               |
| `ROWVERSION`/`TIMESTAMP`  | ✅ Supported   | Hex string; mostly for diagnostics.                        |
| `sql_variant`, `hierarchyid` | ❌ Not supported | Skipped.                                             |
| Spatial (`geometry`, `geography`) | ❌ Not supported | Skipped.                                            |

---

## MongoDB

### Core BSON Types

MongoDB’s JSON‑like model maps very naturally into RedisJSON (or Hashes). Debezium’s Mongo connector (used by RDI) supports:

- **Scalars**:
  - `String`
  - `Int32`, `Int64`, `Double`, `Decimal128`
  - `Boolean`
  - `Date` (BSON datetime)
  - `Null`

- **Identifiers**:
  - `ObjectId`

- **Complex**:
  - `Document` (embedded document)
  - `Array`

- **Binary**:
  - `Binary` (BSON type 5)

- **Others (stored as strings)**:
  - `Regular Expression`
  - `JavaScript` / `JavaScript with Scope`
  - `DBRef` (as a small document)
  - MinKey/MaxKey – rarely used, mostly internal.

### Mapping Behavior

By default, RDI maps **one MongoDB document → one Redis key** (often RedisJSON):

- `_id`:
  - Usually mapped to part or all of the Redis key name, AND/OR stored as a field: `"_id": "64a1..."`.
  - Represented as a 24‑character hex string.

- Numbers:
  - `Int32`, `Int64`, `Double`: numeric in RedisJSON, string in Hash.
  - `Decimal128`: typically represented as a string (to avoid precision loss); you can treat it as a string or parse it downstream.

- Strings:
  - Stored as strings (no special handling).

- Boolean:
  - Stored as JSON `true`/`false` in RedisJSON; `"1"`/`"0"` in Hash.

- Date:
  - BSON datetime (ms since epoch) → numeric epoch ms (JSON) or string epoch ms (Hash).
  - Often you’ll see values like `1672531200000`.

- Binary:
  - Binary data Base64‑encoded into a string.

- Documents & Arrays:
  - RedisJSON target: nested objects / arrays preserved exactly.
  - Hash target: nested documents and arrays are **stringified** JSON (e.g. `address` field contains the JSON string of the subdocument).

### Less Common BSON Types

- **Regex**: stored as a string representation (e.g. `"/^abc/i"`).
- **JavaScript / JavaScriptWithScope**: captured as code text.
- **DBRef**: captured as a small document with `$ref` and `$id`, then mapped like a normal subdocument.
- **MinKey / MaxKey**: may be treated as extreme sentinels or omitted; rarely used in user data.

### MongoDB → Redis Mapping Summary

| MongoDB/BSON type   | Support level | Redis representation                                        |
|---------------------|---------------|-------------------------------------------------------------|
| `String`            | ✅ Supported   | String.                                                     |
| `Int32/Int64`       | ✅ Supported   | Number (JSON) or decimal string (Hash).                    |
| `Double`            | ✅ Supported   | Number (JSON).                                             |
| `Decimal128`        | ✅ Supported   | Typically represented as decimal string.                   |
| `Boolean`           | ✅ Supported   | true/false (JSON), `"1"`/`"0"` in Hash.                    |
| `Date`              | ✅ Supported   | Epoch ms (number or string).                               |
| `Null`              | ✅ Supported   | JSON `null` or omitted field in Hash.                      |
| `ObjectId`          | ✅ Supported   | 24‑char hex string.                                        |
| `Binary`            | ✅ Supported   | Base64 string.                                             |
| `Document`          | ✅ Supported   | Nested JSON object (JSON target) or JSON string (Hash).    |
| `Array`             | ✅ Supported   | JSON array (JSON target) or JSON string (Hash).            |
| Regex, JS, DBRef    | ⚠️ Supported as strings/structs | Stored as strings or embedded objects.       |
| MinKey/MaxKey       | ⚠️ Rare/edge   | Usually not relevant in user data.                         |

---

## Cross‑Cutting Considerations

### Nullability

- **Redis Hashes**:  
  - Null values are **not stored** (field absent).
- **RedisJSON**:  
  - Null values become JSON `null`.

### Precision & Scale

For high‑precision numeric values (money, scientific values):

- Prefer connector modes that preserve full precision:
  - e.g. `decimal.handling.mode=string` or equivalent.
- In Redis:
  - Use JSON strings if you need exact decimal fidelity, or JSON numbers if range is within double precision.

### Time Zones

- Source time zone handling is connector‑specific.
- RDI generally:
  - Converts to UTC where the source type contains a time zone.
  - Stores epoch milliseconds for timestamps in Redis.

### Binary Handling

- Controlled by Debezium’s `binary.handling.mode` (exact property name may vary by connector).
- Common values:
  - `base64` (safest, default),
  - `bytes`,
  - `hex`.

Ensure your consumer understands the chosen encoding.

---

## Quick Configuration Checklist

For advanced RDI users, here are the **common extra steps** by database:

### Oracle

- ✅ Enable supplemental logging on tables/schemas.  
- ✅ Set `lob.enabled=true` if you need `CLOB`/`BLOB`/`XMLTYPE`.  
- ✅ Add Oracle XML JARs (`xdb.jar`, `xmlparserv2.jar`) if using `XMLTYPE`.  
- ✅ Decide on `binary.handling.mode` for `RAW`/`BLOB`.  
- ✅ Avoid unsupported types (LONG, BFILE, complex UDTs) or cast them to supported forms.

### MySQL / MariaDB

- ✅ Binary log enabled in **ROW** mode.  
- ✅ Configure `decimal.handling.mode` to balance precision vs convenience.  
- ✅ Be aware that spatial types are not supported.  
- ✅ Treat `BIT` columns as binary (or cast to integer/boolean in SQL).

### PostgreSQL / Supabase / AlloyDB

- ✅ Ensure WAL/replication settings match connector needs.  
- ✅ Avoid array/composite/spatial types in replicated columns (or cast them to JSON/TEXT).  
- ✅ Use RedisJSON target to get most value from `JSONB`.  

### SQL Server

- ✅ Enable CDC or transaction log access as required by the connector.  
- ✅ Mind `MONEY`/`DECIMAL` precision—store as strings when exactness is critical.  
- ✅ Exclude or transform unsupported types (`sql_variant`, spatial types).

### MongoDB

- ✅ Ensure replica set / change streams are configured.  
- ✅ Prefer RedisJSON outputs to preserve document structure.  
- ✅ For large binary data, confirm Base64 encoding is acceptable to your consumers.
