#!/usr/bin/env python3
"""
Enrich Examples with CLI Commands from Markdown

Processes markdown documentation files to extract CLI commands
and enriches the examples.json with this information.

This script:
1. Scans all markdown files in content/ directory
2. Extracts CLI commands from {{< clients-example >}} blocks
3. Enriches examples.json with cli_commands metadata
"""

import os
import logging
from components.markdown_parser import process_markdown_files
from components.structured_data import load_dict, dump_dict


def enrich_examples_with_markdown_commands(
    markdown_dir: str = 'content',
    examples_json: str = 'data/examples.json'
) -> None:
    """
    Extract CLI commands from markdown and enrich examples.json.

    Stores command names at the step level (not per-language).

    Args:
        markdown_dir: Root directory containing markdown files
        examples_json: Path to examples.json file
    """
    logging.info("Processing markdown files for CLI commands...")

    # Extract CLI commands from markdown by step
    markdown_examples = process_markdown_files(markdown_dir)

    if not markdown_examples:
        logging.info("No CLI commands found in markdown files")
        return

    logging.info(f"Found CLI commands in {len(markdown_examples)} examples")

    # Load existing examples data
    if not os.path.exists(examples_json):
        logging.warning(f"Examples file not found: {examples_json}")
        return

    examples_data = load_dict(examples_json)

    # Process each example found in markdown
    for example_id, steps_commands in markdown_examples.items():
        if example_id not in examples_data:
            logging.debug(
                f"Example {example_id} not in examples.json, skipping"
            )
            continue

        # Add steps_commands at the example set level (not per-language)
        examples_data[example_id]['steps_commands'] = {}

        # Add command names for each step
        for step_name, commands in steps_commands.items():
            if commands:
                examples_data[example_id]['steps_commands'][
                    step_name
                ] = commands
                logging.debug(
                    f"Added {len(commands)} CLI commands to "
                    f"{example_id} step '{step_name}'"
                )

    # Save updated examples data
    dump_dict(examples_json, examples_data)
    logging.info(f"Updated examples data saved to {examples_json}")


if __name__ == '__main__':
    logging.basicConfig(
        level=logging.INFO,
        format='%(levelname)s: %(message)s'
    )

    enrich_examples_with_markdown_commands()
    print("Markdown enrichment complete")

