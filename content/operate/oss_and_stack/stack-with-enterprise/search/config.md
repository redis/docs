---
Title: Search and query configuration compatibility with Redis Enterprise
alwaysopen: false
categories:
- docs
- operate
- stack
description: Search and query configuration settings supported by Redis Enterprise Software and Redis Cloud.
linkTitle: Configuration
toc: 'false'
weight: 15
---

To configure RediSearch in [Redis Enterprise Software]({{< relref "/operate/rs" >}}) or [Redis Cloud]({{< relref "/operate/rc" >}}), use one of the following methods instead of [`FT.CONFIG SET`]({{< relref "commands/ft.config-set" >}}).

## Configure search in Redis Cloud

For Redis Cloud:

- _Flexible or Annual [subscriptions]({{< relref "/operate/rc/subscriptions" >}})_: contact [support](https://redis.com/company/support/) to request a configuration change.
    
- _Free or Fixed subscriptions_: you cannot change RediSearch configuration.

## Configure search in Redis Software

For Redis Enterprise Software, use one of the following methods:

- Cluster Manager UI:

  1. From the **Databases** list, select the database, then click **Configuration**.

  1. Select the **Edit** button.

  1. In the **Capabilities** section, click **Parameters**.

  1. Enter the setting name and setting value in the **RediSearch** box.
  
      In the **Query Performance Factor** section, you can configure settings to improve query performance. See [Configure the query performance factor for Redis Query Engine in Redis Enterprise]({{<relref "/operate/oss_and_stack/stack-with-enterprise/search/query-performance-factor">}}) for more information.

      {{<image filename="images/rs/screenshots/databases/rs-config-search-params.png" alt="The Parameters dialog includes sections to edit RediSearch settings and the Query Performance Factor settings.">}}

  1. After you finish editing the module's configuration parameters, click **Done** to close the parameter editor.

  1. Click **Save**.

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

## Configuration settings

| Setting | Redis<br />Enterprise | Redis<br />Cloud | Notes |
|:--------|:----------------------|:-----------------|:------|
| [CONCURRENT_WRITE_MODE]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: Not enabled |
| [CURSOR_MAX_IDLE]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 300000 |
| CURSOR_READ_SIZE | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 1000 |
| [DEFAULT_DIALECT]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 1 |
| [EXTLOAD]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: None |
| [FORK_GC_CLEAN_THRESHOLD]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 100 |
| [FORK_GC_RETRY_INTERVAL]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 5 |
| [FORK_GC_RUN_INTERVAL]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 30 |
| [FRISOINI]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: Not set |
| [GC_POLICY]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: FORK |
| [GC_SCANSIZE]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 100 |
| [MAXAGGREGATERESULTS]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Redis Enterprise default: Unlimited<br /><br />Redis Cloud defaults:<br />• Flexible & Annual: Unlimited<br />• Free & Fixed: 10000<br /> | 
| [MAXDOCTABLESIZE]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 1000000 |
| [MAXPREFIXEXPANSIONS]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 200 | 
| [MAXSEARCHRESULTS]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Redis Enterprise default: 1000000<br /><br />Redis Cloud defaults:<br />• Flexible & Annual: 1000000<br />• Free & Fixed: 10000<br /> |
| [MINPREFIX]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 2 |
| [MINSTEMLEN]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 2 |
| [NOGC]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: Not set |
| [ON_TIMEOUT]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: RETURN |
| [OSS_GLOBAL_PASSWORD]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Not supported"><nobr>&#x274c; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> |  |
| [PARTIAL_INDEXED_DOCS]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 0 | 
| [TIMEOUT]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Redis Enterprise default: 500<br /><br />Redis Cloud defaults:<br />• Flexible & Annual: 500<br />• Free & Fixed: 100<br /> |
| UNION_ITERATOR_HEAP| <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> 
| [UPGRADE_INDEX]({{< relref "/develop/interact/search-and-query/basic-constructs/configuration-parameters" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: No default index name |
