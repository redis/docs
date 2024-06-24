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

The JSON capability of Redis Stack provides JavaScript Object Notation (JSON) support for Redis. It lets you store, update, and retrieve JSON values in a Redis database, similar to any other Redis data type. Redis JSON also works seamlessly with [Search and Query]({{< relref "/develop/interact/search-and-query/" >}}) to let you [index and query JSON documents]({{< relref "/develop/interact/search-and-query/indexing/" >}}).

## Primary features

* Full support for the JSON standard
* A [JSONPath](http://goessner.net/articles/JsonPath/) syntax for selecting/updating elements inside documents (see [JSONPath syntax]({{< relref "/develop/data-types/json/path#jsonpath-syntax" >}}))
* Documents stored as binary data in a tree structure, allowing fast access to sub-elements
* Typed atomic operations for all JSON value types

## Use Redis with JSON

The first JSON command to try is [`JSON.SET`]({{< baseurl >}}/commands/json.set/), which sets a Redis key with a JSON value. [`JSON.SET`]({{< baseurl >}}/commands/json.set/) accepts all JSON value types. This example creates a JSON string:

{{< clients-example json_tutorial set_get >}}
> JSON.SET bike $ '"Hyperion"'
OK
> JSON.GET bike $
"[\"Hyperion\"]"
> JSON.TYPE bike $
1) "string"
{{< /clients-example >}}

Note how the commands include the dollar sign character `$`. This is the [path]({{< relref "/develop/data-types/json/path" >}}) to the value in the JSON document (in this case it just means the root).

Here are a few more string operations. [`JSON.STRLEN`]({{< baseurl >}}/commands/json.strlen/) tells you the length of the string, and you can append another string to it with [`JSON.STRAPPEND`]({{< baseurl >}}/commands/json.strappend/).

{{< clients-example json_tutorial str>}}
> JSON.STRLEN bike $
1) (integer) 8
> JSON.STRAPPEND bike $ '" (Enduro bikes)"'
1) (integer) 23
> JSON.GET bike $
"[\"Hyperion (Enduro bikes)\"]"
{{< /clients-example >}}

Numbers can be [incremented]({{< baseurl >}}/commands/json.numincrby/) and [multiplied]({{< baseurl >}}/commands/json.nummultby/):

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

The [`JSON.DEL`]({{< baseurl >}}/commands/json.del/) command deletes any JSON value you specify with the `path` parameter.

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
[`JSON.GET`]({{< baseurl >}}/commands/json.get/) to make
it more readable. To use this, run `redis-cli` with the `--raw` option
and include formatting keywords such as `INDENT`, `NEWLINE`, and `SPACE`
with [`JSON.GET`]({{< baseurl >}}/commands/json.get/):

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

Redis JSON is implemented as a module that extends the basic Redis server.
Redis Stack and Redis Enterprise include this module by default but you can
also load it dynamically if it isn't already available. The sections below
the different ways you can access Redis JSON.

### Run with Docker

To run RedisJSON with Docker, use the `redis-stack-server` Docker image:

```sh
$ docker run -d --name redis-stack-server -p 6379:6379 redis/redis-stack-server:latest
```

For more information about running Redis Stack in a Docker container, see [Run Redis Stack on Docker]({{< relref "/operate/oss_and_stack/install/install-stack/docker" >}}).

### Download binaries

To download and run the RedisJSON module that provides the JSON data structure from a precompiled binary:

1. Download a precompiled version from the [Redis download center](https://redis.io/downloads).

2. Load the module it in Redis

    ```sh
    $ redis-server --loadmodule /path/to/module/src/rejson.so
    ```

### Build from source

To build RedisJSON from the source code:

1. Clone the [repository](https://github.com/RedisJSON/RedisJSON) (make sure you include the `--recursive` option to properly clone submodules):

    ```sh
    $ git clone --recursive https://github.com/RedisJSON/RedisJSON.git
    $ cd RedisJSON
    ```

2. Install dependencies:

    ```sh
    $ ./sbin/setup
    ```

3. Build:
    ```sh
    $ make build
    ```

### Load the module to Redis

Requirements:

Generally, it is best to run the latest Redis version.

If your OS has a [Redis 6.x package or later](http://redis.io/downloads), you can install it using the OS package manager.

Otherwise, you can invoke 

```sh
$ ./deps/readies/bin/getredis
```

To load the RedisJSON module, use one of the following methods:

* [Makefile recipe](#makefile-recipe)
* [Configuration file](#configuration-file)
* [Command-line option](#command-line-option)
* [MODULE LOAD command]({{< relref "/commands/module-load" >}})

#### Makefile recipe

Run Redis with RedisJSON:

```sh
$ make run
```

#### Configuration file

Or you can have Redis load the module during startup by adding the following to your `redis.conf` file:

```
loadmodule /path/to/module/target/release/librejson.so
```

On Mac OS, if this module was built as a dynamic library, run:

```
loadmodule /path/to/module/target/release/librejson.dylib
```

In the above lines replace `/path/to/module/` with the actual path to the module.

#### Command-line option

You can also have Redis load the module using the following command-line argument syntax:

 ```bash
 $ redis-server --loadmodule /path/to/module/librejson.so
 ```

In the above lines replace `/path/to/module/` with the actual path to the module's library.

#### [`MODULE LOAD`]({{< relref "/commands/module-load" >}}) command

You can also use the [`MODULE LOAD`]({{< relref "/commands/module-load" >}}) command to load RedisJSON. Note that [`MODULE LOAD`]({{< relref "/commands/module-load" >}}) is a **dangerous command** and may be blocked/deprecated in the future due to security considerations.

After the module has been loaded successfully, the Redis log should have lines similar to:

```
...
9:M 11 Aug 2022 16:24:06.701 * <ReJSON> version: 20009 git sha: d8d4b19 branch: HEAD
9:M 11 Aug 2022 16:24:06.701 * <ReJSON> Exported RedisJSON_V1 API
9:M 11 Aug 2022 16:24:06.701 * <ReJSON> Enabled diskless replication
9:M 11 Aug 2022 16:24:06.701 * <ReJSON> Created new data type 'ReJSON-RL'
9:M 11 Aug 2022 16:24:06.701 * Module 'ReJSON' loaded from /opt/redis-stack/lib/rejson.so
...
```

## Limitation

A JSON value passed to a command can have a depth of up to 128. If you pass to a command a JSON value that contains an object or an array with a nesting level of more than 128, the command returns an error.

## Further information

Read the other pages in this section to learn more about Redis JSON