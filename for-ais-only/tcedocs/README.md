# How to add a multi-language code examples to redis.io

## Configure Hugo

The website redis.io is built from Markdown files using [Hugo](https://gohugo.io). Multi-language code example support is configured in Hugo by adding information to its configuration file, `config.toml`.
There are two sections that need to updated when new languages are added.

1. In the `[params]` section:

    ```toml
    clientsExamples = ["Python", "Node.js", "Java-Sync", "Lettuce-Sync", "Java-Async", "Java-Reactive", "Go", "C", "C#-Sync", "C#-Async", "RedisVL", "PHP", "Rust-Sync", "Rust-Async"]
    ```

    The order of the `clientsExamples` list matters: it's the order in which the language tabs are presented for each code example.
1. In the `[params.clientsConfig]` section:

    ```toml
    [params.clientsConfig]
    "Python"={quickstartSlug="redis-py"}
    "Node.js"={quickstartSlug="nodejs"}
    "Java-Sync"={quickstartSlug="jedis"}
    "Lettuce-Sync"={quickstartSlug="lettuce"}
    "Java-Async"={quickstartSlug="lettuce"}
    "Java-Reactive"={quickstartSlug="lettuce"}
    "Go"={quickstartSlug="go"}
    "C"={quickstartSlug="hiredis"}
    "C#-Sync"={quickstartSlug="dotnet"}
    "C#-Async"={quickstartSlug="dotnet"}
    "RedisVL"={quickstartSlug="redis-vl"}
    "PHP"={quickstartSlug="php"}
    "Rust-Sync"={quickstartSlug="rust"}
    "Rust-Async"={quickstartSlug="rust"}
    ```

This configuration, along with the configuration steps below, is used to control the behavior of the Hugo shortcode that was developed to show tabbed code examples.
A shortcode is a simple snippet inside a content file that Hugo will render using a predefined template. This template can contain HTML and JavaScript.

### How to add a new programming language

#### Add the components file

The folder `data/components` contains one component configuration file for each supported language. These files contain information about the GitHub repos that house the code examples.

Here is the configuration file for Python, `redis_py.json`:

```json
{
    "id": "redis_py",
    "type": "client",
    "name": "redis-py",
    "language": "Python",
    "label": "Python",
    "repository": {
        "git_uri": "https://github.com/redis/redis-py"
    },
    "examples": {
        "git_uri": "https://github.com/redis/redis-py",
        "path": "doctests",
        "pattern": "*.py"
    }
}
```

The `language` property needs to match the value that was added to the `config.toml` file in the previous step. The `label` property, while generally the same as `language`, may be set to a string that is different from `language`. For RedisVL, `language` is set to `Python` and `label` is set to `RedisVL`. The `examples` property points to a GitHub repository, a path under which examples should be searched, and a file name pattern. The current logic will scan for examples that fulfill the filename pattern within the given path.

#### Register the component file

Register your component file by adding it to the `clients` array in the `index.json` file, which resides in the the same folder as the per-language JSON files. The entry should match the file name prefix and ID of the component.

Here is an example:
```json
"clients": [
  "nredisstack_sync",
  "nredisstack_async",
  "go_redis",
  "node_redis",
  "php",
  "redis_py",
  "jedis",
  "lettuce_sync",
  "lettuce_async",
  "lettuce_reactive",
  "redis_vl",
  "redis_rs_sync",
  "redis_rs_async",
  "hi_redis"
]
```

Code examples are pulled from the GitHub repo for each supported language at docs site build time.

### Verify that your language is supported by the source code file parser

Component handling is implemented in `build/components/component.py`. The example file parser that is used by it is implemented inside `build/components/example.py`. Add any language-specific information you need to have the build code support your language's examples.

```python
TEST_MARKER = {
    'java': '@Test',
    'java-sync': '@Test',
    'java-async': '@Test',
    'java-reactive': '@Test',
    'c#': r'\[Fact]|\[SkipIfRedis\(.*\)]'
}
PREFIXES = {
    'python': '#',
    'node.js': '//',
    'java': '//',
    'java-sync': '//',
    'java-async': '//',
    'java-reactive': '//',
    'go': '//',
    'c': '//',
    'c#': '//',
    'redisvl': '#',
    'php': '//',
    'rust': '//'
}
```

The `TEST_MARKER` dictionary maps programming languages to test framework annotations, which allows the parser to filter such source code lines out. The `PREFIXES` dictionary maps each language to its comment prefix. Python, for example, uses a hashtag (`#`) to start a comment.

⚠️ **CRITICAL**: The `PREFIXES` dictionary is **essential** for the example parser to work. If you add a new language, you **must** add an entry to this dictionary, or examples will fail to process with an "Unknown language" error. This is the most commonly missed step when adding a new language.

## Understand special comments in the example source code files

Each code example uses special comments, such as `HIDE_START` and `REMOVE_START`, to control how the examples are displayed. The following list gives an explanation:

- `EXAMPLE: id`: Defines the identifier of the source code example file, where `id` is any common string (for example, `cmds_string`). IDs should only contain ASCII alphanumeric characters, underline characters (`_`), or hyphen characters (`-`). Do not use multibyte characters.
- `BINDER_ID id`: Defines the [BinderHub](https://binderhub.readthedocs.io/en/latest/) commit hash for the example. This is used to generate a link to a BinderHub instance that will run the example.
- `HIDE_START`: Starts a code block that should be *hidden* when showing the example. This code block will only become visible if **unhide** (the eye button) is clicked.
- `HIDE_END`: Marks the end a hidden code block.
- `REMOVE_START`: Starts a code block that should be entirely removed when the example is processed by the build code. This is useful for removing lines of code that do not contribute to the example but are needed to embed the code into a proper test case or framework. Good examples of such code blocks are imports of external libraries or test assertions.
- `REMOVE_END`: Marks the end of a code block that should be removed from the example.
- `STEP_START step-name`: Starts a code block that represents a specific step in a set of examples.
- `STEP_END`: Marks the end of a code block that represents a specific step in a set of examples.

## Add examples to the client library or to the local_examples directory

Examples are added to either a client repo, or, temporarily, to the `local_examples` directory in the `redis.io/docs` repo.

### Add examples to the client libraries

Add a source code file to an appropriate client repo. Consult the /data/components/<client-component>.json file for the location.

| Programming Language | GitHub Repo                                         | Default directory                                 |
|----------------------|-----------------------------------------------------|---------------------------------------------------|
| C                    | [hiredis](https://github.com/redis/hiredis)         | `examples`                                        |
| C#                   | [NRedisStack](https://github.com/redis/NRedisStack) | `tests/Doc`                                       |
| Go                   | [go-redis](https://github.com/redis/go-redis)       | `doctests`                                        |
| Java                 | [jedis](https://github.com/redis/jedis)             | `src/test/java/io/redis/examples`                 |
|                      | [Lettuce](https://github.com/redis/lettuce)         | `src/test/java/io/redis/examples/sync`,            |
|                      |                                                     | `src/test/java/io/redis/examples/async`, or        |
|                      |                                                     | `src/test/java/io/redis/examples/reactive`        |
| Node.js              | [node-redis](https://github.com/redis/node-redis)   | `doctests`                                        |
| PHP                  | [Predis](https://github.com/predis/predis)          | Examples, for now, are stored in `local_examples` |
| Python               | [redis-py](https://github.com/redis/redis-py)       | `doctests`                                        |
|                      | [RedisVL](https://github.com/redis/redis-vl-python) | `doctests`                                        |

### Add examples to the local_examples directory

At times, it can take quite a while to get new or updated examples through the review process. To make the examples available immediately on the docs site, you can place examples temporarily in the `local_examples/client-specific` directory. The manner in which files are added isn't terribly important, as the build code will recursively walk the entire directory, so it will find examples in any directory under `local_examples`.

```
local_examples
├── client-specific
│   ├── go
│   ├── c
│   │   ...

│   │   ...
│   ├── jedis
│   │   ...
│   ├── lettuce-sync
│   │   ...

│   ├── lettuce-async
│   │   ...
│   ├── lettuce-reactive
│   │   ...
│   ├── nodejs
│   │   ...
│   └── redis-py
│       ...
```

## Add your example to the content page

In order to add a multi-language code example to a content page, use the `clients-example` shortcode:

```
{{< clients-example id ... />}}
```

The ID is the same one you used with `EXAMPLE: id` in the first line of your code example.

### Named versus positional parameters

The `clients-example` shortcode supports both positional and named parameters. The lion's share of current examples use positional parameters, but, going forward, names parameters should be used.

Named parameters:

- set: Name of the example set (required)
- step: Example step name (required)
- description: Human-readable description of what the example demonstrates (optional)
- difficulty: Difficulty level of the example (optional, default: "beginner", values: "beginner", "intermediate", "advanced")
- lang_filter: Language filter (optional, default: "")
- max_lines: Maximum number of lines shown by default (optional, default: 100)
- dft_tab_name: Custom first tab name (optional, default: ">_ Redis CLI")
- dft_tab_link_title: Custom first tab footer link title (optional)
- dft_tab_url: Custom first tab footer link URL (optional)
- show_footer: Show footer (optional, default: true)

Positional parameters (for backward compatibility):

- 0: example set name
- 1: step name
- 2: language filter
- 3: max lines
- 4: custom first tab name
- 5: custom first tab footer link title
- 6: custom first tab footer link URL

### Writing effective descriptions

The `description` parameter should provide clear, actionable guidance about what the example demonstrates and when to use it. A well-written description follows this pattern:

**Pattern**: `[Category]: [What it does] [When/why to use it]`

**Examples**:
- `"Foundational: Add members to a sorted set with their scores (creates new members or updates existing ones)"`
- `"Query by score range: Retrieve members within a score range using ZRANGEBYSCORE when you need to filter by numeric values"`
- `"Practical pattern: Use ZADD to set scores and ZINCRBY to increment them when you need to update leaderboards with atomic operations"`

**Best practices**:
- Start with a category label (e.g., "Foundational", "Query by score range", "Practical pattern") to help readers quickly understand the example's purpose
- Include specific command names (e.g., ZADD, ZRANGEBYSCORE) so readers know what they're learning
- Explain the "when/why" in parentheses or with a "when" clause to provide context for when this pattern is useful
- Keep descriptions concise but informative (aim for 1-2 sentences)
- Focus on the pattern or concept, not just a literal description of the code

### Choosing difficulty levels

The `difficulty` parameter helps readers find examples appropriate to their skill level. Use these guidelines:

**Beginner** (default):
- Basic CRUD operations (create, read, update, delete)
- Simple command usage with straightforward parameters
- Examples that introduce fundamental concepts
- No advanced syntax or complex patterns
- Examples: `ZADD`, `ZRANGE`, `ZRANGE ... WITHSCORES`

**Intermediate**:
- Range queries with special syntax (e.g., infinity notation `-inf`, `+inf`)
- Commands that combine multiple operations or concepts
- Examples that introduce a new conceptual layer (e.g., ranking, lexicographical ordering)
- Practical patterns that solve real-world problems
- Examples: `ZRANGEBYSCORE`, `ZREMRANGEBYSCORE`, `ZRANK`, `ZRANGEBYLEX`, leaderboard patterns

**Advanced**:
- Complex multi-step operations
- Specialized use cases or edge cases
- Examples requiring deep understanding of the data structure
- Performance-critical patterns or optimizations
- Examples: Advanced indexing patterns, complex aggregations, specialized algorithms

**Decision tree**:
1. Does the example introduce a fundamental concept? → **Beginner**
2. Does it require understanding of a previous concept or introduce new syntax? → **Intermediate**
3. Does it require deep knowledge or solve a specialized problem? → **Advanced**

**Important**: Difficulty should reflect not just syntax complexity, but also:
- **Misuse risk**: Commands with subtle gotchas (e.g., SDIFF where argument order matters) should be intermediate or higher
- **Performance implications**: Commands with significant performance differences (e.g., SISMEMBER O(1) vs. list iteration) should highlight this
- **Conceptual prerequisites**: Set operations (SINTER, SUNION, SDIFF) are intermediate even if syntax is simple, because they require understanding set algebra concepts

### Emphasizing decision context in descriptions

When writing descriptions, focus on the **decision context** rather than just what the command does. This helps readers understand when to use each pattern.

**Anti-pattern** (command-focused):
- ❌ "Find common members across multiple sets using SINTER"
- ❌ "Remove members from a set using SREM"

**Better pattern** (decision-focused):
- ✅ "Find common members across multiple sets using SINTER **when you need to identify shared items** (e.g., users in multiple groups)"
- ✅ "Use SREM for targeted removal, SPOP for random removal, or SRANDMEMBER to inspect without modifying **when you need flexible deletion patterns**"

**Key phrases to use**:
- "when you need..." - Emphasizes the use case
- "when order doesn't matter..." - Highlights set semantics
- "when you want to precompute..." - Suggests optimization patterns
- "when you need to reduce round trips..." - Performance considerations
- "warning: ..." - Highlights misuse risks or gotchas

### Examples

When converting existing content with redis-cli examples to the new format, you can wrap the existing redis-cli example:

```
{{< clients-example set="set_and_get" step="" >}}
> set mykey somevalue
OK
> get mykey
"somevalue"
{{< /clients-example >}}
```

If the redis-cli example is too long you can hide some lines by specifying the limit as the fourth argument:

```
{{< clients-example set="set_and_get" step="" lang_filter="" max_lines="2" >}}
> set mykey somevalue
OK
> get mykey <-- this line will be hidden
"somevalue" <-- this line will be hidden
{{< /clients-example >}}
```

To refer to a particular step placed in between `STEP_START stepname` and `STEP_END` comments in the code example, you should use the second argument to define the name of the step:

```
{{< clients-example set="id" step="stepname" />}}
```

If you need to embed an example for a specific programming language, the third argument should be defined:

```
{{< clients-example set="id" step="stepname" lang_filter="lang" />}}
```

The following example shows the `connect` step of a Python example:

```
{{< clients-example set="set_and_get" step="connect" lang_filter="Python" />}}
```

The programming language name should match the value in the Hugo configuration file.

#### Language Filter Syntax and Matching

The `lang_filter` parameter accepts a **comma-separated list of exact language names**:

```
{{< clients-example set="example_id" lang_filter="C#-Sync,C#-Async" />}}
```

**Important**: Language names must match exactly as they appear in `config.toml`. The matching is **exact**, not substring-based:

- ✅ `lang_filter="C#-Sync,C#-Async"` - Shows only C# sync and async tabs
- ❌ `lang_filter="C"` - Does NOT match "C#-Sync" or "C#-Async" (exact match only)
- ✅ `lang_filter="Python,Node.js"` - Shows Python and Node.js tabs
- ❌ `lang_filter="Python,Node"` - Does NOT match "Node.js" (must use exact name)

**Common pitfall**: If you use a language name that is a substring of another language name (e.g., "C" is a substring of "C#-Sync"), the filter will NOT accidentally match the longer name. Each language in the filter list must match exactly.

## Troubleshooting "Run in browser" Links

### Issue: Link doesn't appear on page load

**Symptom**: The "Run in browser" link appears only after manually changing the language selector.

**Root cause**: The default selected tab (redis-cli) doesn't have a `binderId`. The JavaScript needs to search for the first tab that has a `binderId` on initial page load.

**Solution**: Ensure the JavaScript in `layouts/partials/tabs/wrapper.html` uses an `isInitialLoad` flag to enable fallback search on page load only:

```javascript
let isInitialLoad = true;

function updateBinderLink() {
    // ... get current panel and binderId ...

    // On initial page load, if current tab doesn't have a binderId, find the first tab that does
    if (isInitialLoad && !binderId) {
        for (let i = 0; i < panels.length; i++) {
            const panelBinderId = panels[i].getAttribute('data-binder-id');
            if (panelBinderId) {
                binderId = panelBinderId;
                break;
            }
        }
    }

    // ... show link if binderId exists ...
}

// Initialize on page load
updateBinderLink();
isInitialLoad = false;  // Set to false after first call
```

### Issue: Link shows for languages that don't have a notebook

**Symptom**: Selecting a language without a notebook (e.g., Java-Async) still shows a "Run in browser" link pointing to a different language's notebook.

**Root cause**: The JavaScript is using fallback search on every update, not just on page load. This causes it to show the wrong language's link.

**Solution**: Only enable fallback search on initial page load (see above). After the first call, `isInitialLoad` is set to `false`, so subsequent language changes will only show the link if the selected language has a `binderId`.

### Issue: Link appears but points to wrong notebook

**Symptom**: The link URL is incorrect or points to the wrong example.

**Root cause**: The `binderId` value in `data/examples.json` is incorrect or missing.

**Solution**:
1. Verify the `BINDER_ID` marker is present in your example source file
2. Check that the value matches a valid Git reference in the `redis/binder-launchers` repository
3. Rebuild the site: `python build/make.py`
4. Verify the `binderId` appears in `data/examples.json` for your example
