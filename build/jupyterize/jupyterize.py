#!/usr/bin/env python3
"""
Jupyterize - Convert code example files to Jupyter notebooks

This tool converts code example files (with special comment markers) into
Jupyter notebook (.ipynb) files. It automatically detects the programming
language from the file extension and handles marker processing.

Usage:
    python jupyterize.py <input_file> [options]

Options:
    -o, --output <file>  Output notebook file path
    -v, --verbose        Enable verbose logging
    -h, --help          Show help message
"""

import argparse
import json
import logging
import os
import re
import sys
import textwrap
import nbformat
from nbformat.v4 import new_notebook, new_code_cell

# Add parent directory to path to import from build/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Import existing mappings
try:
    from local_examples import EXTENSION_TO_LANGUAGE
    from components.example import PREFIXES
except ImportError as e:
    print(f"Error importing required modules: {e}", file=sys.stderr)
    print("Make sure you're running this from the docs repository root.", file=sys.stderr)
    sys.exit(1)

# Marker constants (from build/components/example.py)
HIDE_START = 'HIDE_START'
HIDE_END = 'HIDE_END'
REMOVE_START = 'REMOVE_START'
REMOVE_END = 'REMOVE_END'
STEP_START = 'STEP_START'
STEP_END = 'STEP_END'
EXAMPLE = 'EXAMPLE:'
BINDER_ID = 'BINDER_ID'

# Jupyter kernel specifications
KERNEL_SPECS = {
    'python': {'name': 'python3', 'display_name': 'Python 3'},
    'node.js': {'name': 'javascript', 'display_name': 'JavaScript (Node.js)'},
    'go': {'name': 'gophernotes', 'display_name': 'Go'},
    'c#': {'name': 'csharp', 'display_name': 'C#'},
    'java': {'name': 'java', 'display_name': 'Java'},
    'php': {'name': 'php', 'display_name': 'PHP'},
    'rust': {'name': 'rust', 'display_name': 'Rust'}
}


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


def load_language_config(language):
    """
    Load language-specific configuration from jupyterize_config.json.

    Args:
        language: Language name (e.g., 'python', 'c#')

    Returns:
        dict: Configuration for the language, or empty dict if not found
    """
    config_file = os.path.join(os.path.dirname(__file__), 'jupyterize_config.json')
    if not os.path.exists(config_file):
        logging.debug(f"Configuration file not found: {config_file}")
        return {}

    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
        return config.get(language.lower(), {})
    except json.JSONDecodeError as e:
        logging.warning(f"Failed to parse configuration file: {e}")
        return {}
    except Exception as e:
        logging.warning(f"Error loading configuration: {e}")
        return {}


def remove_wrapper_keep_content(code, start_pattern, end_pattern):
    """
    Remove wrapper lines but keep content between them.

    Args:
        code: Source code as string
        start_pattern: Regex pattern for wrapper start
        end_pattern: Regex pattern for wrapper end

    Returns:
        str: Code with wrappers removed and content dedented
    """
    lines = code.split('\n')
    result = []
    in_wrapper = False
    wrapper_indent = 0
    skip_next_empty = False

    for i, line in enumerate(lines):
        # Check for wrapper start
        if re.match(start_pattern, line):
            in_wrapper = True
            wrapper_indent = len(line) - len(line.lstrip())
            skip_next_empty = True
            continue  # Skip wrapper start line

        # Check for wrapper end
        if in_wrapper and re.match(end_pattern, line):
            in_wrapper = False
            skip_next_empty = True
            continue  # Skip wrapper end line

        # Skip empty line immediately after wrapper start/end
        if skip_next_empty and not line.strip():
            skip_next_empty = False
            continue

        skip_next_empty = False

        # Process content inside wrapper
        if in_wrapper:
            # Remove wrapper indentation (typically 4 spaces)
            if line.startswith(' ' * (wrapper_indent + 4)):
                result.append(line[wrapper_indent + 4:])
            elif line.strip():  # Non-empty line with different indentation
                result.append(line.lstrip())
            else:  # Empty line
                result.append(line)
        else:
            result.append(line)

    return '\n'.join(result)


