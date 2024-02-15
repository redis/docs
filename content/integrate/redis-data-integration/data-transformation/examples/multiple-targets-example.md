---
Title: Multiple Redis targets
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: '1'
---

The `output` section of a job supports multiple `redis.write` blocks. This enables writing the same record to different Redis databases and/or writing it to multiple Redis keys using different data types. For example, RDI can write the captured `invoice` object to a JSON document, update the set holding the list of `invoices`, grouped by countries, and finally, send an update to a Redis stream named `invoice:events` to notify other applications about the change. 

```yaml
source:
  server_name: chinook
  schema: public
  table: invoice
output:
  # this block will use the default connection: target - since no explicit connections is specified,
  # the data will be written in a JSON format as the data_type: json is specified for the block 
  - uses: redis.write
    with:
      data_type: json
      key:
        expression: concat(['invoice_id:', InvoiceId])
        language: jmespath
      on_update: merge
  # this block will use the explicitly specified connection: target1 - it must be defined in config.yaml
  # the data will be written to the corresponding Redis set, based on a value of the key expression
  - uses: redis.write
    with:
      connection: target1
      data_type: set
      key:
        expression: concat(['invoices:', BillingCountry])
        language: jmespath
      args:
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
      mapping:  # only the fields listed below will be written to a stream message, with two of them renamed as message_id and country
        - InvoiceId: message_id
        - BillingCountry: country
        - Total
```