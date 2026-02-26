#!/usr/bin/env python3
"""
Code unwrapping for jupyterize.

Removes language-specific structural wrappers from code.
"""

import logging
import re

from config import load_language_config


def _remove_wrapper_keep_content(code, start_pattern, end_pattern):
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


def _remove_matching_lines(code, start_pattern, end_pattern):
    """
    Remove lines matching patterns (including the matched lines).

    Args:
        code: Source code as string
        start_pattern: Regex pattern for start line
        end_pattern: Regex pattern for end line

    Returns:
        tuple: (modified_code, match_count) where match_count is the number
               of times the pattern was matched
    """
    lines = code.split('\n')
    result = []
    in_match = False
    single_line_pattern = (start_pattern == end_pattern)
    match_count = 0

    for line in lines:
        # Check for start pattern
        if re.match(start_pattern, line):
            match_count += 1
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

    return '\n'.join(result), match_count


def _remove_trailing_braces(code, count):
    """
    Remove a specific number of closing braces from the end of the code.

    Args:
        code: Source code as string
        count: Number of closing braces to remove from the end

    Returns:
        str: Code with trailing closing braces removed
    """
    if count <= 0:
        return code

    lines = code.split('\n')
    removed = 0

    # Scan from the end, removing lines that are only closing braces
    for i in range(len(lines) - 1, -1, -1):
        if removed >= count:
            break

        # Check if this line is only whitespace and a closing brace
        if re.match(r'^\s*\}\s*$', lines[i]):
            lines[i] = None  # Mark for removal
            removed += 1

    # Filter out marked lines
    result = [line for line in lines if line is not None]

    return '\n'.join(result)


class CodeUnwrapper:
    """Removes language-specific structural wrappers from code."""

    def __init__(self, language):
        """
        Initialize unwrapper for a specific language.

        Args:
            language: Language name (e.g., 'c#')
        """
        self.language = language
        self.config = load_language_config(language)

    def unwrap(self, code):
        """
        Remove language-specific structural wrappers from code.

        Args:
            code: Source code as string

        Returns:
            str: Code with structural wrappers removed
        """
        unwrap_patterns = self.config.get('unwrap_patterns', [])

        if not unwrap_patterns:
            return code

        # Track how many opening braces we removed (for closing brace removal)
        braces_removed = 0

        # Apply each unwrap pattern
        for pattern_config in unwrap_patterns:
            try:
                pattern_type = pattern_config.get('type', 'unknown')

                # Skip the closing_braces pattern - we'll handle it specially
                if pattern_type == 'closing_braces':
                    continue

                keep_content = pattern_config.get('keep_content', True)

                if keep_content:
                    # Remove wrapper but keep content
                    code = _remove_wrapper_keep_content(
                        code,
                        pattern_config['pattern'],
                        pattern_config['end_pattern']
                    )
                    # For keep_content patterns, we don't track braces
                    match_count = 0
                else:
                    # Remove entire matched section
                    code, match_count = _remove_matching_lines(
                        code,
                        pattern_config['pattern'],
                        pattern_config['end_pattern']
                    )

                # Count opening braces removed (only if pattern actually matched)
                if match_count > 0:
                    if '{' in pattern_config['pattern'] or '{' in pattern_config.get('end_pattern', ''):
                        braces_removed += match_count

                if match_count > 0:
                    logging.debug(
                        f"Applied unwrap pattern: {pattern_type} ({match_count} matches)"
                    )
            except KeyError as e:
                logging.warning(
                    f"Malformed unwrap pattern (missing {e}), skipping"
                )
            except re.error as e:
                logging.warning(
                    f"Invalid regex pattern: {e}, skipping"
                )

        # Remove the corresponding number of closing braces from the end
        if braces_removed > 0:
            logging.debug(f"Removing {braces_removed} trailing closing braces")
            code = _remove_trailing_braces(code, braces_removed)

        return code

