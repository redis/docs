# Using `buildsUpon` Metadata: AI Agent Guide

## Overview

The `buildsUpon` field in code example metadata enables AI agents to understand learning progressions and dependencies between examples. This guide explains how to consume and use this metadata effectively.

## Metadata Structure

Each code example in the `codeExamples` array may include a `buildsUpon` field:

```json
{
  "id": "setnx_xx",
  "description": "Conditional SET operations...",
  "difficulty": "intermediate",
  "buildsUpon": ["set_get"],
  ...
}
```

## Key Use Cases for AI Agents

### 1. Constructing Learning Paths

When a user asks about an example, construct the full learning path:

```
User asks about: "setnx_xx"
  ↓
Check buildsUpon: ["set_get"]
  ↓
Recommend: "First, understand set_get, then learn setnx_xx"
```

**Implementation**:
- Recursively follow `buildsUpon` chains to build the complete prerequisite tree
- Present prerequisites in order (foundational first)
- Stop when you reach examples with no `buildsUpon` (foundational examples)

### 2. Providing Context-Aware Help

When explaining an example, reference its prerequisites:

```
"This example builds on the foundational set_get example. 
If you haven't seen that yet, I recommend understanding 
basic SET/GET operations first."
```

### 3. Validating Prerequisites

Before recommending an example, check if the user understands prerequisites:

```
"This example requires understanding:
- set_get (foundational)
- setnx_xx (intermediate)

Would you like me to explain any of these first?"
```

### 4. Semantic Search and Filtering

Use `buildsUpon` to improve search results:

```
User searches: "advanced string operations"
  ↓
Filter examples by difficulty="advanced"
  ↓
For each result, show: "Builds on: [list of prerequisites]"
```

## Implementation Patterns

### Pattern 1: Build Prerequisite Tree

```python
def get_prerequisites(example_id, examples_map):
    """Recursively build the prerequisite tree for an example."""
    example = examples_map.get(example_id)
    if not example or not example.get('buildsUpon'):
        return [example_id]  # Foundational example
    
    prerequisites = []
    for dep_id in example['buildsUpon']:
        prerequisites.extend(get_prerequisites(dep_id, examples_map))
    prerequisites.append(example_id)
    return prerequisites
```

### Pattern 2: Detect Circular Dependencies

```python
def has_circular_dependency(example_id, examples_map, visited=None):
    """Check if an example has circular dependencies."""
    if visited is None:
        visited = set()
    
    if example_id in visited:
        return True  # Circular dependency detected
    
    visited.add(example_id)
    example = examples_map.get(example_id)
    
    if not example or not example.get('buildsUpon'):
        return False
    
    for dep_id in example['buildsUpon']:
        if has_circular_dependency(dep_id, examples_map, visited.copy()):
            return True
    
    return False
```

### Pattern 3: Validate References

```python
def validate_buildsupon_references(page_metadata):
    """Validate that all buildsUpon references exist on the page."""
    example_ids = {ex['id'] for ex in page_metadata.get('codeExamples', [])}
    
    for example in page_metadata.get('codeExamples', []):
        for dep_id in example.get('buildsUpon', []):
            if dep_id not in example_ids:
                print(f"Warning: {example['id']} references non-existent {dep_id}")
```

## Best Practices

1. **Always validate references** - Check that `buildsUpon` values reference existing examples
2. **Detect circular dependencies** - Warn if examples have circular dependencies
3. **Present in order** - Show prerequisites before dependent examples
4. **Explain the connection** - Tell users why one example builds on another
5. **Offer alternatives** - If a user doesn't understand a prerequisite, offer alternative explanations

## Limitations and Edge Cases

- `buildsUpon` only references examples on the same page
- Multiple dependencies are comma-separated (e.g., `["step1", "step2"]`)
- Circular dependencies are theoretically possible but should be caught at build time
- Some examples may have implicit dependencies not captured in `buildsUpon`

## Integration with Other Metadata

Combine `buildsUpon` with other fields for richer context:

```json
{
  "id": "advanced_pattern",
  "description": "...",
  "difficulty": "advanced",
  "buildsUpon": ["basic_pattern"],
  "languages": [...]
}
```

Use this to:
- Recommend examples at the user's skill level
- Suggest learning paths based on difficulty progression
- Provide language-specific examples for prerequisites

