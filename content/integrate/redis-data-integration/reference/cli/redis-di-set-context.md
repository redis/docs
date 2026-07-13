---
Title: redis-di set-context
linkTitle: redis-di set-context
description: Creates or updates a context
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
  - /integrate/redis-data-integration/reference/cli/redis-di-add-context/
  - /integrate/redis-data-integration/reference/cli/redis-di-delete-all-contexts/
---

Creates or updates a context in the `~/.redis-di` context file. A context stores an API connection
so you don't have to pass the connection options on every command. `set-context` merges only the
options you give on the command line, preserving the rest, and does not change which context is
active; use [`use-context`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-use-context" >}})
for that. See the
[CLI reference overview]({{< relref "/integrate/redis-data-integration/reference/cli#contexts" >}})
for more about contexts.

Secrets (the password and the Redis Cloud user key) are never stored in a context, so `set-context`
rejects `--password` and `--user-key`.

## Usage

```
redis-di set-context <name> [flags]
```

The connection is set from the global options `--api-url`, `--user`, `--account-key`, `--cacert`,
and `--insecure`.

## Options

| Option | Description |
| :-- | :-- |
| `--unset-user` | Clear the stored user, so the context authenticates without a user. |
| `--unset-account-key` | Clear the stored account key, so the context authenticates without a Redis Cloud account key. |

This command also accepts the
[global options]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di#global-options" >}}).

## Example

```bash
# Create or update a context for a VM or Kubernetes installation
redis-di set-context prod --api-url https://rdi.example.com --user default --cacert /etc/rdi/ingress-ca.crt

# Create or update a context that skips TLS verification
redis-di set-context dev --api-url https://localhost:8443 --insecure
```
