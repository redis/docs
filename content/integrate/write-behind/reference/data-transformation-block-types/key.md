---
Title: key
aliases:
- /integrate/redis-data-integration/reference/data-transformation-block-types/key/
- /integrate/redis-data-integration/write-behind/reference/data-transformation-block-types/key/
alwaysopen: false
categories:
  - docs
  - integrate
  - rs
  - rdi
description: Set the Redis key for this data entry
group: di
linkTitle: key
summary:
  Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
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
