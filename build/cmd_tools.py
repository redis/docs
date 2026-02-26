#!/usr/bin/env python3
"""
Unified command management tool for Redis documentation.

This script combines functionality for:
- Adding new command pages and railroad diagrams
- Updating existing command pages and diagrams
- Generating railroad diagrams only

Usage:
    python cmd_tools.py add <json_file> --output-dir <dir>
    python cmd_tools.py update <json_file> --output-dir <dir>
    python cmd_tools.py update-all [--output-dir <dir>]
    python cmd_tools.py railroad <json_file> --output-dir <dir>
"""

import argparse
import glob
import json
import logging
import os
import sys

from components.syntax import Command
from components.markdown import Markdown


# Prefix filtering for commands_core.json (used in update-all)
FILTER_PREFIXES = [
    "BF.",
    "CF.",
    "CMS.",
    "JSON.",
    "FT.",
    "_FT.",
    "SEARCH.",
    "TDIGEST.",
    "TIMESERIES.",
    "TOPK.",
    "TS.",
]

# Standard categories for new command pages
STANDARD_CATEGORIES = [
    'docs', 'develop', 'stack', 'oss', 'rs', 'rc', 'oss', 'kubernetes', 'clients'
]


def command_filename(name: str) -> str:
    """Convert command name to filename format."""
    return name.lower().replace(' ', '-')


def load_and_validate_json(filepath: str) -> dict:
    """Load and validate the JSON file containing command definitions."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"JSON file not found: {filepath}")

    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in file {filepath}: {e}")

    validate_json_structure(data, filepath)
    return data


def validate_json_structure(data: dict, filename: str) -> None:
    """Validate that the JSON has the expected structure for Redis commands."""
    if not isinstance(data, dict):
        raise ValueError(f"JSON file {filename} must contain a dictionary at root level")

    for command_name, command_data in data.items():
        if not isinstance(command_data, dict):
            raise ValueError(f"Command '{command_name}' must be a dictionary")

        # Check for required fields
        required_fields = ['summary', 'since', 'group']
        for field in required_fields:
            if field not in command_data:
                logging.warning(f"Command '{command_name}' missing recommended field: {field}")

        # Validate arguments structure if present
        if 'arguments' in command_data:
            if not isinstance(command_data['arguments'], list):
                raise ValueError(f"Command '{command_name}' arguments must be a list")


def get_full_command_name(command_name: str, command_data: dict) -> str:
    """Get the full command name, handling container commands."""
    container = command_data.get('container')
    if container:
        return f"{container} {command_name}"
    return command_name


def generate_railroad_diagram(command_name: str, command_data: dict, output_dir: str) -> str:
    """Generate a railroad diagram for a command and save it to the output directory."""
    try:
        import railroad
    except ImportError:
        logging.warning("railroad-diagrams library not available. Skipping railroad diagram generation.")
        return None

    command = Command(command_name, command_data)
    output_file = os.path.join(output_dir, 'images', 'railroad', f"{command_filename(command_name)}.svg")

    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    svg_content = command.to_railroad_diagram()
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(svg_content)

    logging.info(f"Generated railroad diagram: {output_file}")
    return output_file


def generate_command_frontmatter(command_name: str, command_data: dict) -> dict:
    """Generate complete Hugo frontmatter for a command."""
    full_command_name = get_full_command_name(command_name, command_data)
    c = Command(full_command_name, command_data)

    fm_data = command_data.copy()
    fm_data.update({
        'title': full_command_name,
        'linkTitle': full_command_name,
        'description': command_data.get('summary'),
        'syntax_fmt': c.syntax(),
        'hidden': False,
        'categories': STANDARD_CATEGORIES.copy(),
    })

    return fm_data


def generate_argument_sections(command_data: dict) -> str:
    """Generate placeholder sections for Required arguments and Optional arguments."""
    content = ""
    arguments = command_data.get('arguments', [])
    if not arguments:
        return content

    required_args = []
    optional_args = []

    for arg in arguments:
        if arg.get('optional', False):
            optional_args.append(arg)
        else:
            required_args.append(arg)

    if required_args:
        content += "## Required arguments\n\n"
        for arg in required_args:
            arg_name = arg.get('name', 'unknown')
            arg_type = arg.get('type', 'unknown')
            display_text = arg.get('display_text', arg_name)
            content += f"<details open><summary><code>{display_text}</code></summary>\n\n"
            content += f"TODO: Add description for {arg_name} ({arg_type})\n\n"
            content += "</details>\n\n"

    if optional_args:
        content += "## Optional arguments\n\n"
        for arg in optional_args:
            arg_name = arg.get('name', 'unknown')
            arg_type = arg.get('type', 'unknown')
            display_text = arg.get('display_text', arg_name)
            token = arg.get('token', '')
            content += f"<details open><summary><code>{token if token else display_text}</code></summary>\n\n"
            content += f"TODO: Add description for {arg_name} ({arg_type})\n\n"
            content += "</details>\n\n"

    return content


def generate_return_section() -> str:
    """Generate placeholder Return information section."""
    return '''## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

TODO: Add RESP2 return information

-tab-sep-

TODO: Add RESP3 return information

{{< /multitabs >}}

'''


def generate_complete_markdown_content(command_name: str, command_data: dict) -> str:
    """Generate the complete markdown content for a command page."""
    content = ""
    summary = command_data.get('summary', f'TODO: Add summary for {command_name}')
    content += f"{summary}\n\n"
    content += generate_argument_sections(command_data)
    content += generate_return_section()
    return content


def create_command_page(command_name: str, command_data: dict, output_dir: str, force: bool = False) -> str:
    """Create a complete command markdown file with frontmatter and content."""
    full_command_name = get_full_command_name(command_name, command_data)
    filename = command_filename(full_command_name)
    filepath = os.path.join(output_dir, 'commands', f'{filename}.md')

    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    if os.path.exists(filepath) and not force:
        logging.warning(f"File {filepath} already exists, skipping (use --force to overwrite)")
        return None

    frontmatter_data = generate_command_frontmatter(command_name, command_data)
    content = generate_complete_markdown_content(command_name, command_data)

    md = Markdown(filepath)
    md.fm_data = frontmatter_data
    md.payload = content
    md.persist()

    logging.info(f"Created command page: {filepath}")
    return filepath


def update_command_page(command_name: str, command_data: dict, output_dir: str, railroad_path: str = None) -> str:
    """Update an existing command page's frontmatter."""
    filename = command_filename(command_name)
    filepath = os.path.join(output_dir, 'commands', f'{filename}.md')

    if not os.path.exists(filepath):
        logging.warning(f"File {filepath} does not exist, skipping update")
        return None

    c = Command(command_name, command_data)
    md = Markdown(filepath)
    md.fm_data |= command_data

    # Add railroad diagram path to frontmatter if it exists
    if railroad_path and os.path.exists(railroad_path):
        # Convert to web path (remove output_dir prefix, keep /images/railroad/...)
        web_path = railroad_path.replace(output_dir, '').lstrip('/')
        if not web_path.startswith('/'):
            web_path = '/' + web_path
        md.fm_data['railroad_diagram'] = web_path

    md.fm_data.update({
        'syntax_fmt': c.syntax(),
    })
    md.persist()

    logging.info(f"Updated command page: {filepath}")
    return filepath


