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


def _net_braces(code):
    """
    Return ('}' count) - ('{' count), IGNORING braces inside string/char
    literals ('...', "...", `...`) and line comments (# or //). A scanner rather
    than a raw count, so a brace in a string (e.g. a JSON literal) doesn't skew
    the balance and cause a real closing brace to be stripped.
    """
    net = 0
    i, n = 0, len(code)
    quote = None
    while i < n:
        ch = code[i]
        if quote:
            if ch == '\\' and quote != '`':
                i += 2
                continue
            if ch == quote:
                quote = None
            i += 1
            continue
        if ch in ('"', "'", '`'):
            quote = ch
        elif ch == '#' or (ch == '/' and i + 1 < n and code[i + 1] == '/'):
            while i < n and code[i] != '\n':  # skip to end of line comment
                i += 1
            continue
        elif ch == '{':
            net -= 1
        elif ch == '}':
            net += 1
        i += 1
    return net


def _strip_trailing_orphan_braces(code):
    """
    Strip orphan closing braces left when a class/method wrapper's opening was
    removed from an earlier cell.

    Only CONTIGUOUS trailing lone-'}' lines are removed (stopping at the first
    real content line), and at most as many as the cell has unmatched closes
    (counted by _net_braces, which ignores braces in strings/comments). This
    preserves the closing braces of balanced blocks (for/foreach/lambda bodies)
    that legitimately sit inside the cell.
    """
    net = _net_braces(code)
    if net <= 0:
        return code

    lines = code.split('\n')
    while net > 0 and lines:
        if lines[-1].strip() == '':
            lines.pop()                       # drop trailing blank lines
        elif re.match(r'^\s*\}\s*$', lines[-1]):
            lines.pop()                       # drop an orphan closing brace
            net -= 1
        else:
            break                             # hit real content; stop
    return '\n'.join(lines)


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

        # Strip any remaining orphan trailing closing braces. A class/method
        # wrapper spans cells (opening braces in the first cell, closing braces
        # in the last), so per-cell removal above leaves the trailing closes
        # behind. Only contiguous trailing lone-'}' lines are removed, bounded by
        # the cell's net brace imbalance, so balanced bodies keep their braces.
        code = _strip_trailing_orphan_braces(code)

        return code

