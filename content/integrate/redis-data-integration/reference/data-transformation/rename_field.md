---
Title: rename_field
aliases: /integrate/redis-data-integration/ingest/reference/data-transformation/rename_field/
alwaysopen: false
categories:
  - docs
  - integrate
  - rs
  - rdi
description: Rename fields. All other fields remain unchanged.
group: di
linkTitle: rename_field
summary:
  Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

Rename fields. All other fields remain unchanged.

**Option 1 (alternative):**
Rename multiple fields

**Properties**

| Name                         | Type       | Description | Required |
| ---------------------------- | ---------- | ----------- | -------- |
| [**fields**](#option1fields) | `object[]` | Fields<br/> | yes      |

**Additional Properties:** not allowed  
**Example**

```yaml
source:
  schema: dbo
  table: emp
transform:
  - uses: rename_field
    with:
      fields:
        - from_field: name.lname
          to_field: name.last_name
        - from_field: name.fname
          to_field: name.first_name
```

**Option 2 (alternative):**
Rename one field

**Properties**

| Name           | Type     | Description     | Required |
| -------------- | -------- | --------------- | -------- |
| **from_field** | `string` | From field<br/> | yes      |
| **to_field**   | `string` | To field<br/>   | yes      |

**Additional Properties:** not allowed

**Example**

```yaml
source:
  schema: dbo
  table: emp
transform:
  - uses: rename_field
    with:
      from_field: name.lname
      to_field: name.last_name
```

<a name="option1fields"></a>

## Option 1: fields\[\]: array

Fields

**Items**

**Item Properties**

| Name           | Type     | Description     | Required |
| -------------- | -------- | --------------- | -------- |
| **from_field** | `string` | From field<br/> | yes      |
| **to_field**   | `string` | To field<br/>   | yes      |

**Item Additional Properties:** not allowed

**Example**

```yaml
- {}
```
