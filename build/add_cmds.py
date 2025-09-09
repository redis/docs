#!/usr/bin/env python3
import argparse
import json
import logging
import os
import sys

from components.syntax import Command
from components.markdown import Markdown


def command_filename(name: str) -> str:
    """Convert command name to filename format."""
    return name.lower().replace(' ', '-')


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Creates new Redis command pages from JSON input')
    parser.add_argument('json_file', type=str,
                        help='Path to JSON file containing command definitions')
    parser.add_argument('--loglevel', type=str,
                        default='INFO',
                        help='Python logging level (overwrites LOGLEVEL env var)')
    return parser.parse_args()


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


def add_standard_categories(fm_data: dict) -> None:
    """Add the standard categories from create.sh script."""
    standard_categories = [
        'docs', 'develop', 'stack', 'oss', 'rs', 'rc', 'oss', 'kubernetes', 'clients'
    ]
    fm_data['categories'] = standard_categories


def get_full_command_name(command_name: str, command_data: dict) -> str:
    """Get the full command name, handling container commands."""
    container = command_data.get('container')
    if container:
        return f"{container} {command_name}"
    return command_name


def generate_command_frontmatter(command_name: str, command_data: dict, all_commands: dict) -> dict:
    """Generate complete Hugo frontmatter for a command using existing build infrastructure."""
    # Get the full command name (handles container commands)
    full_command_name = get_full_command_name(command_name, command_data)

    # Create Command object to generate syntax using the full command name
    c = Command(full_command_name, command_data)

    # Start with the command data
    fm_data = command_data.copy()

    # Add required Hugo frontmatter fields
    fm_data.update({
        'title': full_command_name,
        'linkTitle': full_command_name,
        'description': command_data.get('summary'),
        'syntax_str': str(c),
        'syntax_fmt': c.syntax(),
        'hidden': False  # Default to not hidden
    })

    # Add the standard categories from create.sh
    add_standard_categories(fm_data)

    return fm_data


def generate_argument_sections(command_data: dict) -> str:
    """Generate placeholder sections for Required arguments and Optional arguments."""
    content = ""

    arguments = command_data.get('arguments', [])
    if not arguments:
        return content

    required_args = []
    optional_args = []

    # Categorize arguments
    for arg in arguments:
        if arg.get('optional', False):
            optional_args.append(arg)
        else:
            required_args.append(arg)

    # Generate Required arguments section
    if required_args:
        content += "## Required arguments\n\n"
        for arg in required_args:
            arg_name = arg.get('name', 'unknown')
            arg_type = arg.get('type', 'unknown')
            display_text = arg.get('display_text', arg_name)

            content += f"<details open><summary><code>{display_text}</code></summary>\n\n"
            content += f"TODO: Add description for {arg_name} ({arg_type})\n\n"
            content += "</details>\n\n"

    # Generate Optional arguments section
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

    # Add command summary as the main description
    summary = command_data.get('summary', f'TODO: Add summary for {command_name}')
    content += f"{summary}\n\n"

    # Add argument sections
    content += generate_argument_sections(command_data)

    # Add return information section
    content += generate_return_section()

    return content


def create_command_file(command_name: str, command_data: dict, all_commands: dict) -> str:
    """Create a complete command markdown file with frontmatter and content."""
    # Get the full command name (handles container commands)
    full_command_name = get_full_command_name(command_name, command_data)

    # Generate the file path using the full command name
    filename = command_filename(full_command_name)
    filepath = f'content/commands/{filename}.md'

    # Ensure the directory exists
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    # Check if file already exists
    if os.path.exists(filepath):
        logging.warning(f"File {filepath} already exists, skipping...")
        return filepath

    # Generate frontmatter
    frontmatter_data = generate_command_frontmatter(command_name, command_data, all_commands)

    # Generate content
    content = generate_complete_markdown_content(command_name, command_data)

    # Create markdown object and set data
    md = Markdown(filepath)
    md.fm_data = frontmatter_data
    md.payload = content

    # Write the file
    md.persist()

    logging.info(f"Created command file: {filepath}")
    return filepath


if __name__ == '__main__':
    args = parse_args()
    
    # Configure logging BEFORE creating objects
    log_level = getattr(logging, args.loglevel.upper())
    logging.basicConfig(
        level=log_level,
        format='%(message)s %(filename)s:%(lineno)d - %(funcName)s',
        force=True  # Force reconfiguration in case logging was already configured
    )
    
    try:
        # Load and validate JSON data
        commands_data = load_and_validate_json(args.json_file)
        logging.info(f"Loaded {len(commands_data)} commands from {args.json_file}")
        
        # Process each command and generate markdown files
        created_files = []
        for command_name in commands_data:
            try:
                logging.info(f"Processing command: {command_name}")
                filepath = create_command_file(command_name, commands_data[command_name], commands_data)
                created_files.append(filepath)
            except Exception as e:
                logging.error(f"Failed to create file for command '{command_name}': {e}")
                # Continue processing other commands
                continue

        # Summary
        logging.info(f"Successfully created {len(created_files)} command files:")
        for filepath in created_files:
            logging.info(f"  - {filepath}")
            
    except (FileNotFoundError, ValueError) as e:
        logging.error(f"Error: {e}")
        sys.exit(1)
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        sys.exit(1)
