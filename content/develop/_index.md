---
title: Develop with Redis
description: Learn how to develop with Redis
hideListLinks: true
linkTitle: Develop
---

The rest of the landing page.

{{% redis-cli %}}
SET mykey "Hello"
GET mykey

SET anotherkey "will expire in a minute" EX 60
{{% /redis-cli %}}