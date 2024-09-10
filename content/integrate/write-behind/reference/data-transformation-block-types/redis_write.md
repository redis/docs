---
Title: redis.write
aliases: null
alwaysopen: false
categories:
  - docs
  - integrate
  - rs
  - rdi
description: Write to a Redis Enterprise database
group: di
linkTitle: redis.write
summary:
  Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

Write to a Redis Enterprise database

**Properties**

| Name                    | Type      | Description                                                                                                                                                                    | Required |
| ----------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| **connection**          | `string`  | Name of Redis connection specified in `config.yaml`.<br/>Defaults to connection named `target`.                                                                                | no       |
| **data_type**<br/>      | `string`  | Type of Redis target data structure.<br/>Enum: `hash`(default), `json`, `set`, `sorted_set`, `stream`, `string`.<br/>Takes precedence over system property `target_data_type`. | no       |
| [**nest**](#nest)       | `object`  | Nest (embed) object within a different key.<br/>If nesting is specified, the following parameters are ignored: `key`, `args` and `on_update`.                                  | no       |
| **key**                 | `object`  | Definition of the target Redis key.<br/>                                                                                                                                       | yes      |
| &#x221F; **expression** | `string`  | Expression used to calculate the target key.                                                                                                                                   | yes      |
| &#x221F; **language**   | `string`  | Language used to define the expression.<br/>Enum: `jmespath`, `sql`.                                                                                                           | yes      |
| [**args**](#args)       | `object`  | Arguments for modifying the target key.<br/>Specific to the data type.                                                                                                         | no       |
| **mapping**             | `array`   | Array of fields (or `field: alias` pairs) to be written to a Redis key.<br/>Supported for hashes, json documents and streams only.                                             | no       |
| **on_update**           | `string`  | Target key update strategy<br/>Enum: `merge`, `replace` (default).                                                                                                             | no       |
| **expire**              | `integer` | TTL in seconds for the modified key to expire.<br/>If not specified (or `expire: 0`), the target key will never expire.                                                        | no       |

> Notes:

- Job parameters always override system properties. In particular, `data_type` will override `target_data_type` and `on_update` will override `json_update_strategy` properties respectively.
- Mapping for **JSON documents** supports nested paths (e.g. `path.to.field`) which results in creating a nested element in Redis key. When a dot is used in a field name, it must be escaped with a backslash (e.g. `path\.to\.field`). Nested paths are not supported for hashes and streams.
- For **strings** Write-behind will automatically assume `on_update: replace` regardless of what was declared in the job file. Appends and increments are not currently supported.
- For **streams** Write-behind will ignore `on_update` property since they are append only.

> Notes:

- Job parameters always override system properties. In particular, `data_type` will override `target_data_type` and `on_update` will override `json_update_strategy` properties respectively.
- Mapping for JSON documents supports nested paths (e.g. `path.to.field`) which results in creating a nested element in Redis key. When a dot is used in a field name, it must be escaped with a backslash (e.g. `path\.to\.field`). Nested paths are not supported for hashes and streams.

**Example**

```yaml
source:
  server_name: chinook
  schema: public
  table: invoice
output:
  # this block will use the default connection: target - since no explicit connection is specified,
  # the data will be written in a JSON format as the data_type: json is specified for the block
  - uses: redis.write
    with:
      data_type: json
      key:
        expression: concat(['invoice_id:', InvoiceId])
        language: jmespath
      mapping: # only the fields listed below will be written to a JSON document
        - InvoiceId: id # this will create an element with a different name
        - InvoiceDate: date
        - BillingAddress: address.primary.street # this will create a nested element in the JSON document
        - BillingCity: "address.primary.city name" # this will create a nested element with a space in the name
        - BillingState: address.primary.state
        - BillingPostalCode: "address.primary.zip\\.code" # this will create a nested element with a dot in the name
        - Total # this will create an element with the same name as the original field
      on_update: merge
  # this block will use the explicitly specified connection: target1 - it must be defined in config.yaml
  # the data will be written to the corresponding Redis set, based on a value of the key expression
  - uses: redis.write
    with:
      connection: target
      data_type: set
      key:
        expression: concat(['invoices:', BillingCountry])
        language: jmespath
      args:
        member: InvoiceId
  # this block will use the explicitly specified connection: target1 - it must be defined in config.yaml
  # the data will be written to the Redis sorted set named invoices:sorted as specified in the key expression
  - uses: redis.write
    with:
      connection: target1
      data_type: sorted_set
      key:
        expression: "`invoices:sorted`"
        language: jmespath
      args:
        score: Total
        member: InvoiceId
  # this block will use the specified connection: target2 - this, again, has to be defined in config.yaml
  # the data will be written to a Redis stream named invoice:events as specified in the key expression
  - uses: redis.write
    with:
      connection: target2
      data_type: stream
      key:
        expression: "`invoice:events`"
        language: jmespath
      mapping: # only the fields listed below will be written to a stream message, with two of them renamed as message_id and country
        - InvoiceId: message_id
        - BillingCountry: country
        - Total
  # this block will use the default connection: target - since no explicit connection is specified,
  # the data will be written to a Redis string as the data_type: string is specified for the block
  - uses: redis.write
    with:
      data_type: string
      key:
        expression: concat(['Invoice:', InvoiceId])
        language: jmespath
      args:
        value: Total # only the Total field will be written to a string
      expire: 100 # the key will expire in 100 seconds
```

<a name="args"></a>

## args: object

Arguments for modifying the target key

**Properties**

| Name       | Type     | Description                                                                                    | Required |
| ---------- | -------- | ---------------------------------------------------------------------------------------------- | -------- |
| **score**  | `string` | Field name used as a score for sorted sets.<br/>Valid for sorted sets only.                    | yes      |
| **member** | `string` | Field name used as a member for sets and sorted sets.<br/>Valid for sets and sorted sets only. | yes      |
| **value**  | `string` | Field name used as a value for strings.<br/>Valid for strings only.                            | yes      |

<a name="nest"></a>

## nest: object

Nest (embed) object within a different key

**Properties**

| Name                     | Type     | Description                                                                                                                                                                                                    | Required |
| ------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **parent**               | `object` | Parent object definition.                                                                                                                                                                                      | yes      |
| &#x221F; **server_name** | `string` | Server name.                                                                                                                                                                                                   | no       |
| &#x221F; **schema**      | `string` | Schema name.                                                                                                                                                                                                   | no       |
| &#x221F; **table**       | `string` | Parent table.                                                                                                                                                                                                  | yes      |
| **parent_key**           | `string` | Field name used to identify the parent key (usually FK).                                                                                                                                                       | yes      |
| **child_key**            | `string` | Optional field name used to identify the parent key value (if different from **parent_key**) in the child record. If not specified, then the field name defined in **parent_key** is used to lookup the value. | no       |
| **nesting_key**          | `string` | Field name used to create the nesting key (usually PK).                                                                                                                                                        | yes      |
| **path**                 | `string` | Path, where the nested object should reside in a parent document.<br/>Must start with the root (e.g. `$.<children-elements-here>`)                                                                             | yes      |
| **structure**            | `string` | Data structure used to represent the object in a parent document (`map` is the only supported value).                                                                                                          | no       |

> Notes:

- When `nest` object is defined, Write-behind will automatically assume `data_type: json` and `on_update: merge` regardless of what was declared in the job file.
- Nesting job cannot be used together with any of the these properties: `key`, `args`. The key is automatically calculated based on the following template: `<parent_table>:<parent_key>:<parent_key.value | child_key.value>`.
- When `expire` is specified, it will be applied to the **parent** key. Therefore all nested objects will expire together with the parent key.

**Example**

```yaml
source:
  server_name: chinook
  schema: public
  table: InvoiceLine
output:
  - uses: redis.write
    with:
      nest:
        parent:
          # server_name: chinook
          # schema: public
          table: Invoice
        nesting_key: InvoiceLineId
        parent_key: InvoiceId
        # child_key: ParentInvoiceId
        path: $.InvoiceLineItems
        # structure: map
```

> Note: In the example above `child_key` is not needed, because the FK in the child table `InvoiceLine` is defined using the same field name `InvoiceId` as in the parent table `Invoice`. If instead a FK was defined differently (e.g. InvoiceLine.ParentInvoivceId = Invoice.InvoiceId), then `child_key` parameter would be required to describe this relationship in the child job.