def remove_matching_lines(code, start_pattern, end_pattern):
    """
    Remove lines matching patterns (including the matched lines).

    Args:
        code: Source code as string
        start_pattern: Regex pattern for start line
        end_pattern: Regex pattern for end line

    Returns:
        str: Code with matching lines removed
    """
    lines = code.split('\n')
    result = []
    in_match = False
    single_line_pattern = (start_pattern == end_pattern)

    for line in lines:
        # Check for start pattern
        if re.match(start_pattern, line):
            if single_line_pattern:
                # For single-line patterns, just skip this line
                continue
            else:
                # For multi-line patterns, enter match mode
                in_match = True
                continue  # Skip this line

        # Check for end pattern (only for multi-line patterns)
        if in_match and re.match(end_pattern, line):
            in_match = False
            continue  # Skip this line

        # Keep line if not in match
        if not in_match:
            result.append(line)

    return '\n'.join(result)


def unwrap_code(code, language):
    """
    Remove language-specific structural wrappers from code.

    Args:
        code: Source code as string
        language: Language name (e.g., 'c#')

    Returns:
        str: Code with structural wrappers removed
    """
    lang_config = load_language_config(language)
    unwrap_patterns = lang_config.get('unwrap_patterns', [])

    if not unwrap_patterns:
        return code

    # Apply each unwrap pattern
    for pattern_config in unwrap_patterns:
        try:
            keep_content = pattern_config.get('keep_content', True)

            if keep_content:
                # Remove wrapper but keep content
                code = remove_wrapper_keep_content(
                    code,
                    pattern_config['pattern'],
                    pattern_config['end_pattern']
                )
            else:
                # Remove entire matched section
                code = remove_matching_lines(
                    code,
                    pattern_config['pattern'],
                    pattern_config['end_pattern']
                )

            logging.debug(
                f"Applied unwrap pattern: {pattern_config.get('type', 'unknown')}"
            )
        except KeyError as e:
            logging.warning(
                f"Malformed unwrap pattern (missing {e}), skipping"
            )
        except re.error as e:
            logging.warning(
                f"Invalid regex pattern: {e}, skipping"
            )

    return code


def detect_language(file_path):
    """
    Detect programming language from file extension.
    
    Args:
        file_path: Path to the input file
        
    Returns:
        str: Language name (e.g., 'python', 'node.js')
        
    Raises:
        ValueError: If file extension is not supported
    """
    _, ext = os.path.splitext(file_path)
    language = EXTENSION_TO_LANGUAGE.get(ext.lower())
    
    if not language:
        supported = ', '.join(sorted(EXTENSION_TO_LANGUAGE.keys()))
        raise ValueError(
            f"Unsupported file extension: {ext}\n"
            f"Supported extensions: {supported}"
        )
    
    logging.info(f"Detected language: {language} (from extension {ext})")
    return language


def validate_input(file_path, language):
    """
    Validate input file.
    
    Args:
        file_path: Path to the input file
        language: Detected language
        
    Raises:
        FileNotFoundError: If file doesn't exist
        ValueError: If file is invalid
    """
    # Check file exists
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Input file not found: {file_path}")
    
    if not os.path.isfile(file_path):
        raise ValueError(f"Path is not a file: {file_path}")
    
    # Check EXAMPLE marker
    prefix = PREFIXES.get(language.lower())
    if not prefix:
        raise ValueError(f"Unknown comment prefix for language: {language}")

    with open(file_path, 'r', encoding='utf-8') as f:
        first_line = f.readline()

    if not _check_marker(first_line, prefix, EXAMPLE):
        raise ValueError(
            f"File must start with '{prefix} {EXAMPLE} <id>' marker\n"
            f"First line: {first_line.strip()}"
        )

    logging.info(f"Input file validated: {file_path}")


