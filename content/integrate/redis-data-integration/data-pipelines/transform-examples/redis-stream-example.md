---
Title: Write to a Redis stream
aliases: /integrate/redis-data-integration/ingest/data-pipelines/transform-examples/redis-stream-example/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
linkTitle: Write to a Redis stream
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 30
---

In the example below, data is captured from the source table named `invoice` and is written to a Redis stream. The `connection` is an optional parameter that refers to the corresponding connection name defined in `config.yaml`. 
When you specify the `data_type` parameter for the job, it overrides the system-wide setting `target_data_type` defined in `config.yaml`. 

When writing to streams, you can use the optional parameter `mapping` to limit the number of fields sent in a message and to provide aliases for them. If you don't use the `mapping` parameter, all fields captured in the source will be passed as the message payload. 

Note that streams are different from other data structures because existing messages are never updated or deleted. Any operation in the source will generate a new message with the corresponding operation code (`op_code` field) that is automatically added to the message payload. 

In this case, the result will be a Redis stream with the name based on the key expression (for example, `invoice:events`) and with an expiration of 100 seconds for the whole stream. If you don't supply an `expire` parameter, the keys will never expire. 

In the example, only three original fields are passed in the message payload: `InvoiceId` (as `message_id`), `BillingCountry` (as `country`), `Total` (as `Total`, no alias provided) and `op_code`, which is implicitly added to all messages sent to streams.    

```yaml
source:
  schema: public
  table: invoice
output:
  - uses: redis.write
    with:
      connection: target
      data_type: stream
      key:
        expression: "`invoice:events`"
        language: jmespath
      mapping:
        - InvoiceId: message_id
        - BillingCountry: country
        - Total
      expire: 100
```
