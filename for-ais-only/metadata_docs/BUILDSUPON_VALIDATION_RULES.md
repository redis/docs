# `buildsUpon` Validation Rules and Constraints

## Overview

This document specifies the validation rules and constraints for the `buildsUpon` attribute in code examples. These rules ensure data integrity and prevent common errors.

## Validation Rules

### Rule 1: Reference Validity

**Requirement**: All step IDs in `buildsUpon` must reference existing examples on the same page.

**Validation**:
```
For each example with buildsUpon:
  For each step_id in buildsUpon:
    Assert: step_id exists in codeExamples[].id on the same page
```

**Error handling**:
- **Build-time**: Warn or error if a referenced example doesn't exist
- **Runtime**: AI agents should validate and warn users about broken references

**Example**:
```markdown
{{< clients-example set="tutorial" step="advanced" buildsUpon="nonexistent" >}}
```
❌ Invalid - "nonexistent" doesn't exist on this page

### Rule 2: No Circular Dependencies

**Requirement**: Examples must not have circular dependencies (A→B→A).

**Validation**:
```
For each example:
  Build prerequisite chain by following buildsUpon
  Assert: No example appears twice in the chain
```

**Error handling**:
- **Build-time**: Error and fail the build if circular dependency detected
- **Runtime**: AI agents should detect and warn about circular dependencies

**Example**:
```
Example A: buildsUpon="B"
Example B: buildsUpon="A"
```
❌ Invalid - Circular dependency (A→B→A)

### Rule 3: Case Sensitivity

**Requirement**: Step IDs in `buildsUpon` are case-sensitive and must match exactly.

**Validation**:
```
For each step_id in buildsUpon:
  Assert: step_id matches codeExamples[].id exactly (case-sensitive)
```

**Example**:
```markdown
Step ID: "set_get"
buildsUpon: "Set_Get"  ❌ Invalid - case mismatch
buildsUpon: "set_get"  ✅ Valid
```

### Rule 4: Format Constraints

**Requirement**: `buildsUpon` must be a comma-separated list of valid step IDs.

**Validation**:
```
buildsUpon format: "step_id1, step_id2, step_id3"
- Separated by commas
- Optional whitespace around commas
- No empty values
- No duplicate values
```

**Examples**:
```
"set_get"                    ✅ Valid - single dependency
"set_get, setnx_xx"          ✅ Valid - multiple dependencies
"set_get,setnx_xx"           ✅ Valid - no spaces
"set_get, setnx_xx, mset"    ✅ Valid - three dependencies
"set_get, , setnx_xx"        ❌ Invalid - empty value
"set_get, set_get"           ❌ Invalid - duplicate
```

### Rule 5: Foundational Examples

**Requirement**: Foundational examples (introducing a concept for the first time) should NOT have `buildsUpon`.

**Validation**:
```
If example is foundational:
  Assert: buildsUpon is not present or empty
```

**Guidance**:
- First example in a tutorial: no `buildsUpon`
- Variations/extensions: include `buildsUpon`
- Advanced patterns: include `buildsUpon`

### Rule 6: Ordering Constraint

**Recommendation** (not enforced): Foundational examples should appear before dependent examples.

**Guidance**:
```
Page structure:
1. Foundational examples (no buildsUpon)
2. Intermediate examples (buildsUpon="foundational")
3. Advanced examples (buildsUpon="intermediate" or multiple)
```

## Build-Time Validation

The build system should validate `buildsUpon` during Hugo build:

1. **Extract all examples** from the page
2. **For each example with `buildsUpon`**:
   - Check that all referenced step IDs exist
   - Check for circular dependencies
   - Check format constraints
3. **Report errors** and fail the build if validation fails
4. **Report warnings** for ordering issues

## Runtime Validation (AI Agents)

AI agents should validate `buildsUpon` when consuming metadata:

```python
def validate_buildsupon(page_metadata):
    """Validate buildsUpon references and constraints."""
    examples = page_metadata.get('codeExamples', [])
    example_ids = {ex['id'] for ex in examples}
    
    for example in examples:
        builds_upon = example.get('buildsUpon', [])
        
        # Rule 1: Reference validity
        for dep_id in builds_upon:
            if dep_id not in example_ids:
                warn(f"{example['id']}: references non-existent {dep_id}")
        
        # Rule 2: Circular dependencies
        if has_circular_dependency(example['id'], examples):
            error(f"{example['id']}: circular dependency detected")
        
        # Rule 3: Case sensitivity (implicit in comparison)
        # Rule 4: Format constraints
        if not all(isinstance(dep, str) for dep in builds_upon):
            error(f"{example['id']}: invalid buildsUpon format")
```

## Migration and Backward Compatibility

- **Existing examples without `buildsUpon`**: Treated as foundational (no change)
- **Adding `buildsUpon` to existing examples**: Safe operation, no breaking changes
- **Removing `buildsUpon`**: Safe operation, example becomes independent

## Future Enhancements

Potential future improvements:

1. **Cross-page references**: Allow `buildsUpon` to reference examples on other pages
2. **Conditional dependencies**: Support "OR" dependencies (e.g., "understand A OR B")
3. **Dependency metadata**: Include reason for dependency in metadata
4. **Automatic validation**: Build-time validation with detailed error messages
5. **Visualization**: Generate dependency graphs for documentation

