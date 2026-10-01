"""Render complete examples into their guides, or check that they are current.

The downloadable .py files are the only editable copies of these full examples.
No network or SDK checkout is required for a documentation build.
"""

import argparse
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "content/develop/ai/context-engine/agent-playbooks"
EXAMPLES = {
    "quickstart.md": ("Package and publish the skill", "publish_skill.py"),
    "connect-agent.md": ("Verify retrieval", "mcp_client.py"),
    "publish-knowledge.md": ("Add an answer", "faq_example.py"),
}


def sync(check=False):
    stale = []
    for page, (heading, filename) in EXAMPLES.items():
        path = DOCS / page
        text = path.read_text()
        start = text.index("## " + heading + "\n")
        section = text[start:].split("\n## ", 1)[0]
        block = re.search(r"```python\n.*?\n```", section, re.S)
        if block is None:
            raise ValueError(f"Missing complete example in {page}")
        expected = "```python\n" + (DOCS / "examples" / filename).read_text() + "```"
        if block.group() != expected:
            stale.append(page)
            if not check:
                path.write_text(text[:start + block.start()] + expected + text[start + block.end():])
    return stale


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    stale = sync(args.check)
    if stale and args.check:
        parser.exit(1, "Stale examples: " + ", ".join(stale) + "\nRun sync_examples.py to update them.\n")
    print("Updated " + ", ".join(stale) if stale else "Example blocks match their downloadable sources.")
