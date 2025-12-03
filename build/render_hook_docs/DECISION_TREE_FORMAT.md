# Decision Tree Format Specification

## Overview

Decision trees are structured YAML documents that guide users through a series of questions to reach a recommendation. They are rendered as interactive SVG diagrams with boxes, connecting lines, and Yes/No branch labels.

## Basic Structure

```yaml
```decision-tree {id="documents-tree"}
id: documents-tree
scope: documents
rootQuestion: root
questions:
    root:
        text: "Your question here?"
        whyAsk: "Explanation of why this question matters"
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: "Recommendation"
                    id: outcomeId
            no:
                value: "No"
                nextQuestion: nextQuestionId
    nextQuestionId:
        text: "Follow-up question?"
        whyAsk: "Why this matters"
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: "Recommendation"
                    id: outcomeId
            no:
                value: "No"
                outcome:
                    label: "Alternative recommendation"
                    id: altOutcomeId
```
```

## Fields

### Top-level

- **`id`** (required): Unique identifier for this decision tree (e.g., `documents-tree`, `collections-tree`). Used for discovery and referencing by AI agents.
- **`scope`** (required): Category or domain this tree applies to (e.g., `documents`, `collections`, `sequences`). Helps AI agents understand the tree's purpose and applicability.
- **`rootQuestion`** (required): The ID of the starting question
- **`questions`** (required): Object containing all questions, keyed by ID

### Question Object

- **`text`** (required): The question text. Can span multiple lines using YAML's `|` literal block syntax
- **`whyAsk`** (required): Explanation of why this question matters. Helps AI agents understand the decision logic
- **`answers`** (required): Object with `yes` and `no` keys

### Answer Object

Each answer (`yes` or `no`) contains:

- **`value`** (required): Display text ("Yes" or "No")
- **`outcome`** (optional): Terminal recommendation
  - `label`: Text to display (e.g., "Use JSON")
  - `id`: Unique identifier for this outcome
- **`nextQuestion`** (optional): ID of the next question to ask

**Note**: Each answer must have either `outcome` or `nextQuestion`, not both.

### Outcome Object

- **`label`** (required): The recommendation text
- **`id`** (required): Unique identifier (e.g., `jsonOutcome`, `hashOutcome`)
- **`sentiment`** (optional): Indicates the nature of the outcome for visual styling
  - `"positive"`: Renders with green styling (e.g., "Use this option")
  - `"negative"`: Renders with red styling (e.g., "Don't use this option")
  - Omitted: Defaults to red (neutral/warning styling)

**Note**: The `sentiment` field is particularly useful for **suitability trees** (where outcomes are binary: suitable vs. unsuitable) as opposed to **selection trees** (where all outcomes are valid options). See [Tree Types](#tree-types) below.

## Tree Types

Decision trees can serve different purposes, which affects how you structure outcomes:

### Selection Trees
All paths lead to valid recommendations. Users choose between options.
- **Example**: "Which data type should I use?" → JSON, Hash, or String (all valid)
- **Outcome styling**: Typically all neutral (no sentiment field needed)
- **Use case**: Helping users choose among alternatives

### Suitability Trees
Paths lead to binary outcomes: suitable or unsuitable for the use case.
- **Example**: "Should I use RDI?" → Yes (good fit) or No (various reasons why not)
- **Outcome styling**: Use `sentiment: "positive"` for suitable outcomes and `sentiment: "negative"` for unsuitable ones
- **Use case**: Determining if a technology/approach is appropriate
- **Benefit**: Visual distinction (green vs. red) helps users quickly understand if something is recommended

## Multi-line Text

Use YAML's literal block syntax (`|`) for multi-line text:

```yaml
text: |
    Do you need nested data structures
    (fields and arrays) or geospatial
    index/query with Redis query engine?
whyAsk: |
    JSON is the only document type that supports
    deeply nested structures and integrates with
    the query engine for those structures
```

## Code Block Attributes

The code block fence supports the following attributes:

- **`id`** (optional): Unique identifier for the tree. Should match the `id` field in the YAML. Used by Hugo to pass metadata to the render hook.

Example:
```markdown
```decision-tree {id="documents-tree"}
id: documents-tree
scope: documents
# ...
```
```

## Best Practices

1. **Use descriptive IDs**: `root`, `hashQuestion`, `jsonOutcome` are clearer than `q1`, `q2`
2. **Keep questions concise**: Aim for 1-2 lines when possible
3. **Explain the rationale**: The `whyAsk` field helps users and AI agents understand the decision logic
4. **Reuse outcomes**: Multiple paths can lead to the same outcome (same `id`)
5. **Consistent naming**: Use camelCase for IDs, end question IDs with "Question"
6. **Match fence and YAML IDs**: The `id` in the code block fence should match the `id` field in the YAML for consistency
7. **Use meaningful scopes**: Choose scope values that clearly indicate the tree's domain (e.g., `documents`, `collections`, `sequences`)
8. **Add sentiment for suitability trees**: If your tree determines whether something is suitable (not just choosing between options), use `sentiment: "positive"` and `sentiment: "negative"` to provide visual feedback
9. **Be consistent with sentiment**: In a suitability tree, ensure all positive outcomes have `sentiment: "positive"` and all negative outcomes have `sentiment: "negative"` for clarity

## Example: Redis Data Type Selection

See `content/develop/data-types/compare-data-types.md` for a complete example.

## Rendering

Decision trees are rendered as:
- **SVG diagram** for humans (with boxes, lines, and labels)
- **Normalized JSON** embedded for AI agents (accessible via `.html.md` URLs)
- **Raw YAML** preserved in `<pre>` element for accessibility

## AI Agent Compatibility

The format is designed to be easily parseable by AI agents:

### Metadata Embedding
- **Server-side JSON**: Each tree is embedded with metadata as `<script type="application/json" data-redis-metadata="decision-tree">` containing `id`, `scope`, and `type` fields
- **No JavaScript required**: Metadata is available in static HTML, accessible to AI agents that don't execute JavaScript
- **Discoverable**: The `id` and `scope` fields enable AI agents to identify and filter trees

### Content Accessibility
- **Raw YAML preserved**: The original YAML source is preserved in a `<pre class="decision-tree-source">` element for AI parsing
- **Clear hierarchical structure**: Explicit question IDs and outcome IDs
- **Reasoning context**: `whyAsk` field explains the decision logic
- **Normalized JSON**: Available for deterministic processing

### Example Metadata
```json
{
  "type": "decision-tree",
  "id": "documents-tree",
  "scope": "documents"
}
```

This metadata helps AI agents:
- Identify the tree's purpose and domain
- Filter trees by scope
- Reference specific trees in recommendations
- Understand the tree's applicability to different problems

