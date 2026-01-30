"""
Command Enricher

Enriches extracted CLI command names with metadata from commands_core.json.
Generates command reference links and handles missing/deprecated commands.
"""

import json
import logging
import os


# Cache for commands metadata
_commands_cache = None


def load_commands_metadata(commands_file='data/commands_core.json'):
    """
    Load Redis commands metadata from JSON file.
    
    Args:
        commands_file: Path to commands_core.json
        
    Returns:
        Dictionary mapping command names to metadata
    """
    global _commands_cache
    
    if _commands_cache is not None:
        return _commands_cache
    
    _commands_cache = {}
    
    if not os.path.exists(commands_file):
        logging.warning(f"Commands file not found: {commands_file}")
        return _commands_cache
    
    try:
        with open(commands_file, 'r') as f:
            data = json.load(f)

        # Build lookup dictionary
        # commands_core.json has structure: {"COMMAND_NAME": {...}, ...}
        if isinstance(data, dict):
            for cmd_name, cmd_data in data.items():
                if isinstance(cmd_data, dict):
                    _commands_cache[cmd_name.upper()] = cmd_data
        else:
            logging.warning(f"Unexpected structure in {commands_file}")

        logging.info(f"Loaded {len(_commands_cache)} commands from {commands_file}")

    except Exception as e:
        logging.error(f"Error loading commands metadata: {e}")
    
    return _commands_cache


def enrich_commands(command_names, commands_file='data/commands_core.json'):
    """
    Enrich command names with metadata from commands_core.json.
    
    Args:
        command_names: List of command names (strings)
        commands_file: Path to commands_core.json
        
    Returns:
        List of enriched command objects with metadata
    """
    commands_metadata = load_commands_metadata(commands_file)
    enriched = []
    
    for cmd_name in command_names:
        cmd_upper = cmd_name.upper()
        
        if cmd_upper in commands_metadata:
            # Command found in metadata
            cmd_data = commands_metadata[cmd_upper]
            enriched_cmd = {
                'name': cmd_upper,
                'summary': cmd_data.get('summary', ''),
                'group': cmd_data.get('group', ''),
                'complexity': cmd_data.get('complexity', ''),
                'since': cmd_data.get('since', ''),
                'link': generate_command_link(cmd_upper)
            }
        else:
            # Command not found - create minimal metadata
            logging.warning(f"Command not found in metadata: {cmd_name}")
            enriched_cmd = {
                'name': cmd_upper,
                'link': generate_command_link(cmd_upper)
            }
        
        enriched.append(enriched_cmd)
    
    return enriched


def generate_command_link(command_name):
    """
    Generate command reference link.
    
    Args:
        command_name: Command name (e.g., "HSET", "ACL CAT", "JSON.SET")
        
    Returns:
        Link path (e.g., "/commands/hset", "/commands/acl-cat", "/commands/json.set")
    """
    # Convert to lowercase
    link = command_name.lower()
    
    # Replace spaces with hyphens (for multi-word commands)
    link = link.replace(' ', '-')
    
    # Keep dots as-is (for dot notation commands)
    
    return f"/commands/{link}"