# =============================================================================
# Action Handlers
# =============================================================================

def action_add(args) -> int:
    """Handle the 'add' action: create new command pages and railroad diagrams."""
    try:
        commands_data = load_and_validate_json(args.json_file)
        logging.info(f"Loaded {len(commands_data)} commands from {args.json_file}")
    except (FileNotFoundError, ValueError) as e:
        logging.error(f"Error: {e}")
        return 1

    created_pages = []
    created_diagrams = []

    for command_name, command_data in commands_data.items():
        try:
            full_name = get_full_command_name(command_name, command_data)
            logging.info(f"Processing command: {full_name}")

            # Create command page
            page_path = create_command_page(command_name, command_data, args.output_dir, args.force)
            if page_path:
                created_pages.append(page_path)

            # Generate railroad diagram unless skipped
            if not args.skip_railroad:
                diagram_path = generate_railroad_diagram(full_name, command_data, args.output_dir)
                if diagram_path:
                    created_diagrams.append(diagram_path)

        except Exception as e:
            logging.error(f"Failed to process command '{command_name}': {e}")
            continue

    logging.info(f"Created {len(created_pages)} command pages and {len(created_diagrams)} railroad diagrams")
    return 0


def action_update(args) -> int:
    """Handle the 'update' action: update existing command pages and regenerate diagrams."""
    try:
        commands_data = load_and_validate_json(args.json_file)
        logging.info(f"Loaded {len(commands_data)} commands from {args.json_file}")
    except (FileNotFoundError, ValueError) as e:
        logging.error(f"Error: {e}")
        return 1

    updated_pages = []
    created_diagrams = []

    for command_name, command_data in commands_data.items():
        try:
            full_name = get_full_command_name(command_name, command_data)
            logging.info(f"Processing command: {full_name}")

            # Generate railroad diagram first (if not skipped) so we can add path to frontmatter
            diagram_path = None
            if not args.skip_railroad:
                diagram_path = generate_railroad_diagram(full_name, command_data, args.output_dir)
                if diagram_path:
                    created_diagrams.append(diagram_path)

            # Update command page
            page_path = update_command_page(full_name, command_data, args.output_dir, diagram_path)
            if page_path:
                updated_pages.append(page_path)

        except Exception as e:
            logging.error(f"Failed to process command '{command_name}': {e}")
            continue

    logging.info(f"Updated {len(updated_pages)} command pages and created {len(created_diagrams)} railroad diagrams")
    return 0


