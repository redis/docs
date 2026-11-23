---
title: Set up the CLI for Redis Cloud
description: Create and manage Redis Iris services on Redis Cloud from the iris CLI with a Redis Cloud API key pair.
linkTitle: CLI for Redis Cloud
alwaysopen: false
categories:
- docs
- operate
- iris
weight: 27
---

The `iris` command-line interface (CLI) in the [`redis-iris`](https://pypi.org/project/redis-iris/) package can create and manage Redis Iris services on Redis Cloud, as an alternative to the console. Use it to script setup, run it in continuous integration (CI), or let a coding agent do the setup for you. The console guides, such as [Create an Agent Memory service](/content/operate/iris/agent-memory/create-service.md), cover the same tasks in the console.

The CLI signs in with a Redis Cloud application programming interface (API) key pair rather than a console session. The steps match the [self-managed setup](/content/operate/iris/agent-memory/self-managed/_index.md#create-a-store-with-the-cli-and-sdk), except that the keys come from the console and the profile needs no URLs.

## 1. Get the API keys

In the [Redis Cloud console](https://cloud.redis.io/), open **Access Management → API Keys**. The CLI needs two keys from this page:

| Console label | Environment variable | What it does |
| --- | --- | --- |
| **API account key** | `REDIS_CLOUD_API_KEY` | Identifies your Redis Cloud account. There's one per account, shown at the top of the **API Keys** tab. If the tab shows **Enable API**, select it first. |
| **API user key** | `REDIS_CLOUD_API_SECRET` | The secret. It acts as one user, with that user's role. Under **User keys**, select **Add**, name the key, and pick the user it acts as. The key is shown only once, so copy it before you close the dialog. |

The account key tells Redis Cloud which account the request is for, and the user key determines what the request is allowed to do. The CLI needs both. See [Manage API keys](/content/operate/rc/api/get-started/manage-api-keys.md) for more about the keys.

A user key works for the whole account, including through the [Redis Cloud API](/content/operate/rc/api/_index.md), and it doesn't expire. To limit what a leaked key can do:

- Create the key for a dedicated user with the least-privileged role that can do the work, not for an account owner. Listing services needs less access than creating services.
- Delete the key from **API Keys** when you no longer need it.

## 2. Install the CLI

```bash
pip install 'redis-iris>=1.2.0'
```

## 3. Create a profile

Create `iris.toml` with a Redis Cloud profile:

```toml
[profiles.cloud]
kind = "cloud"
```

The CLI sends requests to `https://cloud.redis.io` and finds every service URL from there. It sends the keys only over HTTPS (Hypertext Transfer Protocol Secure), and only to that host. A service URL on any other host is refused before any request is sent. Keys in `iris.toml` are refused.

## 4. Store the keys

Put the keys in `.env.cloud`, separate from your application's `.env`, so that your agent never receives your Redis Cloud keys:

```bash
IRIS_CONFIG=./iris.toml
IRIS_PROFILE=cloud
REDIS_CLOUD_API_KEY=<api-account-key>
REDIS_CLOUD_API_SECRET=<api-user-key>
```

Make the file readable only by you, and load it:

```bash
chmod 600 .env.cloud
set -a; source .env.cloud; set +a
```

Check the connection. This lists your Agent Memory services:

```bash
iris agent-memory service list
```

## 5. Create a service

This example creates an Agent Memory service. You need the ID of a Redis Cloud database that meets the [Agent Memory prerequisites](/content/operate/iris/agent-memory/create-service.md#prerequisites-and-limitations). Find it in the console's **Databases** list.

1. Do a dry run. It sends nothing:

    ```bash
    iris agent-memory service create --name support-memory --database <database-id> --dry-run
    ```

1. Create the service. The CLI creates the store, mints its agent key, and writes `IRIS_AGENT_MEMORY_URL`, `IRIS_AGENT_MEMORY_STORE_ID`, and `IRIS_AGENT_MEMORY_API_KEY` to `.env` without printing the key:

    ```bash
    iris agent-memory service create --name support-memory --database <database-id> --write-env .env
    ```

    The key appears under **Iris → Access & Identity** in the console, like a key you create there.

1. Check every hop, from the control plane to a read with the agent key:

    ```bash
    set -a; source .env.cloud; source .env; set +a
    iris agent-memory service check "$IRIS_AGENT_MEMORY_STORE_ID" --env-file .env
    ```

Your application reads the same `.env`. With the Python software development kit (SDK):

```python
from redis_iris import AgentMemory

memory = AgentMemory.from_env()
```

The same profile works for the other services' commands, such as `iris agent-playbooks service list`, `iris context-gateway service list`, and `iris intent-router service list`.

## Troubleshooting

| Error | Cause | Fix |
| --- | --- | --- |
| `cloud_unsupported` | Neither key is set, so the CLI lists the console steps instead. | Load `.env.cloud`. |
| `credential_required` | Only one of the two keys is set. | Set both `REDIS_CLOUD_API_KEY` and `REDIS_CLOUD_API_SECRET`. |
| `input_error`, "refusing to send the Redis Cloud keys" | A service URL points at a host other than the console. | Remove the URL setting, so the CLI uses the console host. |
| `unauthenticated` (HTTP status 401) | Redis Cloud rejected the keys: they're wrong or deleted, or the two keys come from different accounts. | Copy both keys again from **API Keys**. |
| `forbidden` (HTTP status 403) | The user key's user doesn't have the role this command needs. | Create a user key for a user whose role can manage Iris. |
