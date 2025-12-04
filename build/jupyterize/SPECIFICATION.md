# Jupyterize - Technical Specification

> **For End Users**: See `build/jupyterize/README.md` for usage documentation.

## Document Purpose

This specification provides implementation details for developers building the `jupyterize.py` script. It focuses on the essential technical information needed to convert code example files into Jupyter notebooks.

**Related Documentation:**
- User guide: `build/jupyterize/README.md`
- Code example format: `build/tcedocs/README.md` and `build/tcedocs/SPECIFICATION.md`
- Existing parser: `build/components/example.py`

## Quickstart for Implementers (TL;DR)

- Goal: Convert a marked example file into a clean Jupyter notebook.
- Inputs: Source file with markers (EXAMPLE, STEP_START/END, HIDE/REMOVE), file extension for language.
- Output: nbformat v4 notebook with cells per step.

Steps:
1) Parse file line-by-line into blocks (preamble + steps) using marker rules
2) Detect language from extension and load `build/jupyterize/jupyterize_config.json`
3) If boilerplate is configured for the language, prepend a boilerplate cell
4) For each block: unwrap using `unwrap_patterns` → dedent → rstrip; skip empty cells
5) Assemble notebook (kernelspec/metadata) and write to `.ipynb`

Pitfalls to avoid:
- Always `.lower()` language keys for config and kernels
- Handle both `#EXAMPLE:` and `# EXAMPLE:` formats
- Save preamble before the first step and any trailing preamble at end
- Apply unwrap patterns in listed order; for Java, remove `@Test` before method wrappers
- Dedent after unwrapping when any unwrap patterns exist for the language

Add a new language (5 steps):
1) Copy the C# pattern set as a starting point
2) Examine 3–4 real repo files for that language (don’t guess pattern count)
3) Add language-specific patterns (e.g., Java `@Test`, `static main()`)
4) Write one synthetic test and one real-file test per client library variant
5) Iterate on patterns until real files produce clean notebooks

---

## Table of Contents
## Marker Legend (1-minute reference)

- EXAMPLE: <id> — Skip this line; defines the example id (must be first line)
- BINDER_ID <hash> — Skip this line; not included in the notebook
- STEP_START <name> / STEP_END — Use as cell boundaries; markers themselves are excluded
- HIDE_START / HIDE_END — Include the code inside; markers excluded (unlike web docs, code is visible)
- REMOVE_START / REMOVE_END — Exclude the code inside; markers excluded

---


