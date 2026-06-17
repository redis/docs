---
name: command-api-mapping
description: "Map Redis commands to their client-library method signatures for the docs API-mapping tables. Use when adding or updating entries in data/command-api-mapping/ — e.g. a new command family (AR*, BF.*) or refreshing a client's signatures. Produces per-command JSON files in the repo's real schema, then merges them."
---

# Command → API mapping

Build the `data/command-api-mapping/<COMMAND>.json` files that drive the per-command
"API methods" tables in the docs. Each file lists, for one Redis command, the equivalent
method signature(s) in each client library.

This is **AI-in-the-loop work, not a pure extractor.** Reading a client's source file and
turning it into a correct mapping row needs judgment a parser can't supply (public method
name vs. internal function, return type buried in wrappers, descriptions that aren't in the
source at all). You do that judgment; the reference files give you the durable facts.

> Background: an MCP server under `build/command_api_mapping/` (underscore) was an earlier,
> heavier attempt at this. It is **not** wired into the live pipeline and you don't need it.
> The live pipeline is the per-command JSON files + the merge script described below.

## When to use

- Adding a new command family to the mapping (the array `AR*` commands, a new module).
- Refreshing one client's signatures after an API change.
- Filling gaps where a command is missing a client that actually supports it.

## The pipeline (how output is consumed)

1. **Source of truth:** one file per command at `data/command-api-mapping/<COMMAND>.json`
   (e.g. `ARSET.json`, `BF.ADD.json`). Filename = command name, including any space
   (e.g. `ACL CAT.json`).
2. **Merge:** `./build/merge-command-api-mapping.sh` concatenates all per-command files into
   `data/command-api-mapping.json`.
3. **Overrides:** `data/command-api-mapping-overrides.json` *replaces* (not merges) entries
   when the auto-generated data is wrong and you can't fix it at the source.
4. **Render:** `layouts/partials/components/api-methods-tab.html` and
   `layouts/partials/commands-foldout.html` read the merged file.

See `reference/output-schema.md` for the exact JSON shape and the full client-ID list.

## Workflow

For each command in the set you're mapping:

1. **Identify the target clients.** Only include clients that actually ship the command.
   For preview/unreleased commands, a client may have it only on `master` — note that and
   decide per task whether to include it. (See `reference/client-source-map.md` for repos,
   IDs, and default branches.)

2. **Locate the source file(s).** Use the per-client source map in
   `reference/client-source-map.md`. **It can be stale for brand-new commands** — the map is
   a starting point, not gospel. To find where a new command lives, list the client's command
   directory via the GitHub contents API (recipe in the source map reference). This is the
   step that caught us out on `AR*`: the array files existed but weren't in any map.

3. **Read the source and extract the real signature.** Read the file directly. For each
   relevant method capture: public method name, parameters (name + type, skipping
   context/`self`/internal params), and return type. Apply the per-client translation rules
   in `reference/client-quirks.md` — these encode the non-obvious bits (e.g. node-redis method
   name = camelCase of the filename, return type lives in `transformReply`, and there are no
   doc comments).

4. **Write descriptions.** Source doc comments are the first choice. Where a client has none
   (node-redis, often go-redis), leave `description: ""` — do **not** invent prose. The
   command's own reference page already carries the human explanation; the table only needs
   the signature shape.

5. **Write the per-command file** at `data/command-api-mapping/<COMMAND>.json` in the exact
   schema (see `reference/output-schema.md`). Multiple overloads → multiple objects in the
   client's array. Omit clients that don't have the command.

6. **Merge and verify:**
   ```bash
   ./build/merge-command-api-mapping.sh
   python3 -c "import json; json.load(open('data/command-api-mapping.json'))"  # valid JSON
   ```
   Spot-check one command in the rendered table if you can run the site.

## Guardrails

- **Match the live client IDs exactly**, including `go-redis` (hyphen) and `node_redis`,
  `redis_py` (underscores). Wrong IDs render nothing. Full list in `reference/output-schema.md`.
- **Don't fabricate signatures or descriptions.** If you can't confirm a client has a command,
  omit that client rather than guess.
- **Network:** fetching client source uses `raw.githubusercontent.com` / the GitHub API. The
  default command sandbox blocks these hosts — run fetches with the sandbox disabled (or use
  `/sandbox` to allow them).
- **Improve this skill as you go.** When you hit a new quirk or a stale source path, update the
  relevant reference file so the next run is cheaper.

## Reference files

- `reference/output-schema.md` — exact per-command JSON schema, file locations, merge script,
  overrides, client-ID list, consumers.
- `reference/client-source-map.md` — per-client repos, default branches, and the known source
  file locations for command definitions; recipe for finding new command files.
- `reference/client-quirks.md` — per-client translation rules for turning source into a
  mapping row (naming, return types, doc-comment availability, internal params to strip).
