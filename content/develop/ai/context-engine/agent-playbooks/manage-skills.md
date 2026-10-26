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

Follow the quickstart to [install a client and configure it]({{< relref "/develop/ai/context-engine/agent-playbooks/quickstart#before-you-begin" >}}). You also need Bash and the `zip` utility for the sample package.

Expand an example to copy the complete program. Run the package-preparation step before using a Python or CLI copy.

## Prepare a skill package

Package skills using the [Agent Skills specification](https://agentskills.io/specification). Each directory contains `SKILL.md` with frontmatter and Markdown instructions. The required `name` matches the directory name; the required `description` explains the task and when to use the skill.

Make the task and its conditions explicit in the description: semantic matching uses the skill's name and description. In the instructions, specify inputs, decisions, and expected output. Put tool requirements in `compatibility`. Reference supporting files by paths relative to the skill root, with a reason to read each one.

“Help with refunds” is too broad: it overlaps refund requests and status questions. “Draft a customer reply from a reported refund stage or a missing refund” identifies the task and its inputs.

To prepare an upload:

1. Validate the directory against the Agent Skills specification.
2. Check that every referenced file is included and each path is relative to the skill root.
3. Create a ZIP archive containing exactly one skill directory.
4. Encode the archive as base64 for the upload request.

Redis Agent Playbooks also enforces [package and content limits]({{< relref "/develop/ai/context-engine/agent-playbooks/limits#content-limits" >}}).

Run these commands in a new directory. The sample uses customer-provided information without accessing an order system. Adapt its guidance to your policy.

{{< clients-example set="iris_playbook_skills" step="playbook-skill-package" description="" lang_filter="cURL (Iris)" footer="hide" />}}

Run this Bash preparation step for every language. SDK and cURL examples upload the ZIP. The CLI reads the `refund-support-reply` directory and packages it for you. Its `.iris-playbook.json` sidecar supplies intents, attributes, and metadata without changing `SKILL.md`.

## Upload and validate a skill

Create an entry with `create_skill`. Supply the base64-encoded archive with intents, attributes, and metadata.

Upload validation rejects invalid frontmatter, a mismatched root name, unsafe or duplicate paths, symbolic links, special files such as device files, and content exceeding its limits. Regular text and binary files are supported. Include only the skill directory in the archive.

Save the returned entry identifier so later uploads update the same skill.

Validation checks structure and limits, not whether the procedure suits its audience. Review its accuracy before publishing. Your application controls script execution and tool permissions.

{{< clients-example set="iris_playbook_skills" step="playbook-skill-create" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

The CLI uses the skill name as its stable entry key. `skills push` creates missing content, appends changed content, and skips unchanged content. It leaves publication unchanged unless you request publication.

## Review and publish a version

1. Retrieve the exact version returned by the upload.
2. Review its name, description, instructions, and resource descriptors.
3. Read the supporting files needed to assess the procedure.
4. Publish the reviewed version with `publish_skill`.
5. Test retrieval with a reader key, then test the agent's use of the skill.

Uploading a valid package does not publish it automatically. The current [proposal workflow]({{< relref "/develop/ai/context-engine/agent-playbooks/proposals" >}}) creates FAQs, not skills.

{{< clients-example set="iris_playbook_skills" step="playbook-skill-review" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

Publish after review. The [agent-integration examples]({{< relref "/develop/ai/context-engine/agent-playbooks/agent-integration" >}}) ask an agent to draft a reply for the stage “Processing.” Check that it loads this skill and template, preserves the stage, and leaves no placeholders or invented payment date. Also test a missing refund and missing input.

{{< clients-example set="iris_playbook_skills" step="playbook-skill-publish" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

## Update a skill

Use `append_skill_version` to update the existing entry. Supply the complete package and the intents, attributes, and metadata you want to retain.

The identifier stays the same. Agents use the previous publication until you review and publish the new version.

To roll back, publish an earlier version. Concurrent publication changes are last-write-wins, so coordinate publishers.

This example adds a `channel` attribute for chat retrieval and keeps the same instructions. To change the instructions or files, edit the directory and create a fresh ZIP archive before uploading.

{{< clients-example set="iris_playbook_skills" step="playbook-skill-append" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

Leave the update unpublished here so the loading example uses the first version. Publishing the update makes its new attributes available to filters.

## Load instructions and files

Search and discovery return previews: a name, description, entry identifier, version, and file address. Select a relevant skill before loading its instructions. Fetch supporting files when the instructions or task call for them.

Keep the returned identifier and version together, and use the returned resource addresses. If the skill is republished or withdrawn between discovery and loading, rediscover and reassess it. See [Retrieve knowledge]({{< relref "/develop/ai/context-engine/agent-playbooks/retrieval" >}}) and [Connect with MCP]({{< relref "/develop/ai/context-engine/agent-playbooks/mcp" >}}).

Resource descriptors identify the file's media type, size, and digest. Decode known text files as UTF-8 (Unicode Transformation Format, 8-bit); keep binary files as bytes. Python's unified helper reads the stream and exposes `data`, `mime_type`, and optional decoded `text`.

This example loads the first published version and reads its reply template.

{{< clients-example set="iris_playbook_skills" step="playbook-skill-load" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

This guide's CLI reads use the authoring key. The published CLI resolves the entry through management lookup, so these commands require `write` or `publish` even for a published version. For reader-only loading, use the [retrieval examples](/content/develop/ai/context-engine/agent-playbooks/retrieval.md#load-skills-with-progressive-disclosure).

To verify file content, compare the descriptor's SHA-256 (Secure Hash Algorithm 256-bit) digest with the downloaded bytes. It uses `sha256:<hex>`; the HTTP `Content-Digest` header represents the same hash as `sha-256=:<base64>:`. This differs from the normalized entry digest in [entry lookup]({{< relref "/develop/ai/context-engine/agent-playbooks/manage-faqs#look-up-entry-state" >}}).

## List skills and inspect history

Use `list_skills` to inventory entries and `get_skill` to inspect one entry's summary. These operations require `read`; draft content and full version history require `write` or `publish`. To resolve a skill by its entry key or compare latest and published content digests, use the shared [entry lookup operation]({{< relref "/develop/ai/context-engine/agent-playbooks/manage-faqs#look-up-entry-state" >}}).

Follow cursors even after empty pages, and keep filters and ordering unchanged. An absent first-page `total` means the count is unknown. See [pagination behavior]({{< relref "/develop/ai/context-engine/agent-playbooks/limits#retrieval-limits" >}}).

{{< clients-example set="iris_playbook_skills" step="playbook-skill-list" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

{{< clients-example set="iris_playbook_skills" step="playbook-skill-state" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

Read the complete versions newest first. Use a returned version number when reviewing or rolling back a publication:

{{< clients-example set="iris_playbook_skills" step="playbook-skill-history" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

CLI lists and history follow cursors automatically. Use `--page` and `--cursor` to inspect individual pages. CLI version JSON currently omits `contentDigest`; use an SDK or cURL tab to inspect digests.

## Withdraw or delete a skill

Withdraw the publication with `withdraw_skill` to stop serving the procedure while keeping its history. Delete the entry with `delete_skill` when you want to remove all its versions and files permanently.

Complete-program copies retain the skill. For withdrawal or deletion, set `PLAYBOOK_SKILL_ID` to the printed identifier and run the selected example with the same connection values.

{{< clients-example set="iris_playbook_skills_withdraw" step="playbook-skill-withdraw" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

To remove the sample and its files permanently:

{{< clients-example set="iris_playbook_skills_delete" step="playbook-skill-delete" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}
