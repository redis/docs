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
import logging
import sys

from validator import InputValidator
from parser import FileParser
from notebook_builder import NotebookBuilder




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
    import os

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
        # Validate input and detect language
        validator = InputValidator()
        language = validator.detect_language(input_file)
        validator.validate_file(input_file, language)

        # Parse file
        parser = FileParser(language)
        parsed_blocks = parser.parse(input_file)

        if not parsed_blocks:
            logging.warning("No code blocks found in file")

        # Build notebook
        builder = NotebookBuilder(language)
        notebook = builder.build(parsed_blocks)

        if not notebook.cells:
            logging.warning("No cells created (all code may be in REMOVE blocks)")

        # Write to file
        builder.write(notebook, output_file)

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
