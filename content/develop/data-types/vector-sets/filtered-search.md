---
categories:
- docs
- develop
- stack
- rs
- rc
- oss
- kubernetes
- clients
description: Use filter expressions to refine vector similarity results with Redis vector sets
linkTitle: Filter expressions
title: Filter expressions
weight: 10
---

## Overview

Filtered search lets you combine vector similarity search with scalar filtering. You can associate JSON attributes with elements in a vector set, and then filter results using those attributes during [`VSIM`]({{< relref "/commands/vsim" >}}) queries.

This allows queries such as:

```bash
VSIM movies VALUES 3 0.5 0.8 0.2 FILTER '.year >= 1980 and .rating > 7'
```

## Assigning attributes

You can associate attributes when adding a new vector using the `SETATTR` argument:

```bash
VADD vset VALUES 3 1 1 1 a SETATTR '{"year": 1950}'
```

Or update them later with the [`VSETATTR`]({{< relref "/commands/vsetattr" >}}) command:

```bash
VSETATTR vset a '{"year": 1960}'
```

You can retrieve attributes with the [`VGETATTR`]({{< relref "/commands/vgetattr" >}}) command:

```bash
VGETATTR vset a
```

## Filtering during similarity search

To filter by attributes, pass the `FILTER` option to the [`VSIM`]({{< relref "/commands/vsim" >}}) command:

```bash
VSIM vset VALUES 3 0 0 0 FILTER '.year > 1950'
```

This returns only elements that match both the vector similarity and the filter expression.

## Expression syntax

Expressions support familiar JavaScript-like syntax:

- Arithmetic: `+`, `-`, `*`, `/`, `%`, `**`
- Comparison: `==`, `!=`, `>`, `<`, `>=`, `<=`
- Logical: `and`, `or`, `not` (or `&&`, `||`, `!`)
- Containment: `in`
- Grouping: Parentheses `()`

Use dot notation to access attribute fields, e.g. `.year`, `.rating`.

> Only top-level fields are supported (e.g., `.genre`, but not `.movie.genre`).

## Supported data types

- Numbers
- Strings
- Booleans (converted to 1 or 0)
- Arrays (for `in`)

If a field is missing or invalid, the element is skipped without error.

## FILTER-EF

The `FILTER-EF` option controls how many candidate nodes the engine inspects to find enough filtered results. The defaults is `COUNT * 100`.

```bash
VSIM vset VALUES 3 0 0 0 COUNT 10 FILTER '.year > 2000' FILTER-EF 500
```

- Use a higher value for rare filters.
- Use `FILTER-EF 0` to scan as many as needed to fulfill the request.
- The engine will stop early if enough high-quality results are found.

## Examples

```bash
# Filter by year range
VSIM movies VALUES 3 0.5 0.8 0.2 FILTER '.year >= 1980 and .year < 1990'

# Filter by genre and rating
VSIM movies VALUES 3 0.5 0.8 0.2 FILTER '.genre == "action" and .rating > 8.0'

# Use IN with array
VSIM movies VALUES 3 0.5 0.8 0.2 FILTER '.director in ["Spielberg", "Nolan"]'

# Math and logic
VSIM movies VALUES 3 0.5 0.8 0.2 FILTER '(.year - 2000) ** 2 < 100 and .rating / 2 > 4'
```

## Tips

- Missing attributes are treated as non-matching.
- Use `FILTER-EF` to tune recall vs performance.
- Combine multiple attributes for fine-grained filtering.

## See also

- [VSIM]({{< relref "/commands/vsim" >}})
- [VADD]({{< relref "/commands/vadd" >}})
- [VSETATTR]({{< relref "/commands/vsetattr" >}})
- [VGETATTR]({{< relref "/commands/vgetattr" >}})