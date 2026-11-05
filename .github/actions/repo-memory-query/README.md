# Repo Memory Query

A read-only search of the [Repo Memory](https://github.com/redis-learn/redis-repo-memory) store from a
description of work you are about to do. Use it to find related prior PRs, commits and issues, with
their full squash or commit messages, before any PR exists.

It is separate from the `redis-learn/redis-repo-memory` action on purpose. That action runs on every
push and PR and writes to the store. This one only reads, runs only when someone starts it, and can
change or go away without affecting the memory comments.

It never creates the index, never writes a key, and never posts to a PR or commit. It uses the same
`MEMORY_REDIS_URL` and `OPENAI_API_KEY` secrets as `repo-memory.yml`.

## Run it

```sh
gh workflow run repo-memory-query.yml \
  -f query="Move the job-queue use case from JedisPool to RedisClient" \
  -f files="content/develop/use-cases/job-queue/java-jedis/RedisJobQueue.java"
```

The workflow file must be on the default branch for `gh workflow run` to find it. Results appear in
the run's step summary as a list. The full text of each result is on one log line that starts with
`REPO_MEMORY_QUERY_RESULT_JSON`, followed by JSON, so a script can read it from
`gh run view <id> --log`.

## Inputs

| Input | Default | Meaning |
| --- | --- | --- |
| `redis-url` | required | Redis URL of the memory store |
| `openai-api-key` | required | Embeds the query with `text-embedding-3-small` |
| `query` | required | The planned work |
| `query-files` | none | Files you plan to change |
| `query-limit` | `5` | Maximum results |
| `query-max-distance` | `0.60` | Cosine distance cutoff, as in the memory action |
| `github-token` | `github.token` | Reads the full message behind each result |

Only items from the repository the workflow runs in are returned.

## Visibility

Workflow logs of a public repository are public. The query text, and the results, are printed in the
log, so don't put anything confidential in a query. The results are titles and messages of this
repository's own public PRs and commits.

## Compatibility with the memory action

`query.js` reads what `redis-learn/redis-repo-memory` writes: the `repo_memory_idx` index, `memory:`
hashes, and a cosine `embedding` field from `text-embedding-3-small`. If the memory action changes
that layout, update `query.js` and the seed in `test.js` to match.

## Test

The test needs an empty Redis 8 (Search is built in) and uses a mock embedding, so it needs no
OpenAI key or network access. It refuses to run against a database that has any keys.

```sh
cd .github/actions/repo-memory-query
npm ci
REPO_MEMORY_TEST_REDIS_URL=redis://localhost:6379 node test.js
```
