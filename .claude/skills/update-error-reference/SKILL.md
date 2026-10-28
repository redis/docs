---
name: update-error-reference
description: "Bring the Redis error reference (data/errors.json and content/develop/reference/errors/) up to date with a new Redis release: find new, removed and changed error messages in the source, explain the new ones, and recheck the error pages on the release's Docker image. Use when a new Redis release is out, or when asked to update or check the error messages. Optional argument: the Redis version, such as 8.12.0 (default: the latest release)."
---

# Update the error reference for a new Redis release

The error reference lists every error message of Redis and its bundled modules,
each with an explanation, in `data/errors.json`. `build/errors/update_errors.py`
does the mechanical work. You do the judgment: deciding which new strings are
real error messages, writing their explanations, and rechecking changed code.

Read `build/errors/README.md` for the steps and the work file format, and
`build/errors/explanation-style.md` before you write any explanation. Follow the
repository's `AGENTS.md` for page edits.

## 1. Compare the releases

```
python3 build/errors/update_errors.py diff [VERSION]
```

It needs network access to GitHub, so run it outside the sandbox if it fails to
fetch. If it says the reference is already up to date, tell the user and stop.
Otherwise it writes `.errors-update/<version>/work.json` and prints how many
items each list has.

The sources it downloaded are git clones under `~/.cache/redis-docs-errors/`
(or `$ERRORS_CACHE`), one per repository: `redis`, `search`, `json`, `bloom`,
`timeseries`. Read any file at either release with
`git -C ~/.cache/redis-docs-errors/<repo> show <tag>:<path>`, and search with
`git -C ... grep -n -F '<text>' <tag>`. Module tags start with `v`, such as
`v8.12.0`. The work file's `base` and `target` give the versions.

## 2. Fill in the work file

Every item has a `decision`. Work through the lists in this order.

- **`new`**: most are log lines, internal checks or strings in a command-line
  tool. Skip them with `"decision": "skip"`. For each string, read its `context`
  and decide whether a client can get it as an error reply. If it can, set
  `"decision": "add"` and write one or more `entries`, following
  explanation-style.md. One string can produce two messages, for example with
  and without a prefix. When the code doesn't settle when it's sent, reproduce
  it on the target's Docker image.
- **`gone`**: confirm in the target source that the message is really gone. If it
  was reworded, set `"remove"` and add the new wording as an entry of the `new`
  item that has it, carrying the explanation over and fixing what changed. When
  no `new` item has it, add one: `{"id": "new-extra-1", "decision": "add",
  "entries": [...]}`. If
  it's still sent but built differently, set `"keep"`.
- **`review`**: read `code_diff`. A rename or a refactor is `"ok"`. If the change
  affects when the error is sent, which commands send it, or what the reader
  should do, set `"update"` and put the new `explain` or `commands` in `set`.
- **`unused_codes_now_used`**: check where the Redis Search code is now set, and
  set `"used"` or `"still unused"`. A code that's now used needs its list-page
  section updated, from "never sent" to a table.

With more than about 40 items, split the work across subagents, by repository
or by list. Give each one explanation-style.md, the work file path, and its item
IDs, and have it return its decisions as a JSON object keyed by item ID, such as
`{"new-3": {"decision": "add", "entries": [...]}, "review-7": {"decision": "ok"}}`.
Merge their answers into the work file yourself:

```python
import json
work = json.load(open(path))
items = {i['id']: i for k in ('new', 'gone', 'review') for i in work[k]}
for answer in answers:            # the subagents' JSON objects
    for item_id, fields in answer.items():
        items[item_id].update(fields)
json.dump(work, open(path, 'w'), indent=1, ensure_ascii=False)
```

## 3. Apply, and update the pages

```
python3 build/errors/update_errors.py apply
```

Fix anything it reports, then:

- For each code that the check says has no section, add one to the module's
  page in `content/develop/reference/errors/all/`. Copy the shape of the
  sections around it: an H3 with the code, a short explanation of what the code
  means, and the `error-catalog` shortcode.
- Update the versions on `all/_index.md`.
- Read the check's notes. Explanations and pages that name the old release, such
  as "In Redis 8.10, ...", may need a new version or new facts.

## 4. Recheck the error pages

```
python3 build/errors/update_errors.py verify <version>
```

It needs Docker Desktop to be running, and runs outside the sandbox. If Docker
isn't running, ask the user to start it rather than skipping this step. For each
page it lists, compare the new reply with what the page says, and update the
page's example and text. If a change would remove or soften a limitation that
the page states, flag it to the user instead of changing it. Then save the new
replies with `--accept`.

## 5. Finish

Run `python3 build/errors/update_errors.py check` and
`python3 build/test_update_errors.py`, both of which must pass. Then tell the
user, in a few lines:

- how many messages were added, removed and updated,
- the new error codes,
- which explanations are `inferred`, and why,
- any upstream bugs you found, such as a message with the wrong code or a typo,
- the pages that `verify` flagged, and what you changed.

Don't commit or open a pull request unless the user asks.
