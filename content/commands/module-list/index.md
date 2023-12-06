---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arity: 2
command_flags:
- admin
- noscript
complexity: O(N) where N is the number of loaded modules.
description: Returns all loaded modules.
group: server
hidden: false
hints:
- nondeterministic_output_order
linkTitle: MODULE LIST
since: 4.0.0
summary: Returns all loaded modules.
syntax_fmt: MODULE LIST
syntax_str: ''
title: MODULE LIST
---
Returns information about the modules loaded to the server.
