# Code Example System - Technical Specification

> **For Documentation Authors**: See `build/tcedocs/README.md` for user-facing documentation on writing examples.

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

- Java files in `lettuce-async/` → `Java-Async` (Lettuce async client)
- Java files in `lettuce-reactive/` → `Java-Reactive` (Lettuce reactive client)
- Java files elsewhere → `Java-Sync` (Jedis synchronous client)
- Rust files in `rust-async/` → `Rust-Async`
- Rust files in `rust-sync/` → `Rust-Sync`
- C# files in `async/` → `C#-Async`
- C# files in `sync/` → `C#-Sync`

This allows the same language to appear multiple times in the tab interface with different implementations.

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

In the `make_ranges()` method, add the regex pattern compilation alongside other patterns (after `exid` pattern):
```python
exid = re.compile(f'{PREFIXES[self.language]}\\s?{EXAMPLE}')
binder = re.compile(f'{PREFIXES[self.language]}\\s?{BINDER_ID}\\s+([a-f0-9]{{40}})')
go_output = re.compile(f'{PREFIXES[self.language]}\\s?{GO_OUTPUT}')
```

**Pattern explanation**:
- `{PREFIXES[self.language]}` - Language-specific comment prefix (e.g., `#` or `//`)
- `\\s?` - Optional whitespace after comment prefix
- `{BINDER_ID}` - The literal string "BINDER_ID"
- `\\s+` - Required whitespace before hash
- `([a-f0-9]{40})` - Capture group for exactly 40 hexadecimal characters

**3. Detection and Extraction**:

Add detection logic in the main processing loop, **after** the `EXAMPLE:` check and **before** the `GO_OUTPUT` check:

```python
elif re.search(exid, l):
    output = False
    pass
elif re.search(binder, l):
    # Extract BINDER_ID hash value
    match = re.search(binder, l)
    if match:
        self.binder_id = match.group(1)
        logging.debug(f'Found BINDER_ID: {self.binder_id} in {self.path}:L{curr+1}')
    output = False  # CRITICAL: Skip this line from output
elif self.language == "go" and re.search(go_output, l):
    # ... rest of processing
```

**Critical implementation details**:
- **Must set `output = False`**: This prevents the line from being added to the `content` array
- **Placement matters**: Must be in the `elif` chain, not a separate `if` statement
- **No `content.append(l)`**: The line is skipped entirely, just like `EXAMPLE:` lines
- **Extract before setting output**: Get the hash value before marking the line to skip

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

**6. Complete Example Flow**:

Here's a complete example showing how a file is processed:

**Input file** (`local_examples/client-specific/redis-py/landing.py`):
```python
# EXAMPLE: landing
# BINDER_ID 6bbed3da294e8de5a8c2ad99abf883731a50d4dd
import redis

# STEP_START connect
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
# STEP_END
```

**Processing steps**:
1. Line 1: `EXAMPLE:` detected → `output = False` → line skipped
2. Line 2: `BINDER_ID` detected → extract hash `6bbed3da294e8de5a8c2ad99abf883731a50d4dd` → `output = False` → line skipped
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
      "binderId": "6bbed3da294e8de5a8c2ad99abf883731a50d4dd"
    }
  }
}
```

**Key observations**:
- Both `EXAMPLE:` and `BINDER_ID` lines are removed from output
- Line numbers in metadata refer to the processed file (after marker removal)
- `binderId` is stored at the language level, not the example set level
- The hash value is extracted cleanly without comment prefix or keyword

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
- **Binder ID**: The Git commit SHA from `binderId` field (40 hexadecimal characters)
- **URL Path**: `?urlpath=%2Fdoc%2Ftree%2Fdemo.ipynb` (constant, URL-encoded path to notebook)
- **Notebook filename**: Always `demo.ipynb` - do NOT change per example

**Example**:
```
https://redis.io/binder/v2/gh/redis/binder-launchers/6bbed3da294e8de5a8c2ad99abf883731a50d4dd?urlpath=%2Fdoc%2Ftree%2Fdemo.ipynb
```

**Implementation in Hugo Template**:

The `layouts/shortcodes/clients-example.html` template should implement this feature as follows:

**1. Access the binderId from template context**:

```go-html-template
{{- $exampleSet := .Get "set" -}}
{{- $exampleData := index $.Site.Data.examples $exampleSet -}}

