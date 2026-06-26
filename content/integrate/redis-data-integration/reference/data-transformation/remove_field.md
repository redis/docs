---
Title: remove_field
aliases: /integrate/redis-data-integration/ingest/reference/data-transformation/remove_field/
alwaysopen: false
categories:
  - docs
  - integrate
  - rs
  - rdi
description: Remove fields
group: di
linkTitle: remove_field
summary:
  Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

Remove fields

**Option 1 (alternative):**
Remove multiple fields

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
  - uses: remove_field
    with:
      fields:
        - field: credit_card
        - field: name.mname
```

**Option 2 (alternative):**
Remove one field

**Properties**

| Name      | Type     | Description | Required |
| --------- | -------- | ----------- | -------- |
| **field** | `string` | Field<br/>  | yes      |

**Additional Properties:** not allowed  
**Example**

```yaml
source:
  schema: dbo
  table: emp
transform:
  - uses: remove_field
    with:
      field: credit_card
```

<a name="option1fields"></a>

## Option 1: fields\[\]: array

Fields

**Items**

**Item Properties**

| Name      | Type     | Description | Required |
| --------- | -------- | ----------- | -------- |
| **field** | `string` | Field<br/>  | yes      |

**Item Additional Properties:** not allowed

**Example**

```yaml
- {}
```
