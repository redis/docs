#!/usr/bin/env python3
"""
Generate railroad diagrams for Redis commands from a JSON file.

This script allows you to generate railroad diagrams for specific Redis commands
by providing a JSON file with command specifications.
"""

import argparse
import json
import logging
import os
import sys
from pathlib import Path

# Add the build directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from components.syntax import Command


def setup_logging(verbose=False, quiet=False):
    """Set up logging configuration."""
    if quiet:
        level = logging.ERROR
    elif verbose:
        level = logging.DEBUG
    else:
        level = logging.INFO
    
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%H:%M:%S'
    )


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Generate railroad diagrams for Redis commands from a JSON file",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Example JSON format:
{
  "COMMAND_NAME": {
    "summary": "Command description",
    "arguments": [
      {
        "name": "key",
        "type": "key"
      },
      {
        "name": "value", 
        "type": "string",
        "optional": true
      }
    ]
  }
}

Usage examples:
  %(prog)s commands.json
  %(prog)s commands.json -o custom_output
  %(prog)s commands.json --verbose
  %(prog)s commands.json --quiet
        """
    )
    
    parser.add_argument(
        'json_file',
        help='JSON file containing command specifications'
    )
    
    parser.add_argument(
        '-o', '--output-dir',
        default='static/images/railroad',
        help='Output directory for generated SVG files (default: static/images/railroad)'
    )
    
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )
    
    parser.add_argument(
        '-q', '--quiet',
        action='store_true',
        help='Enable quiet mode (errors only)'
    )
    
    parser.add_argument(
        '--version',
        action='version',
        version='%(prog)s 1.0'
    )
    
    return parser.parse_args()


def main():
    """Main function."""
    args = parse_arguments()
    
    # Set up logging
    setup_logging(verbose=args.verbose, quiet=args.quiet)
    
    # Validate input file
    if not os.path.exists(args.json_file):
        logging.error(f"Input file not found: {args.json_file}")
        sys.exit(1)
    
    # Load command data
    try:
        with open(args.json_file, 'r', encoding='utf-8') as f:
            commands_data = json.load(f)
        logging.info(f"Loaded {len(commands_data)} commands from {args.json_file}")
    except json.JSONDecodeError as e:
        logging.error(f"Invalid JSON in {args.json_file}: {e}")
        sys.exit(1)
    except Exception as e:
        logging.error(f"Error reading {args.json_file}: {e}")
        sys.exit(1)
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    logging.info(f"Output directory: {args.output_dir}")
    
    # Generate railroad diagrams
    generated_count = 0
    failed_count = 0
    
    for command_name, command_data in commands_data.items():
        try:
            logging.debug(f"Processing command: {command_name}")
            command = Command(command_name, command_data)
            
            # Generate filename
            output_file = os.path.join(
                args.output_dir, 
                f"{command_name.lower().replace(' ', '-')}.svg"
            )
            
            # Generate railroad diagram
            svg_content = command.to_railroad_diagram()
            
            # Save to file
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(svg_content)
            
            logging.info(f"Generated: {command_name} -> {output_file}")
            generated_count += 1
            
        except Exception as e:
            logging.error(f"Failed to generate diagram for {command_name}: {e}")
            if args.verbose:
                logging.exception("Full traceback:")
            failed_count += 1
    
    # Summary
    total = generated_count + failed_count
    if not args.quiet:
        logging.info(f"Generation complete: {generated_count}/{total} successful")
    
    if failed_count > 0:
        sys.exit(1)


if __name__ == '__main__':
    main()