{{- range $lang, $langConfig := $.Site.Params.clientsexamples -}}
  {{- $langData := index $exampleData $langConfig.label -}}
  {{- if $langData -}}
    {{- $binderId := $langData.binderId -}}
    {{- /* binderId is now available for this language */ -}}
  {{- end -}}
{{- end -}}
```

**2. Construct the BinderHub URL**:

```go-html-template
{{- if $binderId -}}
  {{- $binderUrl := printf "https://redis.io/binder/v2/gh/redis/binder-launchers/%s?urlpath=%%2Fdoc%%2Ftree%%2Fdemo.ipynb" $binderId -}}
{{- end -}}
```

**3. Render the link in the top bar**:

The link should be placed in the top bar of the example box, alongside the existing menu icon. The exact HTML structure depends on the theme, but conceptually:

```html
<div class="example-top-bar">
  <!-- Language selector -->
  <select>...</select>

  <!-- BinderHub link (conditional) -->
  {{ if $binderId }}
  <a href="{{ $binderUrl }}"
     target="_blank"
     rel="noopener noreferrer"
     class="binder-link"
     title="Run this example in an interactive Jupyter notebook">
    Run this example in the browser
  </a>
  {{ end }}

  <!-- Menu icon -->
  <button class="menu-icon">...</button>
</div>
```

**4. Styling considerations**:

- Link should be visually distinct but not overwhelming
- Should work on mobile devices (may need to be icon-only on small screens)
- Should indicate it opens in a new tab/window
- Consider adding a BinderHub icon for visual recognition

**Data Flow**:

1. **Build time**: Python scripts extract `BINDER_ID` from source files → store in `data/examples.json`
2. **Hugo build**: Template reads `binderId` from `$.Site.Data.examples[exampleSet][language].binderId`
3. **Template logic**: If `binderId` exists, construct URL and render link
4. **Runtime**: User clicks link → opens BinderHub in new tab

**Important Notes**:

- **Language-specific**: Each language in an example set can have its own `binderId`
- **Multi-language support**: BinderHub uses Jupyter notebooks which can execute code in multiple languages (Python, Node.js, Java, etc.) through language kernels
- **Notebook filename is constant**: Always use `demo.ipynb` - the BinderHub launcher repository handles routing to the correct example
- **URL encoding**: The `?urlpath=%2Fdoc%2Ftree%2Fdemo.ipynb` part is URL-encoded (`%2F` = `/`)
- **External dependency**: Requires the `redis/binder-launchers` repository to be properly configured with the commit referenced by `binderId`

**Relationship to Manual Links**:

Some documentation pages may have manual BinderHub links in the markdown content (e.g., "You can try this code out in a Jupyter notebook on Binder"). The automated link in the example box serves the same purpose but is:
- Automatically generated from metadata
- Consistently placed across all examples
- Easier to maintain (no manual URL construction in markdown)
- Visually integrated with the code example UI

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
clientsExamples = ["Python", "Node.js", "Java-Sync", "Java-Async", "Java-Reactive", "Go", "C#-Sync", "C#-Async", "RedisVL", "PHP", "Rust-Sync", "Rust-Async"]
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
4. Note the commit SHA (40-character hexadecimal hash)

**Step 2: Add BINDER_ID to your example**:

Add the `BINDER_ID` marker as the second line of your example file (after `EXAMPLE:`):

```python
# EXAMPLE: my_new_example
# BINDER_ID 6bbed3da294e8de5a8c2ad99abf883731a50d4dd
import redis

# STEP_START connect
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
# STEP_END
```

**Step 3: Rebuild and verify**:

```bash
# Process examples
python3 build/local_examples.py

# Verify binderId appears in metadata
python3 -c "import json; data = json.load(open('data/examples.json')); print(data['my_new_example']['Python'].get('binderId'))"
# Should output: 6bbed3da294e8de5a8c2ad99abf883731a50d4dd

