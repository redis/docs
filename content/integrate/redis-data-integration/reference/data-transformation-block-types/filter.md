---
Title: filter
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Filter records
group: library
summary: Redis OM for Node.js is an object-mapping library for Redis.
type: integration
weight: '9'
---

Filter records

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
transform:
  - uses: filter
    with:
      language: sql
      expression: age>20
```
