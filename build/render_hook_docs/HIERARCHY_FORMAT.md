# Hierarchy Format Guide

This document describes the YAML-based format for representing hierarchies (class inheritance, filesystem trees, etc.) in Redis documentation.

## Overview

Hierarchies are written in YAML format within a code block with the language identifier `hierarchy`. The render hook preserves the YAML source for AI agents while JavaScript generates a visual diagram for users.

## Basic Syntax

### Simple Hierarchy

```yaml
Parent:
    Child1:
    Child2:
        Grandchild1:
        Grandchild2:
```

This represents:
```
Parent
├── Child1
├── Child2
│   ├── Grandchild1
│   └── Grandchild2
```

### Quoted Names

Use quotes for names containing special characters (spaces, punctuation, etc.):

```yaml
"Top-level folder":
    "file1.js":
    "file2.png":
    "Inner folder":
        "file3.jpg":
```

This is especially important for:
- Filenames with extensions (`.js`, `.png`, etc.)
- Names with spaces
- Names with hyphens or other punctuation

## Metadata

Add metadata to any item using the special `_meta` key:

```yaml
"Exception":
    _meta:
        description: "Base exception class"
    "RuntimeException":
    "IOException":
```

Currently supported metadata fields:
- `description`: A brief description of the item (displayed as italic text after the item name)
- `ellipsis`: Boolean indicating this is a placeholder for omitted items

## Ellipsis (Omitted Items)

Use an ellipsis item to indicate that some items are not shown:

```yaml
"RedisError":
    "ConnectionError":
    "ResponseError":
    "InvalidResponse":
    "...":
        _meta:
            ellipsis: true
            description: "Other exception types"
```

The `_meta` with `ellipsis: true` tells the renderer to display this as "..." and not expand it further. The ellipsis item is rendered with a dotted vertical line below it to indicate continuation. You can optionally add a `description` to provide context about the omitted items.

## Complete Example: Exception Hierarchy

```yaml
"RedisError":
    _meta:
        description: "Base class for all redis-py exceptions"
    "ConnectionError":
        _meta:
            description: "Connection-related errors"
        "TimeoutError":
        "BusyLoadingError":
    "ResponseError":
    "InvalidResponse":
    "DataError":
    "PubSubError":
    "...":
        _meta:
            ellipsis: true
            description: "Other exception types"
```

This represents an exception hierarchy with:
- A base exception class with description
- Nested exception types
- An ellipsis indicating additional exception types not shown

## Complete Example: Filesystem Hierarchy

```yaml
"(root)":
    "config.yaml":
        _meta:
            description: "Main configuration file"
    "jobs":
        _meta:
            description: "Folder containing job definitions"
        "default-job.yaml":
            _meta:
                description: "Default job configuration"
        "job1.yaml":
        "...":
            _meta:
                ellipsis: true
                description: "Other job files"
```

This represents a filesystem structure with:
- A root folder containing configuration files
- Nested directories and files
- Descriptions for each item
- An ellipsis indicating additional files not shown

When `type="filesystem"` is used, the renderer displays file and folder icons next to each item.

## Usage in Markdown

### Code Block Syntax

~~~
```hierarchy {type="filesystem"}
Parent:
    Child1:
    Child2:
```
~~~

### Attributes

- `type` (optional): Indicates the kind of hierarchy. Common values:
  - `type="exception"` - Exception/error hierarchy
  - `type="filesystem"` - Filesystem or directory structure
  - `type="generic"` - Generic hierarchy (default if omitted)

  The type helps the renderer apply appropriate styling and helps AI agents understand the context.

- `noicons` (optional): Disables icon rendering for filesystem hierarchies. Use `noicons="true"` to hide file/folder icons.
  - Only applies to `type="filesystem"`
  - Default: icons are shown

### Placement

Place the hierarchy code block where you want the diagram to appear in the rendered HTML. The render hook will:
1. Preserve the YAML source in a `<pre>` element (for AI agents)
2. Generate a visual diagram below it (for users with JavaScript)

## Best Practices

### Naming

- Use clear, descriptive names
- Use quotes for any names with special characters
- Keep names concise but meaningful

### Organization

- Order items logically (alphabetically, by importance, etc.)
- Use ellipsis to indicate omitted items rather than showing everything
- Group related items together

### Metadata

- Add metadata only when it provides useful information
- Use consistent metadata field names across similar hierarchies
- Keep descriptions brief (one sentence)

## Metadata Reference

### Supported Fields

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `description` | string | Brief description of the item (displayed as italic text) | `"Base exception class"` |
| `ellipsis` | boolean | Marks as placeholder for omitted items | `true` |

### Notes

- The `description` field is displayed as italic text after the item name in the rendered diagram
- The `ellipsis` field should be set to `true` for items representing omitted content (typically named `"..."`)
- Other metadata fields may be added in the future

## Rendering

### For Users (HTML)

The render hook generates a visual SVG diagram with:
- ASCII art-style tree structure with indented text
- Connected tree lines showing parent-child relationships
- File and folder icons for filesystem hierarchies (when `type="filesystem"`)
- Descriptions displayed as italic text after item names
- Dotted vertical lines for ellipsis items indicating continuation
- Space Mono font matching Redis documentation style

### For AI Agents (Markdown)

AI agents accessing the `.html.md` version see the raw YAML:
- Clean, structured format
- Easy to parse and understand
- Metadata preserved for context
- Descriptions available for understanding item purposes

## Validation

The YAML must be valid according to the YAML 1.2 specification:
- Proper indentation (spaces, not tabs)
- Quoted strings for special characters
- Valid YAML syntax

Invalid YAML will cause rendering errors. Use a YAML validator to check your syntax.

## Real-World Examples

See the following files for real-world examples:
- `content/develop/clients/redis-py/error-handling.md` - Exception hierarchy with descriptions
- `content/integrate/redis-data-integration/data-pipelines/_index.md` - Filesystem hierarchy with file/folder icons

