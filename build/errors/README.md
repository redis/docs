# Updating the error reference for a new Redis release

The error reference under `content/develop/reference/errors/` lists every error
message that Redis and its bundled modules can return. The messages and their
explanations live in `data/errors.json`. When a new Redis release comes out,
follow these steps to bring the reference up to date.

The fastest way is to ask Claude Code to do it: run `/update-error-reference`
in this repository, optionally with a version, such as
`/update-error-reference 8.12.0`. It runs every step and asks you to review
the result. This page describes the same steps, for doing them by hand or for
checking what Claude did.

## What you need

- Python 3.9 or later, and git.
- Network access to GitHub. The first run downloads the source of each release
  into `~/.cache/redis-docs-errors`. Set `ERRORS_CACHE` to use another folder.
- Docker Desktop, running, for the `verify` step.
- Optional: redis-py (`pip install redis`), so that `verify` also records the
  exception names that the error pages mention.

## Steps

1. **Compare the releases.**

   ```
   python3 build/errors/update_errors.py diff
   ```

   With no version, it compares with the latest Redis release. It finds the
   module versions that the release bundles, compares their source code with
   the versions the data comes from, and writes a work file:
   `.errors-update/<version>/work.json`. That folder isn't committed.

2. **Fill in the work file.** Each item has a `decision` to fill in:

   - `new`: a string near error-handling code that wasn't in the old release.
     Many aren't error messages that apps can get, such as log lines or internal
     checks. Set `"decision": "skip"` for those. For a real one, set
     `"decision": "add"` and add the message to `entries`, with its explanation.
     [explanation-style.md](explanation-style.md) says how to write it and which
     fields an entry needs.
   - `gone`: a message in the data that the new source no longer has. Search the
     new source for it first. Set `"remove"` if it's gone or was reworded, and
     add the new wording as a `new` entry. Set `"keep"` if the message is still
     sent, but built in a way the tool couldn't follow. When the new wording
     isn't in the `new` list, add an item of your own to it:
     `{"id": "new-extra-1", "decision": "add", "entries": [...]}`.
   - `review`: a message whose surrounding code changed. `code_diff` shows the
     change. Most changes are refactors: set `"ok"`. If the change affects when
     the error is sent or what the reader should do, set `"update"` and put the
     new values in `set`, such as `{"explain": "...", "commands": [...]}`.
   - `unused_codes_now_used`: a Redis Search code that was never sent and now is.
     Set `"used"` or `"still unused"`.

3. **Merge it into the data.**

   ```
   python3 build/errors/update_errors.py apply
   ```

   It refuses a work file that isn't complete, and lists what's missing. Then it
   updates `data/errors.json`, including the versions and the source locations,
   and runs the check in step 5.

4. **Update the pages.**

   - Each new error code needs a section on its module's list page, under
     `content/develop/reference/errors/all/`: a heading, a short explanation of
     the code, and `{{< error-catalog module="..." code="..." >}}`. The check
     names the codes that don't have one.
   - Update the versions on `all/_index.md`, and any other version that the
     check notes.

5. **Check the reference.**

   ```
   python3 build/errors/update_errors.py check
   ```

   This runs offline in a few seconds. It fails if a message has no
   explanation, a code has no section, or an error page explains a message that
   the data no longer has. Its notes are things worth a look, not failures.

6. **Check the error pages on the real server.**

   ```
   python3 build/errors/update_errors.py verify 8.12.0
   ```

   This starts the `redis:8.12.0` Docker image and reproduces the errors that
   the pages in `common/` show, such as `MOVED` on a small cluster. It compares
   the replies with `live_baseline.json`, and lists each page whose reply
   changed. Fix those pages, then save the new replies:

   ```
   python3 build/errors/update_errors.py verify 8.12.0 --accept
   ```

   It doesn't save a run in which a check failed, or in which a page got no
   replies, because the baseline would lose those pages.

7. **Build the site and open a pull request.** Look at the list pages that
   changed, and at the error lookup on the errors page.

## How the comparison works

The tool reads every string in the C and Rust source of each repository, at
both releases, and notes which strings sit in code that sends an error rather
than logging. It follows each message in the data by the longest piece of its
text that's in the source. So it finds:

- strings near error code that are new in the new release,
- messages whose text is no longer in the source,
- messages whose code changed near the place that sends them.

It's a set of hints for a person or an agent to judge, not a final answer. A
few messages, such as very short ones or those that the Redis module library
builds, can't be followed. `diff` says how many.

## Files

- `update_errors.py`: the `diff`, `apply`, `check` and `verify` steps.
- `live_checks.py`: the server checks that `verify` runs.
- `live_baseline.json`: the replies that the error pages show, from the last
  accepted run.
- `explanation-style.md`: how to write an explanation, and the fields of a new
  message.
- `../test_update_errors.py`: unit tests. Run `python3 build/test_update_errors.py`.
