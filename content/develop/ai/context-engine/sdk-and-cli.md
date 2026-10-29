---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Install the redis-iris SDK and iris CLI, connect them to Redis Cloud or a self-managed deployment.
hideListLinks: true
linktitle: SDK and CLI setup
title: Set up Redis Iris with the SDK and CLI
weight: 7
---

The `redis-iris` package is a Python software development kit (SDK) with one object per Redis Iris service, plus the `iris` command-line interface (CLI), which creates services, mints keys, and checks connections. Your agent reads only `IRIS_*` environment variables, so the same code runs on Redis Cloud and on a self-managed deployment.

Start with a service's quickstart: [Agent Memory](/content/develop/ai/context-engine/agent-memory/quickstart.md), [Agent Playbooks](/content/develop/ai/context-engine/agent-playbooks/quickstart.md), [Context Gateway](/content/develop/ai/context-engine/context-gateway/quickstart.md), or [Lens](/content/develop/ai/context-engine/lens/quickstart.md). This page covers the setup they share.

## Install the SDK and CLI

Both require Python 3.11 or later.

```bash
python -m pip install redis-iris   # the SDK, in your project's virtual environment
pipx install redis-iris            # the iris CLI, in its own environment
iris --version
```

## Learn the command shape

Every command has the same shape. Shared options go before the service name:

```bash
iris [shared options] <service> <noun> <verb> [arguments] [options]
```

For example, this command syncs a folder of FAQs to a playbook:

```bash
iris --json --profile suite agent-playbooks faqs sync ./faqs --publish changed
```

| Part | Role | What it does |
|---|---|---|
| `--json --profile suite` | Shared options | Print the result as one JSON value, and use the `suite` profile from `iris.toml`. |
| `agent-playbooks` | Service | Target Agent Playbooks. |
| `faqs sync` | Noun and verb | Make the playbook's FAQs match the files. |
| `./faqs` | Argument | The folder of FAQ files to sync. |
| `--publish changed` | Option | Publish the new version of each FAQ that changed. Other FAQs keep their published version. |

| Service group | What it manages |
|---|---|
| `agent-memory` | Agent Memory stores, memories, and sessions |
| `agent-playbooks` | Agent Playbooks, FAQs, skills, proposals, and extraction from Agent Memory |
| `context-gateway` | Context Gateways, their upstreams and tool policies, and tool calls |
| `intent-router` | Intent Routers, intents, examples, and matching |
| `identity` | Agent keys for every service: list, rotate, and revoke |

`--json` prints one JSON value, `--no-input` never prompts, and `--profile` selects a configuration profile. Run `iris <service> <noun> <verb> --help` for each command's options.

For every command, see the [redis-iris CLI reference](https://github.com/redis/redis-iris#the-cli), or give your coding agent that link.
<!-- TODO: point to a full command reference in redis-iris when it exists. The README's CLI section shows examples and links the per-service CLI guides. -->

## Set up on Redis Cloud

On Redis Cloud, the [Redis Cloud console](https://cloud.redis.io/) creates services and keys, and the CLI checks the connection. These steps use Agent Playbooks. The other Redis Iris services follow the same steps with their own console pages and `IRIS_<SERVICE>_*` variables.

1. In the Redis Cloud console, go to **Iris AI** > **Agent Playbooks** > **New playbook**. Choose a name, database, and embedding model, then select **Create Playbook**.
1. On the playbook's **Connect** tab, copy the **Agent endpoint** and the **Playbook ID**. Select **Create agent API key** > **Create key**, and copy the key. It's shown only once.
1. Save the values in a `.env` file:

    ```bash
    IRIS_AGENT_PLAYBOOKS_URL=<agent-endpoint>
    IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID=<playbook-id>
    IRIS_AGENT_PLAYBOOKS_API_KEY=<agent-api-key>
    ```

1. Optional, but recommended: create `iris.toml` with a cloud profile, and add `IRIS_PROFILE=cloud` and `IRIS_CONFIG=./iris.toml` to `.env`. One `iris.toml` holds the URLs for every Redis Iris service you use, so the CLI and SDK manage them together, and switching deployments means switching one profile. See the [Redis Cloud project setup example](https://github.com/redis/redis-iris/tree/main/examples/project_setup/cloud).

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

## Set up on a self-managed deployment

On a self-managed deployment, the CLI creates services and keys with your operator tokens. Each token is the deployment's static admin token or an access token from your identity provider.

The services deploy on Kubernetes from the shared Redis Helm repository, `https://helm.redis.io/ai`. See [deploy self-managed Agent Memory](/content/operate/iris/agent-memory/self-managed/deploy.md) and [deploy self-managed Context Gateway](/content/operate/iris/context-gateway/self-managed/deploy.md). For a complete project, see the [self-managed project setup example](https://github.com/redis/redis-iris/tree/main/examples/project_setup/onprem).

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

    ```bash
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

Agent Memory, Context Gateway, and Intent Router follow the same steps with their own `service create` options.

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

## More information

- [The `iris` CLI in the redis-iris README](https://github.com/redis/redis-iris#the-cli)
- [Configuration guide](https://github.com/redis/redis-iris/blob/main/docs/user_guides/configuration.md)
- [Provision without the UI](https://github.com/redis/redis-iris/blob/main/docs/user_guides/provision-without-the-ui.md)
- [Starter configuration for Redis Cloud and self-managed projects](https://github.com/redis/redis-iris/tree/main/examples/project_setup)
- [redis-iris examples](https://github.com/redis/redis-iris/tree/main/examples), including adding Redis Iris to an agent you already have
