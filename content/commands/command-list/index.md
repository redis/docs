---
acl_categories:
- '@slow'
- '@connection'
arguments:
- arguments:
  - display_text: module-name
    name: module-name
    token: MODULE
    type: string
  - display_text: category
    name: category
    token: ACLCAT
    type: string
  - display_text: pattern
    name: pattern
    token: PATTERN
    type: pattern
  name: filterby
  optional: true
  token: FILTERBY
  type: oneof
arity: -2
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
command_flags:
- loading
- stale
complexity: O(N) where N is the total number of Redis commands
description: Returns a list of command names.
group: server
hidden: false
hints:
- nondeterministic_output_order
linkTitle: COMMAND LIST
since: 7.0.0
summary: Returns a list of command names.
syntax_fmt: "COMMAND LIST [FILTERBY\_<MODULE\_module-name | ACLCAT\_category |\n \
  \ PATTERN\_pattern>]"
syntax_str: ''
title: COMMAND LIST
---
Return an array of the server's command names.

You can use the optional _FILTERBY_ modifier to apply one of the following filters:

 - **MODULE module-name**: get the commands that belong to the module specified by _module-name_.
 - **ACLCAT category**: get the commands in the [ACL category]({{< baseurl >}}/operate/oss_and_stack/management/security/acl#command-categories) specified by _category_.
 - **PATTERN pattern**: get the commands that match the given glob-like _pattern_.
