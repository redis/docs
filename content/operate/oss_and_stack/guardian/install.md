---
categories:
- docs
- operate
- stack
- oss
description: Install the Guardian Community module, grant its application permissions, and keep the setup across restarts.
linkTitle: Install
title: Install Guardian Community
weight: 10
---

Install Guardian Community on each Redis node in four stages. Install the package, check your
application users, load the module and grant permissions in one transaction, and then save the
configuration so it survives a restart. Installing the package alone doesn't turn on protection.

## Prerequisites

- **A supported platform.** See
  [Supported platforms](/content/operate/oss_and_stack/guardian/_index.md#supported-platforms).
- **Module loading.** To load Guardian into a running Redis 7 or later server, the server needs
  `enable-module-command local` (or a setting that allows your operator connection). You can't
  change this setting at runtime. If module loading is off, add Guardian to the startup
  configuration instead and restart Redis.
- **A private state directory.** Choose a persistent directory owned by the Redis service user
  with mode `0700`, such as `/var/lib/redis/guardian`. In a container, put it on a persistent
  volume. Guardian creates the directory if its parent is writable by the Redis user.
- **Registry details.** You need the registry URL and the public signing key.
  <!-- TODO: Publish the production registry URL and public signing key before release. -->
- **An operator account.** Guardian works with Redis access control lists (ACLs). The account
  that runs the checks needs to read `INFO`,
  `CONFIG GET aclfile`, `COMMAND INFO`, `ACL GETUSER`, `ACL DRYRUN` (Redis 7 and later), and
  `HOTPATCH.STATUS`. To install, it also needs permission to load modules, manage ACLs, and save
  the configuration. An administrator account works.
- **A list of application users.** Identify every ACL user your applications use to connect.

## Install the package

<!-- TODO: Add the download location for the .deb packages and SHA256SUMS before release. -->

The package installs the module and three command-line tools. It doesn't change your Redis
configuration or start, stop, or restart Redis.

1. Download the `.deb` package for your architecture and its `SHA256SUMS` file. Run
   `dpkg --print-architecture` to check whether you need `amd64` or `arm64`.
1. Check the download:

   ```sh
   sha256sum -c SHA256SUMS
   ```

   The checksum detects a changed or damaged file. It isn't a publisher signature.
1. Install the package:

   ```sh
   sudo apt-get update
   sudo apt-get install ./guardian-community_*_$(dpkg --print-architecture).deb
   ```

1. Confirm the tools are installed:

   ```sh
   guardian-preflight --help
   ```

The module is installed at `/usr/lib/guardian/guardian-community.so`. For every installed file,
see [Installed files](/content/operate/oss_and_stack/guardian/reference.md#installed-files).

## Run Guardian in the official Redis container

To run Guardian in a container, build an image on top of the official Redis image.

1. Put the `.deb` package and `SHA256SUMS` in a directory, and add this `Dockerfile` next to
   them:

   <!-- TODO: Confirm the pinned base image digest to publish. -->

   ```dockerfile
   ARG BASE_IMAGE=redis:<redis-version>
   FROM ${BASE_IMAGE}
   USER root
   COPY guardian-community_*.deb SHA256SUMS /tmp/
   RUN cd /tmp && sha256sum -c SHA256SUMS \
    && test "$(dpkg-deb -f ./guardian-community_*.deb Architecture)" = "$(dpkg --print-architecture)" \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ./guardian-community_*.deb \
    && rm -f /tmp/guardian-community_*.deb /tmp/SHA256SUMS \
    && rm -rf /var/lib/apt/lists/* \
    && install -d -m 0700 -o redis -g redis /data
   USER redis
   WORKDIR /data
   VOLUME /data
   CMD ["redis-server", "--dir", "/data"]
   ```

1. Build the image and create a volume for Redis data and Guardian state:

   ```sh
   docker build -t guardian-community:<tag> <package-directory>
   docker volume create guardian-data
   docker run --rm -v guardian-data:/data guardian-community:<tag> \
     sh -c 'mkdir -p /data/guardian && chmod 700 /data/guardian'
   ```

1. Start Redis with your configuration file:

   ```sh
   docker run --name guardian-redis -v guardian-data:/data \
     -v <absolute-path-to-redis.conf>:/etc/guardian-redis.conf:ro \
     guardian-community:<tag> redis-server /etc/guardian-redis.conf
   ```

   In the configuration file, set `registry-state-dir=/data/guardian` on the `loadmodule` line.
   Keep the Redis configuration, ACL file, and Guardian state on the volume, and reuse the same
   volume when you replace the container. Add the network settings your deployment needs.

## Inspect the application users

`guardian-preflight` reads Redis metadata and reports which permissions each application user
needs. It doesn't change anything, and it doesn't need application passwords.

1. Store the operator password in `REDISCLI_AUTH`, which `redis-cli` also reads:

   ```bash
   read -r -s -p 'Redis operator password: ' REDISCLI_AUTH; echo
   export REDISCLI_AUTH
   ```

1. Run the checker, with one `--application-user` option for each application user:

   ```sh
   guardian-preflight --host <host> --port <port> --user <operator-user> \
     --application-user <app-user> --application-user <other-app-user>
   ```

   For Transport Layer Security (TLS), Unix sockets, and other options, see
   [`guardian-preflight`](/content/operate/oss_and_stack/guardian/reference.md#guardian-preflight).

Before the module loads, the report shows `NEEDS ATTENTION`. That's expected. The report also
prints the exact `ACL SETUSER` command each user needs. The grants let Guardian dispatch
commands and return rule denials. They don't let the application run commands or reach keys
that its ACL forbids. Users with `+@all` usually need no change.

The grant depends on the Redis version:

| Redis version | Proposed grant |
|---|---|
| Redis 8 and later | `+@guardian-execution` |
| Redis 7 | `+hotpatch._blocked +hotpatch._rules.read +hotpatch._rules.write +hotpatch._rules.admin` |
| Redis 6.2 | `+hotpatch._blocked` |

If a user has ACL selectors, the proposed command uses `clearselectors` and recreates each
selector with the added permissions. It keeps the user's original commands, key patterns,
channel patterns, flags, and passwords. Review the proposal, and run the checker again
immediately before you apply it. The proposal is for the ACL state the checker saw. It doesn't protect
against concurrent ACL changes.

## Load the module and grant permissions

Load the module and apply the grants in one `MULTI`/`EXEC` transaction on one connection. Redis
can't run another application command in between, so applications never see the module without
their grants. Existing connections stay open.

1. Connect `redis-cli` to the node with the operator account, using the same TLS options as the
   checker.
1. At the `redis-cli` prompt, enter the transaction. Use your module path, registry URL, signing
   key, and state directory. Replace the `ACL SETUSER` line with each exact command the checker
   printed:

   ```text
   MULTI
   MODULE LOAD /usr/lib/guardian/guardian-community.so registry-url=<registry-url> registry-key=<key-id>:<base64url-public-key> registry-state-dir=/var/lib/redis/guardian registry-access=public
   ACL SETUSER <app-user> +@guardian-execution
   EXEC
   ```

   Run the transaction at one `redis-cli` prompt. Separate `redis-cli` invocations don't share a
   transaction.
1. Check every result in the `EXEC` reply. `EXEC` doesn't roll back earlier commands when a later
   one fails. If any command fails, keep the node out of application traffic until you fix the
   problem and the checks in the next section pass.

If the module is already loaded, apply only the grants. Don't load the module twice. Adding
grants doesn't create or enable a user; the checker reports disabled and missing users
separately.

To turn off telemetry, add `telemetry=no` to the module arguments. See
[Guardian telemetry](/content/operate/oss_and_stack/guardian/telemetry.md).

## Check active protection

1. Run the checker with `--require-active-rules`:

   ```sh
   guardian-preflight --host <host> --port <port> --user <operator-user> \
     --application-user <app-user> --require-active-rules
   ```

   Exit status `0` means the module is ready, every listed user has its grants, and at least one
   rule is active. For the other codes, see
   [Exit codes](/content/operate/oss_and_stack/guardian/reference.md#exit-codes).
1. Check the module status and loaded rules:

   ```sh
   redis-cli HOTPATCH.STATUS
   redis-cli HOTPATCH.RULES
   ```

1. Connect as each real application user and run a quick test. A command the user is allowed to
   run should succeed. A forbidden command, and a key outside the user's allowed key patterns,
   should still fail. If the application uses Lua, run one of its ordinary scripts.

Without `--require-active-rules`, a correctly installed module passes with a warning when no rule
is active. That's normal on a Redis version that has no matching rules.

## Save the module and ACL configuration

`MODULE LOAD` and `ACL SETUSER` change only the running server. Save the module configuration and
the ACL grants together. At startup, Redis loads modules before it applies ACL users. If you save
the grants without the module, the next startup rejects the unknown commands.

1. Add the module to the startup configuration, with the same arguments and state directory:

   ```text
   loadmodule /usr/lib/guardian/guardian-community.so registry-url=<registry-url> registry-key=<key-id>:<base64url-public-key> registry-state-dir=/var/lib/redis/guardian registry-access=public
   ```

1. Save the ACL grants:
   - If Redis uses an `aclfile`, run `ACL SAVE` as the operator. Keep the file on persistent
     storage and in your authoritative configuration.
   - If Redis doesn't use an `aclfile`, add the grants to the existing user definitions in
     `redis.conf`, or in the configuration your deployment system manages. Keep each user's
     original commands, keys, channels, and passwords.

   The checker report shows which of these applies to the node.
1. If a deployment system manages your Redis configuration, make the same changes there.

## Verify a restart

Test the saved configuration on a test or staging node before you rely on it.

1. Restart the node from the saved configuration.
1. Run `guardian-preflight --require-active-rules` and the application user tests again.

Keep the state directory across restarts and container replacements. It lets Guardian restore
the accepted protection when the registry is unreachable. Each new node needs the same
configuration and its own state directory. Later rule releases use the same grants, so you don't
need to change application ACLs for each release.
