#!/usr/bin/env python3
"""
Input validation for jupyterize.

Handles language detection and input file validation.
"""

import logging
import os
import sys

# Add parent directory to path to import from build/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from local_examples import EXTENSION_TO_LANGUAGE
from components.example import PREFIXES, EXAMPLE


def _check_marker(line, prefix, marker):
    """
    Check if a line contains a marker (with or without space after prefix).

    Args:
        line: Line to check
        prefix: Comment prefix (e.g., '#', '//')
        marker: Marker to look for (e.g., 'EXAMPLE:')

    Returns:
        bool: True if marker is found
    """
    return f'{prefix} {marker}' in line or f'{prefix}{marker}' in line


class InputValidator:
    """Validates input files and detects programming language."""

    @staticmethod
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

    @staticmethod
    def validate_file(file_path, language):
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