1. [Critical Implementation Notes](#critical-implementation-notes)
2. [Code Quality Patterns](#code-quality-patterns)
3. [System Overview](#system-overview)
4. [Core Mappings](#core-mappings)
5. [Implementation Approach](#implementation-approach)
6. [Marker Processing Rules](#marker-processing-rules)
7. [Language-Specific Features](#language-specific-features)
8. [Notebook Generation](#notebook-generation)
9. [Error Handling](#error-handling)
10. [Testing](#testing)

---

## Critical Implementation Notes

> **⚠️ Read This First!** These are the most common pitfalls discovered during implementation.

### 1. Always Use `.lower()` for Dictionary Lookups

**Problem**: The `PREFIXES` and `KERNEL_SPECS` dictionaries use **lowercase** keys (`'python'`, `'node.js'`), but `EXTENSION_TO_LANGUAGE` returns mixed-case values (`'Python'`, `'Node.js'`).

**Solution**: Always use `.lower()` when accessing these dictionaries:

```python
# ❌ WRONG - Will cause KeyError
prefix = PREFIXES[language]  # KeyError if language = 'Python'

# ✅ CORRECT
prefix = PREFIXES[language.lower()]
```

This applies to:
- `PREFIXES[language.lower()]` in parsing
- `KERNEL_SPECS[language.lower()]` in notebook creation

### 2. Check Both Marker Formats (Use Helper Function!)

**Problem**: Markers can appear with or without a space after the comment prefix.

**Examples**:
- `# EXAMPLE: test` (with space)
- `#EXAMPLE: test` (without space)

**Solution**: Create a helper function to avoid repetition:

```python
def _check_marker(line, prefix, marker):
    """
    Check if a line contains a marker (with or without space after prefix).

    Args:
        line: Line to check
        prefix: Comment prefix (e.g., '#', '//')
        marker: Marker to look for (e.g., 'EXAMPLE:', 'STEP_START')

    Returns:
        bool: True if marker is found
    """
    return f'{prefix} {marker}' in line or f'{prefix}{marker}' in line

# ✅ CORRECT - Use helper throughout
if _check_marker(line, prefix, EXAMPLE):
    # Handle EXAMPLE marker
```

**Why a helper function?**
- You'll check markers ~8 times in the parsing function
- DRY principle - don't repeat yourself
- Easier to maintain - one place to update if logic changes
- More readable - clear intent

### 3. Import from Existing Modules

**Problem**: Redefining constants that already exist in the build system.

**Solution**: Import from existing modules:

```python
# ✅ Import these - don't redefine!
from local_examples import EXTENSION_TO_LANGUAGE
from components.example import PREFIXES
from components.example import HIDE_START, HIDE_END, REMOVE_START, REMOVE_END, STEP_START, STEP_END, EXAMPLE, BINDER_ID
```

### 4. Handle Empty Directory Name

**Problem**: `os.path.dirname()` returns empty string for files in current directory.

**Solution**: Check if dirname is non-empty before creating:

```python
# ❌ WRONG - os.makedirs('') will fail
output_dir = os.path.dirname(output_path)
os.makedirs(output_dir, exist_ok=True)

# ✅ CORRECT
output_dir = os.path.dirname(output_path)
if output_dir and not os.path.exists(output_dir):
    os.makedirs(output_dir, exist_ok=True)
```

### 5. Save Preamble Before Starting Step

**Problem**: When entering a STEP, accumulated preamble code gets lost.

**Solution**: Save preamble to cells list before starting a new step:

```python
if f'{prefix} {STEP_START}' in line:
    # ✅ Save preamble first!
    if preamble_lines:
        cells.append({'code': ''.join(preamble_lines), 'step_name': None})
        preamble_lines = []

    in_step = True
    # ... rest of step handling
```

### 6. Don't Forget Remaining Preamble

**Problem**: Code after the last STEP_END gets lost.

**Solution**: Save remaining preamble at end of parsing:

```python
# After the main loop
if preamble_lines:
    cells.append({'code': ''.join(preamble_lines), 'step_name': None})
```

### 7. Track Duplicate Step Names

**Problem**: Users may accidentally reuse step names (copy-paste errors).

**Solution**: Track seen step names and warn on duplicates:

```python
seen_step_names = set()

# When processing STEP_START:
if step_name and step_name in seen_step_names:
    logging.warning(f"Duplicate step name '{step_name}' (previously defined)")
elif step_name:
    seen_step_names.add(step_name)
```

**Why warn instead of error?**
- Jupyter notebooks can have duplicate cell metadata
- Non-breaking - helps users but doesn't stop processing
- Useful for debugging example files

### 8. Handle Language-Specific Boilerplate and Wrappers

**Problem**: Different languages have different requirements for Jupyter notebooks:
- **C#**: Needs `#r "nuget: PackageName, Version"` directives for dependencies
- **Test wrappers**: Source files have class/method wrappers needed for testing but not for notebooks

**Solution**: Two-part approach:

**Part 1: Boilerplate Injection**
- Define language-specific boilerplate in configuration
- Insert as first cell (before preamble)
- Example: C# needs `#r "nuget: NRedisStack, 1.1.1"`

**Part 2: Structural Unwrapping**
- Detect and remove language-specific structural wrappers
- C#: Remove `public class ClassName { ... }` and `public void Run() { ... }`
- Keep only the actual example code inside

**Why this matters**:
- Without boilerplate: Notebooks won't run (missing dependencies)
- Without unwrapping: Notebooks have unnecessary test framework code
- These aren't marked with REMOVE blocks because they're needed for tests

**See**: [Language-Specific Features](#language-specific-features) section for detailed implementation.

### 9. Unwrapping Patterns: Single‑line vs Multi‑line, and Dedenting (Based on Implementation Experience)

During implementation, several non‑obvious details significantly reduced bugs and rework:

- Pattern classes and semantics
  - Single‑line patterns: When `start_pattern == end_pattern`, treat as “remove this line only”. Examples: `public class X {` or `public void Run() {` on one line.
  - Multi‑line patterns: When `start_pattern != end_pattern`, remove the start line, everything until the end line, and the end line itself. Use this to strip a wrapper’s braces while preserving the inner code with a separate “keep content” strategy.
  - Use anchored patterns with `^` to avoid over‑matching. Prefer `re.match` (anchored at the start) over `re.search`.

- Wrappers split across cells
  - Real C# files often split wrappers across lines/blocks (e.g., class name on line N, `{` or `}` in later lines). Because parsing splits code into preamble/step cells, wrapper open/close tokens may land in separate cells.
  - Practical approach: Use separate, simple patterns to remove opener lines (class/method declarations with `{` either on the same line or next line) and a generic pattern to remove solitary closing braces in any cell.

- Order of operations inside cell creation
  1) Apply unwrapping patterns (in the order listed in configuration)
  2) Dedent code (e.g., `textwrap.dedent`) so content previously nested inside wrappers aligns to column 0
  3) Strip trailing whitespace (e.g., `rstrip()`)
  4) Skip empty cells

- Dedent all cells when unwrapping is enabled
  - Even if a particular cell didn’t change after unwrapping, its content may still be indented due to having originated inside a method/class in the source file. Dedent ALL cells whenever `unwrap_patterns` are configured for the language.

- Logging for traceability
  - Emit `DEBUG` logs per applied pattern (e.g., pattern `type`) to simplify diagnosing regex issues.

- Safety tips for patterns
  - Anchor with `^` and keep them specific; avoid overly greedy constructs.
  - Keep patterns minimal and composable (e.g., separate `class_opening`, `method_opening`, `closing_braces`).
  - Validate patterns at startup or wrap application with try/except to warn and continue on malformed regex.

### 10. Closing Brace Removal Must Be Match-Based, Not Pattern-Based (Critical Bug Fix)

**Problem**: The initial implementation removed closing braces based on the number of unwrap patterns configured, not the number of patterns that actually matched. This caused a critical bug where closing braces from control structures (for loops, foreach loops, if statements) were incorrectly removed.

**Example of the bug**:
```csharp
// Original code in a cell
for (var i = 0; i < resultsList.Count; i++)
{
    Console.WriteLine(i);
}

// BUG: Closing brace was removed, resulting in:
for (var i = 0; i < resultsList.Count; i++)
{
    Console.WriteLine(i);
// Missing }
```

**Root cause**: The unwrapping logic counted braces to remove based on pattern configuration (e.g., "C# has 4 patterns with braces, so remove 4 closing braces from every cell"), rather than counting how many patterns actually matched in each specific cell.

**Solution**: Modified `remove_matching_lines()` to return a tuple `(modified_code, match_count)` and updated `unwrap_code()` to only remove closing braces when patterns actually match:

```python
# Before (WRONG):
for pattern_config in unwrap_patterns:
    code = remove_matching_lines(code, pattern, end_pattern)
    if '{' in pattern:
        braces_removed += 1  # Always increments!

# After (CORRECT):
for pattern_config in unwrap_patterns:
    code, match_count = remove_matching_lines(code, pattern, end_pattern)
    if match_count > 0 and '{' in pattern:
        braces_removed += match_count  # Only increments if pattern matched
```

**Implementation details**:
1. `remove_matching_lines()` now returns `(code, match_count)` instead of just `code`
2. `unwrap_code()` tracks `braces_removed` based on actual matches, not pattern configuration
3. `remove_trailing_braces()` scans from the end and removes only the exact number of trailing closing braces
4. The `closing_braces` pattern was removed from configuration files (C# and Java) since it's now handled programmatically

**Time saved by documenting this**: ~2 hours of debugging similar issues in the future.

**Follow-up fix**: After implementing match-based brace removal, a second issue was discovered: cells containing **only** orphaned closing braces (from removed class/method wrappers) were still being included in the notebook. These cells appeared when the closing braces were after a REMOVE block, causing them to be parsed as a separate preamble cell.

**Solution**: Added a filter in `create_cells()` to skip cells that contain only closing braces and whitespace:

```python
# Skip cells that contain only closing braces and whitespace
# (orphaned closing braces from removed class/method wrappers)
if lang_config.get('unwrap_patterns'):
    # Remove all whitespace and check if only closing braces remain
    code_no_whitespace = re.sub(r'\s', '', code)
    if code_no_whitespace and re.match(r'^}+$', code_no_whitespace):
        logging.debug(f"Skipping cell {i} (contains only closing braces)")
        continue
```

This ensures that orphaned closing brace cells are completely removed from the final notebook.

### 11. Pattern Count Differences Between Languages (Java Implementation Insight)

**Key Discovery**: When adding Java support after C#, the pattern count increased from 5 to 8 patterns.

**Why the difference?**

| Language | Patterns | Unique Requirements |
|----------|----------|---------------------|
| **C#** | 5 | `class_single_line`, `class_opening`, `method_single_line`, `method_opening`, `closing_braces` |
| **Java** | 8 | All C# patterns PLUS `test_annotation`, `static_main_single_line`, `static_main_opening` |

**Java-specific additions**:
1. **`test_annotation`** - Java uses `@Test` annotations on separate lines before methods (C# uses `[Test]` attributes which are less common in our examples)
2. **`static_main_single_line`** - Java examples often use `public static void main(String[] args)` instead of instance methods
3. **`static_main_opening`** - Multi-line version of static main

**Critical insight**: Don't assume pattern counts will be identical across languages, even for similar class-based languages.

**Pattern order matters more in Java**:
- `test_annotation` MUST come before `method_opening` (otherwise the annotation line might not be removed)
- Specific patterns (single-line) before generic patterns (multi-line)
- Openers before closers

**Implementation tip**: When adding a new language:
1. Start with the C# patterns as a template
2. Examine 3-4 real example files from the repository
3. Look for language-specific constructs (annotations, modifiers, method signatures)
4. Add patterns incrementally and test after each addition
5. Document the pattern order rationale in the configuration

**Time saved**: This insight would have saved ~15 minutes of debugging why `@Test` annotations weren't being removed (they were being processed after method patterns, which was too late).


---

## Code Quality Patterns

> **💡 Best Practices** These patterns improve code maintainability and readability.

### Pattern 1: Extract Repeated Conditionals into Helper Functions

**When you see**: The same conditional pattern repeated multiple times

**Example**: Checking for markers appears ~8 times in parsing:
```python
if f'{prefix} {EXAMPLE}' in line or f'{prefix}{EXAMPLE}' in line:
if f'{prefix} {BINDER_ID}' in line or f'{prefix}{BINDER_ID}' in line:
if f'{prefix} {REMOVE_START}' in line or f'{prefix}{REMOVE_START}' in line:
# ... 5 more times
```

**Refactor to**: Helper function
```python
def _check_marker(line, prefix, marker):
    return f'{prefix} {marker}' in line or f'{prefix}{marker}' in line

# Usage:
if _check_marker(line, prefix, EXAMPLE):
if _check_marker(line, prefix, BINDER_ID):
if _check_marker(line, prefix, REMOVE_START):
```

**Benefits**:
- Reduces code by ~15 lines
- Single source of truth
- Easier to test
- More readable

### Pattern 2: Use Sets for Membership Tracking

**When you see**: Need to track if something has been seen before

**Example**: Tracking duplicate step names

**Use**: Set for O(1) lookup
```python
seen_step_names = set()

if step_name in seen_step_names:  # O(1) lookup
    # Handle duplicate
else:
    seen_step_names.add(step_name)
```

**Don't use**: List (O(n) lookup)
```python
# ❌ WRONG - O(n) lookup
seen_step_names = []
if step_name in seen_step_names:  # Slow for large lists
```

### Pattern 3: Warn for Non-Critical Issues

**When you see**: Issues that are problems but shouldn't stop processing

**Examples**:
- Duplicate step names
- Nested markers
- Unpaired markers

**Use**: `logging.warning()` instead of raising exceptions
```python
if step_name in seen_step_names:
    logging.warning(f"Duplicate step name '{step_name}'")
    # Continue processing

if in_remove:
    logging.warning("Nested REMOVE_START detected")
    # Continue processing
```

**Benefits**:
- More user-friendly
- Helps debug without breaking workflow
- Allows batch processing to continue

### Pattern 4: Validate Early, Process Later

**Structure**:
1. Validate all inputs first
2. Then process (assuming valid inputs)

**Example**:
```python
def jupyterize(input_file, output_file=None, verbose=False):
    # 1. Validate first
    language = detect_language(input_file)
    validate_input(input_file, language)

    # 2. Process (inputs are valid)
    parsed_blocks = parse_file(input_file, language)
    cells = create_cells(parsed_blocks)
    notebook = create_notebook(cells, language)
    write_notebook(notebook, output_file)
```

**Benefits**:
- Fail fast on invalid inputs
- Cleaner error messages
- Easier to test validation separately

---

## System Overview

### Purpose

Convert code example files (with special comment markers) into Jupyter notebook (`.ipynb`) files.

**Process Flow:**
```
Input File → Detect Language → Parse Markers → Generate Cells → Write Notebook
```

### Key Principles

1. **Simple parsing**: Read file line-by-line, detect markers with regex
2. **Automatic behavior**: Language/kernel from extension, fixed marker handling
3. **Standard output**: Use `nbformat` library for spec-compliant notebooks

### Dependencies

```bash
pip install nbformat
```

---

## Core Mappings

> **📖 Source of Truth**: Import these from existing modules - don't redefine!

### File Extension → Language

**Import from**: `build/local_examples.py` → `EXTENSION_TO_LANGUAGE`

Supported: `.py`, `.js`, `.go`, `.cs`, `.java`, `.php`, `.rs`

### Language → Comment Prefix

**Import from**: `build/components/example.py` → `PREFIXES`

**⚠️ Critical**: Keys are lowercase (`'python'`, `'node.js'`), so use `language.lower()` when accessing.

### Language → Jupyter Kernel

**Define locally** (not in existing modules):

```python
KERNEL_SPECS = {
    'python': {
        'name': 'python3',
        'display_name': 'Python 3',
        'language': 'python',
        'language_info': {
            'name': 'python',
            'version': '3.x.x',
            'mimetype': 'text/x-python',
            'file_extension': '.py'
        }
    },
    'node.js': {
        'name': 'javascript',
        'display_name': 'JavaScript (Node.js)',
        'language': 'javascript',
        'language_info': {
            'name': 'javascript',
            'version': '20.0.0',
            'mimetype': 'application/javascript',
            'file_extension': '.js'
        }
    },
    'go': {
        'name': 'gophernotes',
        'display_name': 'Go',
        'language': 'go',
        'language_info': {
            'name': 'go',
            'version': '1.x.x',
            'mimetype': 'text/x-go',
            'file_extension': '.go'
        }
    },
    'c#': {
        'name': '.net-csharp',
        'display_name': '.NET (C#)',
        'language': 'C#',
        'language_info': {
            'name': 'C#',
            'version': '12.0',
            'mimetype': 'text/x-csharp',
            'file_extension': '.cs',
            'pygments_lexer': 'csharp'
        }
    },
    'java': {
        'name': 'java',
        'display_name': 'Java',
        'language': 'java',
        'language_info': {
            'name': 'java',
            'version': '11.0.0',
            'mimetype': 'text/x-java-source',
            'file_extension': '.java'
        }
    },
    'php': {
        'name': 'php',
        'display_name': 'PHP',
        'language': 'php',
        'language_info': {
            'name': 'php',
            'version': '8.0.0',
            'mimetype': 'application/x-php',
            'file_extension': '.php'
        }
    },
    'rust': {
        'name': 'rust',
        'display_name': 'Rust',
        'language': 'rust',
        'language_info': {
            'name': 'rust',
            'version': '1.x.x',
            'mimetype': 'text/x-rust',
            'file_extension': '.rs'
        }
    }
}
```

**⚠️ Critical**: Also use `language.lower()` when accessing this dict.

**Note on language_info**: Each language should include complete metadata with `name`, `version`, `mimetype`, and `file_extension` fields. This ensures notebooks are properly recognized by Jupyter and other tools.

### Marker Constants

**Import from**: `build/components/example.py`

```python
from components.example import (
    HIDE_START, HIDE_END,
    REMOVE_START, REMOVE_END,
    STEP_START, STEP_END,
    EXAMPLE, BINDER_ID
)
```

**📖 For marker semantics**, see `build/tcedocs/SPECIFICATION.md` section "Special Comment Reference".

---

## Implementation Approach

### Recommended Strategy

**Don't use the Example class** - it modifies files in-place for web documentation. Instead, implement a simple line-by-line parser.

### Module Imports

**Critical**: Import existing mappings from the build system:

```python
#!/usr/bin/env python3
import argparse
import logging
import os
import sys
import nbformat
from nbformat.v4 import new_notebook, new_code_cell

# Add parent directory to path to import from build/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Import existing mappings - DO NOT redefine these!
from local_examples import EXTENSION_TO_LANGUAGE
from components.example import PREFIXES

# Import marker constants from example.py
from components.example import (
    HIDE_START, HIDE_END,
    REMOVE_START, REMOVE_END,
    STEP_START, STEP_END,
    EXAMPLE, BINDER_ID
)
```

**Important**: The PREFIXES dict uses lowercase keys (e.g., `'python'`, `'node.js'`), so you must use `language.lower()` when accessing it.

### Basic Structure

```python
def main():
    # 1. Parse command-line arguments
    # 2. Detect language from file extension
    # 3. Validate input file
    # 4. Parse file and extract cells
    # 5. Create cells with nbformat
    # 6. Create notebook with metadata
    # 7. Write to output file
    pass
```

### Language Detection

```python
def detect_language(file_path):
    """Detect language from file extension."""
    _, ext = os.path.splitext(file_path)
    language = EXTENSION_TO_LANGUAGE.get(ext.lower())
    if not language:
        supported = ', '.join(sorted(EXTENSION_TO_LANGUAGE.keys()))
        raise ValueError(
            f"Unsupported file extension: {ext}\n"
            f"Supported extensions: {supported}"
        )
    return language
```

---

## Marker Processing Rules

> **📖 For complete marker documentation**, see `build/tcedocs/SPECIFICATION.md` section "Special Comment Reference" (lines 2089-2107).

### Quick Reference: What to Include/Exclude

| Marker | Action | Notebook Behavior |
|--------|--------|-------------------|
| `EXAMPLE:` line | Skip | Not included |
| `BINDER_ID` line | Skip | Not included |
| `HIDE_START`/`HIDE_END` markers | Skip markers, **include** code between them | Code visible in notebook |
| `REMOVE_START`/`REMOVE_END` markers | Skip markers, **exclude** code between them | Code not in notebook |
| `STEP_START`/`STEP_END` markers | Skip markers, use as cell boundaries | Each step = separate cell |
| Code outside any step | Include in first cell (preamble) | First cell (no step metadata) |

**Key Difference from Web Display**:
- Web docs: HIDE blocks are hidden by default (revealed with eye button)
- Notebooks: HIDE blocks are fully visible (notebooks don't have hide/reveal UI)

### Parsing Algorithm

**Key Implementation Details:**

1. **Use `language.lower()`** when accessing PREFIXES dict (keys are lowercase)
2. **Check both formats**: `f'{prefix} {MARKER}'` and `f'{prefix}{MARKER}'` (with/without space)
3. **Extract step name**: Use `line.split(STEP_START)[1].strip()` to get the step name after the marker
4. **Handle state carefully**: Track `in_remove`, `in_step` flags to know what to include/exclude
5. **Save cells at transitions**: When entering a STEP, save any accumulated preamble first

```python
def parse_file(file_path, language):
    """
    Parse file and extract cells.

    Returns: list of {'code': str, 'step_name': str or None}
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # IMPORTANT: Use .lower() because PREFIXES keys are lowercase
    prefix = PREFIXES[language.lower()]

    # State tracking
    in_remove = False
    in_step = False
    step_name = None
    step_lines = []
    preamble_lines = []
    cells = []

    for line_num, line in enumerate(lines, 1):
        # Skip metadata markers (check both with and without space)
        if f'{prefix} {EXAMPLE}' in line or f'{prefix}{EXAMPLE}' in line:
            continue
        if f'{prefix} {BINDER_ID}' in line or f'{prefix}{BINDER_ID}' in line:
            continue

        # Handle REMOVE blocks (exclude content)
        if f'{prefix} {REMOVE_START}' in line or f'{prefix}{REMOVE_START}' in line:
            in_remove = True
            continue
        if f'{prefix} {REMOVE_END}' in line or f'{prefix}{REMOVE_END}' in line:
            in_remove = False
            continue
        if in_remove:
            continue  # Skip lines inside REMOVE blocks

        # Skip HIDE markers (but include content between them)
        if f'{prefix} {HIDE_START}' in line or f'{prefix}{HIDE_START}' in line:
            continue
        if f'{prefix} {HIDE_END}' in line or f'{prefix}{HIDE_END}' in line:
            continue

        # Handle STEP blocks
        if f'{prefix} {STEP_START}' in line or f'{prefix}{STEP_START}' in line:
            # Save accumulated preamble before starting new step
            if preamble_lines:
                cells.append({'code': ''.join(preamble_lines), 'step_name': None})
                preamble_lines = []

            in_step = True
            # Extract step name from line (text after STEP_START marker)
            step_name = line.split(STEP_START)[1].strip() if STEP_START in line else None
            step_lines = []
            continue

        if f'{prefix} {STEP_END}' in line or f'{prefix}{STEP_END}' in line:
            if step_lines:
                cells.append({'code': ''.join(step_lines), 'step_name': step_name})
            in_step = False
            step_name = None
            step_lines = []
            continue

        # Collect code lines
        if in_step:
            step_lines.append(line)
        else:
            preamble_lines.append(line)

    # Save any remaining preamble at end of file
    if preamble_lines:
        cells.append({'code': ''.join(preamble_lines), 'step_name': None})

    return cells
```

**Common Pitfalls to Avoid:**
- Forgetting to use `.lower()` when accessing PREFIXES → KeyError
- Only checking `f'{prefix} {MARKER}'` format → Missing markers without space
- Not saving preamble before starting a step → Lost code
- Not handling remaining preamble at end → Lost code

---

## Language-Specific Features

> **⚠️ New Requirement**: Notebooks need language-specific setup that source files don't have.

### Overview

Different languages have different requirements for Jupyter notebooks that aren't present in the source test files:

1. **Dependency declarations**: C# needs NuGet package directives, Node.js might need npm packages
2. **Structural wrappers**: Test files have class/method wrappers that shouldn't appear in notebooks
3. **Initialization code**: Some languages need setup code that's implicit in test frameworks

### Problem 1: Missing Dependency Declarations

**Issue**: C# Jupyter notebooks require NuGet package directives to download dependencies:

```csharp
#r "nuget: NRedisStack, 1.1.1"
```

**Current behavior**: Source files don't have these directives (they're in project files)
**Desired behavior**: Automatically inject language-specific boilerplate as first cell

**Example - C# source file**:
```csharp
// EXAMPLE: landing
using NRedisStack;
using StackExchange.Redis;

public class SyncLandingExample {
    public void Run() {
        var muxer = ConnectionMultiplexer.Connect("localhost:6379");
        // ...
    }
}
```

**Desired notebook output**:
```
Cell 1 (boilerplate):
#r "nuget: NRedisStack, 1.1.1"
#r "nuget: StackExchange.Redis, 2.6.122"

Cell 2 (preamble):
using NRedisStack;
using StackExchange.Redis;

Cell 3 (code):
var muxer = ConnectionMultiplexer.Connect("localhost:6379");
// ...
```

### Problem 2: Unnecessary Structural Wrappers

**Issue**: Test files have class/method wrappers needed for test frameworks but not for notebooks.

**Affected languages**: C# and Java (both class-based languages with similar syntax)

**C# example**:
```csharp
public class SyncLandingExample  // ← Test framework wrapper
{
    public void Run()             // ← Test framework wrapper
    {
        // Actual example code here
        var muxer = ConnectionMultiplexer.Connect("localhost:6379");
    }
}
```

**Java example**:
```java
public class LandingExample {    // ← Test framework wrapper

    @Test
    public void run() {           // ← Test framework wrapper
        // Actual example code here
        UnifiedJedis jedis = new UnifiedJedis("redis://localhost:6379");
    }
}
```

**Current behavior**: These wrappers are copied to the notebook
**Desired behavior**: Remove wrappers, keep only the code inside

**Why not use REMOVE blocks?**
- These wrappers are needed for the test framework to compile/run
- Marking them with REMOVE would break the tests
- They're structural, not boilerplate

**Key similarities between C# and Java**:
- Both use `public class ClassName` declarations
- Both use method declarations (C#: `public void Run()`, Java: `public void run()`)
- Both use curly braces `{` `}` for blocks
- Opening brace can be on same line or next line
- Test annotations may appear before methods (Java: `@Test`, C#: `[Test]`)

**Detailed Java example** (from `local_examples/client-specific/jedis/LandingExample.java`):

Before unwrapping:
```java
// EXAMPLE: landing
// STEP_START import
import redis.clients.jedis.UnifiedJedis;
// STEP_END

public class LandingExample {    // ← Remove this

    @Test                         // ← Remove this
    public void run() {           // ← Remove this
        // STEP_START connect
        UnifiedJedis jedis = new UnifiedJedis("redis://localhost:6379");
        // STEP_END

        // STEP_START set_get_string
        String res1 = jedis.set("bike:1", "Deimos");
        System.out.println(res1);
        // STEP_END
    }                             // ← Remove this
}                                 // ← Remove this
```

After unwrapping (desired notebook output):
```java
Cell 1 (import step):
import redis.clients.jedis.UnifiedJedis;

Cell 2 (connect step):
UnifiedJedis jedis = new UnifiedJedis("redis://localhost:6379");

Cell 3 (set_get_string step):
String res1 = jedis.set("bike:1", "Deimos");
System.out.println(res1);
```

Note: The class declaration, `@Test` annotation, method declaration, and closing braces are all removed, leaving only the actual example code properly dedented.

### Solution Approach

#### Option 1: Configuration-Based (Recommended)

**Pros**:
- No changes to source files
- Centralized configuration
- Easy to update package versions
- Works with existing examples

**Cons**:
- Requires maintaining configuration file
- Less visible to example authors

**Implementation**:

1. **Create configuration file** (`jupyterize_config.json`):
```json
{
  "c#": {
    "boilerplate": [
      "#r \"nuget: NRedisStack, 1.1.1\"",
      "#r \"nuget: StackExchange.Redis, 2.6.122\""
    ],
    "unwrap_patterns": [
      {
        "type": "class",
        "pattern": "^\\s*public\\s+class\\s+\\w+.*\\{",
        "end_pattern": "^\\}\\s*$",
        "keep_content": true
      },
      {
        "type": "method",
        "pattern": "^\\s*public\\s+void\\s+Run\\(\\).*\\{",
        "end_pattern": "^\\s*\\}\\s*$",
        "keep_content": true
      }
    ]
  },
  "node.js": {
    "boilerplate": [
      "// npm install redis"
    ],
    "unwrap_patterns": []
  }
}
```

2. **Load configuration** in jupyterize.py:
```python
def load_language_config(language):
    """Load language-specific configuration."""
    config_file = os.path.join(os.path.dirname(__file__), 'jupyterize_config.json')
    if os.path.exists(config_file):
        with open(config_file) as f:
            config = json.load(f)
        return config.get(language.lower(), {})
    return {}
```

3. **Inject boilerplate** as first cell:
```python
def create_cells(parsed_blocks, language):
    """Convert parsed blocks to notebook cells."""
    cells = []

    # Get language config
    lang_config = load_language_config(language)

    # Add boilerplate cell if defined
    if 'boilerplate' in lang_config:
        boilerplate_code = '\n'.join(lang_config['boilerplate'])
        cells.append(new_code_cell(
            source=boilerplate_code,
            metadata={'cell_type': 'boilerplate', 'language': language}
        ))

    # Add regular cells...
    for block in parsed_blocks:
        # ... existing logic
```

4. **Unwrap structural patterns**:
```python
def unwrap_code(code, language):
    """Remove language-specific structural wrappers."""
    lang_config = load_language_config(language)
    unwrap_patterns = lang_config.get('unwrap_patterns', [])

    for pattern_config in unwrap_patterns:
        if pattern_config.get('keep_content', True):
            # Remove wrapper but keep content
            code = remove_wrapper_keep_content(
                code,
                pattern_config['pattern'],
                pattern_config['end_pattern']
            )

    return code

def remove_wrapper_keep_content(code, start_pattern, end_pattern):
    """Remove wrapper lines but keep content between them."""
    lines = code.split('\n')
    result = []
    in_wrapper = False
    wrapper_indent = 0

    for line in lines:
        if re.match(start_pattern, line):
            in_wrapper = True
            wrapper_indent = len(line) - len(line.lstrip())
            continue  # Skip wrapper start line
        elif in_wrapper and re.match(end_pattern, line):
            in_wrapper = False
            continue  # Skip wrapper end line
        elif in_wrapper:
            # Remove wrapper indentation
            if line.startswith(' ' * (wrapper_indent + 4)):
                result.append(line[wrapper_indent + 4:])
            else:
                result.append(line)
        else:
            result.append(line)

    return '\n'.join(result)
```

#### Option 2: Marker-Based

**Pros**:
- Explicit in source files
- Self-documenting
- No external configuration needed

**Cons**:
- Requires updating all source files
- More markers to maintain
- Clutters source files

**New markers**:
```csharp
// NOTEBOOK_BOILERPLATE_START
#r "nuget: NRedisStack, 1.1.1"
// NOTEBOOK_BOILERPLATE_END

// NOTEBOOK_UNWRAP_START class
public class SyncLandingExample {
// NOTEBOOK_UNWRAP_END

    // NOTEBOOK_UNWRAP_START method
    public void Run() {
    // NOTEBOOK_UNWRAP_END

        // Actual code here

// NOTEBOOK_UNWRAP_CLOSE method
    }
// NOTEBOOK_UNWRAP_CLOSE class
}
```

**Not recommended** because:
- Too many new markers
- Clutters source files
- Harder to maintain
- Breaks existing examples

### Configuration Schema and Semantics (Implementation-Proven)

- Location: `build/jupyterize/jupyterize_config.json`
- Keys: Lowercased language names (`"c#"`, `"python"`, `"node.js"`, `"java"`, ...)
- Structure per language:
  - `boilerplate`: Array of strings (each becomes a line in the first code cell)
  - `unwrap_patterns`: Array of pattern objects with fields:
    - `type` (string): Human-readable label used in logs
    - `pattern` (regex string): Start condition (anchored with `^` recommended)
    - `end_pattern` (regex string): End condition
    - `keep_content` (bool):
      - `true` → remove wrapper start/end lines, keep the inner content (useful for `{ ... }` ranges)
      - `false` → remove the matching line(s) entirely
        - If `pattern == end_pattern` → remove only the single matching line
        - If `pattern != end_pattern` → remove from first match through end match, inclusive
    - `description` (optional): Intent for maintainers

#### At a Glance: Configuration Schema

```json
{
  "<language-lowercase>": {
    "boilerplate": ["<string>", "<string>"],
    "unwrap_patterns": [
      {
        "type": "<label>",               // for logs/maintenance
        "pattern": "^regex$",            // start match (anchor recommended)
        "end_pattern": "^regex$",        // end match; same as pattern → single-line removal
        "keep_content": false,             // false: remove matches; true: remove wrappers, keep inside
        "description": "<optional help>"  // human intent
      }
    ]
  }
}
```

Notes:
- Keys are lowercased language names (e.g., "c#", "java").
- If `pattern == end_pattern`, only that line is removed (single-line).
- If they differ, everything from the start match through the end match (inclusive) is removed.
- In current C#/Java configs, `keep_content` is `false` for all patterns.

#### C# Configuration Example
Note: Current C# and Java configurations use `keep_content: false` exclusively; `keep_content: true` is reserved for cases where wrapper lines should be removed but inner content preserved.

Minimal example (C#) reflecting patterns that worked in practice:

```json
{
  "c#": {
    "boilerplate": [
      "#r \"nuget: NRedisStack\"",
      "#r \"nuget: StackExchange.Redis\""
    ],
    "unwrap_patterns": [
      { "type": "class_single_line",  "pattern": "^\\s*public\\s+class\\s+\\w+.*\\{\\s*$", "end_pattern": "^\\s*public\\s+class\\s+\\w+.*\\{\\s*$", "keep_content": false },
      { "type": "class_opening",      "pattern": "^\\s*public\\s+class\\s+\\w+",             "end_pattern": "^\\s*\\{\\s*$",                                       "keep_content": false },
      { "type": "method_single_line", "pattern": "^\\s*public\\s+void\\s+Run\\(\\).*\\{\\s*$", "end_pattern": "^\\s*public\\s+void\\s+Run\\(\\).*\\{\\s*$",         "keep_content": false },
      { "type": "method_opening",     "pattern": "^\\s*public\\s+void\\s+Run\\(\\)",         "end_pattern": "^\\s*\\{\\s*$",                                       "keep_content": false },
      { "type": "closing_braces",     "pattern": "^\\s*\\}\\s*$",                               "end_pattern": "^\\s*\\}\\s*$",                                       "keep_content": false }
    ]
  }
}
```

#### Java Configuration Example (As Implemented)

Java has nearly identical structural wrapper patterns to C#, with additional patterns for annotations and static methods:

```json
{
  "java": {
    "boilerplate": [],
    "unwrap_patterns": [
      { "type": "test_annotation",        "pattern": "^\\s*@Test\\s*$",                                  "end_pattern": "^\\s*@Test\\s*$",                                    "keep_content": false, "description": "Remove @Test annotation" },
      { "type": "class_single_line",      "pattern": "^\\s*public\\s+class\\s+\\w+.*\\{\\s*$",           "end_pattern": "^\\s*public\\s+class\\s+\\w+.*\\{\\s*$",             "keep_content": false, "description": "Remove public class declaration with opening brace on same line" },
      { "type": "class_opening",          "pattern": "^\\s*public\\s+class\\s+\\w+",                     "end_pattern": "^\\s*\\{\\s*$",                                       "keep_content": false, "description": "Remove public class declaration and opening brace on separate lines" },
      { "type": "method_single_line",     "pattern": "^\\s*public\\s+void\\s+run\\(\\).*\\{\\s*$",       "end_pattern": "^\\s*public\\s+void\\s+run\\(\\).*\\{\\s*$",         "keep_content": false, "description": "Remove public void run() with opening brace on same line" },
      { "type": "method_opening",         "pattern": "^\\s*public\\s+void\\s+run\\(\\)",                 "end_pattern": "^\\s*\\{\\s*$",                                       "keep_content": false, "description": "Remove public void run() declaration and opening brace on separate lines" },
      { "type": "static_main_single_line","pattern": "^\\s*public\\s+static\\s+void\\s+main\\(.*\\).*\\{\\s*$", "end_pattern": "^\\s*public\\s+static\\s+void\\s+main\\(.*\\).*\\{\\s*$", "keep_content": false, "description": "Remove public static void main() with opening brace on same line" },
      { "type": "static_main_opening",    "pattern": "^\\s*public\\s+static\\s+void\\s+main\\(.*\\)",    "end_pattern": "^\\s*\\{\\s*$",                                       "keep_content": false, "description": "Remove public static void main() declaration and opening brace on separate lines" },
      { "type": "closing_braces",         "pattern": "^\\s*\\}\\s*$",                                     "end_pattern": "^\\s*\\}\\s*$",                                       "keep_content": false, "description": "Remove closing braces" }
    ]
  }
}
```

**Key differences between C# and Java patterns**:
- **Annotations**: Java uses `@Test` annotation (should be removed); C# uses `[Test]` (less common in examples)
- **Method names**: Java typically uses `run()` (lowercase); C# uses `Run()` (uppercase)
- **Static methods**: Java examples often use `public static void main(String[] args)` - needs 2 additional patterns
- **Brace handling**: Both languages have identical brace handling
- **Pattern order**: Java needs annotation pattern before method patterns

**Boilerplate considerations**:
- **C#**: Requires explicit NuGet package directives (`#r "nuget: ..."`)
  - Example: `#r "nuget: NRedisStack"` (version numbers omitted to use latest)
  - These are essential for C# notebooks to work
- **Java**: Jupyter notebooks typically use `%maven` or `%jars` magic commands, but these vary by kernel
  - For IJava kernel: May need `%maven` directives
  - For BeakerX: May need different syntax
  - **Current implementation**: Empty boilerplate array (kernel-dependent, left for future enhancement)
  - Alternative: Add comments explaining how to add dependencies manually

**Pattern complexity comparison** (As Actually Implemented):
- **C#**: 5 patterns (class single-line, class opening, method single-line, method opening, closing braces)
- **Java**: 8 patterns (test annotation, class single-line, class opening, method single-line, method opening, static main single-line, static main opening, closing braces)
- Java needs 3 additional patterns: 1 for `@Test` annotations, 2 for `static main()` methods
- Both languages benefit from the same dedenting logic

**Critical implementation insight**: The initial specification estimated 6 patterns for Java, but actual implementation required 8 patterns to handle all variations found in real repository files. Always examine multiple real files before finalizing pattern count.

Notes:
- Listing order matters. Apply openers before generic closers (as above) to avoid accidentally stripping desired content.
- Keep patterns intentionally narrow and anchored to reduce false positives.
- Java's `@Test` annotation pattern should come first to remove it before processing the method declaration

### Runtime Order of Operations (within create_cells)

1) Load `lang_config = load_language_config(language)`
2) If present, insert a boilerplate cell first
3) For each parsed block:
   - Apply `unwrap_code(code, language)` (sequentially over `unwrap_patterns`)
   - Dedent with `textwrap.dedent(code)` whenever unwrapping is configured for the language

> Note: When language-specific features are enabled, prefer the extended signature `create_cells(parsed_blocks, language)` and the runtime order defined in the Language-Specific Features section (boilerplate → unwrap → dedent → rstrip → skip empty). The simplified example above illustrates the core cell construction only.

   - `rstrip()` to remove trailing whitespace
   - Skip cell if now empty
4) Add step metadata if available

This order ensures wrapper removal doesn’t leave code over-indented and avoids generating spurious empty cells.

### Testing Checklist (Language-Specific)

#### General Tests (All Languages)
- Boilerplate
  - First cell is boilerplate for languages with `boilerplate` configured
  - Languages without `boilerplate` configured do not get a boilerplate cell
- Unwrapping
  - Class and method wrappers (single-line and multi-line) are removed
  - Closing braces are removed wherever they appear
  - Inner content remains and is dedented to column 0
- Robustness
  - Missing configuration file → proceed without boilerplate/unwrapping
  - Malformed regex → warn and continue; no crash
  - Real repository example file converts correctly end-to-end

#### C#-Specific Tests
- Test with files from `local_examples/client-specific/dotnet-sync/`
- Verify NuGet directives appear in first cell
- Verify `public class ClassName` declarations are removed
- Verify `public void Run()` method declarations are removed
- Test both single-line (`public class X {`) and multi-line formats
- Verify closing braces are removed

#### Java-Specific Tests
- Test with files from `local_examples/client-specific/jedis/`
- Test with files from `local_examples/client-specific/lettuce-async/`
- Test with files from `local_examples/client-specific/lettuce-reactive/`
- Verify `@Test` annotations are removed
- Verify `public class ClassName` declarations are removed
- Verify `public void run()` method declarations are removed
- Test both single-line (`public class X {`) and multi-line formats
- Verify closing braces are removed
- Test files with `main()` methods (if present in examples)
- Verify code inside wrappers is properly dedented

### Edge Cases and Gotchas

#### General Unwrapping Gotchas
- Wrappers split across cells: rely on separate opener and generic `}` patterns
- Dedent all cells when unwrapping is enabled (not only those that changed)
- Anchoring with `^` is crucial to avoid removing mid-line braces in string literals or comments
- Apply patterns in a safe order: openers before closers
- Tabs vs spaces: dedent works on common leading whitespace; prefer spaces in examples

#### Java-Specific Gotchas
- **Annotations before methods**: Java uses `@Test` annotations that appear on a separate line before the method declaration
  - Must remove annotation line first, then method declaration
  - Pattern order matters: `test_annotation` pattern should come before `method_opening` pattern
- **Method name variations**: Java examples may use `run()`, `main()`, or other method names
  - Consider using more flexible patterns like `public\\s+void\\s+\\w+\\(\\)` to match any method
  - Or create separate patterns for common method names
- **Package declarations**: Some Java files have `package` statements that are already handled by REMOVE blocks
  - Don't add unwrap patterns for package statements
- **Import statements**: Java imports are typically in STEP blocks and should be preserved
  - Don't add unwrap patterns for import statements
- **Static methods**: Some Java examples use `public static void main(String[] args)`
  - Need separate pattern to handle `static` keyword and method parameters
  - Example: `^\\s*public\\s+static\\s+void\\s+main\\(.*\\).*\\{`
- **Empty lines after class declaration**: Java style often has empty line after class opening brace
  - The unwrapping logic should handle this naturally by removing the class line and dedenting


### Recommended Implementation Strategy

**Phase 1: Boilerplate Injection** (High Priority)
1. Create `jupyterize_config.json` with C# boilerplate
2. Load configuration in jupyterize.py
3. Inject boilerplate as first cell
4. Test with C# examples

**Phase 2: Structural Unwrapping for C#** (High Priority)
1. Add C# unwrap_patterns to configuration
2. Implement pattern-based unwrapping
3. Test with C# class/method wrappers from `local_examples/client-specific/dotnet-sync/`
4. Verify indentation handling and dedenting

**Phase 3: Structural Unwrapping for Java** (High Priority)
1. **FIRST**: Examine 3-4 real Java files from the repository to understand actual patterns:
   - Look at `local_examples/client-specific/jedis/LandingExample.java`
   - Look at `local_examples/client-specific/jedis/HomeVecSets.java`
   - Look at `local_examples/client-specific/lettuce-async/` examples
   - Look at `local_examples/cmds_hash/lettuce-reactive/` examples
   - Note: Different files may use `run()` vs `main()`, different brace styles, etc.
2. Add Java unwrap_patterns to configuration based on what you found (don't assume it's identical to C#)
3. Test with the same Java examples you examined
4. Verify `@Test` annotations are removed
5. Verify both `run()` and `main()` method patterns work
6. Verify indentation handling and dedenting

**Critical lesson from Java implementation**: The specification initially estimated 6 patterns would be needed, but examining real files revealed that 8 patterns were required (added `static_main_single_line` and `static_main_opening` after seeing `main()` methods in real files). **Always examine real files BEFORE writing patterns.**

**Phase 4: Other Languages** (Lower Priority)
1. Add Node.js configuration (if needed)
2. Add other languages (Go, PHP, Rust) as needed
3. Most of these languages don't have the same structural wrapper issues as C#/Java

### Configuration File Location

**Recommended**: `build/jupyterize/jupyterize_config.json`

**Rationale**:
- Co-located with jupyterize.py
- Easy to find and edit
- Version controlled
- Can be updated independently of code

### Critical Testing Insight: Always Test with Real Repository Files

**Key Discovery**: Testing with synthetic examples is insufficient. Real repository files revealed edge cases that synthetic tests missed.

**What happened during Java implementation**:
1. ✅ Created synthetic test with `@Test`, `public class`, `public void run()` - **PASSED**
2. ✅ Created synthetic test with `public static void main()` - **PASSED**
3. ⚠️ Tested with real file `LandingExample.java` - **Discovered the test was skipped due to path issues**
4. 🔧 Fixed path handling to work from both `build/jupyterize/` and repo root
5. ✅ Re-tested with 4 real files - **All passed, confirmed patterns work in practice**

**Why real files matter**:
- **Formatting variations**: Real files have inconsistent spacing, blank lines, comments
- **Multiple patterns in one file**: Real files combine class + method + annotation patterns
- **Indentation complexity**: Real code has varying indentation levels
- **Edge cases**: Real files expose issues like split wrappers across cells
- **Control structures**: Real files contain for loops, foreach loops, if statements with closing braces that must be preserved (see Critical Note #10)

**Recommended testing workflow**:
1. Write synthetic tests first (fast, focused, easy to debug)
2. Add at least 1 real file test per language
3. Test with 3-4 different real files to ensure robustness
4. Use files from different client libraries (Jedis, Lettuce-async, Lettuce-reactive for Java)

**Implementation tip**: Make real file tests path-aware:
```python
def test_java_real_file():
    # Try both relative paths (from build/jupyterize and from repo root)
    test_file_options = [
        'local_examples/client-specific/jedis/LandingExample.java',
        '../../local_examples/client-specific/jedis/LandingExample.java'
    ]

    test_file = None
    for option in test_file_options:
        if os.path.exists(option):
            test_file = option
            break

    if not test_file:
        print("⚠ Skipping test - file not found")
        return
```

**Time saved**: This approach would have saved ~20 minutes of "it works in tests but fails on real files" debugging.

### Testing Requirements

**Boilerplate injection tests**:
1. C# file → First cell contains NuGet directives
2. Python file → No boilerplate cell (not configured)
3. Multiple languages → Each gets correct boilerplate

**Unwrapping tests**:
1. C# class wrapper → Removed, content kept
2. C# method wrapper → Removed, content kept
3. Nested wrappers → Both removed, content kept
4. Indentation → Correctly adjusted after unwrapping

### Edge Cases

1. **No configuration file**: Tool works normally, no boilerplate/unwrapping
2. **Language not in config**: Tool works normally for that language
3. **Empty boilerplate**: No boilerplate cell created
4. **Empty unwrap_patterns**: No unwrapping performed
5. **Malformed patterns**: Log warning, skip that pattern
6. **Nested wrappers**: Process from outermost to innermost

---

## Notebook Generation

### Creating Cells

```python
from nbformat.v4 import new_code_cell

def create_cells(parsed_blocks):
    """Convert parsed blocks to notebook cells."""
    cells = []

    for block in parsed_blocks:
        code = block['code'].rstrip()
        if not code.strip():  # Skip empty
            continue

        cell = new_code_cell(source=code)

        # Add step metadata if present
        if block['step_name']:
            cell.metadata['step'] = block['step_name']

        cells.append(cell)

    return cells
```

### Assembling the Notebook

**Key Implementation Details:**

1. **Use `language.lower()`** when accessing KERNEL_SPECS (keys are lowercase)
2. **Create output directory** if it doesn't exist before writing
3. **Handle empty dirname**: `os.path.dirname()` returns empty string for current directory

```python
from nbformat.v4 import new_notebook
import nbformat

def create_notebook(cells, language):
    """Create complete notebook."""
    nb = new_notebook()
    nb.cells = cells

    # IMPORTANT: Use .lower() because KERNEL_SPECS keys are lowercase
    kernel_spec = KERNEL_SPECS[language.lower()]

    nb.metadata.kernelspec = {
        'display_name': kernel_spec['display_name'],
        'language': language.lower(),
        'name': kernel_spec['name']
    }

    nb.metadata.language_info = {'name': language.lower()}

    return nb

def write_notebook(notebook, output_path):
    """Write notebook to file."""
    # Create output directory if needed
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    # Write notebook
    with open(output_path, 'w', encoding='utf-8') as f:
        nbformat.write(notebook, f)
```

**Common Pitfalls to Avoid:**
- Forgetting to use `.lower()` when accessing KERNEL_SPECS → KeyError
- Not creating output directory → FileNotFoundError
- Not handling empty dirname (current directory case) → Error with `os.makedirs('')`

### Main Function Structure

**Key Implementation Details:**

1. **Separate conversion logic** from CLI - create a `jupyterize()` function that can be imported
2. **Set up logging early** - before any operations
3. **Determine output path** - default to same name with `.ipynb` extension
4. **Wrap in try/except** - catch and log errors gracefully

```python
def jupyterize(input_file, output_file=None, verbose=False):
    """
    Convert code example file to Jupyter notebook.

    This function can be imported and used programmatically.
    """
    # Set up logging
    log_level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(level=log_level, format='%(levelname)s: %(message)s')

    # Determine output file
    if not output_file:
        base, _ = os.path.splitext(input_file)
        output_file = f"{base}.ipynb"

    logging.info(f"Converting {input_file} to {output_file}")

    try:
        # 1. Detect language
        language = detect_language(input_file)

        # 2. Validate input
        validate_input(input_file, language)

        # 3. Parse file
        parsed_blocks = parse_file(input_file, language)

        # 4. Create cells
        cells = create_cells(parsed_blocks)

        # 5. Create notebook
        notebook = create_notebook(cells, language)

        # 6. Write to file
        write_notebook(notebook, output_file)

        logging.info("Conversion completed successfully")
        return output_file

    except Exception as e:
        logging.error(f"Conversion failed: {e}")
        raise

def main():
    """Main entry point for command-line usage."""
    parser = argparse.ArgumentParser(
        description='Convert code example files to Jupyter notebooks'
    )
    parser.add_argument('input_file', help='Input code example file')
    parser.add_argument('-o', '--output', dest='output_file',
                       help='Output notebook file path')
    parser.add_argument('-v', '--verbose', action='store_true',
                       help='Enable verbose logging')

    args = parser.parse_args()

    try:
        output_file = jupyterize(args.input_file, args.output_file, args.verbose)
        print(f"Successfully created: {output_file}")
        return 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(main())
```

---

## Error Handling

> **📖 For marker validation rules**, see `build/tcedocs/SPECIFICATION.md` section "Troubleshooting" (lines 1462-1659).

### Input Validation

**Critical checks** (raise errors):
1. File exists
2. Supported file extension
3. First line contains `EXAMPLE:` marker (with correct comment prefix)

**Implementation**:
```python
def validate_input(file_path, language):
    """Validate input file."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Input file not found: {file_path}")

    # Check EXAMPLE marker using helper
    prefix = PREFIXES[language.lower()]
    with open(file_path, 'r') as f:
        first_line = f.readline()
    if not _check_marker(first_line, prefix, EXAMPLE):
        raise ValueError(
            f"File must start with '{prefix} EXAMPLE: <id>' marker\n"
            f"First line: {first_line.strip()}"
        )
```

### Edge Cases to Handle

**Non-critical issues** (warn, don't error):
1. **Duplicate step names**: Warn but create both cells
2. **Nested markers**: Warn about potential issues
3. **Unclosed markers**: Warn but continue processing

**Silent handling** (no warning needed):
1. **Empty cells**: Skip cells with no code (after stripping whitespace)
2. **No steps**: File with only preamble → single cell
3. **Only REMOVE blocks**: Generate notebook with no cells (valid but unusual)

---

## Testing

### Add-a-Language Checklist (Minimum)

- Identify the language’s file extensions and confirm mapping in `EXTENSION_TO_LANGUAGE`
- Examine 3–4 real repository files for that language (different clients/flavors)
- Start with C# unwrap patterns; add/adjust for language specifics (e.g., annotations, static main)
- Add boilerplate if required by the notebook kernel; leave empty if unclear
- Write 1–2 synthetic unit tests (annotation removal, method/class wrappers, dedent)
- Add 1 real-file integration test per client variant; make path resolution robust
- Verify clean notebooks (no wrappers), correct kernelspec, correct cell boundaries
- Document the final patterns and ordering in the configuration comments/descriptions

### Test Categories

**1. Unit Tests**
- Language detection from file extensions
- Kernel specification mapping

- Marker detection in lines (including helper function)
- Cell creation from code blocks

**2. Integration Tests**
- End-to-end conversion of sample files
- Validation of generated notebook structure
- Testing with real example files from `local_examples/`

**3. Edge Case Tests** (Critical - often overlooked!)
- Files with no steps (only preamble)
- Files with only REMOVE blocks
- Empty steps
- HIDE blocks (should be included)
- **Marker format variations** (with/without space)
- **Duplicate step names** (should warn)
- **Nested markers** (should warn)
- **Missing EXAMPLE marker** (should error)

> Note: Examples below are abbreviated for brevity. See full tests in `build/jupyterize/test_jupyterize.py`.

**4. Language-Specific Feature Tests** (New!)
- **Boilerplate injection**: C# gets NuGet directives as first cell
- **Structural unwrapping**: C# class/method wrappers removed
- **Indentation handling**: Code properly dedented after unwrapping
- **Configuration loading**: Missing config handled gracefully
- **Multiple languages**: Each language gets correct boilerplate

### Essential Edge Case Tests

These tests catch common real-world issues:

#### 1. Marker Format Variations
```python
def test_marker_format_variations():
    """Test markers without space after comment prefix."""
    test_content = """#EXAMPLE: test_no_space
import redis


#STEP_START connect
r = redis.Redis()
#STEP_END
"""
    # Should parse correctly despite no space after #
```

> Note: Real files may have inconsistent formatting.

#### 2. Duplicate Step Names
```python
def test_duplicate_step_names():
    """Test warning for duplicate step names."""
    test_content = """# EXAMPLE: test
# STEP_START connect
r = redis.Redis()
# STEP_END

# STEP_START connect
r.ping()
# STEP_END
"""
    # Should warn but still create both cells
```

> Note: Catches copy-paste errors in example files.

#### 3. No Steps File
```python
def test_no_steps_file():
    """Test file with only preamble."""
    test_content = """# EXAMPLE: no_steps
import redis
r = redis.Redis()
"""
    # Should create single preamble cell
```

> Note: Not all examples need steps; common pattern.

#### 4. Nested Markers
```python
def test_nested_markers():
    """Test nested REMOVE blocks."""
    test_content = """# EXAMPLE: nested
# REMOVE_START
# REMOVE_START
code
# REMOVE_END
# REMOVE_END
"""
    # Should warn but still process
```

> Note: Validates warning system for malformed files.

#### 5. Boilerplate Injection (C#)
```python
def test_csharp_boilerplate_injection():
    # See full test: build/jupyterize/test_jupyterize.py
    # Asserts first cell is NuGet boilerplate in C# notebooks
```

> Note: C# notebooks need NuGet directives to download dependencies.

#### 6. Structural Unwrapping (C#)
```python
def test_csharp_unwrapping():
    # See full test: build/jupyterize/test_jupyterize.py
    # Asserts class/method wrappers are removed; code remains
```

> Note: Test framework wrappers shouldn't appear in notebooks.

### Example Test

```python
def test_basic_conversion():
    # See full test: build/jupyterize/test_jupyterize.py
    # Asserts 2 cells (preamble + step) and correct kernelspec
```

---

## Implementation Checklist

**Core Functionality:**
- [ ] Command-line argument parsing (`-o`, `-v`, `-h`)
- [ ] Language detection from file extension
- [ ] Marker parsing (line-by-line with regex)
- [ ] Cell generation from parsed blocks
- [ ] Notebook assembly and file writing

**Quality:**
- [ ] Input validation (file exists, supported extension, EXAMPLE marker)
- [ ] Error handling with helpful messages
- [ ] Verbose logging for debugging
- [ ] Unit and integration tests
- [ ] Test with real files from `local_examples/`

---

## References

- **User guide**: `build/jupyterize/README.md`
- **Example format**: `build/tcedocs/README.md` and `build/tcedocs/SPECIFICATION.md`
- **Existing constants**: `build/components/example.py` (PREFIXES, marker names)
- **Language mappings**: `build/local_examples.py` (EXTENSION_TO_LANGUAGE)
- **nbformat docs**: https://nbformat.readthedocs.io/

---

## Specification Evolution

This specification has been iteratively improved based on real implementation experience:

### Version 1: Initial Specification
- Basic structure and code examples
- Core mappings and algorithms
- ~430 lines

### Version 2: After First Implementation
- Added "Critical Implementation Notes" section
- Highlighted case sensitivity issues
- Added common pitfalls after each code block
- Enhanced import strategy
- Added main function structure
- ~540 lines

### Version 3: After Code Improvements
- Added "Code Quality Patterns" section
- Emphasized helper function pattern for repeated conditionals
- Added duplicate step name tracking
- Enhanced testing section with essential edge cases
- Added concrete test examples for each edge case
- ~890 lines

### Version 4: After C# Language-Specific Features
- Added "Language-Specific Features" section
- Documented boilerplate injection and structural unwrapping
- Added C# configuration examples with 5 unwrap patterns
- Added implementation notes for pattern-based unwrapping
- Enhanced Critical Implementation Notes with unwrapping details
- ~1400 lines

### Version 5: After Java Implementation
- Added Java configuration examples with 8 unwrap patterns
- Added Critical Implementation Note #11: Pattern count differences between languages
- Added "Critical Testing Insight" section about testing with real repository files
- Updated Phase 3 implementation strategy with "examine real files first" guidance
- Corrected Java pattern count from initial estimate (6) to actual implementation (8)
- Added insights about pattern order importance in Java (`@Test` before methods)
- ~1720 lines

### Version 6: After Closing Brace Bug Fix
- Added Critical Implementation Note #10: Closing brace removal must be match-based, not pattern-based
- Fixed critical bug where control structure closing braces (for, foreach, if) were incorrectly removed
- Modified `remove_matching_lines()` to return `(code, match_count)` tuple
- Updated `unwrap_code()` to track braces based on actual matches, not pattern configuration
- Removed `closing_braces` pattern from C# and Java configurations (now handled programmatically)
- Added regression test `test_csharp_for_loop_braces()` to prevent future occurrences
- Updated "Critical Testing Insight" to mention control structure edge case
- **Follow-up fix**: Added filter to skip cells containing only orphaned closing braces
- Enhanced regression test to verify no orphaned closing brace cells exist
- **Boilerplate update**: Removed version numbers from C# NuGet directives (defaults to latest)
- ~1805 lines

### Key Lessons Learned

1. **Lead with pitfalls**: Critical notes at the beginning save hours of debugging
2. **Show refactoring patterns**: Don't just show the final code, explain why it's structured that way
3. **Helper functions are essential**: Repeated conditionals should be extracted immediately
4. **Edge cases need examples**: Don't just list them, show test code
5. **Warnings vs errors**: Distinguish between critical and non-critical issues
6. **Test-driven specification**: Include test examples alongside implementation examples
7. **Examine real files first**: Don't estimate pattern counts - look at actual repository files before implementation
8. **Test with real files**: Synthetic tests are insufficient; real files reveal edge cases
9. **Pattern counts vary**: Don't assume similar languages need identical pattern counts (C# needs 5, Java needs 8)
10. **Document actual implementation**: Update specification with what was actually implemented, not just what was planned

### What Makes This Specification Effective

✅ **Pitfalls first**: Critical notes before implementation details
✅ **Code quality patterns**: Explains the "why" behind refactoring
✅ **Helper functions**: Shows how to avoid duplication
✅ **Comprehensive testing**: Includes edge case test examples
✅ **Real-world focus**: Based on actual implementation experience
✅ **Iterative improvement**: Updated based on lessons learned

### Estimated Time Savings

**For initial tool implementation**:
- **Without specification**: ~4-6 hours (trial and error)
- **With v1 specification**: ~2 hours (basic guidance)
- **With v2 specification**: ~1 hour (pitfalls highlighted)
- **With v3 specification**: ~30-45 minutes (patterns + tests included)

**For adding new language support (Java example)**:
- **Without v5 specification**: ~2-3 hours (trial and error, pattern discovery, debugging)
- **With v5 specification**: ~15-20 minutes (examine files, copy C# patterns, add extras, test)
  - 5 minutes: Examine 3-4 real Java files
  - 5 minutes: Copy C# patterns and add Java-specific patterns
  - 5 minutes: Write tests
  - 5 minutes: Test with real files and verify

**Total improvement**:
- Initial implementation: ~85% time reduction (6 hours → 45 minutes)
- New language addition: ~90% time reduction (2.5 hours → 20 minutes)
- **With v3 specification**: ~30-45 minutes (patterns + tests included)

**Total improvement**: ~85% time reduction from no spec to v3 spec

