---
Title: relational.write
aliases: null
alwaysopen: false
categories:
  - docs
  - integrate
  - rs
  - rdi
description: Write into a SQL-compatible data store
group: di
linkTitle: relational.write
summary:
  Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

Write into a SQL-compatible data store

**Properties**

| Name                                                                                                                                                      | Type     | Description                                                                                                                                                          | Required |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **connection**<br/>(The connection to use for loading)                                                                                                    | `string` | Logical connection name as defined in the connections.yaml<br/>                                                                                                      | yes      |
| **schema**<br/>(The table schema of the target table)                                                                                                     | `string` | If left blank, the default schema of this connection will be used as defined in the connections.yaml<br/>                                                            | yes      |
| **table**<br/>(The target table name)                                                                                                                     | `string` | Target table name<br/>                                                                                                                                               | yes      |
| [**keys**](#keys)<br/>(Business keys to use in case of \`load_strategy\` is UPSERT or working with \`opcode_field\`)                                      | `array`  |                                                                                                                                                                      | no       |
| [**mapping**](#mapping)<br/>(Fields to write)                                                                                                             | `array`  |                                                                                                                                                                      | no       |
| **foreach**<br/>(Split a column into multiple records with a JMESPath expression)                                                                         | `string` | Use a JMESPath expression to split a column into multiple records. The expression should be in the format column: expression.<br/>Pattern: `^(?!:).*:.*(?<!:)$`<br/> | no       |
| **opcode_field**                                                                                                                                          | `string` | Name of the field in the payload that holds the operation (c - create, d - delete, u - update) for this record in the DB<br/>                                        | no       |
| **load_strategy**                                                                                                                                         | `string` | type of target<br/>Default: `"APPEND"`<br/>Enum: `"APPEND"`, `"REPLACE"`, `"UPSERT"`, `"TYPE2"`<br/>                                                                 | no       |
| **active_record_indicator**                                                                                                                               | `string` | Used for `TYPE2` load_strategy. An SQL expression used to identify which rows are active<br/>                                                                        | no       |
| [**inactive_record_mapping**](#inactive_record_mapping)<br/>(Used for \`TYPE2\` load_strategy\. The columns mapping to use to close out an active record) | `array`  | A list of columns to use. Use any valid SQL expression for the source. If 'target' is omitted, will default to the name of the source column<br/>Default: <br/>      | no       |

**Additional Properties:** not allowed

**No properties.**

**Not [required1]:**
**No properties.**

**Example**

```yaml
id: load_snowflake
type: relational.write
properties:
  connection: eu_datalake
  table: employees
  schema: dbo
  load_strategy: APPEND
```

<a name="keys"></a>

## keys\[\]: Business keys to use in case of \`load_strategy\` is UPSERT or working with \`opcode_field\`

**Items: name of column**

**No properties.**

**Example**

```yaml
- fname
- lname: last_name
```

<a name="mapping"></a>

## mapping\[\]: Fields to write

**Items: name of column**

**No properties.**

**Example**

```yaml
- fname
- lname: last_name
- address
- gender
```

<a name="inactive_record_mapping"></a>

## inactive_record_mapping\[\]: Used for \`TYPE2\` load_strategy\. The columns mapping to use to close out an active record

A list of columns to use. Use any valid SQL expression for the source. If 'target' is omitted, will default to the name of the source column

**No properties.**

**Example**

```yaml
- source: CURRENT_DATE
  target: deletedAt
- source: "'Y'"
  target: is_active
```
