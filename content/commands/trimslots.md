---
acl_categories:
- '@keyspace'
- '@write'
- '@slow'
- '@dangerous'
arguments:
- arguments:
  - display_text: numranges
    name: numranges
    type: integer
  - arguments:
    - display_text: startslot
      name: startslot
      type: integer
    - display_text: endslot
      name: endslot
      type: integer
    multiple: true
    name: slots
    type: block
  name: ranges
  token: RANGES
  type: block
arity: -5
command_flags:
- write
complexity: O(N) where N is the total number of keys in all databases
group: server
since: 8.4.0
summary: Trim the keys that belong to specified slots.
syntax_fmt: "TRIMSLOTS RANGES\_numranges startslot endslot [startslot endslot ...]"
syntax_str: ''
---
