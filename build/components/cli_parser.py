"""
CLI Command Parser

Extracts Redis CLI commands from code example content.
Handles single-word commands (SET), multi-word commands (ACL CAT),
and dot notation commands (JSON.SET).
"""

import logging
import re


def extract_cli_commands(content):
    """
    Extract Redis CLI command names from example content.

    Only extracts actual CLI commands (lines with redis-cli prompt "> ").
    Ignores lines that happen to start with ">" but are not CLI commands
    (e.g., C# generic type declarations like "> res30 = ...").

    Args:
        content: List of strings (lines) or single string

    Returns:
        List of unique command names found, in order of first appearance
    """
    if isinstance(content, str):
        lines = content.split('\n')
    else:
        lines = content

    commands = []
    seen = set()

    for line in lines:
        line = line.strip()

        # Skip empty lines and comments
        if not line or line.startswith('#'):
            continue

        # Look for redis-cli prompt ("> " with space after)
        # This distinguishes CLI commands from code that happens to start with ">"
        if not line.startswith('> '):
            continue

        # Extract command from line starting with "> "
        # Format: "> COMMAND arg1 arg2 ..."
        command_part = line[2:].strip()

        if not command_part:
            continue

        # Split into tokens
        tokens = command_part.split()
        if not tokens:
            continue

        # Extract command name
        command = extract_command_name(tokens)

        if command and command not in seen:
            commands.append(command)
            seen.add(command)
            logging.debug(f"Extracted command: {command}")

    return commands


def extract_command_name(tokens):
    """
    Extract command name from tokens.

    Handles:
    - Single-word commands: SET, GET, HSET
    - Multi-word commands: ACL CAT, SCRIPT LOAD, CLIENT LIST
    - Dot notation: JSON.SET, GRAPH.QUERY

    Args:
        tokens: List of strings (result of split())

    Returns:
        Command name (uppercase) or None if invalid
    """
    if not tokens:
        return None

    first_token = tokens[0]

    # Check if first token looks like a Redis command
    # Redis commands are typically all uppercase in the original text
    # This filters out code like "res30 = ..." which has lowercase letters
    if not is_likely_redis_command(first_token):
        return None

    first_token_upper = first_token.upper()

    # Handle dot notation (JSON.SET, GRAPH.QUERY, etc.)
    if '.' in first_token_upper:
        return first_token_upper

    # Check if this is a multi-word command (first two tokens together)
    # This will be validated against commands_core.json later
    if len(tokens) >= 2:
        second_token = tokens[1]

        # Check if second token looks like a subcommand (not a key/argument)
        # Subcommands are typically all-uppercase and short
        # Arguments often contain special chars or are quoted
        if is_likely_subcommand(second_token):
            multi_word = f"{first_token_upper} {second_token.upper()}"
            return multi_word

    # Single-word command
    return first_token_upper


def is_likely_redis_command(token):
    """
    Heuristic to determine if a token is likely a Redis command.

    Redis commands are typically:
    - All uppercase letters (and numbers/hyphens/dots)
    - Not containing lowercase letters (which would indicate code variables)
    - Not containing special characters like = or (

    Args:
        token: String token to check

    Returns:
        True if likely a Redis command, False otherwise
    """
    # Redis commands are all uppercase (or contain dots for module commands)
    # Filter out code like "res30" which has lowercase letters
    if re.match(r'^[A-Z0-9._-]+$', token):
        return True

    return False


def is_likely_subcommand(token):
    """
    Heuristic to determine if a token is likely a subcommand.

    Subcommands are typically:
    - All uppercase letters (and numbers/hyphens)
    - Not quoted
    - Not containing special characters like : or .

    Args:
        token: String token to check

    Returns:
        True if likely a subcommand, False otherwise
    """
    # Remove quotes if present
    token = token.strip('\'"')

    # Check if it looks like a subcommand
    # Subcommands are typically alphanumeric, hyphens, underscores
    if re.match(r'^[A-Z0-9_-]+$', token):
        return True

    return False