def generate_railroad_diagram_inplace(command_name: str, command_data: dict, output_dir: str) -> str:
    """Generate a railroad diagram for a command using in-repo paths (for update-all)."""
    try:
        import railroad
    except ImportError:
        logging.warning("railroad-diagrams library not available. Skipping railroad diagram generation.")
        return None

    command = Command(command_name, command_data)
    output_file = os.path.join(output_dir, 'static', 'images', 'railroad', f"{command_filename(command_name)}.svg")

    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    svg_content = command.to_railroad_diagram()
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(svg_content)

    logging.info(f"Generated railroad diagram: {output_file}")
    return output_file


def update_command_page_inplace(command_name: str, command_data: dict, output_dir: str, railroad_path: str = None) -> str:
    """Update an existing command page's frontmatter using in-repo paths (for update-all)."""
    filename = command_filename(command_name)
    filepath = os.path.join(output_dir, 'content', 'commands', f'{filename}.md')

    if not os.path.exists(filepath):
        logging.warning(f"File {filepath} does not exist, skipping update")
        return None

    c = Command(command_name, command_data)
    md = Markdown(filepath)
    md.fm_data |= command_data

    # Add railroad diagram path to frontmatter if it exists
    if railroad_path and os.path.exists(railroad_path):
        # Convert to web path: static/images/railroad/... -> /images/railroad/...
        web_path = railroad_path.replace(os.path.join(output_dir, 'static'), '').replace('static/', '/').replace('static', '')
        if not web_path.startswith('/'):
            web_path = '/' + web_path
        md.fm_data['railroad_diagram'] = web_path

    md.fm_data.update({
        'syntax_fmt': c.syntax(),
    })
    md.persist()

    logging.info(f"Updated command page: {filepath}")
    return filepath


def action_update_all(args) -> int:
    """Handle the 'update-all' action: update all commands from data/commands_*.json."""
    all_commands = {}

    # Load commands_core.json with prefix filtering
    core_file = 'data/commands_core.json'
    if os.path.exists(core_file):
        logging.info(f"Loading commands from {core_file}")
        with open(core_file, 'r') as f:
            data = json.load(f)

        # Apply prefix filtering only to commands_core.json
        filtered = {
            key: value
            for key, value in data.items()
            if not key.startswith(tuple(FILTER_PREFIXES))
        }
        all_commands.update(filtered)
        logging.info(f"Loaded {len(filtered)} commands from {core_file} (filtered from {len(data)})")
    else:
        logging.warning(f"Core commands file not found: {core_file}")

    # Load additional command files (commands_r*.json) without filtering
    command_files = glob.glob('data/commands_r*.json')
    for command_file in command_files:
        logging.info(f"Loading commands from {command_file}")
        with open(command_file, 'r') as f:
            commands = json.load(f)
            all_commands.update(commands)

    logging.info(f"Loaded {len(all_commands)} total commands")

    updated_pages = []
    created_diagrams = []

    for command_name, command_data in all_commands.items():
        try:
            logging.debug(f"Processing command: {command_name}")

            # Generate railroad diagram first (if not skipped)
            diagram_path = None
            if not args.skip_railroad:
                diagram_path = generate_railroad_diagram_inplace(command_name, command_data, args.output_dir)
                if diagram_path:
                    created_diagrams.append(diagram_path)

            # Update command page using in-repo paths
            page_path = update_command_page_inplace(command_name, command_data, args.output_dir, diagram_path)
            if page_path:
                updated_pages.append(page_path)

        except Exception as e:
            logging.error(f"Failed to process command '{command_name}': {e}")
            continue

    logging.info(f"Updated {len(updated_pages)} command pages and created {len(created_diagrams)} railroad diagrams")
    return 0


