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
    | **Automatic summarization** | Enabled | Whether older session events are condensed into a summary. |
    | **Summarize after (messages)** | `6` | The event count that triggers summarization. Six is for this quickstart; use a higher production threshold. |
    | **Keep most recent (messages)** | `2` | How many recent events remain in full. Two is for this quickstart; retain more in production when recent turns are needed. |

1. Under **Memory types & extraction**, select **Add type** and configure this custom memory type:

    | Setting | Value | What it controls |
    |:--------|:------|:-----------------|
    | **Name** | `trip_preference` | The identifier stored in `memoryType` and used in search filters. |
    | **Description** | `Structured requirements for a planned trip` | The purpose of the custom memory type. |
    | **Extraction prompt** | `Extract trip requirements only when the user states a destination or travel plan. Preserve explicit dietary requirements and food preferences.` | When to create the memory and which information to capture. |
    | **Enabled** | Enabled | Whether new memories of this type are extracted. |

1. Add these custom fields:

    | Field | Type | Description |
    |:------|:-----|:------------|
    | `destinations` | `list[str]` | Cities or countries the user plans to visit. |
    | `travel_period` | `str` | When the user plans to travel. |
    | `dietary_requirements` | `list[str]` | Dietary requirements that affect recommendations. |
    | `food_preferences` | `list[str]` | Cuisines, flavors, or dining preferences stated by the user. |

1. Under **Sensitive-data exclusions**, enable **Semantic exclusions** and enter this exclusion prompt:

    ```text
    Do not keep passwords, access tokens, recovery codes, payment card information, or booking confirmation codes in long-term memory.
    ```

1. Select **Create**.
1. Copy the Redis Agent Memory API key and store it securely.

{{< warning >}}
Redis Cloud displays the Redis Agent Memory API key only once. If you lose it, [generate a new API key]({{< relref "/operate/iris/agent-memory/view-service#replace-service-api-key" >}}).
{{< /warning >}}

These settings keep the background stages short enough to observe during the quickstart. For screenshots and configuration details, see [create a Redis Agent Memory service]({{< relref "/operate/iris/agent-memory/create-service" >}}).

{{< warning >}}
Sensitive-data exclusions guide the extraction model but do not guarantee exclusion. Sensitive session content still reaches the model provider. Exclusions do not apply when an application creates long-term memories directly.
{{< /warning >}}
