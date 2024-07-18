---
Title: RedisGears Python plugin
alwaysopen: false
categories:
- docs
- operate
- stack
description: The RedisGears Python plugin allows you to run RedisGears functions with
  Python.
hideListLinks: true
linkTitle: Run with Python
weight: 71
---

With the RedisGears Python plugin, you can write RedisGears functions in [Python](https://www.python.org/) and run them on a [Redis Enterprise]({{< relref "/operate/rs/" >}}) cluster.

The Python plugin allows both batch processing and event-driven processing.

Before you can run RedisGears with Python, you will need to [install the RedisGears module and the Python plugin]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/installing-redisgears#install-redisgears" >}}) on your Redis Enterprise cluster and [enable them for your database]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/python/install" >}}).

Once you have written your code, upload it to a node on your Redis Enterprise cluster. Use the `RG.PYEXECUTE` command with the `redis-cli` command-line tool to run your code.

## More info

- [RedisGears Python quick start]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/python/quickstart" >}})
- [RedisGears recipes]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/python/recipes" >}})