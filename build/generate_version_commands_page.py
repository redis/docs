#!/usr/bin/env python3
"""
Generate comprehensive Redis commands reference pages for specific versions.
Reads all command markdown files and creates a single page with collapsible sections.
"""

import os
import re
import sys
from pathlib import Path
from collections import defaultdict
import yaml

# Command group display names and order
GROUP_ORDER = [
    ('string', 'String commands'),
    ('hash', 'Hash commands'),
    ('list', 'List commands'),
    ('set', 'Set commands'),
    ('sorted-set', 'Sorted set commands'),
    ('stream', 'Stream commands'),
    ('bitmap', 'Bitmap commands'),
    ('hyperloglog', 'HyperLogLog commands'),
    ('geo', 'Geospatial commands'),
    ('json', 'JSON commands'),
    ('search', 'Search commands'),
    ('timeseries', 'Time series commands'),
    ('bloom', 'Probabilistic commands'),
    ('vector_set', 'Vector set commands'),
    ('pubsub', 'Pub/Sub commands'),
    ('transactions', 'Transaction commands'),
    ('scripting', 'Scripting commands'),
    ('connection', 'Connection commands'),
    ('server', 'Server commands'),
    ('cluster', 'Cluster commands'),
    ('generic', 'Generic commands'),
]

def parse_frontmatter(content):
    """Extract YAML frontmatter from markdown content."""
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if match:
        try:
            return yaml.safe_load(match.group(1))
        except yaml.YAMLError:
            return {}
    return {}

def get_command_files():
    """Get all command markdown files."""
    commands_dir = Path('content/commands')
    return list(commands_dir.glob('*.md'))

