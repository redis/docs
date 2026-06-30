# Agent Skills

This directory contains skills that teach AI agents how to perform specific tasks in this codebase. Each skill has a `SKILL.md` file with detailed instructions.

## How Skills Work

When you ask Augment Agent (using the VS Code plugin or Auggie CLI) to do something, it searches the codebase for relevant context—including these skill files. If your request matches a skill's purpose, Augment uses those instructions to do the job correctly.

**Pro tip**: Reference a skill directly in your prompt for best results:
> "Using the generate-tce-examples skill, add an HMGET example for all supported languages."

## Available Skills

### `extract-redis-cli-examples`

Analyzes Redis command documentation pages to find CLI examples and determine which ones need multi-language code implementations.

**Use when**: You want to audit a docs page and identify what examples are missing.

### `generate-tce-examples`

Creates tabbed code examples (TCEs) across 12 client languages (Python, Node.js (2), Go, Java (3), C#, PHP, Rust (2), and C) for Redis commands.

**Use when**: You need to implement the same Redis example in multiple languages, with proper test markers and assertions.

**Assets**: Contains reference templates and `*_TEST_PATTERNS.md` files for each language in the `assets/` subdirectory.

### `redis-use-case-ports`

Orchestrates a full Redis use-case implementation across all 9 supported client libraries (`redis-py`, `node-redis`, `go-redis`, Jedis, Lettuce, StackExchange.Redis, Predis, `redis-rb`, `redis-rs`) using a parallel-build + synthesise + audit workflow.

**Use when**: A new use case (cache-aside, session store, rate limiter, leaderboard, etc.) needs to be ported to all 9 clients with consistent helper APIs, demo behaviour, and prose structure — and you want to use parallel sub-agents rather than implementing serially.

**Assets**: Contains `brief-template.md` (for parallel build agents), `report-template.md` (structured agent output), `audit-checklist.md` (known bug classes — a living document), `cross-diff-checklist.md` (consistency rules across clients), `redis-conventions.md` (repo-specific layout and Hugo conventions), and `html-template.html` (shared demo UI).

## Setup

The `generate-tce-examples` agent skill requires a very specific setup that includes (1) a clone of the `redis/docs` repo and
(2) a `clients` directory that contains clones of all the client repos and an `examples` directory structure that's used for testing.

At the top level, you'll have the following:

```
/path/to/
├── clients
└── docs
```

The `clients` directory is used for agent skill reference and looks like this:

```
/path/to/clients
├── NRedisStack
├── StackExchange.Redis
├── examples
├── go-redis
├── ioredis
├── jedis
├── lettuce
├── node-redis
├── predis
├── redis-py
├── redis-rb
├── redis-rs
└── redis-vl-python
```

The examples directory structure is used to test generated examples and has the following structure:

```
/path/to/clients/examples
├── NRedisStack (a full clone of the NRedisStack repo)
│   └── tests
│       └── Doc
│           └── nredisstack_sample_test.cs
├── go-redis
│   ├── sample_test.go
│   ├── go.mod
│   └── run.sh
├── hiredis
│   ├── sample_test.c
│   └── run.sh
├── ioredis
│   ├── sample_test.js
│   ├── package.json
│   └── run.sh
├── jedis
│   ├── pom.xml
│   ├── run.sh
│   └── src
│       └── test
│           └── java
│               └── io
│                   └── redis
│                       └── examples
│                           └── SampleTest.java
├── lettuce-async
│   ├── pom.xml
│   ├── run.sh
│   └── src
│       └── test
│           └── java
│               └── io
│                   └── redis
│                       └── examples
│                           └── async
│                               └── SampleTest.java
├── lettuce-reactive
│   ├── pom.xml
│   ├── run.sh
│   └── src
│       └── test
│           └── java
│               └── io
│                   └── redis
│                       └── examples
│                           └── reactive
│                               └── SampleTest.java
├── node-redis
│   ├── sample_test.js
│   ├── package.json
│   └── run.sh
├── predis
│   ├── SampleTest.php
│   ├── composer.json
│   └── run.sh
├── redis-py
│   ├── sample_test.py
│   ├── requirements.txt
│   └── run.sh
├── rust-async
│   ├── Cargo.toml
│   ├── run.sh
│   └── tests
│       └── sample_test.rs
└── rust-sync
│   ├── Cargo.toml
│   ├── run.sh
│   └── tests
│       └── sample_test.rs
```

A zip file containing this structure will be made upon request. Ping `David Dougherty` in Slack.
