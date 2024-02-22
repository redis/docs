---
Title: Write-behind to Redis Enterprise target example
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
linkTitle: Write-behind to Redis Enterprise target
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 30
---

The `redis.write` block can be used in the `output` section of the write-behind job in order to enable writing data to the Redis Enterprise target database. Multiple blocks can be used at the same time to write data to different data types. The following example captures data modified in the `address:*` keyspace, then creates a new JSON-like string field named `json_addr`,  and, finally, writes the results to multiple keys in target Redis Enteprise database:

```yaml
source:
  redis:
    trigger: write-behind
    key_pattern: address:*
transform:
  - uses: add_field
    with:
      fields:
        - field: "json_addr"
          expression: concat(['{"city":', city, ', "zip":', zip, '}'])
          language: jmespath
output:
  - uses: redis.write
    with:
      data_type: hash
      connection: target
      key:
        expression: concat(['addr:org_id:', org_id, ':hash'])
        language: jmespath
  - uses: redis.write
    with:
      data_type: json
      key:
        expression: concat(['addr:org_id:', org_id, ':json'])
        language: jmespath
      on_update: merge
  - uses: redis.write
    with:
      data_type: set
      key:
        expression: concat(['addresses:', country])
        language: jmespath
      args:
        member: json_addr
  - uses: redis.write
    with:
      data_type: sorted_set
      key:
        expression: concat(['addrs_withscores:', country])
        language: jmespath
      args:
        score: zip
        member: json_addr
  - uses: redis.write
    with:
      data_type: stream
      key:
        expression: "`addresses:events`"
        language: jmespath
      mapping:
        - org_id: message_id
        - zip: zip_code
        - country
```

Run the following command in the source Redis Enterprise database to test the job:

```shell
127.0.0.1:12005> hset address:1 city Austin zip 78901 org_id 1 country USA
```

The result is five keys will be created in the target Redis Enterprise database (hash, JSON, set, sorted set, and stream):

```shell
127.0.0.1:12000> keys *
1) "addr:org_id:1:hash"
2) "addr:org_id:1:json"
3) "addresses:USA"
4) "addrs_withscores:USA"
5) "addresses:events"
```
