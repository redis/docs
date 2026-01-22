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
    # Only consider it a multi-word command if the second token is
    # a known subcommand (not just any alphanumeric token)
    if len(tokens) >= 2:
        second_token = tokens[1]

        # Check if second token looks like a subcommand (not a key/argument)
        # Known subcommands: CAT, LOAD, LIST, FLUSH, KILL, GETNAME, SETNAME, etc.
        # Arguments are typically: keys, values, numbers, or single letters
        if is_likely_subcommand(second_token):
            multi_word = f"{first_token_upper} {second_token.upper()}"
            return multi_word

    # Single-word command
    return first_token_upper


def is_likely_redis_command(token):
    """
    Heuristic to determine if a token is likely a Redis command.

    Redis commands are typically:
    - Alphanumeric letters (uppercase or lowercase), numbers, hyphens, dots
    - Not containing special characters like = or (
    - Not containing spaces

    Args:
        token: String token to check

    Returns:
        True if likely a Redis command, False otherwise
    """
    # Redis commands can be uppercase or lowercase (both are valid in CLI)
    # Filter out code like "res30 =" which has special characters
    # Allow dots for module commands (JSON.SET, GRAPH.QUERY, etc.)
    if re.match(r'^[A-Za-z0-9._-]+$', token):
        return True

    return False


def is_likely_subcommand(token):
    """
    Heuristic to determine if a token is likely a subcommand.

    Subcommands are typically:
    - Known Redis subcommands (CAT, LOAD, LIST, FLUSH, KILL, etc.)
    - Longer than 1 character (single letters are usually keys)
    - Not containing numbers (which are usually values)
    - Not containing underscores (which are usually variable names)

    Args:
        token: String token to check

    Returns:
        True if likely a subcommand, False otherwise
    """
    # Remove quotes if present
    token = token.strip('\'"')

    # Known Redis subcommands (common ones)
    known_subcommands = {
        'CAT', 'LOAD', 'LIST', 'FLUSH', 'KILL', 'GETNAME', 'SETNAME',
        'HELP', 'INFO', 'RESET', 'REWRITE', 'SAVE', 'BGSAVE', 'LASTSAVE',
        'SHUTDOWN', 'SLAVEOF', 'REPLICAOF', 'ROLE', 'SYNC', 'PSYNC',
        'REPLCONF', 'WAIT', 'COMMAND', 'CONFIG', 'DEBUG', 'MONITOR',
        'SLOWLOG', 'LATENCY', 'MEMORY', 'MODULE', 'ACL', 'CLIENT',
        'CLUSTER', 'READONLY', 'READWRITE', 'ASKING', 'RESTORE', 'MIGRATE',
        'OBJECT', 'TOUCH', 'UNLINK', 'DUMP', 'SCAN', 'HSCAN', 'SSCAN',
        'ZSCAN', 'SORT', 'COPY', 'LMOVE', 'BLMOVE', 'LPOS', 'GETEX',
        'GETDEL', 'SMOVE', 'ZMSCORE', 'ZDIFF', 'ZINTER', 'ZUNION',
        'ZRANGEBYLEX', 'ZREVRANGEBYLEX', 'ZRANGEBYSCORE', 'ZREVRANGEBYSCORE',
        'ZPOPMIN', 'ZPOPMAX', 'BZPOPMIN', 'BZPOPMAX', 'XINFO', 'XGROUP',
        'XREADGROUP', 'XACK', 'XCLAIM', 'XAUTOCLAIM', 'XPENDING', 'XTRIM',
        'XLEN', 'XRANGE', 'XREVRANGE', 'XREAD', 'XADD', 'XDEL', 'SCRIPT',
        'EVAL', 'EVALSHA', 'FUNCTION', 'FCALL', 'FCALL_RO', 'PUBSUB',
        'PSUBSCRIBE', 'PUNSUBSCRIBE', 'SUBSCRIBE', 'UNSUBSCRIBE', 'PUBLISH',
        'SPUBLISH', 'SSUBSCRIBE', 'SUNSUBSCRIBE', 'PEXPIRE', 'PEXPIREAT',
        'PTTL', 'EXPIRE', 'EXPIREAT', 'TTL', 'PERSIST', 'KEYS', 'RANDOMKEY',
        'RENAME', 'RENAMENX', 'MOVE', 'SWAPDB', 'SELECT', 'FLUSHDB',
        'FLUSHALL', 'DBSIZE', 'AND', 'OR', 'XOR', 'NOT', 'DIFF', 'DIFF1',
        'ANDOR', 'ONE'
    }

    token_upper = token.upper()

    # Check if it's a known subcommand
    if token_upper in known_subcommands:
        return True

    # Additional heuristics:
    # - Must be longer than 1 character (single letters are usually keys)
    # - Must not contain numbers (which are usually values)
    # - Must not contain underscores (which are usually variable names)
    if (len(token) > 1 and
        not any(c.isdigit() for c in token) and
        '_' not in token):
        # Only consider it a subcommand if it's all letters
        if token.replace('-', '').isalpha():
            return True

    return False

