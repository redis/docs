"""Extract runnable examples from the documentation, their only editable source.

The guides share the quickstart connection block. MCP has its own complete client.
Validation scripts stay in a temporary directory. Downloadable walkthroughs are
generated beside their pages and checked against these same snippets.
"""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "content/develop/ai/context-engine/agent-playbook"
GUIDES = ("quickstart", "faqs", "skills", "proposals", "retrieval", "mcp", "limits")
DOWNLOADS = {
    "quickstart": {"playbook-quickstart-delete"},
    "skills": {"playbook-skill-withdraw", "playbook-skill-delete"},
}
TABS = re.compile(r'\{\{< multitabs id="([^"]+)"[^>]*>\}\}(.*?)\{\{< /multitabs >\}\}', re.S)
FENCE = re.compile(r"```(?:python|typescript|bash)\n(.*?)\n```", re.S)


def blocks(page):
    result = []
    seen = set()
    for name, body in TABS.findall((DOCS / f"{page}.md").read_text()):
        assert name not in seen, f"Duplicate tab group in {page}: {name}"
        seen.add(name)
        if name.endswith("-install") or name == "playbook-install":
            continue
        sections = body.split("-tab-sep-")
        assert len(sections) == 3, name
        snippets = []
        for section in sections:
            matches = FENCE.findall(section)
            assert len(matches) == 1, name
            snippets.append(matches[0])
        result.append((name, snippets))
    return result


def skill_package():
    text = (DOCS / "skills.md").read_text()
    return next(code for code in FENCE.findall(text) if code.startswith("mkdir -p refund-support-reply/"))


def scripts(page, omit=()):
    selected = [block for block in blocks(page) if block[0] not in omit]
    if page not in ("quickstart", "mcp"):
        setup = next(block for block in blocks("quickstart") if block[0] == "playbook-connect")
        selected.insert(0, setup)
    result = ["\n\n".join(block[1][i] for block in selected) + "\n" for i in range(3)]
    if page == "skills":
        result[2] = skill_package() + "\n\n" + result[2]
    result[2] = "set -euo pipefail\n\n" + result[2]
    return dict(zip(("py", "mts", "sh"), result))


def downloads():
    result = {}
    for page, omit in DOWNLOADS.items():
        assert omit <= {name for name, _ in blocks(page)}, (page, omit)
        for suffix, source in scripts(page, omit=omit).items():
            marker = "//" if suffix == "mts" else "#"
            header = f"{marker} Generated from {page}.md; edit the page, then run examples.py --refresh-downloads.\n"
            result[DOCS / page / f"{page}.{suffix}"] = header + source
    result[DOCS / "skills/prepare_skill.sh"] = (
        "# Generated from skills.md; edit the page, then run examples.py --refresh-downloads.\n"
        "set -euo pipefail\n\n" + skill_package() + "\n"
    )
    return result


def standalone_python(page, heading):
    source = (DOCS / f"{page}.md").read_text().split(f"## {heading}\n", 1)[1].split("\n## ", 1)[0]
    snippets = re.findall(r"```python\n(.*?)\n```", source, re.S)
    assert len(snippets) == 1, (page, heading)
    return snippets[0] + "\n"


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, nargs="?")
    parser.add_argument("--refresh-downloads", action="store_true",
                        help="Refresh the downloadable scripts from the displayed walkthroughs.")
    args = parser.parse_args()
    if args.refresh_downloads:
        for path, source in downloads().items():
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(source)
    if args.output is None:
        if not args.refresh_downloads:
            parser.error("Provide an output directory or --refresh-downloads.")
        raise SystemExit(0)
    args.output.mkdir(parents=True, exist_ok=True)
    for page in GUIDES:
        for suffix, source in scripts(page).items():
            (args.output / f"{page}_example.{suffix}").write_text(source)
    for path, source in downloads().items():
        (args.output / f"{path.stem}_download{path.suffix}").write_text(source)
    (args.output / "async_search_example.py").write_text(standalone_python("quickstart", "Use Python asynchronously"))
