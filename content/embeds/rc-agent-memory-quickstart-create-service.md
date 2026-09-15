1. Sign in to the [Redis Cloud console](https://cloud.redis.io/).
1. Select **Agent Memory** from the navigation menu.
1. If Redis Cloud displays the public preview terms, review and accept them.
1. Select **Create custom service**.
1. Enter a service name, select an eligible database, and select its `default` user.
1. Under **Memory configuration**, enter these values:

    | Setting | Value | What it controls |
    |:--------|:------|:-----------------|
    | **Short-term TTL** | `1` day | How long session memory is retained. |
    | **Long-term TTL** | `365` days | How long long-term memories are retained. |
    | **Extraction cadence** | `1` minute | How often session events are processed for extraction. One minute is for this quickstart; use a longer production interval unless you need rapid extraction. |

1. Select **Create**.
1. Copy the Redis Agent Memory API key and store it securely.

{{< warning >}}
Redis Cloud displays the Redis Agent Memory API key only once. If you lose it, [generate a new API key]({{< relref "/operate/iris/agent-memory/view-service#replace-service-api-key" >}}).
{{< /warning >}}

The one-minute extraction interval makes the result easier to observe in this example. For screenshots and configuration details, see [create a Redis Agent Memory service]({{< relref "/operate/iris/agent-memory/create-service" >}}).
