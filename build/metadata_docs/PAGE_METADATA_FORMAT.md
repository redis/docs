# Page Metadata Format

## Overview

Redis documentation pages include AI-friendly metadata that helps AI agents understand page structure, content, and navigation. This metadata is automatically generated during the Hugo build process and embedded in both HTML and Markdown output formats.

## Metadata Structure

### Core Fields (Required)

- **`title`** (string, required): The page title
- **`description`** (string, required): A brief description of the page content

### Navigation Fields

- **`tableOfContents`** (object): Hierarchical structure of page sections
  - **`sections`** (array): Array of top-level sections
    - **`id`** (string): Unique identifier matching the heading anchor ID
    - **`title`** (string): Display title of the section
    - **`children`** (array, optional): Nested subsections with the same structure

### Categorization Fields

- **`categories`** (array): Category tags for the page (e.g., `["docs", "develop", "stack"]`)
- **`scope`** (string): Scope or domain of the page content
- **`topics`** (array): Related topics
- **`relatedPages`** (array): Links to related documentation pages

### Command Reference Fields (for `/commands/` pages)

- **`arguments`** (array): Command arguments
- **`syntax_fmt`** (string): Command syntax format
- **`complexity`** (string): Time complexity of the command
- **`group`** (string): Command group
- **`command_flags`** (array): Flags associated with the command
- **`acl_categories`** (array): ACL categories for the command
- **`since`** (string): Redis version when the command was introduced
- **`arity`** (integer): Number of arguments the command accepts
- **`key_specs`** (array): Key specifications for the command

### Code Examples Fields

- **`codeExamples`** (array): Array of code examples found on the page
  - **`id`** (string): Unique identifier for the code example
  - **`description`** (string, optional): Description of what the code example demonstrates
  - **`difficulty`** (string, optional): Difficulty level - one of `"beginner"`, `"intermediate"`, `"advanced"`
  - **`codetabsId`** (string, optional): DOM element ID of the codetabs container
  - **`languages`** (array): Array of language-specific code variants
    - **`id`** (string): Display name of the language (e.g., `"Python"`, `"Node.js"`, `"Java-Sync"`)
    - **`panelId`** (string): DOM element ID of the code panel for this language
    - **`langId`** (string): Stable language identifier (e.g., `"python"`, `"javascript"`, `"java"`)
    - **`clientId`** (string): Stable client library identifier (e.g., `"redis-py"`, `"node-redis"`, `"lettuce"`)
    - **`clientName`** (string): Human-readable client library name (e.g., `"redis-py"`, `"Jedis"`, `"Lettuce"`)

### Metadata Location Fields

- **`location`** (string): Where this metadata is located in the HTML document
  - `"head"` - Metadata is in a `<script>` tag in the document head (primary copy)
  - `"body"` - Metadata is in a hidden `<div>` in the document body (fallback copy)
- **`duplicateOf`** (string, optional): If this metadata is a duplicate of another instance, this field indicates the location of the primary copy
  - Format: `"location:selector"` (e.g., `"head:data-ai-metadata"`)
  - Only present in duplicate instances

## Example

### Basic Page Metadata (Head)

```json
{
  "title": "Redis data types",
  "description": "Overview of data types supported by Redis",
  "location": "head",
  "categories": ["docs", "develop", "stack", "oss"],
  "tableOfContents": {
    "sections": [
      {
        "id": "data-types",
        "title": "Data types",
        "children": [
          {"id": "strings", "title": "Strings"},
          {"id": "lists", "title": "Lists"},
          {"id": "sets", "title": "Sets"}
        ]
      },
      {
        "id": "time-series",
        "title": "Time series"
      }
    ]
  }
}
```

### Page with Code Examples

```json
{
  "title": "SET command",
  "description": "Set the string value of a key",
  "location": "head",
  "categories": ["docs", "commands"],
  "codeExamples": [
    {
      "id": "set_basic",
      "description": "Basic SET command usage",
      "difficulty": "beginner",
      "codetabsId": "set_basic_example",
      "languages": [
        {
          "id": "Python",
          "panelId": "set_basic_python",
          "langId": "python",
          "clientId": "redis-py",
          "clientName": "redis-py"
        },
        {
          "id": "Node.js",
          "panelId": "set_basic_nodejs",
          "langId": "javascript",
          "clientId": "node-redis",
          "clientName": "node-redis"
        },
        {
          "id": "Java-Sync",
          "panelId": "set_basic_java_sync",
          "langId": "java",
          "clientId": "lettuce",
          "clientName": "Lettuce"
        }
      ]
    }
  ]
}
```

