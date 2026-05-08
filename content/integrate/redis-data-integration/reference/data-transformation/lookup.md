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

**Items**

**Item Type:** `string`

**Example**

Denormalize a hash:

```yaml
source:
  table: album
transform:
  - uses: redis.lookup
    with:
      connection: target
      cmd: HGET
      args:
        - concat(['artist:artistid:', artistid])
        - '`name`'
      language: jmespath
      field: artist
output:
  - uses: redis.write
    with:
      connection: target
      data_type: hash
      key:
        expression: concat(['album:albumid:', albumid])
        language: jmespath
```

## args\[\]: Redis command arguments {#args}

The list of expressions that produce arguments.
