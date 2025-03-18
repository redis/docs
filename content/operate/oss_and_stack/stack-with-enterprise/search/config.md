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

See [configuration parameters]({{< relref "/develop/interact/search-and-query/administration/configuration" >}}) in the Develop section for parameter details and compatibility with Redis Software and Redis Cloud.
