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
description: Visualize and optimize Redis data
hideListLinks: true
linkTitle: Redis Insight
stack: true
title: Redis Insight
weight: 3
---

[![Discord](https://img.shields.io/discord/697882427875393627?style=flat-square)](https://discord.gg/QUkjSsk)
[![Github](https://img.shields.io/static/v1?label=&message=repository&color=5961FF&logo=github)](https://github.com/redisinsight/redisinsight/)

Redis Insight is a powerful tool for visualizing and optimizing data in Redis or Redis Stack, making real-time application development easier and more fun than ever before. Redis Insight lets you do both GUI- and CLI-based interactions in a fully-featured desktop GUI client.

### Installation and release notes

* See [these pages]({{< relref "/operate/redisinsight/install" >}}) for installation information.

* [Redis Insight Release Notes](https://github.com/Redis-Insight/Redis-Insight/releases)

## Overview

### Connection management

* Automatically discover and add your local Redis or Redis Stack databases (that use standalone connection type and do not require authentication).
* Discover your databases in Redis Enterprise Cluster and databases with Flexible plans in Redis Cloud.
* Use a form to enter your connection details and add any Redis database running anywhere (including Redis Community Edition Cluster or Sentinel).

<img src="images/Databases.png">

{{< note >}}
When you add a Redis database for a particular user using the `username` and `password` fields, that user must be able to run the `INFO` command. See the [access control list (ACL) documentation]({{< relref "/operate/oss_and_stack/management/security/acl" >}}) for more information.
{{< /note >}}

### Redis Copilot

Redis Copilot is an AI-powered developer assistant that helps you learn about Redis, explore your Redis data, and build search queries in a conversational manner. It is available in Redis Insight as well as within the Redis public documentation.

Currently, Redis Copilot provides two primary features: a general chatbot and a context-aware data chatbot.

**General chatbot**: the knowledge-based chatbot serves as an interactive and dynamic documentation interface to simplify the learning process. You can ask specific questions about Redis commands, concepts, and products, and get responses on the fly. The general chatbot is also available in our public docs.

**My data chatbot**: the context-aware chatbot available in Redis Insight lets you construct search queries using everyday language rather than requiring specific programming syntax. This feature lets you query and explore data easily and interactively without extensive technical knowledge.

Here's an example of using Redis Copilot to search data using a simple, natural language prompt.

<img src="images/copilot-example.png">

See the [Redis Insight Copilot FAQ]({{< relref "/develop/connect/insight/copilot-faq" >}}) for more information.

### Browser

Browse, filter and visualize your key-value Redis data structures.
* [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) support for lists, hashes, strings, sets, sorted sets, and streams 
* CRUD support for [JSON]({{< relref "/develop/data-types/json/" >}})
* Group keys according to their namespaces

  <img src="images/Browser.png">

* View, validate, and manage your key values in a human-readable format using formatters that prettify and highlight data in different formats (for example, Unicode, JSON, MessagePack, HEX, and ASCII) in the Browser tool.

  <img src="images/data_formatting.png">

### Profiler

Analyze every command sent to Redis in real time.

<img src="images/Profiler.png">

### CLI

The CLI is accessible at any time within the application. 
* Employs integrated help to deliver intuitive assistance
* Use together with a convenient command helper that lets you search and read on Redis commands.

<img src="images/CLI.png">

### Workbench

Advanced command line interface with intelligent command auto-complete and complex data visualizations.
* Built-in guides: you can conveniently discover Redis and Redis Stack features using the built-in guides.
* Command auto-complete support for all features in Redis and Redis Stack.
* Visualizations of your indexes, queries, and aggregations.
* Visualizations of your [time series]({{< relref "/develop/data-types/timeseries/" >}}) data.

  <img src="images/Workbench_TimeSeries.png">

## Tools

### Database analysis

Use the database analysis tool to optimize the performance and memory usage of your Redis database. Check data type distribution and memory allocation and review the summary of key expiration time and memory to be freed over time. Inspect the top keys and namespaces sorted by consumed memory or key length and count of keys, respectively. Capture and track the changes in your database by viewing historical analysis reports. Next figure shows a sample database analysis report.

<img src="images/database_analysis.png">

### Redis Streams support

Create and manage streams by adding, removing, and filtering entries per timestamp. To see and work with new entries, enable and customize the automatic refresh rate.

View and manage the list of consumer groups. See existing consumers in a given consumer name as well as the last messages delivered to them. Inspect the list of pending messages, explicitly acknowledge the processed items, or claim unprocessed messages via Redis Insight.

<img src="images/streams.png">

### Search features

If you're using Redis Stack's indexing, querying, or full-text search features, Redis Insight provides UI controls to quickly and conveniently run search queries against a preselected index. You can also create a secondary index of your data in a dedicated pane.

<img src="images/search.png">

### Bulk actions

Easily and quickly delete multiple keys of the same type and/or with the same key name pattern in bulk. To do so, in the List or Tree view, set filters per key type or key names and open the Bulk Actions section. The section displays a summary of all the keys with the expected number of keys that will be deleted based on the set filters.

When the bulk deletion is completed, Redis Insight displays the results of this operation with the number of keys processed and the time taken to delete the keys in bulk.
Use bulk deletion to optimize the usage of your database based on the results from the Redis database analysis.

<img src="images/bulk_actions.png">

### Slow Log

The Slow Log tool displays the list of logs captured by the SLOWLOG command to analyze all commands that exceed a specified runtime, which helps with troubleshooting performance issues. Specify both the runtime and the maximum length of Slowlog (which are server configurations) to configure the list of commands logged and set the auto-refresh interval to automatically update the list of commands displayed.

<img src="images/slowlog.png">

## Plugins

With Redis Insight you can now also extend the core functionality by building your own data visualizations. See our [plugin documentation](https://github.com/Redis-Insight/Redis-Insight/wiki/Plugin-Documentation) for more information.

## Telemetry

Redis Insight includes an opt-in telemetry system. This help us improve the developer experience of the app. We value your privacy; all collected data is anonymized.

## Log files

You can review the Redis Insight log files (files with a `.log` extension) to get detailed information about system issues.
These are the locations on supported platforms:

- **Docker**: In the `/data/logs` directory *inside the container*.
- **Mac**: In the `/Users/<your-username>/.redis-insight` directory.
- **Windows**: In the `C:\Users\<your-username>\.redis-insight` directory.
- **Linux**: In the `/home/<your-username>/.redis-insight` directory.

{{< note >}}
You can install Redis Insight on operating systems that are not officially supported, but it may not behave as expected.
{{< /note >}}

## Feedback

To provide your feedback, [open a ticket in our Redis Insight repository](https://github.com/Redis-Insight/Redis-Insight/issues/new).

## License 

Redis Insight is licensed under [SSPL](https://github.com/Redis-Insight/Redis-Insight/blob/main/LICENSE) license.