### Duplicate Metadata (Body)

```json
{
  "title": "SET command",
  "description": "Set the string value of a key",
  "location": "body",
  "duplicateOf": "head:data-ai-metadata",
  "categories": ["docs", "commands"],
  "codeExamples": [...]
}
```

## Embedding

### HTML Output

Metadata is embedded in **two locations** for redundancy and accessibility:

#### Primary: Head (Script Tag)

```html
<head>
  <script type="application/json" data-ai-metadata>
  {
    "title": "...",
    "description": "...",
    "location": "head",
    ...
  }
  </script>
</head>
```

**Use this location for:**
- Static analysis and extraction
- AI agent processing
- Schema validation
- Caching (primary copy)

#### Fallback: Body (Hidden Div)

```html
<body>
  <div hidden data-redis-metadata="page">
  {
    "title": "...",
    "description": "...",
    "location": "body",
    "duplicateOf": "head:data-ai-metadata",
    ...
  }
  </div>
</body>
```

**Use this location for:**
- DOM-based extraction (when JavaScript is available)
- Fallback access if head metadata is unavailable
- Runtime access from page scripts

**Note:** The `duplicateOf` field indicates this is a duplicate of the head version. Prefer the head version when available.

### Markdown Output (`.html.md`)

Metadata is embedded in a JSON code block at the top of the page:

````markdown
```json metadata
{...metadata...}
```
````

## Per-Codetabs Metadata

In addition to page-level metadata, each codetabs container includes a `data-codetabs-meta` attribute with language/client mappings:

```html
<div class="codetabs" id="set_example" data-codetabs-meta='{"redis-cli": {"language": "redis-cli", "client": "redis-cli"}, "Python": {"language": "python", "client": "redis-py"}, "Node.js": {"language": "javascript", "client": "node-redis"}, ...}'>
  <!-- codetabs panels -->
</div>
```

This metadata provides:
- **Single source of truth** for each codetabs block
- **Runtime access** to language/client mappings
- **Zero duplication** - not repeated on every panel
- **AI agent friendly** - direct mapping from tab → language → client

### Usage Example

```javascript
// Get the codetabs metadata
const codetabsDiv = document.getElementById('set_example');
const metaStr = codetabsDiv.getAttribute('data-codetabs-meta');
const metadata = JSON.parse(metaStr);

// Find Python's client library
const pythonMeta = metadata['Python'];
console.log(pythonMeta.language); // "python"
console.log(pythonMeta.client);   // "redis-py"
```

## Auto-Generation

The `tableOfContents` is automatically generated from page headings using Hugo's built-in `.TableOfContents` method. The HTML structure is converted to JSON using regex substitutions in the `layouts/partials/toc-json-regex.html` partial.

The `codeExamples` array is automatically generated from codetabs blocks found on the page using the `layouts/partials/code-examples-json.html` partial.

## Schema

The complete JSON schema is available at: `https://redis.io/schemas/page-metadata.json`

This schema enables:
- Validation of metadata structure
- IDE autocomplete and type checking
- AI agent understanding of page structure
- Consistent metadata across all pages

## Metadata Precedence

When both head and body metadata are available:

1. **Prefer head metadata** - It's the primary copy and more efficient to access
2. **Use body metadata as fallback** - If head is unavailable or inaccessible
3. **Check `duplicateOf` field** - If present, indicates this is a duplicate of another instance

## Notes

- The in-page JSON metadata does **not** include a `$schema` reference. The schema is available separately for validation and documentation purposes.
- The metadata is auto-generated during the Hugo build process and does not require manual maintenance.
- Both head and body metadata contain identical content (except for `location` and `duplicateOf` fields)
- The `location` field helps downstream tooling understand which copy they're accessing
- The `duplicateOf` field enables smart caching and fallback logic in AI agents and tools

