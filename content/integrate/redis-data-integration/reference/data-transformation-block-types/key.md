---
Title: key
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Set the Redis key for this data entry
group: library
summary: Redis OM for Node.js is an object-mapping library for Redis.
type: integration
weight: '9'
---

Set the Redis key for this data entry

**Properties**

| Name           | Type     | Description                                   | Required |
| -------------- | -------- | --------------------------------------------- | -------- |
| **expression** | `string` | Expression<br/>                               | yes      |
| **language**   | `string` | Language<br/>Enum: `"jmespath"`, `"sql"`<br/> | yes      |

**Additional Properties:** not allowed

**Example**

```yaml
source:
  server_name: redislabs
  schema: dbo
  table: emp
key:
  expression: concat([InvoiceId, '.', CustomerId])
  language: jmespath
```
