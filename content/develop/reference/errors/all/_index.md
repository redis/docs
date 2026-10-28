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
description: Every error message that Redis 8.10 and its built-in features can return, with the commands that return it
linkTitle: All error messages
title: All Redis error messages
weight: 100
---

This section lists every error message that Redis Open Source 8.10 can return to a client. It covers the Redis server, and the features that come with it: vector sets, Redis Search, JSON, probabilistic data types, and time series.

The lists were made from the source code of Redis 8.10.3, Redis Search 8.10.1, JSON 8.10.0, probabilistic data types 8.10.1, and time series 8.10.1. Some of the messages were also checked on a running Redis 8.10.3 server, and each list says how many. Messages can change between versions, so an older or newer server may word an error differently.

How to read the lists:

- A word in angle brackets, such as `<key>`, stands for a part of the message that changes, such as a key name or a number. A few messages also contain angle brackets as part of their text, such as `AUTH <password>`.
- **Explanation** says what causes the error and what to do.
- **Returned by** lists the commands that can return the message. **Several commands** means that many commands share the message, for example, because they check an argument the same way.
- When an error has its own page, a **How to fix it** link follows the explanation.

Errors that only internal or debugging commands return, such as `DEBUG` and `REPLCONF`, aren't listed. Some error codes exist in the source code, but Redis 8.10 never sends them. Their pages explain them, without a list of messages.

To find a message quickly, paste it in the [error lookup](/content/develop/reference/errors/_index.md).
