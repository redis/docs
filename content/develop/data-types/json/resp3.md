---
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
description: JSON RESP2 to RESP3 replies reference for client developers
linkTitle: RESP3 migration guide
title: Guide for migrating from RESP2 to RESP3 replies
weight: 6
---

In RESP3, the default value of the optional path argument was changed from `.` to `$`. 
Due to this change, the replies of some commands have slightly changed. 
This page provides a brief comparison between RESP2 and RESP3 responses for JSON commands to help developers in migrating their clients from RESP2 to RESP3.

### JSON command replies comparison 

The types are described using a ["TypeScript-like" syntax](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html). `Array<a>` denotes an [array](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#arrays) where the type of elements is known, but the number of elements is not.

| Command                                                                                                                                                 | RESP2                                                                                                                                                                                            | RESP3                                                                                                                                                                                                               |
|---------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| All JSON commands                                                                                                                                       | **Default value of optional `path` argument**: `.`                                                                                                                                               | **Default value of optional `path` argument:** `$`                                                                                                                                                                  |
| JSON.ARRAPPEND<br/>JSON.ARRINDEX<br/>JSON.ARRINSERT<br/>JSON.ARRLEN<br/>JSON.ARRTRIM<br/>JSON.OBJLEN<br/>JSON.STRAPPEND<br/>JSON.STRLEN<br/>JSON.TOGGLE | *`$`-based path argument:* <br/> Reply: Array\<BulkString &#124; null> <br/><br/> *`.`-based path argument :*&nbsp;<br/> Reply: BulkString                                                       | *`$`-based path argument:*&nbsp; <br/> Reply: Array\<number &#124; null> <br/><br/> *`.`-based path argument :* <br/> Reply: number                                                                                 |
| JSON.GET                                                                                                                                                | Reply: JSON encoded string  <br/> Example: <br/> ```> JSON.SET k $ "[1,2,3]"```<br/> ```> JSON.GET k```<br/>```"[1,2,3]"```                                                                      | Reply: JSON encoded string with a top-level array  <br/> Example: <br/> ```> JSON.SET k $ "[1,2,3]"```<br/> ```> JSON.GET k```<br/>```"[[1,2,3]]"```                                                                |
| JSON.NUMINCRBY<br/>JSON.NUMMULTBY                                                                                                                       | *`$`-based path argument:* <br/> Reply: JSON-encoded BulkString &#124; null <br/><br/> *`.`-based path argument :*&nbsp;<br/> Reply: BulkString &#124; null &#124; error                         | *`$`-based path argument:* <br/> Reply: Array\<number &#124;  null> &#124; error <br/><br/> *`.`-based path argument :*&nbsp;<br/> Reply: number &#124;  null &#124; error                                          |
| JSON.OBJKEYS                                                                                                                                            | *`$`-based path argument:* <br/> Reply: Array\<Array\<BulkString\>> <br/><br/> *`.`-based path argument :*&nbsp;<br/> Reply: Array\<BulkString>                                                  | *`$`-based path argument:* <br/> Reply: Array\<Array\<BulkString\>> <br/><br/> *`.`-based path argument :*&nbsp;<br/> Reply: Array\<BulkString>                                                                     |
| JSON.TYPE                                                                                                                                               | *`$`-based path argument:* <br/> Reply: Array\<BulkString\> <br/> Example: <br />```> JSON.TYPE k $```<br />```1) "array"``` <br/><br/> *`.`-based path argument :*&nbsp;<br/> Reply: BulkString | *`$`-based path argument:* <br/> Reply: Array\<Array\<BulkString\>> <br/> Example: <br />```> JSON.TYPE k $```<br />```1) 1) "array"``` <br/><br/> *`.`-based path argument :*&nbsp;<br/> Reply: Array\<BulkString> |
