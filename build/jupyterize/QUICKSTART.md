# Jupyterize - Quick Start Guide

## Installation

```bash
pip install nbformat
```

## Basic Usage

```bash
# Convert a file (creates example.ipynb)
python build/jupyterize/jupyterize.py example.py

# Specify output location
python build/jupyterize/jupyterize.py example.py -o notebooks/example.ipynb

# Enable verbose logging
python build/jupyterize/jupyterize.py example.py -v
```

## What It Does

Converts code example files → Jupyter notebooks (`.ipynb`)

**Automatic:**
- ✅ Detects language from file extension
- ✅ Selects appropriate Jupyter kernel
- ✅ Excludes `EXAMPLE:` and `BINDER_ID` markers
- ✅ Includes code in `HIDE_START`/`HIDE_END` blocks
- ✅ Excludes code in `REMOVE_START`/`REMOVE_END` blocks
- ✅ Creates separate cells for each `STEP_START`/`STEP_END` block

## Supported Languages

| Extension | Language   | Kernel       |
|-----------|------------|--------------|
| `.py`     | Python     | python3      |
| `.js`     | JavaScript | javascript   |
| `.go`     | Go         | gophernotes  |
| `.cs`     | C#         | csharp       |
| `.java`   | Java       | java         |
| `.php`    | PHP        | php          |
| `.rs`     | Rust       | rust         |

## Input File Format

```python
# EXAMPLE: example_id
# BINDER_ID optional-binder-id
import redis

# STEP_START connect
r = redis.Redis()
# STEP_END

# STEP_START set_get
r.set('foo', 'bar')
r.get('foo')
# STEP_END
```

## Output Structure

Creates a Jupyter notebook with:
- **Preamble cell** - Code before first `STEP_START`
- **Step cells** - Each `STEP_START`/`STEP_END` block
- **Kernel metadata** - Automatically set based on language
- **Step metadata** - Step names stored in cell metadata

## Common Issues

**"Unsupported file extension"**
→ Use a supported extension (.py, .js, .go, .cs, .java, .php, .rs)

**"File must start with EXAMPLE: marker"**
→ Add `# EXAMPLE: <id>` (or `//` for JS/Go/etc.) as first line

**"Input file not found"**
→ Check file path is correct

## Testing

```bash
# Run automated tests
python build/jupyterize/test_jupyterize.py
```

## More Information

- **User Guide**: `build/jupyterize/README.md`
- **Technical Spec**: `build/jupyterize/SPECIFICATION.md`
- **Implementation**: `build/jupyterize/IMPLEMENTATION.md`

