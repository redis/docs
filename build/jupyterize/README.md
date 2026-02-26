# Jupyterize - Code Example to Jupyter Notebook Converter

## Overview

`jupyterize` is a command-line tool that converts code example files into Jupyter notebook (`.ipynb`) files. It processes source code files that use special comment markers to delimit logical steps, converting each step into a separate cell in the generated notebook.

This tool is designed to work with the Redis documentation code example format (documented in `build/tcedocs/`) but can be extended to support other formats.

**Key Features:**
- **Automatic language detection**: Detects programming language and Jupyter kernel from file extension
- **Smart marker processing**: Automatically handles HIDE, REMOVE, and metadata markers with sensible defaults
- **Multi-language support**: Works with any programming language supported by Jupyter kernels
- **Simple interface**: Minimal configuration required - just point it at a file

## Purpose

The tool enables:
- **Interactive documentation**: Convert static code examples into executable Jupyter notebooks
- **Multi-language support**: Generate notebooks for any programming language supported by Jupyter kernels
- **Step-by-step execution**: Each `STEP_START`/`STEP_END` block becomes a separate notebook cell
- **Automated workflow**: Batch convert multiple examples for documentation or educational purposes

## Installation

### Requirements

- Python 3.7 or higher
- Required Python packages (install via pip):
  ```bash
  pip install nbformat
  ```

### Optional Dependencies

For enhanced functionality:
- `jupyter` - To run and test generated notebooks locally
- `jupyterlab` - For a modern notebook interface

## Usage

### Basic Command-Line Syntax

```bash
python jupyterize.py <input_file> [options]
```

### Options

- `-o, --output <file>` - Output notebook file path (default: same name as input with `.ipynb` extension)
- `-v, --verbose` - Enable verbose logging
- `-h, --help` - Show help message

### Automatic Behavior

The tool automatically handles the following without requiring configuration:

- **Language and kernel detection**: Determined from file extension (`.py` → Python/python3, `.js` → JavaScript/javascript, etc.)
- **Metadata markers**: `EXAMPLE:` and `BINDER_ID` markers are always excluded from notebook output
- **Hidden blocks**: Code within `HIDE_START`/`HIDE_END` markers is always included in notebooks (these are only hidden in web documentation)
- **Removed blocks**: Code within `REMOVE_START`/`REMOVE_END` markers is always excluded from notebooks (test boilerplate)

### Examples

**Convert a Python example:**
```bash
python jupyterize.py local_examples/client-specific/redis-py/landing.py
# Output: local_examples/client-specific/redis-py/landing.ipynb
# Language and kernel auto-detected from .py extension
```

**Specify output location:**
```bash
python jupyterize.py local_examples/client-specific/redis-py/landing.py -o notebooks/landing.ipynb
```

**Convert a JavaScript example:**
```bash
python jupyterize.py examples/example.js
# Output: examples/example.ipynb
# Language and kernel auto-detected from .js extension
```

**Batch convert all Python examples:**
```bash
find local_examples -name "*.py" -exec python jupyterize.py {} \;
```

**Verbose mode for debugging:**
```bash
python jupyterize.py example.py -v
# Shows detected language, kernel, parsed markers, and processing steps
```

## Input File Format

The tool processes files that follow the Redis documentation code example format. See `build/tcedocs/README.md` for complete documentation.

### Required Markers

**Example ID** (required, must be first line):
```python
# EXAMPLE: example_id
```

### Step Markers

**Step blocks** (optional, creates separate cells):
```python
# STEP_START step_name
# ... code for this step ...
# STEP_END
```

- Each `STEP_START`/`STEP_END` block becomes a separate notebook cell
- Code outside step blocks is placed in a single cell at the beginning
- Step names are used as cell metadata (can be displayed in notebook UI)

### Optional Markers

**BinderHub ID** (optional, line 2):
```python
# BINDER_ID commit_hash_or_branch_name
```

**Hidden code blocks** (optional):
```python
# HIDE_START
# ... code hidden by default in docs ...
# HIDE_END
```
- These blocks are **included** in notebooks (only hidden in web documentation)
- Useful for setup code that users should run but doesn't need emphasis in docs

