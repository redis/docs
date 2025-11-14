#!/usr/bin/env python3
import argparse
import json
import logging
import os
import glob

from components.syntax import Command
from components.markdown import Markdown


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Updates command metadata')
    parser.add_argument('--loglevel', type=str,
                        default='INFO',
                        help='Python logging level (overwrites LOGLEVEL env var)')
    parser.add_argument('--generate-railroad', action='store_true',
                        help='Generate railroad diagrams for commands')
    parser.add_argument('--railroad-output-dir', type=str,
                        default='static/images/railroad',
                        help='Directory to save railroad diagram SVG files')
    return parser.parse_args()

def generate_railroad_diagrams(commands_data: dict, output_dir: str) -> None:
    """Generate railroad diagrams for all commands."""
    try:
        import railroad
    except ImportError:
        logging.warning("railroad-diagrams library not available. Skipping railroad diagram generation.")
        return

    os.makedirs(output_dir, exist_ok=True)
    generated_count = 0
    failed_count = 0

    for command_name, command_data in commands_data.items():
        try:
            command = Command(command_name, command_data)
            output_file = os.path.join(output_dir, f"{command_name.lower().replace(' ', '-')}.svg")

            svg_content = command.to_railroad_diagram()
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(svg_content)

            logging.info(f"Generated railroad diagram for {command_name}: {output_file}")
            generated_count += 1

        except Exception as e:
            logging.error(f"Failed to generate railroad diagram for {command_name}: {e}")
            failed_count += 1

    logging.info(f"Railroad diagram generation complete: {generated_count} generated, {failed_count} failed")


if __name__ == '__main__':
    ARGS = parse_args()

    # Configure logging BEFORE creating objects
    log_level = getattr(logging, ARGS.loglevel.upper())
    logging.basicConfig(
        level=log_level,
        format='%(message)s %(filename)s:%(lineno)d - %(funcName)s',
        force=True  # Force reconfiguration in case logging was already configured
    )

    # Load all commands_*.json files
    all_commands = {}
    command_files = glob.glob('data/commands_*.json')

    for command_file in command_files:
        logging.info(f"Loading commands from {command_file}")
        with open(command_file, 'r') as f:
            commands = json.load(f)
            all_commands.update(commands)

    logging.info(f"Loaded {len(all_commands)} total commands from {len(command_files)} files")

    # Generate railroad diagrams if requested
    if ARGS.generate_railroad:
        logging.info("Generating railroad diagrams...")
        generate_railroad_diagrams(all_commands, ARGS.railroad_output_dir)

    board = []
    for k in all_commands:
        v = all_commands.get(k)
        c = Command(k, v)
        sf = c.syntax()
        path = f'content/commands/{k.lower().replace(" ", "-")}.md'
        md = Markdown(path)
        md.fm_data |= v

        # Add railroad diagram path to frontmatter if it exists
        railroad_file = f"{ARGS.railroad_output_dir}/{k.lower().replace(' ', '-')}.svg"
        if os.path.exists(railroad_file):
            md.fm_data['railroad_diagram'] = railroad_file.replace('static/', '/')

        md.fm_data.update({
            'syntax_str': str(c),
            'syntax_fmt': sf,
        })
        md.persist()
