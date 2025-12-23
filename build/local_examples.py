#!/usr/bin/env python3
"""
Local Examples Processor

This script processes local examples from the local_examples/ directory
and integrates them into the existing examples system.

Works like remote examples - each file contains an EXAMPLE: header
and can be any supported language.
"""

import os
import shutil
import logging

from components.example import Example
from components.util import mkdir_p
from components.structured_data import load_dict, dump_dict


# File extension to language mapping
EXTENSION_TO_LANGUAGE = {
    '.py': 'python',
    '.js': 'node.js',
    '.go': 'go',
    '.c': 'c',
    '.h': 'c',
    '.cs': 'c#',
    '.java': 'java',
    '.php': 'php',
    '.rs': 'rust'
}

# Language to client name mapping (from config.toml clientsExamples)
LANGUAGE_TO_CLIENT = {
    'python': 'Python',
    'node.js': 'Node.js',
    'go': 'Go',
    'c': 'C',
    'c#': 'C#-Sync',
    'java': 'Java-Sync',  # Default to sync, could be overridden
    'php': 'PHP',
    'redisvl': 'RedisVL',
    'rust': 'Rust-Sync'
}


def get_language_from_extension(filename: str) -> str:
    """Get language from file extension."""
    _, ext = os.path.splitext(filename)
    return EXTENSION_TO_LANGUAGE.get(ext.lower())


def get_client_name_from_language(language: str) -> str:
    """Get client name from language."""
    return LANGUAGE_TO_CLIENT.get(language, language.title())


def get_client_name_from_language_and_path(language: str, path: str) -> str:
    """Get client name from language with path-based overrides.

    For JavaScript (.js) files, override based on path substrings:
    - If 'ioredis' in path -> ioredis
    - Otherwise -> Node.js

    For Java (.java) files, override based on path substrings:
    - If 'lettuce-sync' in path -> Lettuce-Sync
    - If 'lettuce-async' in path -> Java-Async
    - If 'lettuce-reactive' in path -> Java-Reactive

    Substring checks are case-sensitive and can appear anywhere in the path.
    """
    if language == 'node.js':
        if 'ioredis' in path:
            return 'ioredis'
    if language == 'java':
        if 'lettuce-sync' in path:
            return 'Lettuce-Sync'
        if 'lettuce-async' in path:
            return 'Java-Async'
        if 'lettuce-reactive' in path:
            return 'Java-Reactive'
    if language == 'rust':
        if 'rust-async' in path:
            return 'Rust-Async'
        if 'rust-sync' in path:
            return 'Rust-Sync'
    if language == 'c#':
        if 'async' in path:
            return 'C#-Async'
        if 'sync' in path:
            return 'C#-Sync'
    # Default behavior for all languages (and Java fallback)
    return get_client_name_from_language(language)


def get_example_id_from_file(path: str) -> str:
    """Extract example ID from the first line of a file."""
    try:
        with open(path, 'r') as f:
            first_line = f.readline().strip()
            if 'EXAMPLE:' in first_line:
                return first_line.split(':')[1].strip()
    except Exception as e:
        logging.error(f"Error reading example ID from {path}: {e}")
    return None


def process_local_examples(local_examples_dir: str = 'local_examples',
                          examples_dir: str = 'examples',
                          examples_json: str = 'data/examples.json') -> None:
    """
    Process local examples and integrate them into the examples system.

    Works like remote examples - each file contains an EXAMPLE: header
    and can be any supported language.

    Args:
        local_examples_dir: Directory containing local example source files
        examples_dir: Target directory for processed examples
        examples_json: Path to examples.json file
    """

    if not os.path.exists(local_examples_dir):
        logging.info(f"Local examples directory {local_examples_dir} not found, skipping")
        return

    # Load existing examples data
    examples_data = {}
    if os.path.exists(examples_json):
        examples_data = load_dict(examples_json)

    # Process each file in local_examples directory and subdirectories
    for root, _, files in os.walk(local_examples_dir):
        for filename in files:
            source_file = os.path.join(root, filename)

            # Get language from file extension
            language = get_language_from_extension(filename)
            if not language:
                logging.warning(f"Unknown file extension for: {filename}")
                continue

            # Get example ID from file content
            example_id = get_example_id_from_file(source_file)
            if not example_id:
                logging.warning(f"No EXAMPLE: header found in {filename}")
                continue

            logging.info(f"Processing local example: {example_id} ({language}) "
                         f"from {source_file}")

            # Create target directory
            target_dir = os.path.join(examples_dir, example_id)
            mkdir_p(target_dir)

            # Initialize example data
            if example_id not in examples_data:
                examples_data[example_id] = {}

            # Copy file to target directory with local_ prefix
            # Include subdirectory structure in the filename to avoid conflicts
            relative_path = os.path.relpath(source_file, local_examples_dir)
            relative_dir = os.path.dirname(relative_path)
            base_name = os.path.splitext(filename)[0]
            ext = os.path.splitext(filename)[1]

            # Create a unique filename that includes subdirectory info
            if relative_dir and relative_dir != '.':
                # Replace path separators with underscores for flat filename
                subdir_prefix = relative_dir.replace(os.sep, '_')
                target_filename = f"local_{subdir_prefix}_{base_name}{ext}"
            else:
                target_filename = f"local_{base_name}{ext}"

            target_file = os.path.join(target_dir, target_filename)
            shutil.copy2(source_file, target_file)

            # Process with Example class
            example = Example(language, target_file)

            # Get client name (with Java path-based overrides)
            client_name = get_client_name_from_language_and_path(language, source_file)

            # Create metadata
            example_metadata = {
                'source': source_file,
                'language': language,
                'target': target_file,
                'highlight': example.highlight,
                'hidden': example.hidden,
                'named_steps': example.named_steps,
                'sourceUrl': None  # Local examples don't have source URLs
            }

            # Add binderId only if it exists
            if example.binder_id:
                example_metadata['binderId'] = example.binder_id

            examples_data[example_id][client_name] = example_metadata
            logging.info(f"Processed {client_name} example for {example_id}")

    # Save updated examples data
    dump_dict(examples_json, examples_data)
    logging.info(f"Updated examples data saved to {examples_json}")


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO,
                        format='%(levelname)s: %(message)s')

    process_local_examples()
    print("Local examples processing complete")
