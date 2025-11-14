---
Title: Module object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents a Redis module
linkTitle: module
weight: $weight
---

Represents a [Redis module]({{< relref "/operate/oss_and_stack/stack-with-enterprise" >}}).

| Name | Type/Value | Description |
|------|------------|-------------|
| uid | string | Cluster unique ID of module |
| author | string | Module creator |
| bigstore_version_2_support | boolean (default: false) | Whether the module supports bigstore_version_2 capability, bypassing capability validation (optional) |
| capabilities | array of strings | List of capabilities supported by this module |
| capability_name | string | Short description of module functionality |
| command_line_args | string | Command line arguments passed to the module |
| compatible_redis_version | string | Redis version required by this module |
| config_command | string | Name of command to configure module arguments at runtime |
| crdb | CRDB object | CRDB-related information about the module<br />CRDB object fields:<br />**supported_featureset_versions**: array of integers |
| dependencies | dependencies object | Module dependencies |
| description | string | Short description of the module |
| display_name | string | Name of module for display purposes |
| email | string | Author's email address |
| homepage | string | Module's homepage |
| is_bundled | boolean | Whether module came bundled with a version of Redis Enterprise |
| license | string | Module is distributed under this license |
| min_redis_version | string | Minimum Redis database version required by this module. Only relevant for Redis databases earlier than v7.4. |
| module_file | string | Module filename |
| module_name | string | Module's name<br />Values:<br />`search`<br />`ReJSON`<br />`timeseries`<br />`bf` |
| semantic_version | string | Module's semantic version |
| sha256 | string | SHA256 of module binary (deprecated) |
| version | integer | Module's version |
