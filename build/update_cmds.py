#!/usr/bin/env python3
from components.syntax import Command
from components.markdown import Markdown
import json

if __name__ == '__main__':
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
