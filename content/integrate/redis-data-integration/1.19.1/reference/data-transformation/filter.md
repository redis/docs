---
Title: filter
alwaysopen: false
categories:
  - docs
  - integrate
  - rs
  - rdi
description: Filter records
group: di
linkTitle: filter
summary:
  Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
url: '/integrate/redis-data-integration/1.19.1/reference/data-transformation/filter/'
---

Filter records

**Properties**

| Name           | Type     | Description                                                                                                                                                                                            | Required |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| **expression** | `string` | Expression<br/>                                                                                                                                                                                        | yes      |
| **language**   | `string` | Language<br/>Enum: `"jmespath"`, `"sql"`<br/>                                                                                                                                                          | yes      |
| **cache**      | `object` | Cache the result of the filter expression. See [`cache`](/content/integrate/redis-data-integration/1.19.1/reference/data-transformation/cache.md) for the property list. **Flink processor only.**<br/> | no       |

**Additional Properties:** not allowed

**Example**

```yaml
source:
  schema: dbo
  table: emp
transform:
  - uses: filter
    with:
      language: sql
      expression: age>20
```
