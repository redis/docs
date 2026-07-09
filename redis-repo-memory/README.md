# Redis Repo Memory

> Give your repository a memory. Surfaces semantically related PRs, issues, and commits from history using Redis vector search — so your team always knows what's been done before.

On every push and pull request, Redis Repo Memory:

1. Extracts the commit or PR title, body, and changed files
2. Embeds that context using OpenAI `text-embedding-3-small`
3. Searches a Redis vector index for semantically similar prior work
4. Posts the results as a PR comment or commit status

## What it looks like

On every pull request, the action posts a comment like this:

---

**🧠 Redis Repo Memory**

Found **3** related items from repository history:

- **PR** — [Add vector search support to document-database guide](https://github.com/redis/docs/pull/3201)
  > Updates the document database quick start to include vector field indexing and KNN search examples.
- **PR** — [Update FT.SEARCH examples for Redis 8.x syntax](https://github.com/redis/docs/pull/3156)
  > Revises all FT.SEARCH code blocks to use DIALECT 2, adds filter expression examples.
- **Issue** — [FT.AGGREGATE examples missing from get-started](https://github.com/redis/docs/issues/2890)
  > The current quick start covers FT.CREATE and FT.SEARCH but has no aggregation examples.

*Memory updated at [2400bb9](https://github.com/redis/docs/commit/2400bb9)*

---

On pushes to non-main branches, results appear as a commit status and in the Actions step summary instead of a PR comment.

## Quick start

**Step 1 — Get a Redis URL**

Any Redis instance with the Search module works. The easiest option is a free Redis Cloud database:

1. Sign up at [redis.io/try-free](https://redis.io/try-free/)
2. Create a database — choose any cloud provider and region; all defaults are fine. The free tier (30 MB) is enough to get started, but a repo with about 150 PRs/month will outgrow it within a year. The Essentials plan (about $5/month, 250 MB) comfortably handles several years of history.
3. On the database details page, click **Connect** and copy the connection string (format: `redis://default:<password>@<host>:<port>`)

**Step 2 — Get an OpenAI API key**

1. Sign in or create an account at [platform.openai.com](https://platform.openai.com/)
2. Go to **API keys** and create a new key
3. Only the [Embeddings API](https://platform.openai.com/docs/guides/embeddings) is used — cost is typically less than $0.01/day for an active repo

**Step 3 — Add secrets to your repository**

In your repository, go to **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret | Value |
|--------|-------|
| `MEMORY_REDIS_URL` | The Redis connection string from step 1 |
| `OPENAI_API_KEY` | The OpenAI API key from step 2 |

**Step 4 — Add the workflow**

Create `.github/workflows/repo-memory.yml` in your repository:

```yaml
name: Repo Memory

on:
  push:
    branches-ignore:
      - main
  pull_request:
    types:
      - opened
      - synchronize

permissions:
  pull-requests: write
  contents: read
  statuses: write

jobs:
  memory:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - uses: redis/redis-repo-memory@v1
        continue-on-error: true
        with:
          redis-url: ${{ secrets.MEMORY_REDIS_URL }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

`continue-on-error: true` prevents a Redis Cloud or OpenAI outage from blocking PR merges. The action is informational — a failed run should never be a merge blocker.

**First run:** the action stores the current PR or commit in memory but returns no results yet — the index starts empty. Results improve as more PRs and pushes are stored. To pre-populate with existing history, see [Seeding existing history](#seeding-existing-history) below.

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `redis-url` | Yes | — | Redis connection URL for the memory store |
| `openai-api-key` | Yes | — | OpenAI API key for generating embeddings |
| `github-token` | No | `github.token` | Token for posting PR comments and commit statuses |
| `upstream-repo` | No | `''` | Upstream repo to include in search (e.g. `redis/docs`). Useful in forks. |

## Seeding existing history

On first run the memory index is empty. Seeding pre-populates it with past PRs and issues so results are useful right away.

### Option A — Seed via GitHub Actions (no local tools needed)

Add this one-time workflow to your repository at `.github/workflows/seed-memory.yml`:

```yaml
name: Seed Memory (run once)

on:
  workflow_dispatch:
    inputs:
      days_back:
        description: 'Days of history to seed'
        default: '365'
        required: false
        type: string

permissions:
  contents: read

jobs:
  seed:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install redis-repo-memory scripts
        run: |
          git clone --depth 1 https://github.com/redis/redis-repo-memory.git /tmp/redis-repo-memory
          npm install --prefix /tmp/redis-repo-memory/scripts

      - name: Seed history
        env:
          REDIS_URL: ${{ secrets.MEMORY_REDIS_URL }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SEED_REPO: ${{ github.repository }}
          DAYS_BACK: ${{ inputs.days_back }}
        run: node /tmp/redis-repo-memory/scripts/seed.js
```

Then trigger it from **Actions → Seed Memory (run once) → Run workflow**. You can delete this workflow file afterwards.

### Option B — Seed locally

```bash
git clone https://github.com/redis/redis-repo-memory
cd redis-repo-memory/scripts
npm install

REDIS_URL=<your-redis-url> \
OPENAI_API_KEY=<your-key> \
GITHUB_TOKEN=<your-pat> \
SEED_REPO=owner/repo \
DAYS_BACK=365 \
node seed.js
```

The PAT needs `repo` read access. Seeding is a one-time operation; the action keeps the index up to date from that point on.

Optional seed environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SEED_REPO` | `redis/docs` | Repository to fetch history from |
| `DAYS_BACK` | `365` | How many days of history to seed |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | OpenAI embedding model to use |
| `DRY_RUN` | — | Set to `true` to fetch and embed without writing to Redis |

## How it works

```
push / pull_request event
        │
        ▼
collect_context.js   — extracts title, body, changed files from the GitHub event
        │
        ▼
retrieve_memory.js   — embeds context, searches Redis KNN index for similar items,
                       stores current item, writes results to /tmp/memory_results.json
        │
        ▼
post_comment.js      — posts PR comment (PRs) or commit status + step summary (pushes)
```

Memories are stored as Redis hashes with a `FLOAT32` HNSW vector index. The index is created automatically on first run. Each memory stores the title, a body summary, source URL, repo, and embedding.

## Known limitations

**Fork PRs on public repositories**

GitHub does not pass secrets to `pull_request` workflows triggered by forks of public repos (this is a GitHub security feature, not specific to this action). If your repo is public and a contributor opens a PR from their fork, the action will fail because `MEMORY_REDIS_URL` and `OPENAI_API_KEY` are unavailable.

`continue-on-error: true` (included in the quick start workflow above) prevents this from blocking the PR, but the memory step will show as failed for fork contributors. This is expected behaviour — the action simply has no results to post for those runs.

If you want the action to run silently on fork PRs instead of showing a failed step, add a check for the secrets being present:

```yaml
      - uses: redis/redis-repo-memory@v1
        continue-on-error: true
        if: ${{ secrets.MEMORY_REDIS_URL != '' }}
        with:
          redis-url: ${{ secrets.MEMORY_REDIS_URL }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

## Using with a fork

If you're working in a fork and want to surface context from the upstream repository, set the `upstream-repo` input:

```yaml
- uses: redis/redis-repo-memory@v1
  with:
    redis-url: ${{ secrets.MEMORY_REDIS_URL }}
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    upstream-repo: owner/upstream-repo
```

The action will include memories from both the fork and the upstream repo in its search results.

## License

Apache 2.0
