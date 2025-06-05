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
description: Learn how to use the autocomplete feature of Redis for efficient prefix-based suggestion retrieval.
linkTitle: Autocomplete
title: Autocomplete with Redis
weight: 1
---

## Overview

Redis Query Engine provides an autocomplete feature using suggestions that are stored in a [trie-based](https://en.wikipedia.org/wiki/Trie) data structure.
This feature allows you to store and retrieve ranked suggestions based on user input prefixes, making it useful for applications like search boxes, command completion, and chatbot responses.

This guide covers how to use the [`FT.SUGADD`]({{< relref "/commands/ft.sugadd" >}}), [`FT.SUGGET`]({{< relref "/commands/ft.sugget" >}}), [`FT.SUGDEL`]({{< relref "/commands/ft.sugdel" >}}), and [`FT.SUGLEN`]({{< relref "/commands/ft.suglen" >}}) commands to implement autocomplete, and some examples of how you can use these commands with [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}).

## Add autocomplete suggestions

To add phrases or words to a suggestions dictionary, use the [`FT.SUGADD`]({{< relref "/commands/ft.sugadd" >}}) command.
You will assign a score to each entry, which determines its ranking in the results.

```
FT.SUGADD autocomplete "hello world" 100
FT.SUGADD autocomplete "hello there" 90
FT.SUGADD autocomplete "help me" 80
FT.SUGADD autocomplete "hero" 70
```

Integer scores were used in the above examples, but the scores argument is described as being floating point.
Integer scores are converted to floating point internally.
Also, "`autocomplete`" in the above examples is just the name of the key; you can use any key name you wish.

### Optional arguments

The `FT.SUGADD` command can take two optional arguments:

* `INCR`: increments the existing entry of the suggestion by the given score instead of replacing the score. This is useful for updating the dictionary based on user queries in real time.
* `PAYLOAD`: saves a string with the suggestion, which can be fetched by adding the `WITHPAYLOADS` argument to `FT.SUGGET`.

## Retrieve suggestions

To get autocomplete suggestions for a given prefix, use the [`FT.SUGGET`]({{< relref "/commands/ft.sugget" >}}) command.

```
redis> FT.SUGGET autocomplete "he"
1) "hero"
2) "help me"
3) "hello world"
4) "hello there"
```

If you wish to see the scores, use the `WITHSCORES` option:

```
redis> FT.SUGGET autocomplete "he" WITHSCORES
1) "hero"
2) "40.414520263671875"
3) "help me"
4) "32.65986251831055"
5) "hello world"
6) "31.62277603149414"
7) "hello there"
8) "28.460498809814453"
```

### Enable fuzzy matching

If you want to allow for small spelling mistakes or typos, use the `FUZZY` option. This option performs a fuzzy prefix search, including prefixes at a [Levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance) of 1 from the provided prefix.

```
redis> FT.SUGGET autocomplete hell FUZZY
1) "hello world"
2) "hello there"
3) "help me"
```

### Optional arguments

There are three additional arguments you can use with `FT.SUGGET`:

* `MAX num`: limits the results to a maximum of `num`. The default for `MAX` is 5.
* `WITHSCORES`: returns the score of each suggestion.
* `WITHPAYLOADS`: returns optional payloads saved with the suggestions. If no payload is present for an entry, a `nil` reply is returned.
    ```
    redis> FT.SUGADD autocomplete hero 70 PAYLOAD "you're no hero"
    (integer) 4
    redis> FT.SUGGET autocomplete "hr" FUZZY WITHPAYLOADS
    1) "hero"
    2) "you're no hero"
    3) "help me"
    4) (nil)
    5) "hello world"
    6) (nil)
    7) "hello there"
    8) (nil)
    ```

## Delete suggestions

To remove a specific suggestion from the dictionary, use the `FT.SUGDEL` command.

```
redis> FT.SUGDEL autocomplete "help me"
(integer 1)
```

After deletion, running `FT.SUGGET autocomplete hell FUZZY` will no longer return "help me".

## Check the number of suggestions

To get a count of the number of entries in a given suggestions dictionary, use the `FT.SUGLEN` command.

```
redis> FT.SUGLEN autocomplete
(integer) 3
```

## Use autocomplete with search

A common approach is to:

1. Use FT.SUGGET to suggest query completions as users type in a text field.
1. Once the user selects a suggestion, run FT.SEARCH using the selected term to get full search results.

Example workflow

1. Get suggestions for a given user input.

    ```
    FT.SUGGET autocomplete "hel"
    ```
1. Capture the user's selection.
1. Use the selected suggestion in a full-text search.

    ```
    FT.SEARCH index "hello world"
    ```

### When to use autocomplete versus full-text search

* Use `FT.SUGGET` when you need fast, real-time prefix-based suggestion retrieval.
* Use `FT.SEARCH` when you need document retrieval, filtering, and ranking based on relevance.

## Autocomplete use cases

The autocomplete feature in Redis Query Engine is useful for:

- **Search box suggestions**: providing live suggestions as users type.
- **Command completion**: offering autocompletion for CLI tools.
- **Product search**: suggesting product names in e-commerce applications.
- **Chatbot responses**: recommending common phrases dynamically.
