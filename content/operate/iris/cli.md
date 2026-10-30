---
title: Operate Redis Iris with the CLI
description: Create Redis Iris services, mint agent keys, and check each hop with the iris command-line interface.
linkTitle: CLI
alwaysopen: false
categories:
- docs
- operate
- iris
hideListLinks: true
weight: 30
---

The `iris` command-line interface (CLI) creates Redis Iris services on a self-managed deployment, mints the agent keys your applications use, writes their settings to an env file, and checks that each one works. It ships in the `redis-iris` package. On Redis Cloud, create services and keys in the [Redis Cloud console](/content/operate/iris/cloud/_index.md).

## Install and connect

```bash
pipx install redis-iris
iris --version
```

Point the CLI at your deployment with a profile in `iris.toml` and your operator tokens in environment variables. See [SDK and CLI setup](/content/develop/ai/context-engine/sdk-and-cli.md#set-up-on-a-self-managed-deployment) for the profile keys and token variables.

## Provision services

Each service group has the same provisioning commands:

| Command | What it does |
|---|---|
| `service create` | Creates the service, mints its agent key, and writes the URL, ID, and key to the file you pass with `--write-env`. The key is never printed. |
| `service list`, `service show ID` | Lists the services, or shows one. |
| `service key ID --write PATH` | Mints another agent key and writes it to a file. |
| `service env ID --write PATH` | Writes the URL and ID of an existing service to an env file. |
| `service check ID` | Checks each hop, from the service to a read with the agent key, and stops at the first failure. |
| `service delete ID` | Deletes the service. It asks first unless you pass `--yes`. |

The service groups are `agent-memory`, `agent-playbooks`, `context-gateway`, and `intent-router`. For example, to create an Agent Memory store, first do a dry run, which sends nothing and lists any missing setting, then create it and check it:

```bash
iris agent-memory service create --name support-memory --dry-run
iris agent-memory service create --name support-memory --write-env .env
iris agent-memory service check "$IRIS_AGENT_MEMORY_STORE_ID" --env-file .env
```

Deleting a Context Gateway or an Agent Playbooks playbook never deletes what belongs to it: delete its Upstreams or extraction bindings first.

## Manage agent keys

`iris identity keys` lists, rotates, and revokes the agent keys of every service:

```bash
iris identity keys list --product context-gateway --resource-id <gateway-id>
iris identity keys rotate <key-id> --env IRIS_CONTEXT_GATEWAY_API_KEY --write .env --grace 1h
iris identity keys revoke <key-id> --product context-gateway --yes
```

`rotate` writes the new key to the file and keeps the old one working for the grace period. `revoke --product` refuses a key that also grants another service, because revoking deletes the whole key.

## More information

- [Self-managed Redis Iris](/content/operate/iris/self-managed/_index.md)
- [The `iris` CLI in the redis-iris README](https://github.com/redis/redis-iris#the-cli)
