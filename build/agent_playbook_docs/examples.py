"""Read the standard TCE sources for Playbooks validation.

Site builds use build/local_examples.py and clients-example. This adapter exposes
those same processed source files and named steps to the API example checks.
"""

from functools import lru_cache
from pathlib import Path
import re
import shutil
import sys
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "build"))
from components.example import Example
from local_examples import get_example_id_from_file, get_language_from_extension

DOCS = ROOT / "content/develop/ai/context-engine/agent-playbook"
SOURCES = ROOT / "local_examples/iris/playbooks"
GUIDES = ("quickstart", "faqs", "skills", "proposals", "retrieval", "mcp", "limits")
PAGE_NAMES = {"faqs": "manage-faqs"}
CLIENTS = {}
for row in (ROOT / "build/example-test-harness/clients.tsv").read_text().splitlines():
    if row.startswith("iris-"):
        fields = row.split("\t")
        CLIENTS[fields[6].rsplit(".", 1)[1]] = fields[1]
assert set(CLIENTS) == {"py", "mts", "sh"}
CALLS = re.compile(r'\{\{< clients-example\s+([^>]*?)/>\}\}', re.S)
ATTRS = re.compile(r'(\w+)="([^"]*)"')
FENCE = re.compile(r"```(?:python|typescript|bash)\n(.*?)\n```", re.S)


def source_path(page, suffix, action=None):
    name = f"{page}_{action}" if action else "mcp_example" if page == "mcp" else page
    return SOURCES / page / f"{name}.{suffix}"


@lru_cache(maxsize=128)
def _processed(path, mtime):
    with TemporaryDirectory(prefix="playbook-tce-") as directory:
        target = Path(directory) / path.name
        shutil.copy2(path, target)
        example = Example(get_language_from_extension(path.name), str(target))
        assert example.named_steps, f"No named steps in {path}"
        return target.read_text(), example.named_steps


def processed(path):
    return _processed(path, path.stat().st_mtime_ns)


def bundle(set_id):
    result = {}
    for path in SOURCES.rglob("*"):
        suffix = path.suffix.lstrip(".")
        if suffix in CLIENTS and get_example_id_from_file(str(path)) == set_id:
            assert suffix not in result, f"Duplicate {suffix} source in {set_id}"
            result[suffix] = path
    assert result, f"Unknown Playbook example set: {set_id}"
    return result


def step(path, name):
    source, steps = processed(path)
    assert name in steps, f"Missing {name} in {path}"
    start, end = map(int, steps[name].split("-"))
    return "\n".join(source.splitlines()[start - 1:end])


def calls(page):
    source = (DOCS / f"{PAGE_NAMES.get(page, page)}.md").read_text()
    return [dict(ATTRS.findall(body)) for body in CALLS.findall(source)]


def blocks(page):
    result = []
    seen = set()
    for attrs in calls(page):
        if len(attrs.get("lang_filter", "").split(",")) != 3:
            continue
        name = attrs["step"]
        assert name not in seen, f"Duplicate step in {page}: {name}"
        seen.add(name)
        files = bundle(attrs["set"])
        result.append((name, [step(files[suffix], name) for suffix in CLIENTS]))
    return result


def skill_package():
    return step(source_path("skills", "sh"), "playbook-skill-package")


def scripts(page, omit=()):
    selected = [block for block in blocks(page) if block[0] not in omit]
    if page not in ("quickstart", "mcp"):
        setup = next(block for block in blocks("quickstart") if block[0] == "playbook-connect")
        selected.insert(0, setup)
    result = ["\n\n".join(block[1][i] for block in selected) + "\n" for i in range(3)]
    if page == "skills":
        result[2] = skill_package() + "\n\n" + result[2]
    result[2] = "set -euo pipefail\n\n" + result[2]
    return dict(zip(CLIENTS, result))


def full_examples():
    return {source_path(page, suffix): processed(source_path(page, suffix))[0]
            for page in ("quickstart", "skills") for suffix in CLIENTS}


def standalone_python(page, heading):
    assert (page, heading) == ("quickstart", "Use Python asynchronously")
    return processed(SOURCES / "async/async_example.py")[0]


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    for path in args.output.glob("*_download.*"):
        path.unlink()
    for page in GUIDES:
        for suffix, source in scripts(page).items():
            (args.output / f"{page}_example.{suffix}").write_text(source)
    for path, source in full_examples().items():
        (args.output / f"{path.stem}_copy{path.suffix}").write_text(source)
    (args.output / "async_search_example.py").write_text(standalone_python("quickstart", "Use Python asynchronously"))
