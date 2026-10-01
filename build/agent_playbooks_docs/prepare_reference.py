"""Add documentation labels to freshly generated public Playbooks OpenAPI files.

Request/response schemas, routes, security, and operation IDs are preserved.
Input must be the public Smithy projection, not an internal projection.
"""

import argparse
from copy import deepcopy
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
GROUPS = {
    "Skills": [
        ("CreateSkill", "Create a skill"), ("ListSkills", "List skills"),
        ("GetSkill", "Get a skill"), ("AppendSkillVersion", "Append a skill version"),
        ("ListSkillVersions", "List skill versions"), ("GetSkillVersion", "Get a skill version"),
        ("PublishSkill", "Publish a skill version"), ("WithdrawSkill", "Withdraw a skill"),
        ("GetSkillResource", "Read a skill resource"),
        ("DeleteSkill", "Delete a skill"), ("DeleteSkills", "Delete multiple skills"),
    ],
    "FAQs": [
        ("CreateFaq", "Create an FAQ"), ("ListFaqs", "List FAQs"),
        ("GetFaq", "Get an FAQ"), ("AppendFaqVersion", "Append an FAQ version"),
        ("ListFaqVersions", "List FAQ versions"), ("GetFaqVersion", "Get an FAQ version"),
        ("PublishFaq", "Publish an FAQ version"), ("WithdrawFaq", "Withdraw an FAQ"),
        ("DeleteFaq", "Delete an FAQ"), ("DeleteFaqs", "Delete multiple FAQs"),
    ],
    "Retrieval": [
        ("DiscoverEntries", "Discover published entries"),
        ("SearchFaqs", "Search published FAQs"), ("SearchSkills", "Search published skills"),
        ("LookupEntries", "Look up entries"),
    ],
    "Proposals": [
        ("CreateProposal", "Create a proposal"), ("SubmitProposalEvidence", "Submit proposal evidence"),
        ("ListProposals", "List proposals"), ("SearchProposals", "Search proposals"),
        ("GetProposal", "Get a proposal"), ("ReplaceProposal", "Replace a proposal candidate"),
        ("AcceptProposal", "Accept a reviewed proposal"),
        ("DismissProposal", "Dismiss a proposal"), ("RestoreProposal", "Restore a proposal"),
        ("PurgeProposal", "Purge a proposal"),
    ],
    "Maintenance": [
        ("GetPlaybookHealth", "Check playbook health"), ("ClearPlaybook", "Clear playbook content"),
    ],
}
CONTROL = {"Playbooks": [
    ("CreatePlaybook", "Create a playbook"), ("ListPlaybooks", "List playbooks"),
    ("GetPlaybook", "Get a playbook"), ("UpdatePlaybook", "Update a playbook"),
    ("DeletePlaybook", "Delete a playbook"),
]}


def prepare(source, title, groups):
    document = deepcopy(source)
    labels = {op: (group, label) for group, entries in groups.items() for op, label in entries}
    operations = {
        operation["operationId"]: (path, method, operation)
        for path, methods in document["paths"].items()
        for method, operation in methods.items() if "operationId" in operation
    }
    if operations.keys() != labels.keys():
        raise ValueError("Public operations changed; review the documentation groups before regenerating.")
    document["info"]["title"] = title
    document["tags"] = [{"name": name} for name in groups]
    # Preserve shared path properties while ordering methods by the task sequence.
    ordered = {}
    for op_id, (group, label) in labels.items():
        path, method, operation = operations[op_id]
        operation["tags"] = [group]
        operation["summary"] = label
        if path not in ordered:
            ordered[path] = {k: v for k, v in document["paths"][path].items()
                             if not isinstance(v, dict) or "operationId" not in v}
        ordered[path][method] = operation
    document["paths"] = ordered
    return document


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-plane", type=Path, required=True)
    parser.add_argument("--control-plane", type=Path, required=True)
    args = parser.parse_args()
    for source, title, groups, target in [
        (args.data_plane, "Redis Agent Playbooks data-plane API", GROUPS,
         "content/develop/ai/context-engine/agent-playbooks/reference/rest-api/openapi.json"),
        (args.control_plane, "Redis Agent Playbooks control-plane API", CONTROL,
         "content/operate/iris/agent-playbooks/control-plane-api-reference/openapi.json"),
    ]:
        result = prepare(json.loads(source.read_text()), title, groups)
        (ROOT / target).write_text(json.dumps(result, indent=2) + "\n")
        print(target)
