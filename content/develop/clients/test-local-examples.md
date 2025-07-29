---
title: "Test Local Examples"
description: "Testing the local code examples feature"
---

# Test Local Examples

This page demonstrates the new local code examples feature that works just like remote examples.

## String Operations

Here's a local example showing string operations:

{{< clients-example local_string_demo incr >}}
> SET mykey "Hello Redis!"
OK
> GET mykey
"Hello Redis!"
> SET counter 10
OK
> INCR counter
(integer) 11
> INCRBY counter 5
(integer) 16
{{< /clients-example >}}

## With Step Highlighting

You can highlight specific steps:

{{< clients-example local_string_demo set_get >}}
> SET mykey "Hello Redis!"
OK
> GET mykey
"Hello Redis!"
{{< /clients-example >}}

## Hash Operations

Here's a local example for hash operations:

{{< clients-example local_hash_demo >}}
> HSET user:1000 name "John Smith"
(integer) 1
> HSET user:1000 email "john@example.com" age 30
(integer) 2
> HGET user:1000 name
"John Smith"
> HGETALL user:1000
1) "name"
2) "John Smith"
3) "email"
4) "john@example.com"
5) "age"
6) "30"
{{< /clients-example >}}

## List Operations (Go only)

This example only has a Go implementation:

{{< clients-example local_list_demo >}}
> LPUSH mylist "world"
(integer) 1
> LPUSH mylist "hello"
(integer) 2
> LRANGE mylist 0 -1
1) "hello"
2) "world"
{{< /clients-example >}}

## Language Filtering

Show only Python examples:

{{< clients-example local_hash_demo hset_hget Python >}}
> SET counter 10
OK
> INCR counter
(integer) 11
{{< /clients-example >}}

## Custom Tab Name and Footer Link

Test custom tab name and footer link (no language filtering so footer shows):

{{< clients-example local_string_demo "" "" "" "REST API" "LangCache API" "/develop/ai/langcache/api-reference" >}}
> SET counter 10
OK
> INCR counter
(integer) 11
{{< /clients-example >}}
