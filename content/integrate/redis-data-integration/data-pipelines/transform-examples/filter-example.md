---
Title: Restructure JSON or hash objects
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
linkTitle: Restructure objects
summary: Redis Data Integration keeps Redis in sync with a primary database in near
  real time.
type: integration
weight: 40
---

By default, RDI adds records to the target database for all changed records
in the source. The examples below show how you can select just the specific
records you want using the
[`filter`]({{< relref "/integrate/redis-data-integration/reference/data-transformation/filter" >}})
transformation.

## Simple filtering

Unlike some of the other transformations, a `filter` often uses an expression that
is quite short. The example below removes records from the `employee` table of the
[`chinook`](https://github.com/Redislabs-Solution-Architects/rdi-quickstart-postgres)
database that don't have "Calgary" in the `city` field. The `expression` field
matches the records you want to keep, while all others are discarded.

```yaml
source:
  db: chinook
  table: employee
transform:
  - uses: filter
    with:
      expression: city like 'Calgary'
      language: sql
```

