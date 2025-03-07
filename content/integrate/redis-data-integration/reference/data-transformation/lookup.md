---
Title: redis.lookup
alwaysopen: false
categories:
  - docs
  - integrate
  - rs
  - rdi
description: Lookup data from Redis using the given command and key
group: di
linkTitle: redis.lookup
summary:
  Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

**Properties**

| Name              | Type       | Description                                   | Required |
| ----------------- | ---------- | --------------------------------------------- | -------- |
| **connection**    | `string`   | Connection name                               | yes      |
| **cmd**           | `string`   | The command to execute                        | yes      |
| [**args**](#args) | `string[]` | Redis command arguments                       | yes      |
| **language**      | `string`   | Language<br/>Enum: `"jmespath"`, `"sql"`<br/> | yes      |
| **field**         | `string`   | The target field to write the result to<br/>  | yes      |

**Additional Properties:** not allowed

## args\[\]: Redis command arguments {#args}

The list of expressions that produce arguments.

**Items**

**Item Type:** `string`