# Verify BINDER_ID line is removed from processed file
cat examples/my_new_example/local_*.py | grep BINDER_ID
# Should output nothing (line removed)

# Build Hugo and check the page
hugo serve
# Navigate to the page and verify "Run this example in the browser" link appears
```

**Important notes**:
- BinderHub uses **Jupyter notebooks** which support multiple languages through kernels (Python, Node.js, Java, etc.)
- The commit hash must exist in the `redis/binder-launchers` repository
- The notebook filename is always `demo.ipynb` (hardcoded in the URL)
- The link will only appear if `binderId` exists in the metadata
- Update the `BINDER_ID` hash whenever you update the notebook in the launcher repository
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
4. ✅ Add language to `PREFIXES` in `build/components/example.py`
5. ✅ Add extension mapping in `build/local_examples.py`
6. ✅ Add test markers if needed

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

**BINDER_ID not extracted or appearing in output**:
- **Symptom 1**: `binderId` field missing from `data/examples.json`
  - **Cause**: Regex pattern not matching the line
  - **Debug**:
    1. Check comment prefix matches language: `# BINDER_ID` for Python, `// BINDER_ID` for JavaScript
    2. Verify hash is exactly 40 hexadecimal characters (lowercase a-f, 0-9)
    3. Check for extra whitespace or special characters
    4. Run with debug logging: `python3 build/local_examples.py --loglevel DEBUG`
    5. Look for "Found BINDER_ID" message in logs
  - **Fix**: Ensure format is exactly `{comment_prefix} BINDER_ID {40-char-hash}`

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

- **Symptom 4**: Wrong hash value extracted
  - **Cause**: Regex capture group not matching correctly
  - **Debug**: Check the regex pattern includes capture group: `([a-f0-9]{40})`
  - **Fix**: Ensure using `match.group(1)` to extract the captured hash

**BinderHub "Run in browser" link issues**:
- **Symptom 1**: Link not appearing in example box
  - **Cause 1**: No `binderId` in metadata
    - **Debug**: Check `data/examples.json` for the example set and language
    - **Fix**: Add `BINDER_ID` marker to source file and rebuild
  - **Cause 2**: Template conditional not checking for `binderId`
    - **Debug**: Inspect `layouts/shortcodes/clients-example.html` template
    - **Fix**: Ensure template has `{{ if $binderId }}` conditional around link
  - **Cause 3**: Wrong variable name in template
    - **Debug**: Check template is accessing `$langData.binderId` correctly
    - **Fix**: Verify variable names match the data structure in `examples.json`

- **Symptom 2**: Link appears but URL is malformed
  - **Cause 1**: Missing URL encoding in template
    - **Expected**: `?urlpath=%2Fdoc%2Ftree%2Fdemo.ipynb`
    - **Wrong**: `?urlpath=/doc/tree/demo.ipynb`
    - **Fix**: Use `%%2F` (double percent) in `printf` to get `%2F` in output
  - **Cause 2**: Wrong notebook filename
    - **Fix**: Always use `demo.ipynb` - do not change per example
  - **Cause 3**: `binderId` variable is empty or undefined
    - **Debug**: Add template debugging: `{{ printf "%#v" $binderId }}`
    - **Fix**: Ensure `binderId` is extracted from correct language data

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

- **Symptom 5**: Link text or styling is wrong
  - **Cause**: CSS classes or HTML structure doesn't match theme
  - **Debug**: Inspect browser developer tools for CSS issues
  - **Fix**: Update template HTML/CSS to match theme's design system

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
5. **Consult user guide**: `build/tcedocs/README.md` for author-focused documentation

---

## Appendix

### Related Documentation

- **User Guide**: `build/tcedocs/README.md` - For documentation authors
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
| `BINDER_ID hash` | Define BinderHub commit hash | `# BINDER_ID 6bbed3da294e8de5a8c2ad99abf883731a50d4dd` | **Optional**. Typically line 2 (after EXAMPLE). Hash must be exactly 40 hexadecimal characters (Git commit SHA). Removed from processed output. Stored as `binderId` in metadata. Used to generate interactive Jupyter notebook links. |
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

