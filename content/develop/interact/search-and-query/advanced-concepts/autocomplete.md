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
description: Learn how to use the autocomplete feature of Redis for efficient prefix-based search and suggestions.
linkTitle: Autocomplete
title: Autocomplete with Redis
weight: 1
---

## Overview

Redis Query Engine provides an autocomplete feature using suggestions that are stored in a trie-based data structure.
This feature allows you to store and retrieve ranked suggestions based on user input prefixes, making it useful for applications like search boxes, command completion, and chatbot responses.

This guide covers how to use the [`FT.SUGADD`]({{< baseurl >}}/commands/ft.sugadd), [`FT.SUGGET`]({{< baseurl >}}/commands/ft.sugget), [`FT.SUGDEL`]({{< baseurl >}}/commands/ft.sugdel), and [`FT.SUGLEN`]({{< baseurl >}}/commands/ft.suglen) commands to implement autocomplete, and some examples of how you can use suggestions with [`FT.SEARCH`]({{< baseurl >}}/commands/ft.search).

## Add autocomplete suggestions

To add phrases or words–suggestions–to an autocomplete dictionary, use [`FT.SUGADD`]({{< baseurl >}}/commands/ft.sugadd). You will assign a score to each entry, which determines its ranking in the results (higher scores rank first).

```
FT.SUGADD autocomplete "hello world" 100
FT.SUGADD autocomplete "hello there" 90
FT.SUGADD autocomplete "help me" 80
FT.SUGADD autocomplete "hero" 70
```

The use of "autocomplete" in the above examples is just the name of the key. You can use any key name you wish.

## Retrieve suggestions

To get autocomplete suggestions for a given prefix, use [`FT.SUGGET`]({{< baseurl >}}/commands/ft.sugget):

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

The displayed scores will differ from what you used when you added the suggestions. This is because scores are normalized internally.

### Enabling Fuzzy Matching

If you want to allow small spelling mistakes or typos, use the `FUZZY` option:

```sh
FT.SUGGET autocomplete "hr" FUZZY
```

**Response:**
```sh
1) "hero"
```

## Deleting a Suggestion

To remove a specific suggestion from the dictionary:

```sh
FT.SUGDEL autocomplete "hero"
```

After deletion, running `FT.SUGGET autocomplete "he"` will no longer return "hero."

## Checking the Number of Suggestions

To count the number of entries in the autocomplete dictionary:

```sh
FT.SUGLEN autocomplete
```

## Use Cases

The autocomplete feature in Redis Query Engine is useful for:

- **Search box suggestions**: Providing live suggestions as users type.
- **Command completion**: Offering auto-completion for CLI tools.
- **Product search**: Suggesting product names in e-commerce applications.
- **Chatbot responses**: Recommending common phrases dynamically.

## Summary

The autocomplete feature of Redis Query Engine provides a fast and efficient way to implement prefix-based suggestions using a trie-based data structure. By using `FT.SUGADD`, `FT.SUGGET`, `FT.SUGDEL`, and `FT.SUGLEN`, you can build dynamic and ranked suggestion lists tailored to your application's needs.

