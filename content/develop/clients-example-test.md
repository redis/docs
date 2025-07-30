---
Title: TCE test
alwaysopen: false
categories:
- docs
- operate
- rs
description: Test for tabbed-clients-example.html
weight: 1
linkTitle: TCE test
---

This page demonstrates the new named parameter syntax for the `clients-example` shortcode while maintaining backward compatibility with positional parameters.

## Basic Usage with Named Parameters

### Example 1: Basic named parameters
Using the new named parameter syntax with just the required parameters:

{{< clients-example set="stream_tutorial" step="xadd" >}}
> XADD race:france * rider Castilla speed 30.2 position 1 location_id 1
"1692632086370-0"
{{< /clients-example >}}

### Example 2: Named parameters with language filter
Filtering to show only specific client languages:

{{< clients-example set="py_home_json" step="query1" lang_filter="Python" >}}
{{< /clients-example >}}

### Example 3: Named parameters with custom max lines
Limiting the number of lines displayed in the Redis CLI tab:

{{< clients-example set="hash_tutorial" step="set_get_all" max_lines="2" >}}
> JSON.SET "bicycle:0" "." "{\"brand\": \"Velorim\", \"model\": \"Jigger\", \"price\": 270}"
OK
> JSON.SET "bicycle:1" "." "{\"brand\": \"Bicyk\", \"model\": \"Hillcraft\", \"price\": 1200}"
OK
{{< /clients-example >}}

### Example 4: Named parameters with custom tab name
Using a custom name for the Redis CLI tab:

{{< clients-example set="cmds_list" step="llen" dft_tab_name="🔧 Redis Commands" >}}
redis> LPUSH mylist "World"
(integer) 1
redis> LPUSH mylist "Hello"
(integer) 2
redis> LLEN mylist
(integer) 2
{{< /clients-example >}}

### Example 5: Named parameters with custom footer links
Adding custom footer links to the Redis CLI tab:

{{< clients-example set="cmds_hash" step="hvals" dft_tab_name="Redis CLI Example" dft_tab_link_title="Learn More" dft_tab_url="https://redis.io/commands/hvals" >}}
redis> HSET myhash field1 "Hello"
(integer) 1
redis> HSET myhash field2 "World"
(integer) 1
redis> HVALS myhash
1) "Hello"
2) "World"
{{< /clients-example >}}

## Backward Compatibility Tests

### Example 6: Original positional parameters (2 params)
This should work exactly as before:

{{< clients-example stream_tutorial xrange >}}
> XRANGE race:france 1692632086370-0 + COUNT 2
{{< /clients-example >}}

### Example 7: Original positional parameters (4 params)
Testing with language filter and max lines:

{{< clients-example search_quickstart add_documents "" 3 >}}
> JSON.SET "bicycle:0" "." "{\"brand\": \"Velorim\", \"model\": \"Jigger\", \"price\": 270}"
OK
> JSON.SET "bicycle:1" "." "{\"brand\": \"Bicyk\", \"model\": \"Hillcraft\", \"price\": 1200}"
OK
{{< /clients-example >}}

## Parameter Reference

### Named Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `set` | string | Name of the example set (required) | - |
| `step` | string | Example step name (required) | - |
| `lang_filter` or `language` | string | Language filter to show only specific clients | `""` (all languages) |
| `max_lines` | integer | Maximum number of lines shown in Redis CLI tab | `100` |
| `dft_tab_name` | string | Custom name for the Redis CLI tab | `">_ Redis CLI"` |
| `dft_tab_link_title` | string | Custom footer link title for Redis CLI tab | - |
| `dft_tab_url` | string | Custom footer link URL for Redis CLI tab | - |

### Positional Parameters (Backward Compatibility)

| Position | Type | Description | Default |
|----------|------|-------------|---------|
| 0 | string | Name of the example set (required) | - |
| 1 | string | Example step name (required) | - |
| 2 | string | Language filter | `""` |
| 3 | integer | Maximum number of lines | `100` |
| 4 | string | Custom first tab name | `">_ Redis CLI"` |
| 5 | string | Custom first tab footer link title | - |
| 6 | string | Custom first tab footer link URL | - |

## Migration Guide

### Before (Positional Parameters)
```hugo
{{</* clients-example stream_tutorial xadd */>}}
{{</* clients-example search_quickstart add_documents "" 2 */>}}
{{</* clients-example cmds_list llen "" "" "Custom CLI" */>}}
```

### After (Named Parameters)
```hugo
{{</* clients-example set="stream_tutorial" step="xadd" */>}}
{{</* clients-example set="search_quickstart" step="add_documents" max_lines="2" */>}}
{{</* clients-example set="cmds_list" step="llen" dft_tab_name="Custom CLI" */>}}
```

The named parameter syntax is more readable and self-documenting, making it easier to understand what each parameter does without referring to documentation.
