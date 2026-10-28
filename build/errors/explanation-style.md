# How to write an error explanation

Every error message in `data/errors.json` has an `explain` field: a short
explanation that the docs show under the message, in the lists and in the error
lookup. Readers are developers who pasted an error from their app and want to
know what to fix. Many of them are new to Redis.

## Find out what the error means

- Read the source where the error is sent (`sources`, or the `where` and
  `context` of a work file item). Read enough of the code around it to know
  exactly when Redis sends it.
- If the code doesn't settle it, reproduce the error on the release's Docker
  image: `docker run -d --rm --name <name> redis:<version>`, then
  `docker exec <name> redis-cli ...`. The image has Redis Search, JSON,
  probabilistic data types, time series, and vector sets. Remove the container
  when you're done.
- Set `explain_basis` to `tested` when you reproduced it, `source` when the code
  makes the condition clear, or `inferred` when you couldn't pin it down. For an
  `inferred` explanation, still write the most useful text you can, and say
  "can" or "usually" where you aren't sure.

## Write it

- One or two short sentences, about 15–40 words. Add a third only if it's needed.
- First sentence: what went wrong, in plain words. Second: what to do about it.
- Add what the message doesn't say: which argument or value it means, the valid
  range or values (take them from the code), the condition that triggers it, the
  common reason it happens. Never just reword the message.
- Second person, present tense, active voice: "You called `XREADGROUP` with a
  group that doesn't exist", not "A non-existent group was specified".
- Plain verbs. Contractions are fine. No "simply", "just", "easily", "seamless".
- Command names, options, configuration parameters, field types and other
  literals go in backticks, spelled exactly as Redis spells them (`FT.CREATE`,
  `INDEXMISSING`, `maxmemory`). Never re-case or pluralize a literal.
- Expand any acronym in each explanation, because each one is also shown on its
  own: "access control list (ACL)". Literals in backticks don't count.
- Refer to placeholders in words: "the index name in the message", "the key".
- No links, no Markdown other than backticks, no line breaks.
- Don't name C or Rust functions, files, or internal variables, unless the message
  itself shows them. Then explain what they mean to the reader.
- Don't promise a fix the code doesn't support. Check claims such as "you can
  change this with `CONFIG SET`" before you write them.
- Don't soften a limitation. If something isn't supported, say so plainly.
- A message that many commands share, such as `ERR syntax error`, gets a general
  explanation that holds for all of them.
- When a message can't be reached in practice, say so: "You shouldn't see this
  error, because ..."

## Example

Message: `SEARCH_SYNTAX 'ismissing' requires defining the field with 'INDEXMISSING' at offset <position> near <token>`

Explanation: Your query calls `ismissing()` on a field that wasn't defined with
`INDEXMISSING`, so the index doesn't track which documents lack it. Re-create the
index with `INDEXMISSING` on that field. Or use `FT.ALTER` to add the same field
again under a new name with `INDEXMISSING`, and query that name.

## The other fields of a new message

- `message`: the message as a client receives it, with angle-bracket
  placeholders for the parts that change, such as `<key>`.
- `prefix`: its first word when that's an error code, such as `ERR`, `WRONGTYPE`
  or `SEARCH_SYNTAX`. Module messages without a code use their first word, such
  as `Bad`. The message must start with it.
- `module`: `core`, `vectorset`, `search`, `json`, `bloom` or `timeseries`.
- `commands`: the public commands that can return it, in uppercase, such as
  `["FT.SEARCH", "FT.AGGREGATE"]`. Leave out internal and debugging commands.
  An empty list shows "Several commands".
- Optional: `verified: true` and `example` (the reply exactly as you saw it)
  when you reproduced it, and `internal: true` when only internal or debugging
  commands return it, which keeps it off the pages.
