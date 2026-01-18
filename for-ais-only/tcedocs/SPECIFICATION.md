# Code Example System - Technical Specification

> **For Documentation Authors**: See `for-ais-only/tcedocs/README.md` for user-facing documentation on writing examples.

## Document Purpose

This specification is for developers who need to:
- **Understand** how the code example system works
- **Maintain** the build scripts and templates
- **Extend** the system (add new languages, modify UI, etc.)
- **Debug** issues with example processing or rendering

**Not covered**: Line-by-line code walkthrough, Hugo basics, JavaScript implementation details.

## Quick Navigation

**I want to...**
- Understand the system → [System Overview](#system-overview), [Architecture](#architecture)
- Add a new example → [Working with Examples](#working-with-examples)
- Add a new language → [Extension Points](#extension-points), [Appendix: Adding a Language](#adding-a-language)
- Fix a build issue → [Troubleshooting](#troubleshooting)
- Understand the build → [Build Process](#build-process)
- Find configuration → [Configuration](#configuration)

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Key Components](#key-components)
4. [File Structure and Conventions](#file-structure-and-conventions)
5. [Configuration](#configuration)
6. [Working with Examples](#working-with-examples)
7. [Extension Points](#extension-points)
8. [Build Process](#build-process)
9. [Troubleshooting](#troubleshooting)
10. [Appendix](#appendix)

---

## System Overview

### Purpose

The code example system provides a multi-language, tabbed code example interface for the Redis documentation site. It allows documentation authors to embed **executable, tested code examples** from multiple programming languages in a single, unified interface with language-specific tabs.

**Critical Design Principle**: All examples are actual test code from client library repositories or local test files. This ensures examples are always valid, executable, and tested against real Redis instances.

### Key Features

- **Multi-language support**: Display the same example in multiple programming languages
- **Interactive execution**: "Run in browser" links via BinderHub integration (Jupyter notebooks supporting multiple languages)
- **Tabbed interface**: Users can switch between languages using a dropdown selector
- **Code hiding/highlighting**: Support for hiding boilerplate code and highlighting relevant sections
- **Named steps**: Break examples into logical steps that can be referenced individually
- **Remote and local examples**: Pull examples from client library repositories or use local examples
- **Syntax highlighting**: Automatic syntax highlighting based on language
- **Source linking**: Link back to the original source code in GitHub repositories

### Remote vs Local Examples

**Remote Examples** (Preferred):
- Pulled from client library repositories (e.g., `redis-py/doctests/`)
- Automatically updated when client libraries release new versions
- Include GitHub source links for contributions
- **Use when**: Example is stable and part of client library test suite

**Local Examples** (`local_examples/`):
- Stored directly in the docs repository
- Faster iteration during development
- No GitHub source links
- **Use when**:
  - Example is under active development
  - Waiting for client library PR approval
  - Example is docs-specific and doesn't belong in client library
  - Need to quickly fix or update an example

**Important**: Local examples should eventually migrate to client repositories when stable.

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Build Process                             │
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │ Remote Examples  │         │ Local Examples   │              │
│  │ (GitHub Repos)   │         │ (local_examples/)│              │
│  └────────┬─────────┘         └────────┬─────────┘              │
│           │                            │                         │
│           ▼                            ▼                         │
│  ┌────────────────────────────────────────────┐                 │
│  │   build/make.py (Orchestrator)             │                 │
│  │   - Calls component.py for remote examples │                 │
│  │   - Calls local_examples.py for local      │                 │
│  └────────────────┬───────────────────────────┘                 │
│                   │                                              │
│                   ▼                                              │
│  ┌────────────────────────────────────────────┐                 │
│  │   Example Processing (example.py)          │                 │
│  │   - Parse special comments                 │                 │
│  │   - Extract steps, hide/remove blocks      │                 │
│  │   - Generate metadata                      │                 │
│  └────────────────┬───────────────────────────┘                 │
│                   │                                              │
│                   ▼                                              │
│  ┌────────────────────────────────────────────┐                 │
│  │   Output                                   │                 │
│  │   - examples/ (processed code files)       │                 │
│  │   - data/examples.json (metadata)          │                 │
│  └────────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Hugo Rendering                               │
│                                                                   │
│  ┌────────────────────────────────────────────┐                 │
│  │   Documentation Pages (Markdown)           │                 │
│  │   {{< clients-example set="..." />}}       │                 │
│  └────────────────┬───────────────────────────┘                 │
│                   │                                              │
│                   ▼                                              │
│  ┌────────────────────────────────────────────┐                 │
│  │   Shortcode (clients-example.html)         │                 │
│  │   - Parse parameters                       │                 │
│  │   - Call partial template                  │                 │
│  └────────────────┬───────────────────────────┘                 │
│                   │                                              │
│                   ▼                                              │
│  ┌────────────────────────────────────────────┐                 │
│  │   Partial (tabbed-clients-example.html)    │                 │
│  │   - Load examples.json                     │                 │
│  │   - Generate tabs for each language        │                 │
│  │   - Apply syntax highlighting              │                 │
│  └────────────────┬───────────────────────────┘                 │
│                   │                                              │
│                   ▼                                              │
│  ┌────────────────────────────────────────────┐                 │
│  │   HTML Output (Interactive Tabs)           │                 │
│  └────────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

The system operates in three distinct phases:

**1. Build Time (Python)** - Processes example source code:
- Clones remote repositories or reads local files
- Parses special comment markers (`EXAMPLE:`, `HIDE_START`, etc.)
- Removes test framework code and boilerplate
- Generates metadata (line ranges for highlighting, hidden sections, steps)
- Writes processed files to `examples/` directory
- Creates/updates `data/examples.json` with metadata for all examples

**2. Hugo Build Time (Go Templates)** - Renders HTML:
- Reads `data/examples.json` metadata
- Processes `{{< clients-example >}}` shortcodes in Markdown files
- Loads processed example files from `examples/` directory
- Applies syntax highlighting
- Generates tabbed HTML interface with language selector

**3. Browser Runtime (JavaScript)** - Handles interactivity:
- Tab switching between languages
- Show/hide hidden code sections
- Copy code to clipboard
- Persist language preference across page loads

**Key Insight**: The Python build phase does the heavy lifting (parsing, processing), while Hugo simply renders pre-processed files. This separation allows Hugo to remain fast even with hundreds of examples.

### Important Behaviors

**Metadata Merging**:
- If the same example ID exists in both remote and local sources, both are included in `examples.json`
- Each language variant is stored separately (e.g., `"Python"`, `"Node.js"`)
- Local examples can supplement or override remote examples for specific languages
- Example: Remote has Python/Node.js, local adds Go → final result has all three

**Generated Files** (gitignored):
- `examples/` directory - processed code files
- `data/examples.json` - metadata for all examples
- These are regenerated on every build and should not be committed

**In-Place Processing**:
- The `Example` class modifies files in-place after copying to `examples/`
- Original source files (in repos or `local_examples/`) remain unchanged
- Processed files have test markers removed, REMOVE blocks stripped, etc.

---

## Key Components

> **Note**: This section provides technical details about each component. For practical usage, see [Working with Examples](#working-with-examples).

### 1. Build Scripts

#### `build/make.py`

**Purpose**: Main orchestrator for the build process

**Responsibilities**:
- Parse command-line arguments (stack definition, skip-clone, log level, etc.)
- Initialize the build environment
- Invoke component processing for remote examples
- Invoke local example processing
- Coordinate the overall build workflow

**Key Functions**:
- `parse_args()`: Parse command-line arguments
- Main execution: Calls `All.apply()` and `process_local_examples()`

**Inputs**:
- `--stack`: Path to stack definition (default: `./data/components/index.json`)
- `--skip-clone`: Skip git clone operations
- `--loglevel`: Python logging level
- `--tempdir`: Temporary directory for cloning repositories

**Outputs**:
- Processed examples in `examples/` directory
- Updated `data/examples.json` metadata file

#### `build/local_examples.py`

**Purpose**: Process local example files from the `local_examples/` directory

**Responsibilities**:
- Walk the `local_examples/` directory tree
- Identify example files by extension (see [Appendix: Language Mappings](#language-mappings))
- Extract example IDs from file headers
- Process examples using the `Example` class
- Generate metadata and update `examples.json`
- Handle language-specific client name mapping (e.g., Java-Sync vs Java-Async)

**Key Functions**:
- `process_local_examples()`: Main processing function
- `get_language_from_extension()`: Map file extensions to languages
- `get_client_name_from_language_and_path()`: Determine client name with path-based overrides
- `get_example_id_from_file()`: Extract example ID from first line

**Path-Based Client Name Overrides**:

Some languages have multiple client implementations (sync/async, different libraries). The system uses directory path to determine which variant:

- Java files in `lettuce-sync/` → `Lettuce-Sync` (Lettuce synchronous client)
- Java files in `lettuce-async/` → `Java-Async` (Lettuce asynchronous client)
- Java files in `lettuce-reactive/` → `Java-Reactive` (Lettuce reactive client)
- Java files elsewhere → `Java-Sync` (Jedis synchronous client)
- Rust files in `rust-async/` → `Rust-Async`
- Rust files in `rust-sync/` → `Rust-Sync`
- C# files in `async/` → `C#-Async`
- C# files in `sync/` → `C#-Sync`

This allows the same language to appear multiple times in the tab interface with different implementations. The order of checks matters: more specific paths (e.g., `lettuce-sync`) should be checked before generic ones (e.g., `Java-Sync`).

**Outputs**:
- Copies files to `examples/{example_id}/local_{filename}`
- Updates `data/examples.json` with metadata

### 2. Component Processing

#### `build/components/component.py`

**Purpose**: Handle remote example processing from GitHub repositories

**Key Classes**:

**`Component`**: Base class for all components
- Handles URI parsing
- Manages git operations
- Provides utility methods for repository access

**`All`**: Main component orchestrator
- Loads component definitions from `data/components/index.json`
- Processes clients, core, docs, modules, and assets
- Persists examples metadata to `data/examples.json`

**`Client`**: Client library component handler
- Clones client library repositories
- Extracts examples based on component configuration
- Processes examples using the `Example` class
- Generates source URLs for GitHub links
- Creates metadata for each example

**Key Methods**:
- `_git_clone()`: Clone repositories from GitHub
- `_copy_examples()`: Extract and process examples from repositories
- `_get_example_id_from_file()`: Extract example ID from file header
- `_get_default_branch()`: Query GitHub API for default branch name

**GitHub Integration**:
- Uses GitHub API to fetch latest release tags
- Clones repositories at specific tags or branches
- Generates source URLs pointing to GitHub

#### `build/components/example.py`

**Purpose**: Parse and process individual example files

**Special Comment Markers**:
- `EXAMPLE: {id}`: Defines the example identifier (required, must be first line)
- `BINDER_ID {hash}`: Defines the BinderHub commit hash for interactive notebook link (optional)
- `HIDE_START` / `HIDE_END`: Code blocks hidden by default (revealed with eye button)
- `REMOVE_START` / `REMOVE_END`: Code blocks completely removed from display
- `STEP_START {name}` / `STEP_END`: Named code blocks for step-by-step examples

**BINDER_ID Marker**:

The `BINDER_ID` marker provides a commit hash for [BinderHub](https://binderhub.readthedocs.io/en/latest/) integration, allowing users to run examples in an interactive Jupyter notebook environment.

**Syntax**:
```python
# EXAMPLE: example_id
# BINDER_ID 6bbed3da294e8de5a8c2ad99abf883731a50d4dd
```

**Requirements**:
- Must appear after the `EXAMPLE:` marker (typically on line 2)
- Must use the language's comment prefix (e.g., `#` for Python, `//` for JavaScript)
- The hash value is a Git commit SHA from the binder-launchers repository
- Only one `BINDER_ID` per example file
- Optional - not all examples need BinderHub integration

**Usage**:
The hash is used to construct a BinderHub URL like:
```
https://redis.io/binder/v2/gh/redis/binder-launchers/{hash}?urlpath=%2Fdoc%2Ftree%2Fdemo.ipynb
```

This allows documentation to include "Try this in Jupyter" links that launch interactive notebook environments with the example pre-loaded.

**Processing Algorithm**:
1. Read file line by line
2. Detect special comment markers (using language-specific comment prefix)
3. Extract example ID from `EXAMPLE:` marker (line 1)
4. Extract BinderHub hash from `BINDER_ID` marker if present (typically line 2)
5. Track hidden/highlighted/removed ranges
6. Extract named steps with `STEP_START`/`STEP_END`
7. Filter out test markers and removed blocks
8. Generate metadata (highlight ranges, hidden ranges, named steps, binder ID)
9. Write processed content back to file (in-place modification)

**BINDER_ID Extraction Details**:

The `BINDER_ID` marker allows example authors to specify a Git reference (branch name or commit SHA) from the `redis/binder-launchers` repository. This enables the Hugo templates to generate "Run this example in the browser" links that open the example in an interactive Jupyter notebook environment via BinderHub.

**Quick Implementation Checklist**:
- [ ] Add constant: `BINDER_ID = 'BINDER_ID'` (around line 11 in `example.py`)
- [ ] Add class attribute: `binder_id = None` (around line 49 in `Example` class)
- [ ] Add regex pattern: `binder = re.compile(...)` (around line 94 in `make_ranges()`)
- [ ] Add detection logic in `elif` chain (around line 157 in main loop)
- [ ] Add conditional metadata field in `build/local_examples.py` (around line 183)
- [ ] Add conditional metadata field in `build/components/component.py` (around line 278)
- [ ] Test with both branch name and commit SHA
- [ ] Verify `BINDER_ID` line removed from processed output
- [ ] Verify `binderId` appears in `data/examples.json`

The parser should implement the following logic in `build/components/example.py`:

**1. Add Constant and Class Attribute**:

First, add the constant at the top of the file with other marker constants:
```python
BINDER_ID = 'BINDER_ID'
```

Add the attribute to the `Example` class:
```python
class Example(object):
    language = None
    path = None
    content = None
    hidden = None
    highlight = None
    named_steps = None
    binder_id = None  # Add this
```

Initialize in `__init__`:
```python
self.binder_id = None
```

**2. Compile Regex Pattern**:

In the `make_ranges()` method (around line 94), add the regex pattern compilation alongside other patterns (after `exid` pattern):
```python
exid = re.compile(f'{PREFIXES[self.language]}\\s?{EXAMPLE}')
binder = re.compile(f'{PREFIXES[self.language]}\\s?{BINDER_ID}\\s+([a-zA-Z0-9_-]+)')
go_output = re.compile(f'{PREFIXES[self.language]}\\s?{GO_OUTPUT}')
```

**Exact location**: In `build/components/example.py`, class `Example`, method `make_ranges()`, in the section where regex patterns are compiled (after line 93).

**Pattern explanation**:
- `{PREFIXES[self.language]}` - Language-specific comment prefix (e.g., `#` or `//`)
- `\\s?` - Optional whitespace after comment prefix
- `{BINDER_ID}` - The literal string "BINDER_ID"
- `\\s+` - Required whitespace before identifier
- `([a-zA-Z0-9_-]+)` - Capture group for Git reference (commit SHA or branch name)
  - Matches: lowercase letters (a-z), uppercase letters (A-Z), digits (0-9), hyphens (-), underscores (_)
  - Length: 1 or more characters (no maximum)
  - Examples: `6bbed3da294e8de5a8c2ad99abf883731a50d4dd` (commit SHA), `python-landing` (branch name), `main`, `feature-123`

**Why this pattern works**:
- **Backward compatible**: The old pattern `([a-f0-9]{40})` only matched commit SHAs. The new pattern `([a-zA-Z0-9_-]+)` matches commit SHAs (which are valid under the new pattern) AND branch names.
- **No breaking changes**: Existing examples with commit SHAs continue to work without modification.
- **Flexible**: Supports common Git branch naming conventions (kebab-case, snake_case, alphanumeric).

**3. Detection and Extraction**:

Add detection logic in the main processing loop (around line 157), **after** the `EXAMPLE:` check and **before** the `GO_OUTPUT` check:

```python
elif re.search(exid, l):
    output = False
    pass
elif re.search(binder, l):
    # Extract BINDER_ID value (commit SHA or branch name)
    match = re.search(binder, l)
    if match:
        self.binder_id = match.group(1)
        logging.debug(f'Found BINDER_ID: {self.binder_id} in {self.path}:L{curr+1}')
    output = False  # CRITICAL: Skip this line from output
elif self.language == "go" and re.search(go_output, l):
    # ... rest of processing
```

**Exact location**: In `build/components/example.py`, class `Example`, method `make_ranges()`, in the main `while curr < len(self.content):` loop, in the `elif` chain that handles special markers.

**Critical implementation details**:
- **Must set `output = False`**: This prevents the line from being added to the `content` array
- **Placement matters**: Must be in the `elif` chain, not a separate `if` statement
- **No `content.append(l)`**: The line is skipped entirely, just like `EXAMPLE:` lines
- **Extract before setting output**: Get the value before marking the line to skip
- **Order in elif chain**: Must come after `exid` (EXAMPLE:) but before `go_output` to maintain proper precedence

**4. Storage in Metadata**:

In `build/local_examples.py`, add the `binderId` field conditionally after creating the metadata dictionary:

```python
example_metadata = {
    'source': source_file,
    'language': language,
    'target': target_file,
    'highlight': example.highlight,
    'hidden': example.hidden,
    'named_steps': example.named_steps,
    'sourceUrl': None
}

# Add binderId only if it exists
if example.binder_id:
    example_metadata['binderId'] = example.binder_id

examples_data[example_id][client_name] = example_metadata
```

In `build/components/component.py`, add similarly after setting other metadata fields:

```python
example_metadata['highlight'] = e.highlight
example_metadata['hidden'] = e.hidden
example_metadata['named_steps'] = e.named_steps
example_metadata['sourceUrl'] = (
    f'{ex["git_uri"]}/tree/{default_branch}/{ex["path"]}/{os.path.basename(f)}'
)

# Add binderId only if it exists
if e.binder_id:
    example_metadata['binderId'] = e.binder_id

examples = self._root._examples
```

**Why conditional addition**:
- Only add the field if `binder_id` is not `None`
- This keeps the JSON clean - examples without BinderHub links don't have the field
- Avoids `null` or empty string values in the metadata

**5. Line Processing Behavior**:

The `BINDER_ID` line is removed from output through the same mechanism as other marker lines:

- **How it works**: Setting `output = False` prevents the line from reaching the `else` block that calls `content.append(l)`
- **Line number impact**: Because the line is never added to `content`, it doesn't affect line number calculations for steps, highlights, or hidden ranges
- **Result**: The processed file is clean, containing only the actual code without any marker comments

**Common Pitfalls**:
1. **Forgetting `output = False`**: The line will appear in processed output
2. **Wrong placement in elif chain**: May not be detected or may interfere with other markers
3. **Using `if` instead of `elif`**: Could cause multiple conditions to match
4. **Not checking `if match`**: Could cause AttributeError if regex doesn't match
5. **Adding field unconditionally**: Results in `"binderId": null` in JSON for examples without the marker
6. **Regex pattern too restrictive**: Using `[a-f0-9]{40}` only matches commit SHAs, not branch names
7. **Regex pattern too permissive**: Using `.*` or `.+` could match invalid characters or whitespace
8. **Wrong capture group**: Using `match.group(0)` returns the entire match including comment prefix, not just the value

**6. Complete Example Flow**:

Here's a complete example showing how a file is processed:

**Input file** (`local_examples/client-specific/redis-py/landing.py`):
```python
# EXAMPLE: landing
# BINDER_ID python-landing
import redis

# STEP_START connect
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
# STEP_END
```

**Processing steps**:
1. Line 1: `EXAMPLE:` detected → `output = False` → line skipped
2. Line 2: `BINDER_ID` detected → extract value `python-landing` → `output = False` → line skipped
3. Line 3: `import redis` → no marker → added to `content` array at index 0
4. Line 4: Empty line → added to `content` array at index 1
5. Line 5: `STEP_START` detected → record step start at line 3 (len(content) + 1) → line skipped
6. Line 6: Code → added to `content` array at index 2
7. Line 7: `STEP_END` detected → record step range "3-3" → line skipped

**Output file** (`examples/landing/local_client-specific_redis-py_landing.py`):
```python
import redis

r = redis.Redis(host='localhost', port=6379, decode_responses=True)
```

**Metadata** (`data/examples.json`):
```json
{
  "landing": {
    "Python": {
      "source": "local_examples/client-specific/redis-py/landing.py",
      "language": "python",
      "target": "examples/landing/local_client-specific_redis-py_landing.py",
      "highlight": ["1-3"],
      "hidden": [],
      "named_steps": {
        "connect": "3-3"
      },
      "sourceUrl": null,
      "binderId": "python-landing"
    }
  }
}
```

**Key observations**:
- Both `EXAMPLE:` and `BINDER_ID` lines are removed from output
- Line numbers in metadata refer to the processed file (after marker removal)
- `binderId` is stored at the language level, not the example set level
- The value is extracted cleanly without comment prefix or keyword
- Value can be either a Git commit SHA (40 hex chars) or a branch name (letters, numbers, hyphens, underscores)

**Output Metadata** (stored in `examples.json`):
- `highlight`: Line ranges to highlight (e.g., `["1-10", "15-20"]`)
- `hidden`: Line ranges initially hidden (e.g., `["5-8"]`)
- `named_steps`: Map of step names to line ranges (e.g., `{"connect": "1-5"}`)
- `binderId`: BinderHub commit hash (optional, e.g., `"6bbed3da294e8de5a8c2ad99abf883731a50d4dd"`)

> **Note**: For language-specific configuration (comment prefixes, test markers), see [Appendix: Language Mappings](#language-mappings).

### 3. Hugo Templates

#### `layouts/shortcodes/clients-example.html`

**Purpose**: Hugo shortcode for embedding code examples in Markdown

**Parameters** (Named):
- `set`: Example set name (required) - matches the `EXAMPLE:` ID
- `step`: Example step name (optional) - references a `STEP_START` block
- `lang_filter`: Language filter (optional) - show only specific languages
- `max_lines`: Maximum lines shown by default (optional, default: 100)
- `dft_tab_name`: Custom first tab name (optional, default: ">_ Redis CLI")
- `dft_tab_link_title`: Custom first tab footer link title (optional)
- `dft_tab_url`: Custom first tab footer link URL (optional)
- `show_footer`: Show footer (optional, default: true)

**Parameters** (Positional - for backward compatibility):
- Position 0: example set name
- Position 1: step name
- Position 2: language filter
- Position 3: max lines
- Position 4: custom first tab name
- Position 5: custom first tab footer link title
- Position 6: custom first tab footer link URL

**Functionality**:
- Detects named vs positional parameters
- Normalizes parameters into Hugo scratch variables
- Captures inner content (for redis-cli examples)
- Delegates rendering to `tabbed-clients-example.html` partial

#### `layouts/partials/tabbed-clients-example.html`

**Purpose**: Generate the tabbed interface HTML

**Responsibilities**:
- Load example metadata from `data/examples.json`
- Iterate through configured languages (from `config.toml`)
- Generate tabs for each available language
- Apply syntax highlighting using Hugo's `highlight` function
- Handle step-specific highlighting
- Render redis-cli tab if inner content provided
- Generate footer with quickstart links and source URLs

**Data Sources**:
- `$.Site.Data.examples`: Loaded from `data/examples.json`
- `$.Site.Params.clientsexamples`: Language order from `config.toml`
- `$.Site.Params.clientsconfig`: Client configuration from `config.toml`

**Tab Generation Logic**:
1. Check if example exists in `examples.json`
2. For each configured language:
   - Check if example exists for that language
   - Apply language filter if specified
   - Load example file from `target` path
   - Apply syntax highlighting with line numbers
   - Apply step-specific or default highlighting
   - Generate tab metadata (title, language, quickstart slug, source URL)
3. Render tabs using `tabs/wrapper.html` partial

#### `layouts/partials/tabs/wrapper.html`

**Purpose**: Render the interactive tabbed interface HTML

**Features**:
- Language selector dropdown
- Visibility toggle button (show/hide hidden code)
- Copy to clipboard button
- BinderHub "Run in browser" link (conditional)
- Tab panels with syntax-highlighted code
- Footer with quickstart links and GitHub source links
- Responsive design with Tailwind CSS

**JavaScript Integration**:

The interactive features are implemented in JavaScript (location varies by theme):
- `toggleVisibleLinesForCodetabs()`: Toggle hidden code visibility
- `copyCodeToClipboardForCodetabs()`: Copy code to clipboard
- Language selector change handler: Switch between tabs
- Language preference persistence (localStorage)

> **Note**: JavaScript implementation details are theme-specific and not covered in this specification.

#### BinderHub Integration ("Run in Browser" Link)

**Purpose**: Provide interactive Jupyter notebook environment for running examples

**Feature Description**:

The code example boxes can display a "Run this example in the browser" link that launches the example in a BinderHub-powered Jupyter notebook environment. This link appears in the top bar of the example box, next to the three-dot menu icon.

**Conditional Display**:
- Only shown if the example has a `binderId` value in its metadata
- If no `binderId` exists, the link is not rendered (no placeholder, no broken link)
- The `binderId` is language-specific, so different languages in the same example set may have different BinderHub links
- BinderHub uses Jupyter notebooks which can run code in multiple languages (Python, Node.js, Java, etc.)

**Link URL Format**:
```
https://redis.io/binder/v2/gh/redis/binder-launchers/<binderId>?urlpath=%2Fdoc%2Ftree%2Fdemo.ipynb
```

**URL Components**:
- **Base URL**: `https://redis.io/binder/v2/gh/redis/binder-launchers/`
- **Binder ID**: The Git reference from `binderId` field (commit SHA or branch name)
  - **Commit SHA**: 40 hexadecimal characters (e.g., `6bbed3da294e8de5a8c2ad99abf883731a50d4dd`)
  - **Branch name**: Letters, numbers, hyphens, underscores (e.g., `python-landing`, `main`, `feature-123`)
- **URL Path**: `?urlpath=%2Fdoc%2Ftree%2Fdemo.ipynb` (constant, URL-encoded path to notebook)
- **Notebook filename**: Always `demo.ipynb` - do NOT change per example

**Examples**:
```
# Using branch name
https://redis.io/binder/v2/gh/redis/binder-launchers/python-landing?urlpath=%2Fdoc%2Ftree%2Fdemo.ipynb

# Using commit SHA
https://redis.io/binder/v2/gh/redis/binder-launchers/6bbed3da294e8de5a8c2ad99abf883731a50d4dd?urlpath=%2Fdoc%2Ftree%2Fdemo.ipynb
```

**Implementation in Hugo Templates**:

The implementation spans two template files:

**1. Extract and pass binderId in `layouts/partials/tabbed-clients-example.html`**:

In the loop that builds tabs for each language, extract the `binderId` and include it in the tab dictionary:

```go-html-template
{{ $clientExamples := index $.Site.Data.examples $id }}
{{ range $client := $.Site.Params.clientsexamples }}
    {{ $example := index $clientExamples $client }}
    {{ $clientConfig := index $.Site.Params.clientsconfig $client }}
    {{ $language := index $example "language" }}
    {{ $quickstartSlug := index $clientConfig "quickstartSlug" }}

    {{ if and ($example) (or (eq $lang "") (strings.Contains $lang $client)) }}
        {{ $examplePath := index $example "target" }}
        {{ $options := printf "linenos=false" }}

        {{/* ... highlight options logic ... */}}

        {{ if hasPrefix $language "java" }}{{ $language = "java"}}{{ end }}
        {{ $params := dict "language" $language "contentPath" $examplePath "options" $options }}
        {{ $content := partial "tabs/source.html" $params }}

        {{/* Extract binderId if it exists */}}
        {{ $binderId := index $example "binderId" }}

        {{ $tabs = $tabs | append (dict "title" $client "language" $client "quickstartSlug" $quickstartSlug "content" $content "sourceUrl" (index $example "sourceUrl") "binderId" $binderId) }}
    {{ end }}
{{ end }}
```

**Key points**:
- Extract `binderId` using `index $example "binderId"`
- Add it to the tab dictionary alongside other tab data
- If `binderId` doesn't exist, it will be `nil` (which is fine - handled later)

**2. Add link container in `layouts/partials/tabs/wrapper.html` top bar**:

Insert the BinderHub link container between the language selector and the control buttons:

```go-html-template
<!-- Language selector dropdown with controls -->
<div class="codetabs-header flex items-center justify-between px-4 py-2 bg-slate-900 rounded-t-lg">
    <div class="flex items-center flex-1">
        <label for="lang-select-{{ $id }}" class="text-xs text-slate-400 mr-3 whitespace-nowrap">Language:</label>
        <select id="lang-select-{{ $id }}"
                class="lang-selector max-w-xs px-3 py-2 text-sm bg-slate-700 text-white border border-slate-600 rounded-md cursor-pointer
                       hover:bg-slate-600 focus:outline-none
                       transition duration-150 ease-in-out appearance-none"
                data-codetabs-id="{{ $id }}">
            {{/* ... options ... */}}
        </select>
    </div>

    {{/* BinderHub "Run in browser" link - shown conditionally based on current tab's binderId */}}
    <div id="binder-link-container-{{ $id }}" class="flex items-center ml-4">
        {{/* Link will be shown/hidden by JavaScript based on selected tab */}}
    </div>

    <div class="flex items-center gap-2 ml-2">
        {{/* Visibility toggle button */}}
        {{/* Copy to clipboard button */}}
    </div>
</div>
```

**Placement notes**:
- Container is placed **after** the language selector (`flex-1` div)
- Container is placed **before** the control buttons (visibility/copy)
- `ml-4` adds left margin to separate from language selector
- `ml-2` on buttons div adds small gap between link and buttons
- Container starts empty - JavaScript will populate it

**3. Add binderId data attribute to tab panels**:

In the tab panels loop, add the `data-binder-id` attribute if `binderId` exists:

```go-html-template
<!-- Tab panels -->
{{ range $i, $tab := $tabs }}
    {{ $tid := printf "%s_%s" (replace (replace (index $tab "title") "#" "sharp") "." "") $id }}
    {{ $pid := printf "panel_%s" $tid }}
    {{ $dataLang := replace (or (index $tab "language") "redis-cli") "C#" "dotnet" }}
    {{ $dataLang := replace $dataLang "." "-" }}
    {{ $binderId := index $tab "binderId" }}

    <div class="panel {{ if ne $i 0 }}panel-hidden{{ end }} w-full mt-0 {{ if not $showFooter}}pb-8{{end}}"
         id="{{ $pid }}"
         data-lang="{{ $dataLang }}"
         {{ if $binderId }}data-binder-id="{{ $binderId }}"{{ end }}
         data-codetabs-id="{{ $id }}"
         role="tabpanel"
         tabindex="0"
         aria-labelledby="lang-select-{{ $id }}">
        {{/* ... panel content ... */}}
    </div>
{{ end }}
```

**Key points**:
- Extract `binderId` from tab data
- Only add `data-binder-id` attribute if `binderId` exists (conditional)
- Add `data-codetabs-id` to match panels to their container
- Both attributes are used by JavaScript to find and update the link

**4. Add JavaScript to handle link display and updates**:

Add this script at the end of `layouts/partials/tabs/wrapper.html` (after the closing `</div>` of the codetabs container):

```html
<script>
(function() {
    // Initialize BinderHub link for this codetabs instance
    const codetabsId = '{{ $id }}';
    const container = document.getElementById('binder-link-container-' + codetabsId);
    const langSelect = document.getElementById('lang-select-' + codetabsId);

    function updateBinderLink() {
        if (!container || !langSelect) return;

        // Get the currently selected tab index
        const selectedOption = langSelect.options[langSelect.selectedIndex];
        const tabIndex = parseInt(selectedOption.getAttribute('data-index'));

        // Find the corresponding panel
        const panels = document.querySelectorAll('[data-codetabs-id="' + codetabsId + '"].panel');
        if (!panels || tabIndex >= panels.length) return;

        const currentPanel = panels[tabIndex];
        const binderId = currentPanel.getAttribute('data-binder-id');

        // Clear existing content
        container.innerHTML = '';

        // If binderId exists, create and show the link
        if (binderId) {
            const binderUrl = 'https://redis.io/binder/v2/gh/redis/binder-launchers/' +
                            binderId +
                            '?urlpath=%2Fdoc%2Ftree%2Fdemo.ipynb';

            const link = document.createElement('a');
            link.href = binderUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'text-xs text-slate-300 hover:text-white hover:underline whitespace-nowrap flex items-center gap-1';
            link.title = 'Run this example in an interactive Jupyter notebook';

            // Add Binder icon (play icon)
            link.innerHTML = `
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <span>Run in browser</span>
            `;

            container.appendChild(link);
        }
    }

    // Initialize on page load
    updateBinderLink();

    // Update when language changes (in addition to existing language change handler)
    if (langSelect) {
        langSelect.addEventListener('change', updateBinderLink);
    }
})();
</script>
```

**JavaScript implementation details**:

**Function: `updateBinderLink()`**
- **Purpose**: Show or hide the BinderHub link based on the currently selected language tab
- **Trigger**: Called on page load and when language selector changes

**Step-by-step logic**:
1. **Get references**: Find the link container and language selector by ID
2. **Get selected tab index**: Read `data-index` attribute from selected option
3. **Find corresponding panel**: Query all panels with matching `data-codetabs-id`
4. **Read binderId**: Get `data-binder-id` attribute from current panel
5. **Clear container**: Remove any existing link (important for language switches)
6. **Conditional rendering**:
   - If `binderId` exists: Create link element with proper URL and append to container
   - If `binderId` is null/undefined: Container remains empty (no link shown)

**URL construction**:
```javascript
const binderUrl = 'https://redis.io/binder/v2/gh/redis/binder-launchers/' +
                binderId +
                '?urlpath=%2Fdoc%2Ftree%2Fdemo.ipynb';
```
- Base URL + commit hash + URL-encoded path
- `%2F` is the URL-encoded form of `/`
- Path is constant: `/doc/tree/demo.ipynb`

**Link element properties**:
- `target="_blank"`: Opens in new tab
- `rel="noopener noreferrer"`: Security best practice for external links
- `className`: Tailwind CSS classes for styling (small text, hover effects, flex layout)
- `title`: Tooltip text for accessibility
- `innerHTML`: SVG play icon + text label

**Event handling**:
- **Page load**: IIFE executes immediately, calls `updateBinderLink()`
- **Language change**: Event listener on `<select>` element calls `updateBinderLink()`
- **Scoped variables**: IIFE prevents global namespace pollution

**Why JavaScript instead of Hugo template**:
- Hugo templates are static - can't respond to language selector changes
- Each codetabs instance can have multiple languages with different `binderId` values
- Need to dynamically show/hide link based on user's language selection
- JavaScript allows real-time updates without page reload

**Data Flow**:

1. **Build time**: Python scripts extract `BINDER_ID` from source files → store in `data/examples.json`
2. **Hugo build**:
   - Template reads `binderId` from `$.Site.Data.examples[exampleSet][language].binderId`
   - Passes `binderId` through tab data structure
   - Adds `data-binder-id` attribute to panel HTML
   - Creates empty container for link
   - Embeds JavaScript with template variable `{{ $id }}`
3. **Page load (JavaScript runtime)**:
   - Script executes in IIFE
   - Finds container and selector using `codetabsId`
   - Reads `data-binder-id` from currently visible panel
   - Creates link element if `binderId` exists
   - Appends link to container
4. **User interaction**:
   - User changes language selector
   - Event listener triggers `updateBinderLink()`
   - Script finds new panel, reads its `data-binder-id`
   - Clears container and recreates link (or leaves empty)
5. **Link click**: Opens BinderHub in new tab with constructed URL

**Important Notes**:

- **Language-specific**: Each language in an example set can have its own `binderId`
- **Multi-language support**: BinderHub uses Jupyter notebooks which can execute code in multiple languages (Python, Node.js, Java, etc.) through language kernels
- **Notebook filename is constant**: Always use `demo.ipynb` - the BinderHub launcher repository handles routing to the correct example
- **URL encoding**: The `?urlpath=%2Fdoc%2Ftree%2Fdemo.ipynb` part is URL-encoded (`%2F` = `/`)
- **External dependency**: Requires the `redis/binder-launchers` repository to be properly configured with the commit referenced by `binderId`

**Implementation Gotchas and Edge Cases**:

1. **Empty container initialization**:
   - The link container `<div id="binder-link-container-{{ $id }}">` is intentionally empty in the Hugo template
   - JavaScript populates it dynamically based on the selected tab
   - **Why**: Hugo templates are static and can't respond to language selector changes
   - **Don't**: Try to render the link in Hugo template with conditionals - it won't update when user changes language

2. **Container clearing is critical**:
   - `container.innerHTML = ''` must be called before checking `binderId`
   - **Why**: When user switches from a language with `binderId` to one without, the old link must be removed
   - **Without clearing**: Link from previous language would remain visible incorrectly

3. **Play icon instead of text-only**:
   - Link includes an SVG play icon (`<path d="M8 5v14l11-7z"/>`)
   - **Why**: Visual indicator that this is an interactive/executable feature
   - **Benefit**: Recognizable across languages, saves horizontal space
   - **Alternative**: Could use BinderHub's official logo, but play icon is simpler

4. **Importance of `data-codetabs-id` attribute**:
   - Both the container and panels need `data-codetabs-id="{{ $id }}"` attribute
   - **Why**: Multiple example boxes can exist on the same page
   - **Purpose**: Ensures JavaScript matches the correct panels to the correct container
   - **Without it**: JavaScript might update the wrong container or fail to find panels

5. **IIFE (Immediately Invoked Function Expression)**:
   - Script is wrapped in `(function() { ... })();`
   - **Why**: Creates a closure to avoid polluting global namespace
   - **Benefit**: Multiple codetabs instances on same page don't interfere with each other
   - **Variables**: `codetabsId`, `container`, `langSelect`, `updateBinderLink` are scoped to this instance

6. **Event listener doesn't replace existing handlers**:
   - Uses `addEventListener('change', updateBinderLink)` instead of `onchange=`
   - **Why**: Existing language selector change handler (for tab switching) must continue to work
   - **Benefit**: Multiple handlers can coexist on the same element
   - **Order**: BinderHub link updates after tab switching completes

7. **Null/undefined binderId handling**:
   - `if (binderId)` check handles both `null` and `undefined`
   - **When null**: Hugo template didn't add `data-binder-id` attribute (no `binderId` in metadata)
   - **When undefined**: `getAttribute()` returns `null` if attribute doesn't exist
   - **Result**: Container remains empty, no broken link shown

8. **CSS classes for responsive design**:
   - `text-xs`: Small text size to fit in top bar
   - `whitespace-nowrap`: Prevents text wrapping on narrow screens
   - `flex items-center gap-1`: Aligns icon and text horizontally with small gap
   - `hover:text-white hover:underline`: Visual feedback on hover
   - **Mobile consideration**: May need media queries to hide text and show icon-only on very small screens

9. **Timing of script execution**:
   - Script is at the end of the template (after all HTML)
   - **Why**: Ensures DOM elements exist before JavaScript tries to access them
   - **Alternative**: Could use `DOMContentLoaded` event, but not necessary here
   - **Benefit**: Simpler code, immediate execution

10. **Hugo template variable in JavaScript**:
    - `const codetabsId = '{{ $id }}';` embeds Hugo variable in JavaScript
    - **How it works**: Hugo processes template first, outputs static HTML with JavaScript
    - **Result**: Each codetabs instance gets a unique ID in its script
    - **Example output**: `const codetabsId = 'landing-stepconnect';`

**Relationship to Manual Links**:

Some documentation pages may have manual BinderHub links in the markdown content (e.g., "You can try this code out in a Jupyter notebook on Binder"). The automated link in the example box serves the same purpose but is:
- Automatically generated from metadata
- Consistently placed across all examples
- Easier to maintain (no manual URL construction in markdown)
- Visually integrated with the code example UI

**Common Pitfall: Global Synchronization Across Multiple Codetabs Instances**:

When a page contains multiple code example boxes (codetabs instances), a critical implementation detail can cause bugs: **each instance must update independently, but all instances must stay synchronized when the user changes the language selector**.

**The Problem**:

If each codetabs instance has its own independent `updateBinderLink()` function, and you only call that function when its own language selector changes, then:
- When the user changes the language in one dropdown, only that box's function gets called
- The other boxes don't know about the language change
- Result: Only the box where the user clicked shows the updated link; other boxes show stale links

**Why this happens**:

The `codetabs.js` library has a `switchCodeTab()` function that synchronizes all language selector dropdowns on the page when one is changed. However, it updates the dropdowns **without triggering change events** on them. This means:
- The dropdown where the user clicked fires a change event ✅
- The other dropdowns are updated silently (no change event) ❌
- External listeners on those dropdowns never get notified

**Solution**: Implement a global `updateAllBinderLinks()` function that updates ALL binder links on the page:

```javascript
// Global function to update all binder links on the page
window.updateAllBinderLinks = window.updateAllBinderLinks || function() {
    // Find all binder link containers
    const containers = document.querySelectorAll('[id^="binder-link-container-"]');

    containers.forEach((container) => {
        // Extract the codetabs ID from the container ID
        const codetabsId = container.id.replace('binder-link-container-', '');
        const langSelect = document.getElementById('lang-select-' + codetabsId);

        if (!langSelect) return;

        // Get the currently selected tab index
        const selectedOption = langSelect.options[langSelect.selectedIndex];
        const tabIndex = parseInt(selectedOption.getAttribute('data-index'));

        // Find the corresponding panel
        const panels = document.querySelectorAll('[data-codetabs-id="' + codetabsId + '"].panel');
        if (!panels || tabIndex >= panels.length) return;

        const currentPanel = panels[tabIndex];
        const binderId = currentPanel.getAttribute('data-binder-id');

        // Clear existing content
        container.innerHTML = '';

        // Only show the link if the CURRENTLY SELECTED tab has a binderId
        if (binderId) {
            const binderUrl = 'https://redis.io/binder/v2/gh/redis/binder-launchers/' +
                            binderId +
                            '?urlpath=%2Fdoc%2Ftree%2Fdemo.ipynb';

            const link = document.createElement('a');
            link.href = binderUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'text-xs text-slate-300 hover:text-white hover:underline whitespace-nowrap flex items-center gap-1';
            link.title = 'Run this example in an interactive Jupyter notebook';

            link.innerHTML = `
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <span>Run in browser</span>
            `;

            container.appendChild(link);
        }
    });
};

// Initialize on page load with a delay to allow codetabs.js to restore localStorage selection
setTimeout(() => {
    window.updateAllBinderLinks();
}, 100);

// Update all binder links when ANY language selector changes
// Use a small delay to allow codetabs.js to synchronize all dropdowns first
document.querySelectorAll('.lang-selector').forEach((selector) => {
    selector.addEventListener('change', () => {
        setTimeout(window.updateAllBinderLinks, 10);
    });
});
```

**Key implementation details**:

1. **Global function**: Defined once on `window` object, not per-instance
2. **Finds all containers**: Uses `querySelectorAll('[id^="binder-link-container-"]')` to find every binder link container
3. **Loops through each**: For each container, extracts its codetabs ID and updates independently
4. **Delays on page load**: Uses `setTimeout(..., 100)` to allow `codetabs.js` to restore localStorage selection first
5. **Delays on change**: Uses `setTimeout(..., 10)` to allow `codetabs.js` to synchronize all dropdowns first
6. **Listens to all selectors**: Adds change listener to every `.lang-selector` dropdown, not just one per instance

**Why the delays matter**:

- **100ms on page load**: `codetabs.js` is deferred and runs after DOM is ready. It restores the user's language preference from localStorage. Without the delay, our function runs before that restoration completes.
- **10ms on change**: `codetabs.js` has a `switchCodeTab()` function that updates all dropdowns. Without the delay, our function might run before all dropdowns are synchronized.

**This ensures**:
- ✅ Link appears on page load for all boxes with the correct language
- ✅ When user changes language in ANY box, ALL boxes update their links
- ✅ Link disappears in ALL boxes when switching to a language without a notebook
- ✅ Link reappears in ALL boxes when switching back to a language with a notebook
- ✅ No stale or incorrect links shown in any box

#### `layouts/partials/tabs/source.html`

**Purpose**: Read and highlight source code files

**Functionality**:
- Uses Hugo's `readFile` to load example file from `examples/` directory
- Applies syntax highlighting with specified options
- Returns highlighted HTML

---

## File Structure and Conventions

### Directory Structure

Understanding the directory structure in context of the workflow:

```
docs/
├── build/                         # Build scripts (Python)
│   ├── make.py                    # Main orchestrator - run this to process examples
│   ├── local_examples.py          # Local example processor
│   ├── components/                # Processing logic
│   │   ├── component.py           # Remote example processor
│   │   ├── example.py             # Core parser - handles special comments
│   │   ├── util.py                # Utility functions
│   │   └── structured_data.py     # JSON/YAML/TOML handling
│   └── tcedocs/
│       └── README.md              # User-facing documentation
│
├── local_examples/                # SOURCE: Local example files (committed)
│   ├── client-specific/           # Organized by client
│   │   ├── redis-py/              # Python examples
│   │   ├── nodejs/                # Node.js examples
│   │   └── ...
│   ├── cmds_generic/              # Organized by command type
│   └── cmds_hash/
│
├── examples/                      # OUTPUT: Processed files (gitignored, generated)
│   └── {example_id}/              # One directory per example ID
│       ├── {client}_{filename}    # Remote example (from GitHub)
│       └── local_{filename}       # Local example (from local_examples/)
│
├── data/
│   ├── components/                # CONFIG: Component definitions (committed)
│   │   ├── index.json             # Registry of all components
│   │   ├── redis_py.json          # Python client config
│   │   ├── node_redis.json        # Node.js client config
│   │   └── ...
│   └── examples.json              # OUTPUT: Metadata (gitignored, generated)
│
├── layouts/                       # TEMPLATES: Hugo rendering (committed)
│   ├── shortcodes/
│   │   └── clients-example.html   # Shortcode entry point
│   └── partials/
│       ├── tabbed-clients-example.html  # Main rendering logic
│       └── tabs/
│           ├── wrapper.html       # Tab interface HTML
│           └── source.html        # Source code loader
│
├── content/                       # CONTENT: Documentation pages (committed)
│   └── develop/
│       ├── clients/               # Client documentation
│       │   ├── redis-py/
│       │   │   └── connect.md     # Uses {{< clients-example >}}
│       │   └── ...
│       └── data-types/            # Data type documentation
│           └── hashes.md          # Uses {{< clients-example >}}
│
└── config.toml                    # CONFIG: Hugo configuration (committed)
```

**Key Directories**:
- **Committed**: `local_examples/`, `data/components/`, `layouts/`, `content/`, `config.toml`
- **Generated** (gitignored): `examples/`, `data/examples.json`, `public/`
- **Build scripts**: `build/` (committed, but outputs are generated)

### File Naming Conventions

**Example Source Files**:
- Must start with comment: `# EXAMPLE: {example_id}` (or `//` for other languages)
- Example ID should be alphanumeric with underscores or hyphens only
- No multibyte characters in IDs

**Processed Example Files**:
- Remote: `{client_id}_{original_filename}`
  - Example: `redis_py_home_vecsets.py`
- Local: `local_{subdir}_{filename}` or `local_{filename}`
  - Example: `local_client-specific_redis-py_home_vecsets.py`

**Component Configuration Files**:
- Location: `data/components/`
- Format: `{client_id}.json`
- Must be registered in `data/components/index.json`

### Example File Format

```python
# EXAMPLE: example_id
# STEP_START step_name
# REMOVE_START
import test_framework  # This line will be removed
# REMOVE_END

# HIDE_START
# This code is hidden by default
setup_code()
# HIDE_END

# Visible code
def main():
    # This is always visible
    pass
# STEP_END
```

---

## Configuration

### Hugo Configuration (`config.toml`)

**Client Examples Order**:
```toml
[params]
clientsExamples = ["Python", "Node.js", "Java-Sync", "Lettuce-Sync", "Java-Async", "Java-Reactive", "Go", "C", "C#-Sync", "C#-Async", "RedisVL", "PHP", "Rust-Sync", "Rust-Async"]
```

This controls:
- The order of language tabs in the UI
- Which languages are displayed

**Client Configuration**:
```toml
[params.clientsConfig]
"Python"={quickstartSlug="redis-py"}
"Node.js"={quickstartSlug="nodejs"}
"Java-sync"={quickstartSlug="jedis"}
...
```

This maps:
- Language names to quickstart documentation slugs
- Used for generating "Quick-Start" footer links

### Component Configuration (`data/components/{client}.json`)

Example for Python (`redis_py.json`):
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

**Fields**:
- `id`: Unique identifier for the component
- `type`: Component type (usually "client")
- `name`: Display name
- `language`: Language name (must match `config.toml`)
- `label`: Tab label (usually same as language, except RedisVL)
- `repository.git_uri`: GitHub repository URL
- `examples.git_uri`: Repository containing examples
- `examples.path`: Path within repository to search for examples
- `examples.pattern`: Glob pattern for example files

### Component Registry (`data/components/index.json`)

```json
{
    "id": "index",
    "clients": [
        "nredisstack_sync",
        "nredisstack_async",
        "go_redis",
        "node_redis",
        "php",
        "redis_py",
        ...
    ],
    "website": {
        "path": "./",
        "content": "content/",
        "examples": "data/examples.json",
        "examples_path": "examples"
    }
}
```

**Purpose**: Registry of all components to process during build

---

## Working with Examples

### Quick Reference

**Common Tasks**:
```bash
# Full build (first time or after major changes)
make all

# Rebuild examples only (after changing example code)
python3 build/make.py

# Rebuild local examples only (fastest iteration)
python3 build/local_examples.py

# Serve docs locally (auto-reloads on content changes)
hugo serve

# Check if example was processed
grep "example_id" data/examples.json

# View processed example file
cat examples/example_id/processed_file.py
```

**Example Naming Conventions**:
- Use descriptive, lowercase IDs: `hash_basic`, `json_query`, `vector_search`
- Prefix with feature area: `dt_hash_basic` (data type), `cmd_set` (command)
- Use underscores, not hyphens: `set_and_get` not `set-and-get`
- Keep IDs short but meaningful: `conn_pool` not `connection_pooling_example`

**What Makes a Good Example**:
- ✅ **Executable**: Runs as part of test suite
- ✅ **Focused**: Demonstrates one concept clearly
- ✅ **Minimal**: Only essential code (use REMOVE for test setup)
- ✅ **Self-contained**: Doesn't depend on external state
- ✅ **Commented**: Explains non-obvious parts
- ✅ **Interactive** (optional): Includes `BINDER_ID` for "Run in browser" functionality via Jupyter notebooks
- ✅ **Stepped**: Uses STEP_START for multi-part examples
- ❌ **Avoid**: Complex logic, multiple concepts, undocumented magic

### Creating a New Example

**1. Write the Example Code**:

Create a test file in the appropriate client library repository (or `local_examples/` for quick iteration):

```python
# EXAMPLE: my_new_example
# REMOVE_START
import redis
import pytest
# REMOVE_END

# STEP_START connect
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
# STEP_END

# STEP_START set_value
r.set('mykey', 'myvalue')
# STEP_END

# STEP_START get_value
value = r.get('mykey')
print(value)  # Output: myvalue
# STEP_END
```

**2. Test the Example Locally**:

Before committing, ensure the example works:

```bash
# For Python examples
cd /path/to/redis-py
python -m pytest doctests/my_new_example.py -v

# For Node.js examples
cd /path/to/node-redis
npm test -- doctests/my_new_example.js

# For local examples (create a simple test runner)
cd /path/to/docs
python3 local_examples/client-specific/redis-py/my_new_example.py
```

**3. Add to Documentation**:

Reference the example in a Markdown file:

```markdown
Connect to Redis:
{{< clients-example set="my_new_example" step="connect" />}}

Set and retrieve a value:
{{< clients-example set="my_new_example" step="set_value" />}}
{{< clients-example set="my_new_example" step="get_value" />}}
```

**4. Build and Verify**:

```bash
# Process examples
python3 build/make.py

# Verify example appears in examples.json
cat data/examples.json | grep my_new_example

# Build and serve
hugo serve
```

**5. Add BinderHub Support (Optional)**:

If you want to enable the "Run in browser" link for an example:

**Step 1: Create or update the BinderHub launcher**:

The `redis/binder-launchers` repository contains Jupyter notebooks for each example. Jupyter notebooks can run code in multiple languages (Python, Node.js, Java, etc.) through language kernels. You need to:
1. Create a notebook file (e.g., `demo.ipynb`) that runs your example in the appropriate language
2. Ensure the necessary language kernel is configured in the BinderHub environment
3. Commit and push to the `redis/binder-launchers` repository
4. Choose your Git reference strategy:
   - **Branch name** (recommended for active development): Use a descriptive branch name like `python-landing`, `main`, or `feature-xyz`
   - **Commit SHA** (recommended for stable examples): Use the 40-character hexadecimal commit hash

**Step 2: Add BINDER_ID to your example**:

Add the `BINDER_ID` marker as the second line of your example file (after `EXAMPLE:`).

**Option A: Using a branch name** (recommended for active development):
```python
# EXAMPLE: my_new_example
# BINDER_ID python-landing
import redis

# STEP_START connect
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
# STEP_END
```

**Option B: Using a commit SHA** (recommended for stable examples):
```python
# EXAMPLE: my_new_example
# BINDER_ID 6bbed3da294e8de5a8c2ad99abf883731a50d4dd
import redis

# STEP_START connect
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
# STEP_END
```

**Choosing between branch name and commit SHA**:

| Aspect | Branch Name | Commit SHA |
|--------|-------------|------------|
| **Updates** | Automatically uses latest commit on branch | Fixed to specific commit |
| **Stability** | May change if branch is updated | Immutable, always same version |
| **Maintenance** | Easy - just push to branch | Requires updating `BINDER_ID` after each change |
| **Use case** | Active development, frequently updated examples | Stable, production examples |
| **Example** | `python-landing`, `main`, `dev` | `6bbed3da294e8de5a8c2ad99abf883731a50d4dd` |

**Recommendation**: Use branch names during development for easier iteration, then switch to commit SHAs when the example is stable and ready for production.

**Step 3: Rebuild and verify**:

```bash
# Process examples
python3 build/local_examples.py

# Verify binderId appears in metadata
python3 -c "import json; data = json.load(open('data/examples.json')); print(data['my_new_example']['Python'].get('binderId'))"
# Should output: python-landing (or your commit SHA)

# Verify BINDER_ID line is removed from processed file
cat examples/my_new_example/local_*.py | grep BINDER_ID
# Should output nothing (line removed)

# Build Hugo and check the page
hugo serve
# Navigate to the page and verify "Run this example in the browser" link appears
```

**Step 4: Test both formats** (recommended during development):

To ensure the regex pattern works correctly with both branch names and commit SHAs, create temporary test files:

```bash
# Test 1: Branch name
cat > local_examples/test_branch.py << 'EOF'
# EXAMPLE: test_branch
# BINDER_ID main
import redis
r = redis.Redis()
EOF

# Test 2: Commit SHA
cat > local_examples/test_sha.py << 'EOF'
# EXAMPLE: test_sha
# BINDER_ID 6bbed3da294e8de5a8c2ad99abf883731a50d4dd
import redis
r = redis.Redis()
EOF

# Process and verify both
python3 build/local_examples.py

# Check branch name extraction
python3 -c "import json; data = json.load(open('data/examples.json')); print('Branch:', data['test_branch']['Python'].get('binderId'))"
# Expected output: Branch: main

# Check commit SHA extraction
python3 -c "import json; data = json.load(open('data/examples.json')); print('SHA:', data['test_sha']['Python'].get('binderId'))"
# Expected output: SHA: 6bbed3da294e8de5a8c2ad99abf883731a50d4dd

# Verify both lines removed from processed files
grep BINDER_ID examples/test_branch/local_test_branch.py
grep BINDER_ID examples/test_sha/local_test_sha.py
# Both should output nothing

# Clean up test files
rm local_examples/test_branch.py local_examples/test_sha.py
python3 build/local_examples.py  # Rebuild to remove from metadata
```

**Important notes**:
- BinderHub uses **Jupyter notebooks** which support multiple languages through kernels (Python, Node.js, Java, etc.)
- The Git reference (branch or commit) must exist in the `redis/binder-launchers` repository
- The notebook filename is always `demo.ipynb` (hardcoded in the URL)
- The link will only appear if `binderId` exists in the metadata
- **Branch names**: Automatically use the latest commit on that branch (easier maintenance, but may change)
- **Commit SHAs**: Point to a specific immutable version (more stable, but requires manual updates)
- Update the `BINDER_ID` value whenever you want to point to a different version of the notebook
- Ensure the appropriate language kernel is installed in the BinderHub environment for your example's language

### When to Rebuild

**Full rebuild required** (`make all` or `python3 build/make.py`):
- Adding/modifying example source files
- Changing special comment markers
- Updating component configurations
- After pulling new client library versions

**Hugo rebuild only** (`hugo serve` auto-reloads):
- Changing Markdown content
- Modifying shortcode parameters
- Updating Hugo templates
- CSS/JavaScript changes

**No rebuild needed**:
- Reading documentation
- Switching between examples in browser

### Debugging Examples

**Example not appearing**:
1. Check `data/examples.json` - is your example ID present?
2. Verify the `EXAMPLE:` header matches the ID you're using
3. Check build logs for parsing errors
4. Ensure the language is in `config.toml` `clientsExamples`

**Wrong code displayed**:
1. Check the `target` path in `examples.json`
2. Verify the processed file in `examples/{example_id}/`
3. Look for unclosed `HIDE_START` or `REMOVE_START` markers
4. Check that comment prefix matches language in `PREFIXES`

**Highlighting issues**:
1. Verify `STEP_START`/`STEP_END` markers are properly closed
2. Check metadata in `examples.json` for correct line ranges
3. Ensure step name matches between source and shortcode

---

## Extension Points

### Adding a New Programming Language

See [Appendix: Adding a Language](#adding-a-language) for complete step-by-step instructions.

**Quick checklist**:
1. ✅ Update `config.toml` (clientsExamples, clientsConfig)
2. ✅ Create component config in `data/components/`
3. ✅ Register in `data/components/index.json`
4. ✅ Add language to `PREFIXES` in `build/components/example.py` ⚠️ **CRITICAL - DO NOT SKIP**
5. ✅ Add extension mapping in `build/local_examples.py`
6. ✅ Add test markers if needed
7. ⚠️ Check if Jupyter notebook support is needed (update `build/jupyterize/` if applicable)

### Customizing the UI

**Tab Appearance**: Edit `layouts/partials/tabs/wrapper.html`
- Modify Tailwind CSS classes for styling
- Change dropdown selector HTML structure
- Customize button icons (SVG paths)

**Syntax Highlighting**: Edit `layouts/partials/tabbed-clients-example.html`
- Adjust Hugo `highlight` function options
- Modify line number display settings
- Change highlighting color schemes

**Footer Links**: Edit `layouts/partials/tabs/wrapper.html`
- Customize quickstart link format
- Modify GitHub source link appearance
- Add custom footer content or branding

---

## Build Process

### Local Development Build

```bash
# Full build (clean + dependencies + components + hugo)
make all

# Build and serve locally
make serve

# Use local components only (skip GitHub cloning)
make localserve

# Just process components (useful for testing)
python3 build/make.py

# Process only local examples
python3 build/local_examples.py
```

### Build Steps

The build process has strict dependencies - each step requires the previous step to complete:

**1. Clean** (`make clean`):
- Remove `public/` (Hugo output)
- Remove `resources/` (Hugo cache)
- Remove `node_modules/` (Node.js packages)
- Remove `examples/` (processed examples)
- **Why**: Ensures clean slate, prevents stale files

**2. Install Dependencies** (`make deps`):
- `npm install`: Install Node.js dependencies (Tailwind CSS, PostCSS)
- `pip3 install -r requirements.txt`: Install Python dependencies (pytoml, PyYAML, requests)
- **Why**: Required for subsequent build steps
- **Dependency**: None (can run independently)

**3. Process Components** (`make components`):
- Run `python3 build/make.py`
- Clone remote repositories (unless `--skip-clone`)
- Process remote examples from GitHub
- Process local examples from `local_examples/`
- Generate `examples/` directory (processed code files)
- Generate `data/examples.json` (metadata)
- **Why**: Creates the data Hugo needs to render examples
- **Dependency**: Requires Python dependencies from step 2

**4. Build Hugo** (`make hugo`):
- Run `hugo --gc --logLevel debug`
- Process Markdown files
- Render shortcodes (reads `data/examples.json`)
- Load example files (reads `examples/` directory)
- Apply templates and syntax highlighting
- Generate static HTML in `public/`
- **Why**: Produces the final website
- **Dependency**: Requires `examples/` and `data/examples.json` from step 3

**Build Optimization**:
- **First build**: Run `make all` (all steps)
- **Example changes**: Run `python3 build/make.py` then `hugo`
- **Content changes**: Just `hugo serve` (auto-reloads)
- **Template changes**: Just `hugo serve` (auto-reloads)
- **Config changes**: Run `make all` (Hugo needs restart)

### CI/CD Build (GitHub Actions)

**Workflow**: `.github/workflows/main.yml`

**Steps**:
1. Install Hugo (v0.143.1)
2. Checkout repository
3. Run `make all`
4. Install Google Cloud CLI
5. Authenticate to GCS bucket
6. Validate branch name
7. Sync to GCS bucket

**Environment Variables**:
- `PRIVATE_ACCESS_TOKEN`: GitHub token for private repositories
- `REPOSITORY_URL`: Current repository URL (for preview mode)
- `REPO_DIR`: Repository directory (for preview mode)

### Preview Mode

When building from a specific repository (e.g., during PR preview):
- Set `REPOSITORY_URL` environment variable
- Set `REPO_DIR` to repository path
- Build skips checkout for that specific repository
- Uses local files instead of cloning

---

## Troubleshooting

### Build Failures

**"Example not found" warning in Hugo build**:
```
WARN [tabbed-clients-example] Example not found "my_example" for "content/page.md"
```
- **Cause**: Example ID doesn't exist in `data/examples.json`
- **Fix**:
  1. Check the `EXAMPLE:` header in source file matches the ID
  2. Rebuild examples: `python3 build/make.py`
  3. Verify entry exists: `grep my_example data/examples.json`

**"Unknown language" error during build**:
```
ERROR: Unknown language "newlang" for example /path/to/file
```
- **Cause**: Language not configured in `PREFIXES` dictionary
- **Fix**: Add language to `build/components/example.py` PREFIXES

**Git clone failures**:
```
ERROR: command failed: git clone https://github.com/...
```
- **Cause**: Network issues or missing GitHub token for private repos
- **Fix**:
  1. Check network connectivity
  2. For private repos, set `PRIVATE_ACCESS_TOKEN` environment variable
  3. Use `--skip-clone` flag to skip cloning during development

**Python import errors**:
```
ModuleNotFoundError: No module named 'pytoml'
```
- **Cause**: Missing Python dependencies
- **Fix**: `pip3 install -r requirements.txt`

### Display Issues

**Example shows test code/imports**:
- **Cause**: Missing or incorrect `REMOVE_START`/`REMOVE_END` markers
- **Fix**: Wrap test-specific code in REMOVE blocks
- **Verify**: Check processed file in `examples/{example_id}/`

**Code highlighting wrong lines**:
- **Cause**: Line ranges in metadata don't match processed file
- **Fix**:
  1. Check for unclosed `HIDE_START` or `STEP_START` markers
  2. Rebuild to regenerate metadata
  3. Inspect `highlight` array in `data/examples.json`

**Wrong language variant shown** (e.g., Java-Sync instead of Java-Async):
- **Cause**: Path-based override not matching
- **Fix**: Ensure file is in correct subdirectory (e.g., `lettuce-async/`)
- **Verify**: Check `local_examples.py` path override logic

**Tab not appearing for a language**:
- **Cause**: Language not in `config.toml` or example doesn't exist for that language
- **Fix**:
  1. Verify language in `clientsExamples` array
  2. Check `data/examples.json` has entry for that language
  3. Ensure `label` field matches exactly (case-sensitive)

**"Run in browser" link not appearing in all boxes when language changes**:
- **Symptom**: When you change the language selector in one code example box, the "Run in browser" link updates in that box but not in other boxes on the same page
- **Cause**: Each codetabs instance has its own change event listener, but `codetabs.js` synchronizes all dropdowns without triggering change events on the non-selected ones
- **Fix**: Implement a global `updateAllBinderLinks()` function (see [Common Pitfall: Global Synchronization Across Multiple Codetabs Instances](#common-pitfall-global-synchronization-across-multiple-codetabs-instances))
- **Verify**:
  1. Open a page with multiple code examples (e.g., `/develop/data-types/hashes/`)
  2. Select a language with notebooks (e.g., Python)
  3. Verify ALL boxes show the "Run in browser" link
  4. Switch to a language without notebooks (e.g., Java-Async)
  5. Verify ALL boxes hide the link
  6. Switch back to Python
  7. Verify ALL boxes show the link again

**BINDER_ID not extracted or appearing in output**:
- **Symptom 1**: `binderId` field missing from `data/examples.json`
  - **Cause**: Regex pattern not matching the line
  - **Debug**:
    1. Check comment prefix matches language: `# BINDER_ID` for Python, `// BINDER_ID` for JavaScript
    2. Verify value format:
       - **Branch name**: Letters, numbers, hyphens, underscores (e.g., `python-landing`, `main`)
       - **Commit SHA**: Exactly 40 hexadecimal characters (e.g., `6bbed3da294e8de5a8c2ad99abf883731a50d4dd`)
    3. Check for extra whitespace or special characters
    4. Run with debug logging: `python3 build/local_examples.py --loglevel DEBUG`
    5. Look for "Found BINDER_ID" message in logs
  - **Fix**: Ensure format is exactly `{comment_prefix} BINDER_ID {git-reference}`

- **Symptom 2**: `BINDER_ID` line appears in processed output file
  - **Cause**: `output = False` not set in detection logic
  - **Fix**: Verify the `elif re.search(binder, l):` block sets `output = False`
  - **Verify**: Check processed file in `examples/{example_id}/` - should not contain `BINDER_ID` line

- **Symptom 3**: `"binderId": null` in metadata
  - **Cause**: Field added unconditionally instead of conditionally
  - **Fix**: Only add field if `example.binder_id` is not None:
    ```python
    if example.binder_id:
        example_metadata['binderId'] = example.binder_id
    ```

- **Symptom 4**: Wrong value extracted
  - **Cause**: Regex capture group not matching correctly
  - **Debug**: Check the regex pattern includes capture group: `([a-zA-Z0-9_-]+)`
  - **Fix**: Ensure using `match.group(1)` to extract the captured value
  - **Verify**: Value should match what's in the source file (branch name or commit SHA)

**BinderHub "Run in browser" link issues**:
- **Symptom 1**: Link not appearing in example box
  - **Cause 1**: No `binderId` in metadata
    - **Debug**:
      ```bash
      # Check if binderId exists in metadata
      python3 -c "import json; data = json.load(open('data/examples.json')); print(data['example_id']['Python'].get('binderId'))"
      ```
    - **Fix**: Add `BINDER_ID` marker to source file and rebuild with `python3 build/local_examples.py`

  - **Cause 2**: `data-binder-id` attribute missing from HTML
    - **Debug**:
      1. Open page in browser
      2. Right-click on example box → Inspect
      3. Find the panel div (class `panel`)
      4. Check if it has `data-binder-id` attribute
    - **Expected**: `<div class="panel" ... data-binder-id="6bbed3da294e8de5a8c2ad99abf883731a50d4dd" ...>`
    - **If missing**: Template not passing `binderId` through tab data
    - **Fix**: Verify `layouts/partials/tabbed-clients-example.html` includes `"binderId" $binderId` in tab dict

  - **Cause 3**: JavaScript not executing
    - **Debug**:
      1. Open browser console (F12 → Console tab)
      2. Look for JavaScript errors
      3. Type: `document.getElementById('binder-link-container-landing-stepconnect')` (replace with actual ID)
      4. Should return the container element, not `null`
    - **If null**: Container div not rendered or ID mismatch
    - **Fix**: Check `layouts/partials/tabs/wrapper.html` has container div with correct ID format

  - **Cause 4**: JavaScript can't find panels
    - **Debug**:
      1. Open browser console
      2. Type: `document.querySelectorAll('[data-codetabs-id="landing-stepconnect"].panel')` (replace with actual ID)
      3. Should return NodeList with panel elements
    - **If empty**: Panels missing `data-codetabs-id` attribute
    - **Fix**: Add `data-codetabs-id="{{ $id }}"` to panel divs in wrapper template

- **Symptom 2**: Link appears but URL is malformed
  - **Cause 1**: Missing URL encoding in JavaScript
    - **Debug**:
      1. Right-click link → Inspect
      2. Check `href` attribute value
      3. Or hover over link and check browser status bar
    - **Expected**: `https://redis.io/binder/v2/gh/redis/binder-launchers/6bbed3da294e8de5a8c2ad99abf883731a50d4dd?urlpath=%2Fdoc%2Ftree%2Fdemo.ipynb`
    - **Wrong**: `?urlpath=/doc/tree/demo.ipynb` (missing `%2F` encoding)
    - **Fix**: JavaScript should use `%2F` directly (not `%%2F` - that's for Hugo templates)
    - **Correct code**: `'?urlpath=%2Fdoc%2Ftree%2Fdemo.ipynb'`

  - **Cause 2**: Wrong notebook filename
    - **Debug**: Check URL ends with `demo.ipynb`
    - **Fix**: Always use `demo.ipynb` - do not change per example

  - **Cause 3**: `binderId` value is incorrect in JavaScript
    - **Debug**:
      1. Open browser console
      2. Find the current panel: `document.querySelector('.panel:not(.panel-hidden)')`
      3. Check attribute: `panel.getAttribute('data-binder-id')`
      4. Should be a valid Git reference (branch name or 40-character commit SHA)
    - **If wrong**: Check metadata in `data/examples.json`
    - **Fix**: Verify `BINDER_ID` in source file is correct (matches what's in `redis/binder-launchers` repo)

- **Symptom 3**: Link opens but BinderHub shows error
  - **Cause 1**: Invalid commit hash in `binderId`
    - **Debug**: Verify hash exists in `redis/binder-launchers` repository
    - **Fix**: Update `BINDER_ID` in source file to valid commit SHA
  - **Cause 2**: BinderHub launcher not configured for this commit
    - **Debug**: Check `redis/binder-launchers` repository for the commit
    - **Fix**: Ensure the commit has the necessary notebook and configuration files

- **Symptom 4**: Link appears but example doesn't work in BinderHub
  - **Cause**: Language kernel not installed in BinderHub environment
  - **Fix**: Ensure the `redis/binder-launchers` repository has the necessary kernel configuration
  - **Note**: Jupyter notebooks can run multiple languages (Python, Node.js, Java, etc.) through kernels

- **Symptom 5**: Link doesn't update when changing languages
  - **Cause 1**: Event listener not attached
    - **Debug**:
      1. Open browser console
      2. Change language selector
      3. Check if `updateBinderLink()` is called (add `console.log` to function)
    - **Fix**: Verify `langSelect.addEventListener('change', updateBinderLink)` is in script

  - **Cause 2**: Container not being cleared
    - **Debug**:
      1. Switch from language with `binderId` to one without
      2. Check if old link remains visible
    - **Fix**: Ensure `container.innerHTML = ''` is called at start of `updateBinderLink()`

  - **Cause 3**: Wrong panel being queried
    - **Debug**:
      1. Add to script: `console.log('Tab index:', tabIndex, 'Panel:', currentPanel)`
      2. Change language and check console output
    - **Fix**: Verify `data-index` attribute on `<option>` elements matches panel order

- **Symptom 6**: Link text or styling is wrong
  - **Cause**: CSS classes or HTML structure doesn't match theme
  - **Debug**:
    1. Right-click link → Inspect
    2. Check computed styles in browser dev tools
    3. Verify Tailwind classes are being applied
  - **Expected classes**: `text-xs text-slate-300 hover:text-white hover:underline whitespace-nowrap flex items-center gap-1`
  - **Fix**: Update template HTML/CSS to match theme's design system

- **Symptom 7**: Multiple links appear or wrong link shown
  - **Cause**: Multiple codetabs instances interfering with each other
  - **Debug**:
    1. Check page has multiple example boxes
    2. Verify each has unique `data-codetabs-id`
    3. Console: `document.querySelectorAll('[id^="binder-link-container-"]')`
  - **Fix**: Ensure each codetabs instance has unique `{{ $id }}` value
  - **Prevention**: IIFE scope prevents variable conflicts

- **Symptom 8**: JavaScript errors in console
  - **Common errors**:
    - `Cannot read property 'getAttribute' of undefined`: Panel not found
      - **Fix**: Check `data-codetabs-id` matches between container and panels
    - `container is null`: Container div not rendered
      - **Fix**: Verify container div exists in wrapper template
    - `langSelect is null`: Language selector not found
      - **Fix**: Check `id="lang-select-{{ $id }}"` on select element
  - **Debug approach**:
    1. Note the error message and line number
    2. Check which variable is null/undefined
    3. Verify the corresponding HTML element exists with correct ID
    4. Check for typos in ID construction

### Performance Issues

**Build takes too long**:
- **Cause**: Cloning large repositories repeatedly
- **Fix**: Use `--skip-clone` during development
- **Note**: First build will always be slow; subsequent builds reuse cloned repos

**Hugo serve slow to reload**:
- **Cause**: Processing hundreds of example files on each change
- **Fix**: Hugo only reloads on template/content changes, not example changes
- **Workaround**: If modifying examples, use `python3 build/local_examples.py` separately

### Getting Help

1. **Check build logs**: Look for ERROR or WARN messages
2. **Inspect generated files**:
   - `data/examples.json` for metadata
   - `examples/{example_id}/` for processed code
3. **Compare with working example**: Find a similar working example and diff the files
4. **Review this spec**: Check configuration requirements and file formats
5. **Consult user guide**: `for-ais-only/tcedocs/README.md` for author-focused documentation

---

## Appendix

### Related Documentation

- **User Guide**: `for-ais-only/tcedocs/README.md` - For documentation authors
- **Hugo Documentation**: https://gohugo.io/documentation/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Makefile**: See `Makefile` for all available build commands

### Language Mappings

**File Extensions to Languages** (`build/local_examples.py`):
```python
{
    '.py': 'python',
    '.js': 'node.js',
    '.go': 'go',
    '.cs': 'c#',
    '.java': 'java',
    '.php': 'php',
    '.rs': 'rust'
}
```

**Comment Prefixes** (`build/components/example.py`):
```python
{
    'python': '#',
    'node.js': '//',
    'java': '//',
    'java-sync': '//',
    'java-async': '//',
    'java-reactive': '//',
    'go': '//',
    'c#': '//',
    'c#-sync': '//',
    'c#-async': '//',
    'redisvl': '#',
    'php': '//',
    'rust': '//',
    'rust-sync': '//',
    'rust-async': '//'
}
```

**Test Markers** (removed from output):
```python
{
    'java': '@Test',
    'java-sync': '@Test',
    'java-async': '@Test',
    'java-reactive': '@Test',
    'c#': r'\[Fact]|\[SkipIfRedis\(.*\)]',
    'c#-sync': r'\[Fact]|\[SkipIfRedis\(.*\)]',
    'c#-async': r'\[Fact]|\[SkipIfRedis\(.*\)]',
    'rust': r'#\[test]|#\[cfg\(test\)]|#\[tokio::test]'
}
```

### Adding a Language

Complete step-by-step guide for adding a new programming language to the system.

**Prerequisites**:
- Client library repository with example code
- Examples follow the test-driven approach (executable code)
- Examples use special comment markers

**Step 1: Update Hugo Configuration**

Edit `config.toml`:
```toml
[params]
# Add to the end of the array (or desired position)
clientsExamples = ["Python", "Node.js", ..., "NewLang"]

[params.clientsConfig]
# Add configuration for quickstart link
"NewLang"={quickstartSlug="newlang"}
```

**Step 2: Create Component Configuration**

Create `data/components/newlang_client.json`:
```json
{
    "id": "newlang_client",
    "type": "client",
    "name": "newlang-client",
    "language": "NewLang",
    "label": "NewLang",
    "repository": {
        "git_uri": "https://github.com/redis/newlang-client"
    },
    "examples": {
        "git_uri": "https://github.com/redis/newlang-client",
        "path": "doctests",
        "pattern": "*.nl"
    }
}
```

**Field explanations**:
- `id`: Unique identifier (used in filenames)
- `language`: Must match `clientsExamples` in config.toml
- `label`: Display name in tabs (usually same as language)
- `examples.path`: Directory in repo containing examples
- `examples.pattern`: Glob pattern for example files

**Step 3: Register Component**

Edit `data/components/index.json`:
```json
{
    "clients": [
        "nredisstack_sync",
        ...
        "newlang_client"  // Add here
    ]
}
```

**Step 4: Update Example Parser**

Edit `build/components/example.py`:
```python
PREFIXES = {
    'python': '#',
    ...
    'newlang': '//',  // Add comment prefix for the language
}

# Only if language has test markers to remove:
TEST_MARKER = {
    'java': '@Test',
    ...
    'newlang': r'@TestAnnotation',  // Add test marker regex
}
```

**Step 5: Update Local Examples Processor**

Edit `build/local_examples.py`:
```python
EXTENSION_TO_LANGUAGE = {
    '.py': 'python',
    ...
    '.nl': 'newlang',  // Add file extension mapping
}

LANGUAGE_TO_CLIENT = {
    'python': 'Python',
    ...
    'newlang': 'NewLang',  // Add language to client name mapping
}
```

**Step 6: Test the Integration**

```bash
# Clean and rebuild
make clean
make all

# Check that examples were processed
cat data/examples.json | grep NewLang

# Serve and verify in browser
hugo serve
```

**Step 7: Add Example Code**

In the client repository, create example files:
```newlang
// EXAMPLE: newlang_basic
// REMOVE_START
import test_framework
// REMOVE_END

// STEP_START connect
client = new RedisClient("localhost", 6379)
// STEP_END

// STEP_START set_get
client.set("key", "value")
value = client.get("key")
// STEP_END
```

**Step 8: Reference in Documentation**

In Markdown files:
```markdown
{{< clients-example set="newlang_basic" step="connect" />}}
```

### Metadata Schema

**`data/examples.json` Structure**:
```json
{
  "example_id": {
    "Language": {
      "source": "path/to/original/file",
      "language": "lowercase_language",
      "target": "examples/example_id/processed_file",
      "highlight": ["1-10", "15-20"],
      "hidden": ["5-8"],
      "named_steps": {
        "step_name": "1-5"
      },
      "sourceUrl": "https://github.com/...",
      "binderId": "6bbed3da294e8de5a8c2ad99abf883731a50d4dd"
    }
  }
}
```

**Field descriptions**:
- `source`: Original file path (before processing)
- `language`: Lowercase language identifier
- `target`: Processed file path (what Hugo reads)
- `highlight`: Line ranges to highlight (1-based, inclusive)
- `hidden`: Line ranges initially hidden (revealed with eye button)
- `named_steps`: Map of step names to line ranges
- `sourceUrl`: GitHub link to original source (null for local examples)
- `binderId`: **Optional** - BinderHub commit hash for interactive notebook link (string, only present if `BINDER_ID` marker exists in source file)

**Metadata Hierarchy**:
- The `binderId` field is stored **per-language**, not per-example-set
- This allows different languages to have different BinderHub configurations
- Example: Python might have a BinderHub link, while Node.js doesn't
- If `BINDER_ID` marker is not present in the source file, the `binderId` field should be omitted entirely (not set to null or empty string)

### Special Comment Reference

| Marker | Purpose | Example | Notes |
|--------|---------|---------|-------|
| `EXAMPLE: id` | Define example ID | `# EXAMPLE: home_vecsets` | **Required**. Must be first line. Removed from processed output. |
| `BINDER_ID ref` | Define BinderHub Git reference | `# BINDER_ID python-landing`<br>`# BINDER_ID 6bbed3da294e8de5a8c2ad99abf883731a50d4dd` | **Optional**. Typically line 2 (after EXAMPLE). Value can be a Git branch name (e.g., `python-landing`, `main`) or commit SHA (40 hex chars). Removed from processed output. Stored as `binderId` in metadata. Used to generate interactive Jupyter notebook links. |
| `HIDE_START` | Start hidden block | `# HIDE_START` | Code hidden by default, revealed with eye button |
| `HIDE_END` | End hidden block | `# HIDE_END` | Must close HIDE_START |
| `REMOVE_START` | Start removed block | `# REMOVE_START` | Code completely removed from output |
| `REMOVE_END` | End removed block | `# REMOVE_END` | Must close REMOVE_START |
| `STEP_START name` | Start named step | `# STEP_START connect` | Name is lowercase. Removed from output. |
| `STEP_END` | End named step | `# STEP_END` | Must close STEP_START. Removed from output. |

**Important**:
- All markers must use the correct comment prefix for the language (see [Language Mappings](#language-mappings))
- Marker lines (`EXAMPLE:`, `BINDER_ID`, `STEP_START`, `STEP_END`, `HIDE_START`, `HIDE_END`, `REMOVE_START`, `REMOVE_END`) are **removed** from the processed output file
- Only the code between markers appears in the final processed file
- Line numbers in metadata (highlight, hidden, named_steps) refer to the processed file, not the source file

### Shortcode Parameter Reference

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `set` | string | Yes | - | Example set name (matches EXAMPLE: ID) |
| `step` | string | No | "" | Named step to display (from STEP_START) |
| `lang_filter` | string | No | "" | Comma-separated language filter |
| `max_lines` | int | No | 100 | Max lines shown before "show more" |
| `dft_tab_name` | string | No | ">_ Redis CLI" | Custom name for CLI tab |
| `dft_tab_link_title` | string | No | - | Custom footer link text for CLI tab |
| `dft_tab_url` | string | No | - | Custom footer link URL for CLI tab |
| `show_footer` | bool | No | true | Show/hide footer with links |

**Usage examples**:
```markdown
<!-- Basic usage -->
{{< clients-example set="example_id" />}}

<!-- With step -->
{{< clients-example set="example_id" step="connect" />}}

<!-- Filter to specific languages -->
{{< clients-example set="example_id" lang_filter="Python,Node.js" />}}

<!-- With redis-cli content -->
{{< clients-example set="example_id" step="" >}}
> SET key value
OK
> GET key
"value"
{{< /clients-example >}}
```

### Language Filter Matching Behavior

The `lang_filter` parameter uses **exact matching** on comma-separated language names:

**Matching Logic**:
1. Split the filter string by commas (e.g., `"C#-Sync,C#-Async"` → `["C#-Sync", "C#-Async"]`)
2. Trim whitespace from each language name
3. For each configured language in `config.toml`, check if it exactly matches any value in the filter list
4. Only include languages that match exactly

**Examples**:
- `lang_filter="C#-Sync,C#-Async"` → Shows only C# sync and async tabs
- `lang_filter="Python"` → Shows only Python tab
- `lang_filter="Python,Node.js"` → Shows Python and Node.js tabs
- `lang_filter="C"` → Shows only C tab (does NOT match "C#-Sync" or "C#-Async")

**Important**: Language names must match exactly as they appear in `config.toml`. This prevents accidental matches when one language name is a substring of another (e.g., "C" is a substring of "C#-Sync", but they are treated as distinct languages).

**Implementation**: See `layouts/partials/tabbed-clients-example.html` for the matching logic.


## Lessons Learned: Adding the C (hiredis) Client

### Critical Discovery: The PREFIXES Dictionary

When adding the C client, a critical step was initially missed: **adding the language to the `PREFIXES` dictionary in `build/components/example.py`**.

**Why this matters**: The `PREFIXES` dictionary maps each language to its comment prefix character(s). This is used by the example parser to:
- Identify special markers like `EXAMPLE:`, `STEP_START`, `HIDE_START`, etc.
- Parse metadata from source files
- Process example files correctly

**What happens if you skip this step**:
- The example parser will fail with an error: `Unknown language "c" for example {path}`
- Examples won't be processed
- The build system will silently skip C examples
- No error message will appear in the build output (just a debug log)

**The fix**:
```python
# In build/components/example.py, add to PREFIXES dictionary:
PREFIXES = {
    ...
    'c': '//',  # C uses // for comments
    ...
}
```

### Complete Checklist for Adding a New Language

The original checklist was incomplete. Here's the comprehensive version:

**Configuration Files**:
1. ✅ `config.toml` - Add to `clientsExamples` list and `clientsConfig` section
2. ✅ `data/components/{language}.json` - Create component configuration
3. ✅ `data/components/index.json` - Register the component

**Build System**:
4. ✅ `build/components/example.py` - **CRITICAL**: Add to `PREFIXES` dictionary
5. ✅ `build/components/example.py` - Add to `TEST_MARKER` dictionary (if language has test annotations)
6. ✅ `build/local_examples.py` - Add file extension mapping to `EXTENSION_TO_LANGUAGE`
7. ✅ `build/local_examples.py` - Add language to `LANGUAGE_TO_CLIENT` mapping

**Optional (if Jupyter notebook support is needed)**:
8. ⚠️ `build/jupyterize/jupyterize.py` - Add to `KERNEL_SPECS` dictionary
9. ⚠️ `build/jupyterize/jupyterize_config.json` - Add language-specific boilerplate and unwrap patterns

**Documentation**:
10. ✅ `for-ais-only/tcedocs/SPECIFICATION.md` - Update examples and checklist
11. ✅ `for-ais-only/tcedocs/README.md` - Update tables and examples

### Pre-existing Examples

**Important**: Before adding a new language, check if examples already exist in the repository:
- Look in `local_examples/client-specific/{language}/` for local examples
- Check the client repository for remote examples
- Verify the component configuration points to the correct example directory

For C (hiredis), there was already a `landing.c` example in `local_examples/client-specific/c/` that was ready to be processed once the language was properly configured.

### Language-Specific Comment Prefixes

Different languages use different comment styles. When adding a language, ensure the correct prefix is used:

| Language | Prefix | Example |
|----------|--------|---------|
| Python | `#` | `# EXAMPLE: my_example` |
| C | `//` | `// EXAMPLE: my_example` |
| Java | `//` | `// EXAMPLE: my_example` |
| Go | `//` | `// EXAMPLE: my_example` |
| C# | `//` | `// EXAMPLE: my_example` |
| PHP | `//` | `// EXAMPLE: my_example` |
| Rust | `//` | `// EXAMPLE: my_example` |
| Node.js | `//` | `// EXAMPLE: my_example` |

**Critical**: The `PREFIXES` dictionary uses **lowercase** language names as keys, but the `Example` class converts the language to lowercase before accessing it (line 57 in `example.py`).

### Verification Steps

After adding a new language, verify the integration:

```bash
# 1. Check that the language is recognized
grep -r "c" build/components/example.py  # Should find 'c': '//' in PREFIXES

# 2. Process examples
python3 build/local_examples.py

# 3. Verify examples were processed
grep -i "landing" data/examples.json | grep -i "c"

# 4. Check for errors in the build output
python3 build/make.py 2>&1 | grep -i "error\|unknown language"

# 5. Build and serve
hugo serve
```

### Common Mistakes to Avoid

1. **Forgetting the PREFIXES entry**: This is the most common mistake. The build will appear to succeed but examples won't be processed.

2. **Case sensitivity**: Language names in `PREFIXES` must be lowercase, but `clientsExamples` in `config.toml` uses proper case (e.g., `"C"` not `"c"`).

3. **Inconsistent naming**: Ensure the language name is consistent across:
   - `config.toml` clientsExamples (proper case, e.g., `"C"`)
   - `config.toml` clientsConfig keys (proper case, e.g., `"C"`)
   - `build/local_examples.py` LANGUAGE_TO_CLIENT values (proper case, e.g., `'C'`)
   - `build/components/example.py` PREFIXES keys (lowercase, e.g., `'c'`)

4. **Missing component registration**: If the component isn't registered in `data/components/index.json`, remote examples won't be fetched.

5. **Wrong file extension mapping**: Ensure the file extension correctly maps to the language name in `EXTENSION_TO_LANGUAGE`.

### Single-Variant vs Multi-Variant Languages

**Single-variant languages** (Python, Go, PHP, C):
- One client implementation per language
- No path-based client name overrides needed
- File extension mapping is straightforward

**Multi-variant languages** (Java, Rust, C#):
- Multiple client implementations (e.g., Sync, Async, Reactive)
- Require path-based client name overrides in `get_client_name_from_language_and_path()`
- More complex configuration

C is a single-variant language, so it doesn't require path-based overrides.
