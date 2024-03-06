---
Title: Search and query configuration compatibility with Redis Enterprise
alwaysopen: false
categories:
- docs
- operate
- stack
description: Search and query configuration settings supported by Redis Enterprise.
linkTitle: Configuration
toc: 'false'
weight: 30
---

You cannot use [`FT.CONFIG SET`]({{< relref "/commands" >}}/ft.config-set) to configure RediSearch in [Redis Enterprise Software]({{< relref "/operate/rs" >}}) or [Redis Cloud]({{< relref "/operate/rc" >}}). Instead, use one of the following methods.

For Redis Cloud:

- _Flexible or Annual [subscriptions]({{< relref "/operate/rc/subscriptions" >}})_: contact [support](https://redis.com/company/support/) to request a configuration change.
    
- _Free or Fixed subscriptions_: you cannot change RediSearch configuration.

For Redis Enterprise Software, use either:

- [`rladmin tune db`]({{< relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-db" >}}):

    ```sh
    $ rladmin tune db db:<ID|name> module_name search \
        module_config_params "setting-name setting-value"
    ```

- [Configure module]({{< relref "/operate/rs/references/rest-api/requests/modules/config" >}}) REST API request:

    ```sh
    POST /v1/modules/config/bdb/<ID>
    {
      "modules": [
        {
          "module_name": "search",
          "module_args": "setting-name setting-value"
        }
      ]
    }
    ```

| Setting | Redis<br />Enterprise | Redis<br />Cloud | Notes |
|:--------|:----------------------|:-----------------|:------|
| [CONCURRENT_WRITE_MODE]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#concurrent_write_mode) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: Not enabled |
| [CURSOR_MAX_IDLE]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#cursor_max_idle) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 300000 |
| CURSOR_READ_SIZE | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 1000 |
| [DEFAULT_DIALECT]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#default_dialect) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 1 |
| [EXTLOAD]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#extload) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: None |
| [FORK_GC_CLEAN_THRESHOLD]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#fork_gc_clean_threshold) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 100 |
| [FORK_GC_RETRY_INTERVAL]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#fork_gc_retry_interval) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 5 |
| [FORK_GC_RUN_INTERVAL]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#fork_gc_run_interval) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 30 |
| [FRISOINI]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#frisoini) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: Not set |
| [GC_POLICY]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#gc_policy) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: FORK |
| [GC_SCANSIZE]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#gc_scansize) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 100 |
| [MAXAGGREGATERESULTS]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#maxaggregateresults) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Redis Enterprise default: Unlimited<br /><br />Redis Cloud defaults:<br />• Flexible & Annual: Unlimited<br />• Free & Fixed: 10000<br /> | 
| [MAXDOCTABLESIZE]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#maxdoctablesize) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 1000000 |
| [MAXPREFIXEXPANSIONS]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#maxprefixexpansions) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 200 | 
| [MAXSEARCHRESULTS]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#maxsearchresults) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Redis Enterprise default: 1000000<br /><br />Redis Cloud defaults:<br />• Flexible & Annual: 1000000<br />• Free & Fixed: 10000<br /> |
| [MINPREFIX]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#minprefix) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 2 |
| [NOGC]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#nogc) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: Not set |
| [ON_TIMEOUT]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#on_timeout) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: RETURN |
| [OSS_GLOBAL_PASSWORD]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#oss_global_password) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Not supported"><nobr>&#x274c; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |  |
| [PARTIAL_INDEXED_DOCS]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#partial_indexed_docs) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 0 | 
| [TIMEOUT]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#timeout) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Redis Enterprise default: 500<br /><br />Redis Cloud defaults:<br />• Flexible & Annual: 500<br />• Free & Fixed: 100<br /> |
| UNION_ITERATOR_HEAP| <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> 
| [UPGRADE_INDEX]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/configuring/#upgrade_index) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: No default index name |
