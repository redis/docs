#!/usr/bin/env python3
import argparse
import json
import logging

from components.syntax import Command
from components.markdown import Markdown


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Updates command metadata')
    parser.add_argument('--loglevel', type=str,
                        default='INFO',
                        help='Python logging level (overwrites LOGLEVEL env var)')
    return parser.parse_args()


if __name__ == '__main__':
    ARGS = parse_args()

    # Configure logging BEFORE creating objects
    log_level = getattr(logging, ARGS.loglevel.upper())
    logging.basicConfig(
        level=log_level,
        format='%(message)s %(filename)s:%(lineno)d - %(funcName)s',
        force=True  # Force reconfiguration in case logging was already configured
    )

    with open('data/commands_core.json', 'r') as f:
        j = json.load(f)

    board = []
    for k in j:
        v = j.get(k)
        c = Command(k, v)
        sf = c.syntax()
        path = f'content/commands/{k.lower().replace(" ", "-")}.md'
        md = Markdown(path)
        md.fm_data |= v
        md.fm_data.update({
            'syntax_str': str(c),
            'syntax_fmt': sf,
        })
        if 'replaced_by' in md.fm_data:
            replaced = md.generate_commands_links(k, j, md.fm_data['replaced_by'])
            md.fm_data['replaced_by'] = replaced
        md.persist()
