---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Package, validate, upload, version, and publish reusable agent skills.
hideListLinks: true
linktitle: Manage skills
title: Manage skills
weight: 30
---

A skill tells an agent how to complete a task: what inputs or tools to use, which decisions to make, and what to return. This example drafts a customer reply by choosing and filling a refund template.

## Before you begin

Use an existing playbook and an API key with `write` permission to upload and maintain skills. Publishing and withdrawing require `publish`.

Follow the quickstart to [install a client and configure it]({{< relref "/develop/ai/context-engine/agent-playbook/quickstart#before-you-begin" >}}). You also need Bash and the `zip` utility for the sample package.

Download the complete example: [Python]({{< relref "/develop/ai/context-engine/agent-playbook/skills/" >}}skills.py), [TypeScript]({{< relref "/develop/ai/context-engine/agent-playbook/skills/" >}}skills.mts), or [HTTP]({{< relref "/develop/ai/context-engine/agent-playbook/skills/" >}}skills.sh). The HTTP script creates the package. For Python or TypeScript, run the package commands in [Prepare a skill package]({{< relref "/develop/ai/context-engine/agent-playbook/skills#prepare-a-skill-package" >}}) first.

## Prepare a skill package

Package skills using the [Agent Skills specification](https://agentskills.io/specification). Each directory contains `SKILL.md` with frontmatter and Markdown instructions. The required `name` matches the directory name; the required `description` explains the task and when to use the skill.

Make the task and its conditions explicit in the description: semantic matching uses the skill's name and description. In the instructions, specify inputs, decisions, and expected output. Put tool requirements in `compatibility`. Reference supporting files by paths relative to the skill root, with a reason to read each one.

“Help with refunds” is too broad: it overlaps refund requests and status questions. “Draft a customer reply from a reported refund stage or a missing refund” identifies the task and its inputs.

To prepare an upload:

1. Validate the directory against the Agent Skills specification.
2. Check that every referenced file is included and each path is relative to the skill root.
3. Create a ZIP archive containing exactly one skill directory.
4. Encode the archive as base64 for the upload request.

Agent Playbooks also enforces [package and content limits]({{< relref "/develop/ai/context-engine/agent-playbook/limits#content-limits" >}}).

Run these commands in a new directory. The sample uses customer-provided information without accessing an order system. Adapt its guidance to your policy.

```bash
mkdir -p refund-support-reply/references
cat > refund-support-reply/SKILL.md <<'SKILL'
---
name: refund-support-reply
description: Draft a customer reply for an existing refund using a reported refund stage or a report that no refund is listed. Use the matching reply template. Do not use to request a new refund.
---

# Draft a refund support reply

1. Check whether the customer supplied a displayed refund stage or said no refund is listed. If neither is known, ask what their order history shows before drafting a reply.
2. Read references/reply-template.md for the listed and missing refund templates.
3. If a stage is supplied, choose the listed refund template and replace <displayed-stage> with that exact stage.
4. If no refund is listed, choose the missing refund template. Do not invent a stage.
5. Return only the completed customer reply. Do not leave placeholders in it.

Do not claim to have accessed the order system, claim a refund was issued, or promise a bank posting date.
SKILL
cat > refund-support-reply/references/reply-template.md <<'TEMPLATE'
Refund listed: Your order history shows "<displayed-stage>". Support can help if you need more information about that stage.

Refund missing: Contact support with your order number and explain that no refund appears in your order history.
TEMPLATE
zip -r refund-support-reply.zip refund-support-reply
```

## Upload and validate a skill

Create an entry with `create_skill`. Supply the archive as `package_base64` in the Python client or `packageBase64` in a direct request. Include intents, attributes, and metadata alongside the package.

Upload validation rejects invalid frontmatter, a mismatched root name, unsafe or duplicate paths, symbolic links, special files such as device files, and content exceeding its limits. Regular text and binary files are supported. Include only the skill directory in the archive.

Save the returned entry identifier so later uploads update the same skill.

Validation checks structure and limits, not whether the procedure suits its audience. Review its accuracy before publishing. Your application controls script execution and tool permissions.

{{< multitabs id="playbook-skill-create" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
import base64
from pathlib import Path

package_base64 = base64.b64encode(Path("refund-support-reply.zip").read_bytes()).decode("ascii")
skill_context = {
    "intents": ["Draft a refund support reply", "Choose a refund reply template"],
    "attributes": {"locale": "en-US", "topic": "refund"},
}
skill_draft = playbook.create_skill(package_base64=package_base64, content=skill_context)
skill_id = skill_draft.entry.entry_id
skill_version = skill_draft.version.version
print(skill_id, skill_version)
```

-tab-sep-

```typescript
const { readFile } = await import("node:fs/promises");
const packageBase64 = (await readFile("refund-support-reply.zip")).toString("base64");
const skillContext = {
  intents: ["Draft a refund support reply", "Choose a refund reply template"],
  attributes: { locale: "en-US", topic: "refund" },
};
const skillDraft = await playbook.createSkill({ packageBase64, content: skillContext });
const skillId = skillDraft.entry.entryId;
const skillVersion = skillDraft.version.version;
console.log(skillId, skillVersion);
```

-tab-sep-

```bash
base64 < refund-support-reply.zip | tr -d '\r\n' > package.b64
jq -n --rawfile package package.b64 '{
  packageBase64: $package,
  content: {
    intents: ["Draft a refund support reply", "Choose a refund reply template"],
    attributes: {locale: "en-US", topic: "refund"}
  }
}' > skill.json
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/skills" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @skill.json > skill-draft.json
SKILL_ID=$(jq -er '.entry.entryId' skill-draft.json)
SKILL_VERSION=$(jq -er '.version.version' skill-draft.json)
jq .version skill-draft.json
```

{{< /multitabs >}}

## Review and publish a version

1. Retrieve the exact version returned by the upload.
2. Review its name, description, instructions, and resource descriptors.
3. Read the supporting files needed to assess the procedure.
4. Publish the reviewed version with `publish_skill`.
5. Test retrieval with a reader key, then test the agent's use of the skill.

Uploading a valid package does not publish it automatically. The current [proposal workflow]({{< relref "/develop/ai/context-engine/agent-playbook/proposals" >}}) creates FAQs, not skills.

{{< multitabs id="playbook-skill-review" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
stored_skill = playbook.get_skill_version(skill_id=skill_id, version=skill_version)
print(stored_skill.content)
```

-tab-sep-

```typescript
const storedSkill = await playbook.getSkillVersion(skillId, skillVersion);
console.log(storedSkill.content);
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/skills/$SKILL_ID/versions/$SKILL_VERSION" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .content
```

{{< /multitabs >}}

Publish after review. The [MCP example]({{< relref "/develop/ai/context-engine/agent-playbook/mcp#connect-an-agent" >}}) asks an agent to draft a reply for the stage “Processing.” Check that it loads this skill and template, preserves the stage, and leaves no placeholders or invented payment date. Also test a missing refund and missing input.

{{< multitabs id="playbook-skill-publish" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
playbook.publish_skill(skill_id=skill_id, version=skill_version)
```

-tab-sep-

```typescript
await playbook.publishSkill(skillId, { version: skillVersion });
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  -X PUT "$PLAYBOOK_API/skills/$SKILL_ID/publication" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq -n --argjson version "$SKILL_VERSION" '{version: $version}')" | jq .publication
```

{{< /multitabs >}}

## Update a skill

Use `append_skill_version` to update the existing entry. Supply the complete package and the intents, attributes, and metadata you want to retain.

The identifier stays the same. Agents use the previous publication until you review and publish the new version.

To roll back, publish an earlier version. Concurrent publication changes are last-write-wins, so coordinate publishers.

This example adds a `channel` attribute for chat retrieval and keeps the same instructions. To change the instructions or files, edit the directory and create a fresh ZIP archive before uploading.

{{< multitabs id="playbook-skill-append" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
from copy import deepcopy

updated_context = deepcopy(skill_context)
updated_context["attributes"]["channel"] = "chat"
replacement = base64.b64encode(Path("refund-support-reply.zip").read_bytes()).decode("ascii")
skill_update = playbook.append_skill_version(
    skill_id=skill_id, package_base64=replacement, content=updated_context,
)
print("Review before publishing:", skill_update.version)
```

-tab-sep-

```typescript
const updatedContext = {
  ...skillContext,
  attributes: { ...skillContext.attributes, channel: "chat" },
};
const replacement = (await readFile("refund-support-reply.zip")).toString("base64");
const skillUpdate = await playbook.appendSkillVersion(skillId, {
  packageBase64: replacement, content: updatedContext,
});
console.log("Review before publishing:", skillUpdate.version);
```

-tab-sep-

```bash
base64 < refund-support-reply.zip | tr -d '\r\n' > package.b64
jq --rawfile package package.b64 \
  '.packageBase64 = $package | .content.attributes.channel = "chat"' \
  skill.json > skill-update.json
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/skills/$SKILL_ID/versions" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @skill-update.json | jq .version
```

{{< /multitabs >}}

Leave the update unpublished here so the loading example uses the first version. Publishing the update makes its new attributes available to filters.

## Load instructions and files

Search and discovery return previews: a name, description, entry identifier, version, and file address. Select a relevant skill before loading its instructions. Fetch supporting files when the instructions or task call for them.

Keep the returned identifier and version together, and use the returned resource addresses. If the skill is republished or withdrawn between discovery and loading, rediscover and reassess it. See [Retrieve knowledge]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval" >}}) and [Connect with MCP]({{< relref "/develop/ai/context-engine/agent-playbook/mcp" >}}).

Resource descriptors identify the file's media type, size, and digest. Decode known text files as UTF-8 (Unicode Transformation Format, 8-bit); keep binary files as bytes. Close the Python response stream after reading it.

This example loads the first published version and reads its reply template.

{{< multitabs id="playbook-skill-load" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
selected = playbook.get_skill_version(skill_id=skill_id, version=skill_version)
skill = selected.content.payload.skill
if skill is None:
    raise ValueError("Expected a skill")
print(skill.instructions)
resource = next((r for r in skill.resources if r.path == "references/reply-template.md"), None)
if resource is None:
    raise ValueError("Reply template is missing")
response = playbook.get_skill_resource(
    skill_id=selected.entry_id, version=selected.version, resource_id=resource.resource_id,
)
try:
    print(response.result.read().decode("utf-8"))
finally:
    response.result.close()
```

-tab-sep-

```typescript
const selected = await playbook.getSkillVersion(skillId, skillVersion);
if (!("skill" in selected.content.payload)) throw new Error("Expected a skill");
const skill = selected.content.payload.skill;
console.log(skill.instructions);
const resource = skill.resources.find(r => r.path === "references/reply-template.md");
if (!resource) throw new Error("Reply template is missing");
const response = await playbook.getSkillResource(selected.entryId, selected.version, resource.resourceId);
console.log(await new Response(response.result).text());
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/skills/$SKILL_ID/versions/$SKILL_VERSION" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" > selected-skill.json
jq -r '.content.payload.skill.instructions' selected-skill.json
RESOURCE_ID=$(jq -er '.content.payload.skill.resources[] | select(.path == "references/reply-template.md") | .resourceId' selected-skill.json)
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/skills/$SKILL_ID/versions/$SKILL_VERSION/resources/$RESOURCE_ID" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY"
```

{{< /multitabs >}}

To verify file content, compare the descriptor's SHA-256 (Secure Hash Algorithm 256-bit) digest with the downloaded bytes. It uses `sha256:<hex>`; the HTTP `Content-Digest` header represents the same hash as `sha-256=:<base64>:`. This differs from the normalized entry digest in [entry lookup]({{< relref "/develop/ai/context-engine/agent-playbook/faqs#look-up-entry-state" >}}).

## List skills and inspect history

Use `list_skills` to inventory entries and `get_skill` to inspect one entry's summary. These operations require `read`; draft content and full version history require `write` or `publish`. To resolve a skill by its entry key or compare latest and published content digests, use the shared [entry lookup operation]({{< relref "/develop/ai/context-engine/agent-playbook/faqs#look-up-entry-state" >}}).

Follow cursors even after empty pages, and keep filters and ordering unchanged. An absent first-page `total` means the count is unknown. See [pagination behavior]({{< relref "/develop/ai/context-engine/agent-playbook/limits#retrieval-limits" >}}).

{{< multitabs id="playbook-skill-list" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
cursor = None
while True:
    page = playbook.list_skills(sort_by="updatedAt", sort_order="desc", limit=50, cursor=cursor)
    if cursor is None:
        print("Total skills:", page.total if page.total is not None else "unknown")
    for entry in page.skills:
        print(entry.entry_id, entry.latest_version, entry.publication)
    cursor = page.next_cursor
    if cursor is None:
        break
```

-tab-sep-

```typescript
let skillCursor: string | undefined;
while (true) {
  const page = await playbook.listSkills(
    "updatedAt", "desc", undefined, undefined, undefined, 50, skillCursor,
  );
  if (skillCursor === undefined) console.log("Total skills:", page.total ?? "unknown");
  for (const entry of page.skills) console.log(entry.entryId, entry.latestVersion, entry.publication);
  skillCursor = page.nextCursor;
  if (skillCursor === undefined) break;
}
```

-tab-sep-

```bash
CURSOR=''
while true; do
  PAGE_ARGS=(--data-urlencode sortBy=updatedAt --data-urlencode sortOrder=desc --data-urlencode limit=50)
  if [[ -n "$CURSOR" ]]; then PAGE_ARGS+=(--data-urlencode "cursor=$CURSOR"); fi
  curl --fail-with-body --silent --show-error --get "$PLAYBOOK_API/skills" \
    -H "Authorization: Bearer $PLAYBOOK_API_KEY" "${PAGE_ARGS[@]}" > skill-page.json
  if [[ -z "$CURSOR" ]]; then jq '.total // "unknown"' skill-page.json; fi
  jq '.skills[] | {entryId, latestVersion, publication}' skill-page.json
  CURSOR=$(jq -r '.nextCursor // empty' skill-page.json)
  [[ -n "$CURSOR" ]] || break
done
```

{{< /multitabs >}}

{{< multitabs id="playbook-skill-state" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
entry = playbook.get_skill(skill_id=skill_id)
print(entry.latest_version, entry.publication)
```

-tab-sep-

```typescript
const entry = await playbook.getSkill(skillId);
console.log(entry.latestVersion, entry.publication);
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error "$PLAYBOOK_API/skills/$SKILL_ID" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq '{latestVersion, publication}'
```

{{< /multitabs >}}

Read the complete versions newest first. Use a returned version number when reviewing or rolling back a publication:

{{< multitabs id="playbook-skill-history" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
cursor = None
while True:
    page = playbook.list_skill_versions(skill_id=skill_id, limit=50, cursor=cursor)
    for item in page.versions:
        print(item.version, item.content_digest, item.content)
    cursor = page.next_cursor
    if cursor is None:
        break
```

-tab-sep-

```typescript
let skillVersionCursor: string | undefined;
while (true) {
  const page = await playbook.listSkillVersions(skillId, undefined, undefined, 50, skillVersionCursor);
  for (const item of page.versions) console.log(item.version, item.contentDigest, item.content);
  skillVersionCursor = page.nextCursor;
  if (skillVersionCursor === undefined) break;
}
```

-tab-sep-

```bash
CURSOR=''
while true; do
  PAGE_ARGS=(--data-urlencode limit=50)
  if [[ -n "$CURSOR" ]]; then PAGE_ARGS+=(--data-urlencode "cursor=$CURSOR"); fi
  curl --fail-with-body --silent --show-error --get "$PLAYBOOK_API/skills/$SKILL_ID/versions" \
    -H "Authorization: Bearer $PLAYBOOK_API_KEY" "${PAGE_ARGS[@]}" > skill-versions.json
  jq '.versions[] | {version, contentDigest, content}' skill-versions.json
  CURSOR=$(jq -r '.nextCursor // empty' skill-versions.json)
  [[ -n "$CURSOR" ]] || break
done
```

{{< /multitabs >}}

## Withdraw or delete a skill

Withdraw the publication with `withdraw_skill` to stop serving the procedure while keeping its history. Delete the entry with `delete_skill` when you want to remove all its versions and files permanently.

The downloads omit these operations. For cleanup after a download, use a new script with the client setup and set `skill_id` (Python), `skillId` (TypeScript), or `SKILL_ID` (HTTP) to the printed identifier.

{{< multitabs id="playbook-skill-withdraw" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
playbook.withdraw_skill(skill_id=skill_id)
```

-tab-sep-

```typescript
await playbook.withdrawSkill(skillId);
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  -X DELETE "$PLAYBOOK_API/skills/$SKILL_ID/publication" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .
```

{{< /multitabs >}}

To remove the sample and its files permanently:

{{< multitabs id="playbook-skill-delete" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
playbook.delete_skill(skill_id=skill_id)
```

-tab-sep-

```typescript
await playbook.deleteSkill(skillId);
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  -X DELETE "$PLAYBOOK_API/skills/$SKILL_ID" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY"
```

{{< /multitabs >}}
