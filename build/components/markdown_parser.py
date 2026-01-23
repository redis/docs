"""
Markdown Parser for CLI Command Extraction

Extracts Redis CLI commands from markdown documentation files.
Parses {{< clients-example >}} shortcodes and extracts CLI commands
shown in the documentation.
"""

import logging
import re
from typing import Dict, List, Tuple


def extract_examples_from_markdown(content: str) -> Dict[str, Dict[str, List[str]]]:
    """
    Extract CLI commands from markdown clients-example shortcodes.

    Finds all {{< clients-example set="..." step="..." >}}...{{< /clients-example >}}
    blocks and extracts CLI commands from the content.

    Args:
        content: Markdown file content as string

    Returns:
        Dictionary mapping example IDs to step names to lists of CLI command names
        Example: {"hash_tutorial": {"set_get_all": ["HSET", "HGET"], ...}, ...}
    """
    examples = {}

    # Pattern to match {{< clients-example set="..." step="..." >}}...{{< /clients-example >}}
    # Using non-greedy matching to handle multiple blocks
    pattern = r'{{<\s*clients-example\s+[^>]*set="([^"]+)"[^>]*step="([^"]+)"[^>]*>}}(.*?){{<\s*/clients-example\s*>}}'

    for match in re.finditer(pattern, content, re.DOTALL):
        example_id = match.group(1)
        step_name = match.group(2)
        block_content = match.group(3)

        # Extract CLI commands from this block
        commands = extract_command_names(block_content)

        if commands:
            if example_id not in examples:
                examples[example_id] = {}
            examples[example_id][step_name] = commands

    return examples


def extract_command_names(content: str) -> List[str]:
    """
    Extract Redis command names from CLI content.

    Parses lines starting with "> " or "redis> " and extracts command names.
    Handles single-word (SET), multi-word (ACL CAT), and dot notation
    (JSON.SET) commands.

    Args:
        content: Block content as string

    Returns:
        List of unique command names in order of appearance
    """
    from components.cli_parser import extract_cli_commands

    lines = content.split('\n')
    cli_lines = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith('> ') or stripped.startswith('redis> '):
            cli_lines.append(stripped)

    # Extract command names from CLI lines
    commands = extract_cli_commands('\n'.join(cli_lines))

    # Deduplicate while preserving order
    seen = set()
    unique_commands = []
    for cmd in commands:
        if cmd not in seen:
            seen.add(cmd)
            unique_commands.append(cmd)

    return unique_commands


def process_markdown_files(
    markdown_dir: str = 'content'
) -> Dict[str, Dict[str, List[str]]]:
    """
    Process all markdown files and extract CLI commands by step.

    Args:
        markdown_dir: Root directory containing markdown files

    Returns:
        Dictionary mapping example IDs to step names to command lists
    """
    import os
    import glob

    all_examples = {}

    # Find all markdown files
    for md_file in glob.glob(
        os.path.join(markdown_dir, '**/*.md'), recursive=True
    ):
        try:
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()

            examples = extract_examples_from_markdown(content)
            for example_id, steps in examples.items():
                if example_id not in all_examples:
                    all_examples[example_id] = {}
                all_examples[example_id].update(steps)

            if examples:
                logging.debug(
                    f"Found {len(examples)} examples in {md_file}"
                )

        except OSError as e:
            logging.warning(f"Error processing {md_file}: {e}")

    return all_examples

