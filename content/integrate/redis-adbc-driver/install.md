---
bannerText: The Redis ADBC driver is a pre-1.0 project that changes frequently. Behavior, storage formats, and supported SQL can change between releases.
bannerChildren: true
categories:
- docs
- integrate
- oss
- rs
- rc
description: Install the Redis ADBC driver and check your connection to Redis.
group: library
linkTitle: Install and connect
summary: Install the Redis ADBC driver and check your connection to Redis.
title: Install and connect
type: integration
weight: 2
---

The Redis ADBC driver ships as the `adbc-driver-redis` Python package. The
package bundles the native driver, so you don't need to build anything. Other
tools that load ADBC drivers by name, such as DuckDB, can use the same library
after you register it.

## Before you start

You need:

- Python 3.12 or later, on Linux (x86-64 or ARM64, glibc 2.28 or later) or
  macOS on Apple silicon (macOS 15 or later). There are no wheels for other
  platforms.
- A Redis database with the Query Engine (Search) enabled. See the
  [requirements](/content/integrate/redis-adbc-driver/_index.md#requirements)
  for supported deployments.

## Install the package

1. Create and activate a virtual environment:

    ```bash
    python3 -m venv .venv
    . .venv/bin/activate
    ```

1. Install the driver with its DB-API extra. DB-API is Python's standard
   database interface, and the extra adds the `dbapi` module and its
   dependencies:

    ```bash
    python -m pip install 'adbc-driver-redis[dbapi]'
    ```

1. Check the installation without connecting to Redis:

    ```bash
    python -m adbc_driver_redis doctor --offline
    ```

   The `doctor` command prints `OK`, `SKIP`, or `FAIL` for each check. It
   exits with 0 when the checks pass, 1 when a check fails, and 2 when its
   arguments are invalid.

Installing the package doesn't start a Redis server.

## Connect to Redis

The driver connects with a Redis URI. Set it in your environment rather than
in code, so that credentials stay out of your source files and shell history.

| Connection | URI |
| :-- | :-- |
| No TLS | `redis://<host>:<port>/0` |
| TLS with certificate verification | `rediss://<host>:<port>/0` |
| With credentials | `redis://<username>:<password>@<host>:<port>/0` |

If a username or password contains reserved characters, URL-encode them. Use
your deployment's actual host and port rather than assuming 6379. Only
database 0 is supported on a cluster, and the project has tested only
database 0 on standalone servers.

1. Set the URI:

    ```bash
    export REDIS_URI='redis://<host>:<port>/0'
    ```

1. Check the connection:

    ```bash
    python -m adbc_driver_redis doctor
    ```

   The connection check opens a normal driver connection, confirms that Search
   is available, and runs `SELECT 1`. It doesn't create tables or write data.
   If it prints `FAIL`, check the URI, network access, the
   [server requirements](/content/integrate/redis-adbc-driver/_index.md#requirements),
   and the user's ACL permissions.

A plaintext connection check doesn't test TLS. To test TLS, run `doctor` with
your `rediss://` URI. If your server uses a certificate from a private
certificate authority, pass its PEM bundle with `--ca-file`:

```bash
python -m adbc_driver_redis doctor --ca-file <path-to-ca.pem>
```

If the database uses [ACLs](/content/operate/oss_and_stack/management/security/acl.md),
the user needs a specific set of commands and key patterns. See
[ACL users](https://redis.github.io/redis-adbc-driver/docs/driver-reference/#acl-users)
in the driver reference.

## Use the driver from other tools

Tools that load ADBC drivers by name, such as DuckDB, need a driver manifest
that points to the library in the Python package.

1. Register the driver for your user:

    ```bash
    python -m adbc_driver_redis install-manifest --user
    ```

   Use `--venv` to register it for the active virtual environment only, or
   `--directory <manifest-directory>` for a custom location. If you use a
   custom directory, add it to the `ADBC_DRIVER_PATH` environment variable of
   the tool that loads the driver.

1. Check that both the `redis` and `rediss` driver names work against your
   server:

    ```bash
    python -m adbc_driver_redis doctor --check-manifests
    ```

The manifests contain absolute paths into the installed package. Keep the
virtual environment in place, and run the registration command again if you
move or replace it.

If you don't use Python, the project provides a native installer that
downloads, verifies, and registers a release of the library. See
[Install, upgrade and uninstall the native driver](https://redis.github.io/redis-adbc-driver/docs/native-installation/).

## Next steps

- [Query Redis with SQL and Arrow](/content/integrate/redis-adbc-driver/quick-start.md)
- [Data tool guides](/content/integrate/redis-adbc-driver/_index.md#data-tools)