def action_railroad(args) -> int:
    """Handle the 'railroad' action: generate railroad diagrams only."""
    try:
        commands_data = load_and_validate_json(args.json_file)
        logging.info(f"Loaded {len(commands_data)} commands from {args.json_file}")
    except (FileNotFoundError, ValueError) as e:
        logging.error(f"Error: {e}")
        return 1

    created_diagrams = []

    for command_name, command_data in commands_data.items():
        try:
            full_name = get_full_command_name(command_name, command_data)
            logging.info(f"Generating railroad diagram for: {full_name}")

            diagram_path = generate_railroad_diagram(full_name, command_data, args.output_dir)
            if diagram_path:
                created_diagrams.append(diagram_path)

        except Exception as e:
            logging.error(f"Failed to generate diagram for '{command_name}': {e}")
            continue

    logging.info(f"Generated {len(created_diagrams)} railroad diagrams")
    return 0


# =============================================================================
# Argument Parsing
# =============================================================================

def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description='Unified command management tool for Redis documentation',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s add commands.json --output-dir /tmp/docs-output
  %(prog)s add commands.json --output-dir /tmp/docs-output --force
  %(prog)s update commands.json --output-dir /tmp/docs-output
  %(prog)s update-all
  %(prog)s update-all --output-dir /tmp/docs-output
  %(prog)s railroad commands.json --output-dir /tmp/diagrams
        """
    )

    # Global options
    parser.add_argument('--loglevel', type=str, default='INFO',
                        choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
                        help='Logging level (default: INFO)')

    subparsers = parser.add_subparsers(dest='action', required=True,
                                        help='Action to perform')

    # --- add subcommand ---
    add_parser = subparsers.add_parser('add',
        help='Add new command pages and railroad diagrams')
    add_parser.add_argument('json_file', type=str,
        help='Path to JSON file containing command definitions')
    add_parser.add_argument('--output-dir', type=str, required=True,
        help='Output directory for generated files')
    add_parser.add_argument('--force', action='store_true',
        help='Overwrite existing files')
    add_parser.add_argument('--skip-railroad', action='store_true',
        help='Skip railroad diagram generation')

    # --- update subcommand ---
    update_parser = subparsers.add_parser('update',
        help='Update existing command pages and regenerate diagrams')
    update_parser.add_argument('json_file', type=str,
        help='Path to JSON file containing command definitions')
    update_parser.add_argument('--output-dir', type=str, required=True,
        help='Output directory for generated files')
    update_parser.add_argument('--skip-railroad', action='store_true',
        help='Skip railroad diagram generation')

    # --- update-all subcommand ---
    update_all_parser = subparsers.add_parser('update-all',
        help='Update all commands from data/commands_*.json')
    update_all_parser.add_argument('--output-dir', type=str, default='.',
        help='Output directory (default: current directory, uses content/commands/ and static/images/railroad/)')
    update_all_parser.add_argument('--skip-railroad', action='store_true',
        help='Skip railroad diagram generation')

    # --- railroad subcommand ---
    railroad_parser = subparsers.add_parser('railroad',
        help='Generate railroad diagrams only')
    railroad_parser.add_argument('json_file', type=str,
        help='Path to JSON file containing command definitions')
    railroad_parser.add_argument('--output-dir', type=str, required=True,
        help='Output directory for generated SVG files')

    return parser.parse_args()


def configure_logging(loglevel: str) -> None:
    """Configure logging with the specified level."""
    log_level = getattr(logging, loglevel.upper())
    logging.basicConfig(
        level=log_level,
        format='%(levelname)s: %(message)s',
        force=True
    )


def main() -> int:
    """Main entry point."""
    args = parse_args()
    configure_logging(args.loglevel)

    # Dispatch to the appropriate action handler
    if args.action == 'add':
        return action_add(args)
    elif args.action == 'update':
        return action_update(args)
    elif args.action == 'update-all':
        return action_update_all(args)
    elif args.action == 'railroad':
        return action_railroad(args)
    else:
        logging.error(f"Unknown action: {args.action}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
