---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arity: 2
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
- admin
- noscript
- loading
- stale
complexity: O(N). Where N is the number of configured users.
description: Reloads the rules from the configured ACL file.
group: server
hidden: false
linkTitle: ACL LOAD
since: 6.0.0
summary: Reloads the rules from the configured ACL file.
syntax_fmt: ACL LOAD
syntax_str: ''
title: ACL LOAD
---
When Redis is configured to use an ACL file (with the `aclfile` configuration
option), this command will reload the ACLs from the file, replacing all
the current ACL rules with the ones defined in the file. The command makes
sure to have an *all or nothing* behavior, that is:

* If every line in the file is valid, all the ACLs are loaded.
* If one or more line in the file is not valid, nothing is loaded, and the old ACL rules defined in the server memory continue to be used.

## Examples

```
> ACL LOAD
+OK

> ACL LOAD
-ERR /tmp/foo:1: Unknown command or category name in ACL...
```
