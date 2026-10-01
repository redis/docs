"""Check the docs API against the locked iris-sdks public contract.

Without arguments, verify the vendored contract without network access.
With --sdk-repo, also verify the local SDK contract, example overlay, and version.
An upstream change requires reviewing the source lock and SDK pin together.
"""

import argparse
from copy import deepcopy
import hashlib
import json
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[2]
LOCK = Path(__file__).with_name("source-lock.json")
SPEC = ROOT / "content/develop/ai/context-engine/agent-playbooks/reference/rest-api/openapi.json"


def wire_contract(document):
    result = deepcopy(document)
    result["info"].pop("title", None)
    result.pop("tags", None)
    for methods in result["paths"].values():
        for operation in methods.values():
            if not isinstance(operation, dict) or "operationId" not in operation:
                continue
            operation.pop("tags", None)
            operation.pop("summary", None)
    return result


def digest(document):
    content = json.dumps(wire_contract(document), sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(content.encode()).hexdigest()


def check(sdk_repo=None):
    lock = json.loads(LOCK.read_text())
    expected = lock["data_plane_contract_sha256"]
    if digest(json.loads(SPEC.read_text())) != expected:
        raise ValueError("Docs contract differs from the locked SDK input. Regenerate and review it.")
    if sdk_repo is not None:
        upstream = json.loads((sdk_repo / lock["sdk_contract_path"]).read_text())
        if digest(upstream) != expected:
            raise ValueError("SDK contract changed. Review the API, examples, version pin, and source lock together.")
        overlay = sdk_repo / lock["sdk_example_overlay_path"]
        if hashlib.sha256(overlay.read_bytes()).hexdigest() != lock["sdk_example_overlay_sha256"]:
            raise ValueError("SDK usage examples changed. Review the docs walkthroughs before updating the source lock.")
        config = yaml.safe_load((sdk_repo / "playbook-python-sdk/.speakeasy/gen.yaml").read_text())
        if config["python"]["version"] != lock["sdk_generator_version"]:
            raise ValueError("SDK version changed. Review the docs dependency pin.")
    return lock


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sdk-repo", type=Path)
    args = parser.parse_args()
    try:
        lock = check(args.sdk_repo)
    except ValueError as error:
        parser.exit(1, str(error) + "\n")
    print(f"Docs match the locked SDK contract ({lock['python_package']}).")
    if args.sdk_repo:
        print("Local SDK contract, usage overlay, and generator version also match.")