**Removed code blocks** (optional):
```python
# REMOVE_START
# ... test framework code, imports, etc. ...
# REMOVE_END
```
- Always **excluded** from notebooks (test boilerplate that shouldn't be in user-facing examples)

### Example Input File

```python
# EXAMPLE: landing
# BINDER_ID python-landing
import redis

# STEP_START connect
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
# STEP_END

# STEP_START set_get_string
r.set('foo', 'bar')
# True
r.get('foo')
# bar
# STEP_END

# STEP_START close
r.close()
# STEP_END
```

### Generated Notebook Structure

The above example generates a notebook with 4 cells:

1. **Cell 1** (code): `import redis`
2. **Cell 2** (code, metadata: `step=connect`): `r = redis.Redis(...)`
3. **Cell 3** (code, metadata: `step=set_get_string`): `r.set('foo', 'bar')` and `r.get('foo')`
4. **Cell 4** (code, metadata: `step=close`): `r.close()`

**Note**: The `EXAMPLE:` and `BINDER_ID` marker lines are automatically excluded from the notebook output.

## Language Support

The tool supports any programming language that has a Jupyter kernel. The language is auto-detected from the file extension.

### Supported Languages and Kernels

| Language   | File Extension | Default Kernel | Comment Prefix |
|------------|----------------|----------------|----------------|
| Python     | `.py`          | `python3`      | `#`            |
| JavaScript | `.js`          | `javascript`   | `//`           |
| TypeScript | `.ts`          | `typescript`   | `//`           |
| Java       | `.java`        | `java`         | `//`           |
| Go         | `.go`          | `gophernotes`  | `//`           |
| C#         | `.cs`          | `csharp`       | `//`           |
| PHP        | `.php`         | `php`          | `//`           |
| Ruby       | `.rb`          | `ruby`         | `#`            |
| Rust       | `.rs`          | `rust`         | `//`           |

### Adding New Languages

To add support for a new language:

1. **Update language mappings** in `jupyterize.py`:
   ```python
   LANGUAGE_MAP = {
       '.ext': 'language_name',
       # ...
   }
   ```

2. **Update kernel mappings**:
   ```python
   KERNEL_MAP = {
       'language_name': 'kernel_name',
       # ...
   }
   ```

3. **Update comment prefix mappings**:
   ```python
   COMMENT_PREFIX = {
       'language_name': '//',
       # ...
   }
   ```

4. **Install the Jupyter kernel** (if not already installed):
   ```bash
   # Example for Go
   go install github.com/gopherdata/gophernotes@latest
   ```

## Output Format

The tool generates standard Jupyter Notebook files (`.ipynb`) in JSON format, compatible with:
- Jupyter Notebook
- JupyterLab
- VS Code
- Google Colab
- BinderHub
- Any other Jupyter-compatible environment

### Notebook Metadata

Generated notebooks include:
- **Kernel specification**: Language and kernel name
- **Language info**: Programming language metadata
- **Cell metadata**: Step names (if using STEP_START/STEP_END)
- **Custom metadata**: Example ID, source file path

## Advanced Usage

### Integration with Build Pipeline

The tool can be integrated into the documentation build process:

```bash
# In build/make.py or a separate script
python build/jupyterize/jupyterize.py local_examples/**/*.py -o notebooks/
```

### Custom Processing

For custom processing logic, import the tool as a module:

```python
from jupyterize import JupyterizeConverter

converter = JupyterizeConverter(input_file='example.py')
notebook = converter.convert()
converter.save(notebook, 'output.ipynb')
```

The converter automatically detects language and kernel from the file extension and applies the standard processing rules for markers.

## Troubleshooting

### Common Issues

**Issue**: "Kernel not found" error
- **Solution**: Install the required Jupyter kernel for your language
- **Check available kernels**: `jupyter kernelspec list`

**Issue**: Comment markers not detected
- **Solution**: Ensure comment prefix matches the language (e.g., `#` for Python, `//` for JavaScript)
- **Check**: First line must be `# EXAMPLE: id` or `// EXAMPLE: id`

**Issue**: Empty notebook generated
- **Solution**: Verify that the input file contains code outside of REMOVE_START/REMOVE_END blocks
- **Note**: REMOVE blocks are always excluded, HIDE blocks are always included

**Issue**: Steps not creating separate cells
- **Solution**: Ensure `STEP_START` and `STEP_END` markers are properly paired and use correct comment syntax

**Issue**: Unexpected code in notebook output
- **Solution**: Remember that HIDE_START/HIDE_END blocks are included in notebooks (they're only hidden in web docs)
- **Solution**: Use REMOVE_START/REMOVE_END for code that should never appear in notebooks

### Debug Mode

Enable verbose logging to troubleshoot issues:

```bash
python jupyterize.py example.py -v
```

This will show:
- Detected language and kernel
- Parsed markers and line ranges
- Cell creation process
- Output file location

## Related Documentation

- **Code Example Format**: `build/tcedocs/README.md` - User guide for writing examples
- **Technical Specification**: `build/tcedocs/SPECIFICATION.md` - System architecture and implementation details
- **Example Parser**: `build/components/example.py` - Python module that parses example files

## Future Enhancements

Potential improvements for future versions:

- **Markdown cells**: Convert comments to markdown cells for documentation
- **Output formats**: Support for other formats (e.g., Google Colab, VS Code notebooks)
- **Validation**: Verify that generated notebooks are executable
- **Testing**: Automatically run notebooks to ensure examples work
- **Metadata preservation**: Include more metadata from source files (highlight ranges, etc.)
- **Template support**: Custom notebook templates for different use cases

## Contributing

When contributing to this tool:

1. Follow the existing code style and structure
2. Add tests for new features
3. Update this README with new options or features
4. Ensure compatibility with the existing code example format
5. Test with multiple programming languages

## License

This tool is part of the Redis documentation project and follows the same license as the parent repository.

