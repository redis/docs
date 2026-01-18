#!/usr/bin/env python3
"""
File parsing for jupyterize.

Parses source files with special comment markers and extracts code blocks.
"""

import logging
import os
import sys

# Add parent directory to path to import from build/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from components.example import (
    HIDE_START, HIDE_END,
    REMOVE_START, REMOVE_END,
    STEP_START, STEP_END,
    EXAMPLE, BINDER_ID,
    PREFIXES
)


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


class FileParser:
    """Parses source files with special comment markers."""

    def __init__(self, language):
        """
        Initialize parser for a specific language.

        Args:
            language: Programming language (e.g., 'python', 'c#')
        """
        self.language = language
        self.prefix = PREFIXES[language.lower()]

    def parse(self, file_path):
        """
        Parse file and extract cells.

        Args:
            file_path: Path to the input file

        Returns:
            list: List of dicts with 'code' and 'step_name' keys
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # State tracking
        in_remove = False
        in_step = False
        step_name = None
        step_lines = []
        preamble_lines = []
        cells = []
        seen_step_names = set()

        logging.debug(f"Parsing {len(lines)} lines with comment prefix '{self.prefix}'")

        for line_num, line in enumerate(lines, 1):
            # Skip metadata markers
            if _check_marker(line, self.prefix, EXAMPLE):
                logging.debug(f"Line {line_num}: Skipping EXAMPLE marker")
                continue

            if _check_marker(line, self.prefix, BINDER_ID):
                logging.debug(f"Line {line_num}: Skipping BINDER_ID marker")
                continue

            # Handle REMOVE blocks
            if _check_marker(line, self.prefix, REMOVE_START):
                if in_remove:
                    logging.warning(f"Line {line_num}: Nested REMOVE_START detected")
                in_remove = True
                logging.debug(f"Line {line_num}: Entering REMOVE block")
                continue

            if _check_marker(line, self.prefix, REMOVE_END):
                if not in_remove:
                    logging.warning(f"Line {line_num}: REMOVE_END without REMOVE_START")
                in_remove = False
                logging.debug(f"Line {line_num}: Exiting REMOVE block")
                continue

            if in_remove:
                continue

            # Skip HIDE markers (but include content)
            if _check_marker(line, self.prefix, HIDE_START):
                logging.debug(f"Line {line_num}: Skipping HIDE_START marker (content will be included)")
                continue

            if _check_marker(line, self.prefix, HIDE_END):
                logging.debug(f"Line {line_num}: Skipping HIDE_END marker")
                continue

            # Handle STEP blocks
            if _check_marker(line, self.prefix, STEP_START):
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

            if _check_marker(line, self.prefix, STEP_END):
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

