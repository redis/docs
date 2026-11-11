---
bannerText: The Redis Arrow Flight server is a pre-1.0 project that changes frequently. Behavior, storage formats, and supported SQL can change between releases.
bannerChildren: true
categories:
- docs
- integrate
- oss
- rs
- rc
description: Run the Redis Arrow Flight server with Docker or as a binary, and check that it works.
group: service
linkTitle: Run the server
summary: Run the Redis Arrow Flight server with Docker or as a binary, and check that it works.
title: Run the server
type: integration
weight: 2
---

You can run the Redis Arrow Flight server as a container or as a single
binary. Either way, it needs a running Redis database. For SQL, the database
needs the Query Engine (Search) enabled. See the
[requirements](/content/integrate/redis-arrow-flight/_index.md#requirements).

> [!WARNING]
> The published server has no client authentication and no TLS. Anyone who can
> reach its port can read and change the data that its Redis credentials can
> reach. The binary listens on `localhost` by default, so only clients on the
> same machine can connect. The container image listens on all interfaces
> inside the container, so publish its port on `127.0.0.1` as shown in
> [Run with Docker](#run-with-docker). Expose the server to other machines only
> on a trusted network.

## Run with Docker

1. Start the server. This command assumes Redis is running on your host at
   port 6379, and that you use Docker Desktop:

    ```bash
    docker run --rm --pull=always -p 127.0.0.1:8815:8815 \
      -e REDIS_URI=redis://host.docker.internal:6379/0 \
      ghcr.io/redis/redis-apache-arrow-flight:latest
    ```

   The `127.0.0.1:` prefix publishes the port on your machine only. Without
   it, Docker publishes the unauthenticated server on every host network
   interface. Don't use the server's `-listen` option to restrict a container.
   A `localhost` bind inside the container refuses connections that arrive
   through the published port.

   With Docker Engine on Linux, put Redis and the server on the same Docker
   network, and use the Redis container's name in `REDIS_URI` instead of
   `host.docker.internal`.

1. Check the log. The server prints a line like this when it is serving:

    ```text
    level=INFO msg="serving Arrow Flight" addr=[::]:8815 redis=redis://host.docker.internal:6379/0 auth=none tls=false sessions=true
    ```

The `--pull=always` option fetches the latest published image each time. To
run a specific release, replace `latest` with a release tag.

## Run the binary

Release archives are available for macOS on Apple silicon and for Linux on
x86-64 and ARM64. The following script finds the latest release for your
platform, verifies its checksum, and starts it against Redis on your host. It
needs `curl`, `tar`, and `shasum`:

```bash
(
  set -eu
  case "$(uname -s)-$(uname -m)" in
    Darwin-arm64) PLATFORM=darwin-arm64 ;;
    Linux-x86_64) PLATFORM=linux-amd64 ;;
    Linux-aarch64|Linux-arm64) PLATFORM=linux-arm64 ;;
    *) echo "No published binary for this platform; use Docker or build from source." >&2; exit 1 ;;
  esac
  RELEASE_URL=$(curl -fsSL -o /dev/null -w '%{url_effective}' \
    https://github.com/redis/redis-apache-arrow-flight/releases/latest)
  VERSION=${RELEASE_URL##*/}
  ARCHIVE="redis-flight-server-${VERSION}-${PLATFORM}"
  DOWNLOAD="https://github.com/redis/redis-apache-arrow-flight/releases/download/${VERSION}"
  curl -fLO "${DOWNLOAD}/${ARCHIVE}.tar.gz"
  curl -fLO "${DOWNLOAD}/${ARCHIVE}.tar.gz.sha256"
  shasum -a 256 -c "${ARCHIVE}.tar.gz.sha256"
  tar -xzf "${ARCHIVE}.tar.gz"
  "./${ARCHIVE}/redis-flight-server" -redis-uri redis://localhost:6379/0
)
```

The server runs in the foreground and listens on `localhost:8815`. For other
platforms, see
[Run locally from source](https://redis.github.io/redis-apache-arrow-flight/docs/local-development/).

## Check that the server works

The server's health check isn't a reliable readiness signal. It reports
`UNKNOWN` whether or not Redis is reachable. To check that the server is
ready, run a query through a client.

1. Install the Flight SQL driver for Python:

    ```bash
    python -m pip install adbc-driver-flightsql pyarrow
    ```

1. Run a query:

    ```bash
    python -c "
    import adbc_driver_flightsql.dbapi as flight_sql
    with flight_sql.connect('grpc://localhost:8815', autocommit=True) as conn, conn.cursor() as cur:
        cur.execute('SELECT 1 AS one')
        print(cur.fetch_arrow_table().to_pylist())
    "
    ```

   The command prints `[{'one': 1}]`.

## Configure the server

Each option is a command-line flag and has an environment variable. To list
them all, run the server with `-h`. The most useful options are:

| Flag | Environment variable | Default | Meaning |
| :-- | :-- | :-- | :-- |
| `-redis-uri` | `REDIS_URI` | `redis://localhost:6379/0` | The Redis database to serve. See [connection URLs](/content/develop/clients/connection-urls.md) for the format. |
| `-listen` | `FLIGHT_LISTEN` | `localhost:8815` (`0.0.0.0:8815` in the container image) | The address and port to listen on. Set an address that other machines can reach only on a trusted network, because the server has no authentication. In a container, leave it unchanged and publish the port on `127.0.0.1` instead. |
| `-dataset-ttl` | `FLIGHT_DATASET_TTL` | `0` (keep) | How long to keep uploaded datasets before they expire. |
| `-key-prefix` | `FLIGHT_KEY_PREFIX` | `arrowflight:` | The prefix of the Redis keys that store datasets. |
| `-pool-max-open` | `FLIGHT_POOL_MAX_OPEN` | `32` | The maximum number of driver connections in use at once for each Redis user. |
| `-shutdown-timeout` | `FLIGHT_SHUTDOWN_TIMEOUT` | `25s` | How long running calls can finish after a stop signal before the server cancels them. |
| `-log-level` | `FLIGHT_LOG_LEVEL` | `info` | The log level: `debug`, `info`, `warn`, or `error`. |

The `-auth`, `-tls-cert`, and `-tls-key` options, and a `rediss://` Redis URI,
make the published server exit at startup with the message
`requested enterprise feature is unavailable in this build`.

For the complete list, including streaming, memory, and session limits, see the
[server guide](https://redis.github.io/redis-apache-arrow-flight/docs/server-guide/).

## Next steps

- [Connect and query](/content/integrate/redis-arrow-flight/connect.md)