def parse_command_file(filepath):
    """Parse a command file and extract relevant information."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    frontmatter = parse_frontmatter(content)
    
    # Skip hidden commands and container commands
    if frontmatter.get('hidden', False):
        return None
    
    return {
        'name': frontmatter.get('title', ''),
        'link': frontmatter.get('linkTitle', ''),
        'summary': frontmatter.get('summary', frontmatter.get('description', '')),
        'syntax': frontmatter.get('syntax_fmt', ''),
        'complexity': frontmatter.get('complexity', ''),
        'since': frontmatter.get('since', ''),
        'group': frontmatter.get('group', 'generic'),
        'filepath': filepath.stem,
    }

def version_compare(version_str):
    """Convert version string to tuple for comparison."""
    if not version_str:
        return (0, 0, 0)
    # Handle versions like "8.4.0", "1.0.0", etc.
    parts = version_str.split('.')
    try:
        return tuple(int(p) for p in parts[:3])
    except (ValueError, IndexError):
        return (0, 0, 0)

def is_new_in_version(since_version, target_version):
    """Check if command was introduced in the target version."""
    since_tuple = version_compare(since_version)
    target_tuple = version_compare(target_version)
    # Check if it's exactly the target version (major.minor match)
    return since_tuple[:2] == target_tuple[:2]

def is_available_in_version(since_version, target_version):
    """Check if command is available in the target version (introduced in or before)."""
    return version_compare(since_version) <= version_compare(target_version)

def generate_command_entry(cmd, target_version):
    """Generate HTML for a single command entry."""
    is_new = is_new_in_version(cmd['since'], target_version)
    version_display = target_version.rsplit('.', 1)[0]  # "8.4.0" -> "8.4"
    new_badge = f' <span style="color: #e74c3c;">⭐ New in {version_display}</span>' if is_new else ''

    # Clean up syntax for display
    syntax = cmd['syntax'].replace('_', ' ').replace('\\n', ' ')

    entry = f'''<details>
<summary><strong><a href="/commands/{cmd['filepath']}/">{cmd['name']}</a></strong> - {cmd['summary']}{new_badge}</summary>

**Syntax:** `{syntax}`

**Description:** {cmd['summary']}

**Complexity:** {cmd['complexity']}

**Since:** {cmd['since']}

</details>

'''
    return entry

def generate_page_content(commands_by_group, target_version):
    """Generate the complete page content."""
    content = []

    version_display = target_version.rsplit('.', 1)[0]  # "8.4.0" -> "8.4"

    # Calculate weight based on version (higher version = lower weight = appears first)
    # Weight mapping: 8.4->1, 8.2->2, 8.0->3, 7.4->4, 7.2->5, 6.2->6
    version_weights = {
        '8.4': 1,
        '8.2': 2,
        '8.0': 3,
        '7.4': 4,
        '7.2': 5,
        '6.2': 6,
    }
    weight = version_weights.get(version_display, 10)

    # Header
    content.append(f'''---
title: Redis {version_display} Commands Reference
linkTitle: Redis {version_display} Commands
description: Complete list of all Redis commands available in version {version_display}, organized by functional group
summary: Complete list of all Redis commands available in version {version_display}, organized by functional group
layout: single
type: develop
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
weight: {weight}
---

This page provides a comprehensive reference of all Redis commands available in Redis {version_display}, organized by functional group. Each command includes its description and syntax in a collapsible section for easy navigation.

{{{{< note >}}}}
Redis {version_display} includes all commands from previous versions plus new commands introduced in {version_display}. Commands marked with **⭐ New in {version_display}** were added in this release.
{{{{< /note >}}}}

## Quick Navigation

''')
    
    # Table of contents
    for group_key, group_name in GROUP_ORDER:
        if group_key in commands_by_group:
            anchor = group_name.lower().replace(' ', '-').replace('/', '')
            content.append(f'- [{group_name}](#{anchor})\n')
    
    content.append('\n---\n\n')
    
    # Generate sections for each group
    for group_key, group_name in GROUP_ORDER:
        if group_key not in commands_by_group:
            continue

        commands = sorted(commands_by_group[group_key], key=lambda x: x['name'])

        # Section header
        anchor = group_name.lower().replace(' ', '-').replace('/', '')
        content.append(f'## {group_name}\n\n')

        # Group description
        group_descriptions = {
            'string': 'String commands operate on string values, the most basic Redis data type.',
            'hash': 'Hash commands operate on hash data structures, which map string fields to string values.',
            'list': 'List commands operate on lists of strings, ordered by insertion order.',
            'set': 'Set commands operate on unordered collections of unique strings.',
            'sorted-set': 'Sorted set commands operate on sets of unique strings ordered by a score.',
            'stream': 'Stream commands operate on append-only log data structures.',
            'bitmap': 'Bitmap commands operate on strings as arrays of bits.',
            'hyperloglog': 'HyperLogLog commands provide probabilistic cardinality estimation.',
            'geo': 'Geospatial commands operate on geographic coordinates.',
            'json': 'JSON commands operate on JSON data structures.',
            'search': 'Search commands provide full-text search and secondary indexing.',
            'timeseries': 'Time series commands operate on time-series data.',
            'bloom': 'Probabilistic data structure commands (Bloom filters, Cuckoo filters, etc.).',
            'vector_set': 'Vector set commands operate on vector data structures for similarity search and range queries.',
            'pubsub': 'Pub/Sub commands enable message passing between clients.',
            'transactions': 'Transaction commands enable atomic execution of command groups.',
            'scripting': 'Scripting commands enable server-side Lua script execution.',
            'connection': 'Connection commands manage client connections.',
            'server': 'Server commands provide server management and introspection.',
            'cluster': 'Cluster commands manage Redis Cluster operations.',
            'generic': 'Generic commands work across all data types.',
        }

        if group_key in group_descriptions:
            content.append(f'{group_descriptions[group_key]}\n\n')

        # Add commands
        for cmd in commands:
            content.append(generate_command_entry(cmd, target_version))

        content.append('\n')

    return ''.join(content)

def main():
    """Main function to generate the commands page."""
    # Get target version from command line argument or default to 8.4.0
    if len(sys.argv) > 1:
        target_version = sys.argv[1]
        if not target_version.count('.') == 2:
            target_version = f"{target_version}.0"
    else:
        target_version = "8.4.0"

    version_display = target_version.rsplit('.', 1)[0]  # "8.4.0" -> "8.4"

    print(f"Generating Redis {version_display} commands reference page...")
    print("Parsing command files...")

    commands_by_group = defaultdict(list)
    total_commands = 0
    new_commands = 0

    for filepath in get_command_files():
        cmd_data = parse_command_file(filepath)
        if cmd_data and is_available_in_version(cmd_data['since'], target_version):
            commands_by_group[cmd_data['group']].append(cmd_data)
            total_commands += 1
            if is_new_in_version(cmd_data['since'], target_version):
                new_commands += 1

    print(f"Found {total_commands} commands ({new_commands} new in {version_display})")
    print(f"Organized into {len(commands_by_group)} groups")

    # Generate page content
    print("Generating page content...")
    content = generate_page_content(commands_by_group, target_version)

    # Write to file
    output_file = Path(f'content/commands/redis-{version_display.replace(".", "-")}-commands.md')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ Generated {output_file}")
    print(f"   Total commands: {total_commands}")
    print(f"   New in {version_display}: {new_commands}")

if __name__ == '__main__':
    main()