def parse_file(file_path, language):
    """
    Parse file and extract cells.
    
    Args:
        file_path: Path to the input file
        language: Programming language
        
    Returns:
        list: List of dicts with 'code' and 'step_name' keys
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    prefix = PREFIXES[language.lower()]
    
    # State tracking
    in_remove = False
    in_step = False
    step_name = None
    step_lines = []
    preamble_lines = []
    cells = []
    seen_step_names = set()  # Track duplicate step names

    logging.debug(f"Parsing {len(lines)} lines with comment prefix '{prefix}'")
    
    for line_num, line in enumerate(lines, 1):
        # Skip metadata markers
        if _check_marker(line, prefix, EXAMPLE):
            logging.debug(f"Line {line_num}: Skipping EXAMPLE marker")
            continue

        if _check_marker(line, prefix, BINDER_ID):
            logging.debug(f"Line {line_num}: Skipping BINDER_ID marker")
            continue

        # Handle REMOVE blocks
        if _check_marker(line, prefix, REMOVE_START):
            if in_remove:
                logging.warning(f"Line {line_num}: Nested REMOVE_START detected")
            in_remove = True
            logging.debug(f"Line {line_num}: Entering REMOVE block")
            continue

        if _check_marker(line, prefix, REMOVE_END):
            if not in_remove:
                logging.warning(f"Line {line_num}: REMOVE_END without REMOVE_START")
            in_remove = False
            logging.debug(f"Line {line_num}: Exiting REMOVE block")
            continue

        if in_remove:
            continue

        # Skip HIDE markers (but include content)
        if _check_marker(line, prefix, HIDE_START):
            logging.debug(f"Line {line_num}: Skipping HIDE_START marker (content will be included)")
            continue

        if _check_marker(line, prefix, HIDE_END):
            logging.debug(f"Line {line_num}: Skipping HIDE_END marker")
            continue

        # Handle STEP blocks
        if _check_marker(line, prefix, STEP_START):
            if in_step:
                logging.warning(f"Line {line_num}: Nested STEP_START detected")

            # Save preamble if exists
            if preamble_lines:
                preamble_code = ''.join(preamble_lines)
                cells.append({'code': preamble_code, 'step_name': None})
                logging.debug(f"Saved preamble cell ({len(preamble_lines)} lines)")
                preamble_lines = []

            in_step = True
            # Extract step name
            if STEP_START in line:
                step_name = line.split(STEP_START)[1].strip()

                # Check for duplicate step names
                if step_name and step_name in seen_step_names:
                    logging.warning(
                        f"Line {line_num}: Duplicate step name '{step_name}' "
                        f"(previously defined)"
                    )
                elif step_name:
                    seen_step_names.add(step_name)

                logging.debug(f"Line {line_num}: Starting step '{step_name}'")
            else:
                step_name = None
                logging.debug(f"Line {line_num}: Starting unnamed step")
            step_lines = []
            continue

        if _check_marker(line, prefix, STEP_END):
            if not in_step:
                logging.warning(f"Line {line_num}: STEP_END without STEP_START")

            if step_lines:
                step_code = ''.join(step_lines)
                cells.append({'code': step_code, 'step_name': step_name})
                logging.debug(f"Saved step cell '{step_name}' ({len(step_lines)} lines)")

            in_step = False
            step_name = None
            step_lines = []
            continue
        
        # Collect code
        if in_step:
            step_lines.append(line)
        else:
            preamble_lines.append(line)
    
    # Save remaining preamble
    if preamble_lines:
        preamble_code = ''.join(preamble_lines)
        cells.append({'code': preamble_code, 'step_name': None})
        logging.debug(f"Saved final preamble cell ({len(preamble_lines)} lines)")
    
    # Check for unclosed blocks
    if in_remove:
        logging.warning("File ended with unclosed REMOVE block")
    if in_step:
        logging.warning("File ended with unclosed STEP block")
    
    logging.info(f"Parsed {len(cells)} cells from file")
    return cells


def create_cells(parsed_blocks, language):
    """
    Convert parsed blocks to notebook cells.

    Args:
        parsed_blocks: List of dicts with 'code' and 'step_name'
        language: Programming language (for boilerplate injection and unwrapping)

    Returns:
        list: List of nbformat cell objects
    """
    cells = []

    # Get language configuration
    lang_config = load_language_config(language)

    # Add boilerplate cell if defined
    boilerplate = lang_config.get('boilerplate', [])
    if boilerplate:
        boilerplate_code = '\n'.join(boilerplate)
        boilerplate_cell = new_code_cell(source=boilerplate_code)
        boilerplate_cell.metadata['cell_type'] = 'boilerplate'
        boilerplate_cell.metadata['language'] = language
        cells.append(boilerplate_cell)
        logging.info(f"Added boilerplate cell for {language} ({len(boilerplate)} lines)")

    # Process regular cells
    for i, block in enumerate(parsed_blocks):
        code = block['code']

        # Apply unwrapping if configured
        if lang_config.get('unwrap_patterns'):
            original_code = code
            code = unwrap_code(code, language)
            if code != original_code:
                logging.debug(f"Applied unwrapping to cell {i}")

        # Dedent code if unwrap patterns are configured
        # (code may have been indented inside wrappers)
        if lang_config.get('unwrap_patterns'):
            code = textwrap.dedent(code)

        # Strip trailing whitespace
        code = code.rstrip()

        # Skip empty cells
        if not code.strip():
            logging.debug(f"Skipping empty cell {i}")
            continue

        # Create code cell
        cell = new_code_cell(source=code)

        # Add step metadata if present
        if block['step_name']:
            cell.metadata['step'] = block['step_name']
            logging.debug(f"Created cell {i} with step '{block['step_name']}'")
        else:
            logging.debug(f"Created cell {i} (preamble)")

        cells.append(cell)

    logging.info(f"Created {len(cells)} notebook cells")
    return cells


def create_notebook(cells, language):
    """
    Create complete Jupyter notebook.
    
    Args:
        cells: List of nbformat cell objects
        language: Programming language
        
    Returns:
        nbformat.NotebookNode: Complete notebook
    """
    nb = new_notebook()
    nb.cells = cells
    
    # Set kernel metadata
    kernel_spec = KERNEL_SPECS.get(language.lower())
    if not kernel_spec:
        raise ValueError(f"No kernel specification for language: {language}")
    
    nb.metadata.kernelspec = {
        'display_name': kernel_spec['display_name'],
        'language': language.lower(),
        'name': kernel_spec['name']
    }
    
    nb.metadata.language_info = {
        'name': language.lower()
    }
    
    logging.info(f"Created notebook with kernel: {kernel_spec['name']}")
    return nb


def write_notebook(notebook, output_path):
    """
    Write notebook to file.

    Args:
        notebook: nbformat.NotebookNode object
        output_path: Output file path
    """
    # Create output directory if needed
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
        logging.debug(f"Created output directory: {output_dir}")

    # Write notebook
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            nbformat.write(notebook, f)
        logging.info(f"Wrote notebook to: {output_path}")
    except IOError as e:
        raise IOError(f"Failed to write notebook: {e}")


def jupyterize(input_file, output_file=None, verbose=False):
    """
    Convert code example file to Jupyter notebook.

    Args:
        input_file: Path to input file
        output_file: Path to output file (default: same name with .ipynb extension)
        verbose: Enable verbose logging

    Returns:
        str: Path to output file
    """
    # Set up logging
    log_level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(levelname)s: %(message)s'
    )

    # Determine output file
    if not output_file:
        base, _ = os.path.splitext(input_file)
        output_file = f"{base}.ipynb"

    logging.info(f"Converting {input_file} to {output_file}")

    try:
        # Detect language
        language = detect_language(input_file)

        # Validate input
        validate_input(input_file, language)

        # Parse file
        parsed_blocks = parse_file(input_file, language)

        if not parsed_blocks:
            logging.warning("No code blocks found in file")

        # Create cells (with language-specific boilerplate and unwrapping)
        cells = create_cells(parsed_blocks, language)

        if not cells:
            logging.warning("No cells created (all code may be in REMOVE blocks)")

        # Create notebook
        notebook = create_notebook(cells, language)

        # Write to file
        write_notebook(notebook, output_file)

        logging.info("Conversion completed successfully")
        return output_file

    except Exception as e:
        logging.error(f"Conversion failed: {e}")
        raise


def main():
    """Main entry point for command-line usage."""
    parser = argparse.ArgumentParser(
        description='Convert code example files to Jupyter notebooks',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python jupyterize.py example.py
  python jupyterize.py example.py -o output.ipynb
  python jupyterize.py example.py -v

The tool automatically:
  - Detects language from file extension
  - Excludes EXAMPLE: and BINDER_ID markers
  - Includes code in HIDE_START/HIDE_END blocks
  - Excludes code in REMOVE_START/REMOVE_END blocks
  - Creates separate cells for each STEP_START/STEP_END block
        """
    )

    parser.add_argument(
        'input_file',
        help='Input code example file'
    )

    parser.add_argument(
        '-o', '--output',
        dest='output_file',
        help='Output notebook file path (default: same name with .ipynb extension)'
    )

    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )

    args = parser.parse_args()

    try:
        output_file = jupyterize(
            args.input_file,
            args.output_file,
            args.verbose
        )
        print(f"Successfully created: {output_file}")
        return 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
