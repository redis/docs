---
Title: Proxy object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents a proxy in the cluster
linkTitle: proxy
weight: $weight
url: '/operate/rs/7.8/references/rest-api/objects/proxy/'
---

An API object that represents a [proxy](https://en.wikipedia.org/wiki/Proxy_server) in the cluster.

| Name | Type/Value | Description |
|------|------------|-------------|
| uid | integer | Unique ID of the proxy (read-only) |
| backlog | integer | TCP listen queue backlog |
| client_keepcnt | integer | Client TCP keepalive count |
| client_keepidle | integer | Client TCP keepalive idle |
| client_keepintvl | integer | Client TCP keepalive interval |
| conns | integer | Number of connections |
| duration_usage_threshold | integer, <nobr>(range: 10-300)</nobr> | Max number of threads |
| dynamic_threads_scaling | boolean | Automatically adjust the number of threads|
| ignore_bdb_cconn_limit | boolean | Ignore client connection limits |
| ignore_bdb_cconn_output_buff_limits | boolean | Ignore buffer limit |
| log_level | `crit`<br />`error`<br />`warn`<br />`info`<br />`trace`<br />`debug` | Minimum log level to log. Only logs with this level or greater will be logged. |
| max_listeners | integer | Max number of listeners |
| max_servers | integer | Max number of Redis servers |
| max_threads | integer, <nobr>(range: 1-256)</nobr> | Max number of threads |
| max_worker_client_conns | integer | Max client connections per thread |
| max_worker_server_conns | integer | Max server connections per thread |
| max_worker_txns | integer | Max in-flight transactions per thread |
| threads | integer, <nobr>(range: 1-256)</nobr> | Number of threads |
| threads_usage_threshold | integer, <nobr>(range: 50-99)</nobr> | Max number of threads |
