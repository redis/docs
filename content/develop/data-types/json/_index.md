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
description: JSON support for Redis
linkTitle: JSON
stack: true
title: JSON
weight: 11
---

[![Discord](https://img.shields.io/discord/697882427875393627?style=flat-square)](https://discord.gg/QUkjSsk)
[![Github](https://img.shields.io/static/v1?label=&message=repository&color=5961FF&logo=github)](https://github.com/RedisJSON/RedisJSON/)

<<<<<<< HEAD
The JSON capability of Redis Open Source provides JavaScript Object Notation (JSON) support for Redis. It lets you store, update, and retrieve JSON values in a Redis database, similar to any other Redis data type. Redis JSON also works seamlessly with the [Redis Query Engine]({{< relref "/develop/interact/search-and-query/" >}}) to let you [index and query JSON documents]({{< relref "/develop/interact/search-and-query/indexing/" >}}).
=======
The JSON data type provides JavaScript Object Notation (JSON) support for Redis. It lets you store, retrieve, and update JSON documents. 
A JSON document can be queried and manipulated using JSONPath expressions.
JSON also works seamlessly with the [Redis Query Engine]({{< relref "/develop/interact/search-and-query/" >}}) to let you [index and query JSON documents]({{< relref "/develop/interact/search-and-query/indexing/" >}}).
>>>>>>> main

## Primary features

* Full support for the JSON standard
* A [JSONPath](http://goessner.net/articles/JsonPath/) syntax for selecting/updating elements inside documents (see [JSONPath syntax]({{< relref "/develop/data-types/json/path#jsonpath-syntax" >}}))
* Documents stored as binary data in a tree structure, allowing fast access to sub-elements
* Typed atomic operations for all JSON value types

## Use Redis with JSON

The first JSON command to try is [`JSON.SET`]({{< relref "commands/json.set/" >}}), which sets a Redis key with a JSON value. [`JSON.SET`]({{< relref "commands/json.set/" >}}) accepts all JSON value types. This example creates a JSON string:

{{< clients-example json_tutorial set_get >}}
> JSON.SET bike $ '"Hyperion"'
OK
> JSON.GET bike $
"[\"Hyperion\"]"
> JSON.TYPE bike $
1) "string"
{{< /clients-example >}}

Note how the commands include the dollar sign character `$`. This is the [path]({{< relref "/develop/data-types/json/path" >}}) to the value in the JSON document (in this case it just means the root).

Here are a few more string operations. [`JSON.STRLEN`]({{< relref "commands/json.strlen/" >}}) tells you the length of the string, and you can append another string to it with [`JSON.STRAPPEND`]({{< relref "commands/json.strappend/" >}}).

{{< clients-example json_tutorial str>}}
> JSON.STRLEN bike $
1) (integer) 8
> JSON.STRAPPEND bike $ '" (Enduro bikes)"'
1) (integer) 23
> JSON.GET bike $
"[\"Hyperion (Enduro bikes)\"]"
{{< /clients-example >}}

Numbers can be [incremented]({{< relref "commands/json.numincrby/" >}}) and [multiplied]({{< relref "commands/json.nummultby/" >}}):

{{< clients-example json_tutorial num >}}
> JSON.SET crashes $ 0
OK
> JSON.NUMINCRBY crashes $ 1
"[1]"
> JSON.NUMINCRBY crashes $ 1.5
"[2.5]"
> JSON.NUMINCRBY crashes $ -0.75
"[1.75]"
> JSON.NUMMULTBY crashes $ 24
"[42]"
{{< /clients-example >}}

Here's a more interesting example that includes JSON arrays and objects:

{{< clients-example json_tutorial arr >}}
> JSON.SET newbike $ '["Deimos", {"crashes": 0}, null]'
OK
> JSON.GET newbike $
"[[\"Deimos\",{\"crashes\":0},null]]"
> JSON.GET newbike $[1].crashes
"[0]"
> JSON.DEL newbike $[-1]
(integer) 1
> JSON.GET newbike $
"[[\"Deimos\",{\"crashes\":0}]]"
{{< /clients-example >}}

The [`JSON.DEL`]({{< relref "commands/json.del/" >}}) command deletes any JSON value you specify with the `path` parameter.

You can manipulate arrays with a dedicated subset of JSON commands:

{{< clients-example json_tutorial arr2 >}}
> JSON.SET riders $ []
OK
> JSON.ARRAPPEND riders $ '"Norem"'
1) (integer) 1
> JSON.GET riders $
"[[\"Norem\"]]"
> JSON.ARRINSERT riders $ 1 '"Prickett"' '"Royce"' '"Castilla"'
1) (integer) 4
> JSON.GET riders $
"[[\"Norem\",\"Prickett\",\"Royce\",\"Castilla\"]]"
> JSON.ARRTRIM riders $ 1 1
1) (integer) 1
> JSON.GET riders $
"[[\"Prickett\"]]"
> JSON.ARRPOP riders $
1) "\"Prickett\""
> JSON.ARRPOP riders $
1) (nil)
{{< /clients-example >}}

JSON objects also have their own commands:

{{< clients-example json_tutorial obj >}}
> JSON.SET bike:1 $ '{"model": "Deimos", "brand": "Ergonom", "price": 4972}'
OK
> JSON.OBJLEN bike:1 $
1) (integer) 3
> JSON.OBJKEYS bike:1 $
1) 1) "model"
   2) "brand"
   3) "price"
{{< /clients-example >}}

## Format CLI output

The CLI has a raw output mode that lets you add formatting to the output from
[`JSON.GET`]({{< relref "commands/json.get/" >}}) to make
it more readable. To use this, run `redis-cli` with the `--raw` option
and include formatting keywords such as `INDENT`, `NEWLINE`, and `SPACE`
with [`JSON.GET`]({{< relref "commands/json.get/" >}}):

```bash
$ redis-cli --raw
> JSON.GET obj INDENT "\t" NEWLINE "\n" SPACE " " $
[
	{
		"name": "Leonard Cohen",
		"lastSeen": 1478476800,
		"loggedOut": true
	}
]
```

## Enable Redis JSON

The Redis JSON data type is part of Redis Open Source and it is also available in Redis Software and Redis Cloud.
See
[Install Redis Open Source]({{< relref "/operate/oss_and_stack/install/install-stack" >}}) or
[Install Redis Enterprise]({{< relref "/operate/rs/installing-upgrading/install" >}})
for full installation instructions.

## Limitation

A JSON value passed to a command can have a depth of up to 128. If you pass to a command a JSON value that contains an object or an array with a nesting level of more than 128, the command returns an error.

## Further information

Read the other pages in this section to learn more about Redis JSON
