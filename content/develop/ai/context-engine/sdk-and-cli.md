---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Install the redis-iris SDK and iris CLI, connect them to Redis Cloud or a self-managed deployment, and attach Redis Iris to an agent you already have.
hideListLinks: true
linktitle: SDK and CLI setup
title: Set up Redis Iris with the SDK and CLI
weight: 7
---

The `redis-iris` package is a Python software development kit (SDK) with one object per Redis Iris service, plus the `iris` command-line interface (CLI), which creates services, mints keys, and checks connections. Your agent reads only `IRIS_*` environment variables, so the same code runs on Redis Cloud and on a self-managed deployment.

Start with a service's quickstart: [Agent Memory](/content/develop/ai/context-engine/agent-memory/quickstart.md), [Agent Playbooks](/content/develop/ai/context-engine/agent-playbooks/quickstart.md), [Context Gateway](/content/develop/ai/context-engine/context-gateway/quickstart.md), or [Lens](/content/develop/ai/context-engine/lens/quickstart.md). This page covers the setup they share.

## Install the SDK and CLI

Both require Python 3.11 or later, and both are prereleases.

```bash
python -m pip install redis-iris   # the SDK, in your project's virtual environment
pipx install redis-iris            # the iris CLI, in its own environment
iris --version
```

## Learn the command shape

Every command has the same shape. Shared options go before the service name:

```text
iris [shared options] <service> <noun> <verb> [arguments] [options]
```

For example, `iris --json --profile suite agent-playbooks faqs sync ./faqs --publish changed`.

| Service group | What it manages |
|---|---|
| `agent-memory` | Agent Memory stores, memories, and sessions |
| `agent-playbooks` | Agent Playbooks, FAQs, skills, proposals, and extraction from Agent Memory |
| `context-gateway` | Context Gateways, their upstreams and tool policies, and tool calls |
| `intent-router` | Intent Routers, intents, examples, and matching |
| `identity` | Agent keys for every service: list, rotate, and revoke |

`--json` prints one JSON value, `--no-input` never prompts, and `--profile` selects a configuration profile. Run `iris <service> <noun> <verb> --help` for each command's options.

## Set up on Redis Cloud

On Redis Cloud, the Redis Cloud console creates services and keys, and the CLI checks the connection. These steps use Agent Playbooks.

1. In the Redis Cloud console, go to **Iris AI** > **Agent Playbooks** > **New playbook**. Choose a name, database, and embedding model, then select **Create Playbook**.
1. On the playbook's **Connect** tab, copy the **Agent endpoint** and the **Playbook ID**. Select **Create agent API key** > **Create key**, and copy the key. It's shown only once.
1. Save the values in a `.env` file:

    ```text
    IRIS_PROFILE=cloud
    IRIS_CONFIG=./iris.toml
    IRIS_AGENT_PLAYBOOKS_URL=<agent-endpoint>
    IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID=<playbook-id>
    IRIS_AGENT_PLAYBOOKS_API_KEY=<agent-api-key>
    ```

1. Create `iris.toml` with a cloud profile:

    ```toml
    [profiles.cloud]
    kind = "cloud"

    [profiles.cloud.agent_playbooks]
    url = "<agent-endpoint>"
    ```

1. Load the values and check the connection with the agent key:

    ```bash
    set -a; source .env; set +a
    iris agent-playbooks health
    ```

    A working playbook reports `status: ready`.

On a cloud profile, `service create`, `service key`, and `service check` don't call the service. They stop with a `cloud_unsupported` error that lists the console steps for the same task.

## Set up on a self-managed deployment

On a self-managed deployment, the CLI creates services and keys with your operator tokens. Each token is the deployment's static admin token or an access token from your identity provider.

1. Create `iris.toml` with a profile for your deployment. It holds URLs only:

    ```toml
    [profiles.suite]
    kind = "self-managed"

    [profiles.suite.agent_playbooks]
    service_url = "<playbook-service-url>"
    url = "<playbook-data-plane-url>"
    identity_url = "<identity-service-url>"
    ```

1. Put the operator tokens in a `.env.admin` file. Keep them out of your agent's `.env`:

    ```text
    IRIS_CONFIG=./iris.toml
    IRIS_PROFILE=suite
    IRIS_AGENT_PLAYBOOKS_SERVICE_TOKEN=<service-token>
    IRIS_AGENT_PLAYBOOKS_IDENTITY_TOKEN=<identity-token>
    ```

1. Load the tokens and do a dry run. It sends nothing, and `missing: nothing` means the real run has every credential and URL it needs:

    ```bash
    set -a; source .env.admin; set +a
    iris agent-playbooks service create --name support-playbook --dry-run
    ```

1. Create the playbook. The CLI mints its agent key and writes the URL, ID, and key to `.env`. It never prints the key:

    ```bash
    iris agent-playbooks service create --name support-playbook --write-env .env
    ```

1. Check every hop, from the service to a read with the agent key:

    ```bash
    set -a; source .env; set +a
    iris agent-playbooks service check "$IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID" --env-file .env
    ```

Agent Memory, Context Gateway, and Intent Router follow the same steps with their own `service create` options. Context Gateway's `service create` has no dry run.

## Configure profiles and credentials

The CLI takes each setting from the first of these that sets it: a command option, an environment variable, the selected profile in `iris.toml`, the file's shared tables, then a built-in default.

| Key in a profile | Meaning |
|---|---|
| `kind` | `self-managed` (the default) or `cloud` |
| `service_url` | The service's control plane, which the CLI calls |
| `url` | The data plane your agent calls. The CLI writes it into `.env` |
| `identity_url` | The Identity Service that mints this service's keys |
| `[profiles.<name>.identity]` `url`, `tenant` | An Identity Service shared by every service, and its tenant |

`iris.toml` never holds secrets. A token or API key in it stops the CLI with exit code 2. Tokens and keys come only from environment variables or the files the CLI writes.

## Attach Redis Iris to an agent you already have

`attach` adds a service to an agent you already built, at the framework's own hook points, and returns the same object. Before the model runs, it adds the service's context to the prompt. After the reply, it records the turn.

For LangGraph, install `redis-iris[langgraph]` and attach to the graph before you compile it:

```python
from redis_iris import AgentMemory
from redis_iris.integrations.langgraph import attach

memory = AgentMemory.from_env(assistant_id="support-bot")
app = attach(memory, graph).compile()
```

For Google Agent Development Kit (ADK), in `redis-iris` 0.1.0a9 and later, attach to the `LlmAgent`:

```python
from redis_iris.integrations.adk import attach

agent = attach(memory, LlmAgent(name="support", model="<model>", instruction="<instruction>"))
```

`attach` works with Agent Memory and Agent Playbooks, and with several services combined by `redis_iris.hooks.stack`. Context Gateway adds tools rather than context, so you pass its tools to your model yourself. Intent Router and Lens don't attach: call `router.match()` where your agent routes. On LangGraph, each run of an attached graph is already one Lens turn. Elsewhere, wrap each turn in `lens.turn()`.

## More information

- [The `iris` CLI in the redis-iris README](https://github.com/redis/redis-iris#the-cli)
- [Configuration guide](https://github.com/redis/redis-iris/blob/main/docs/user_guides/configuration.md)
- [Provision without the UI](https://github.com/redis/redis-iris/blob/main/docs/user_guides/provision-without-the-ui.md)
- [Starter configuration for Redis Cloud and self-managed projects](https://github.com/redis/redis-iris/tree/main/examples/project_setup)
