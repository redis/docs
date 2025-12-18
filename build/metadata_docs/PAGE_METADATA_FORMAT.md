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

## Example

```json
{
  "title": "Redis data types",
  "description": "Overview of data types supported by Redis",
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

## Embedding

### HTML Output

Metadata is embedded in a `<script>` tag in the page header:

```html
<script type="application/json" data-ai-metadata>
{...metadata...}
</script>
```

### Markdown Output (`.html.md`)

Metadata is embedded in a JSON code block at the top of the page:

````markdown
```json metadata
{...metadata...}
```
````

## Auto-Generation

The `tableOfContents` is automatically generated from page headings using Hugo's built-in `.TableOfContents` method. The HTML structure is converted to JSON using regex substitutions in the `layouts/partials/toc-json-regex.html` partial.

## Schema

The complete JSON schema is available at: `https://redis.io/schemas/page-metadata.json`

This schema enables:
- Validation of metadata structure
- IDE autocomplete and type checking
- AI agent understanding of page structure
- Consistent metadata across all pages

## Notes

- The in-page JSON metadata does **not** include a `$schema` reference. The schema is available separately for validation and documentation purposes.
- The metadata is auto-generated during the Hugo build process and does not require manual maintenance.

