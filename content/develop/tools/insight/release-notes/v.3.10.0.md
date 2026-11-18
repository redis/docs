---
Title: Redis Insight v3.10.0, November 2026
linkTitle: v3.10.0 (November 2026)
date: 2026-11-17 00:00:00 +0000
description: Redis Insight v3.10.0
weight: 1
---

## 3.10.0 (November 2026)

This is the General Availability (GA) release of Redis Insight 3.10.0, which includes new features, improvements, and bug fixes.

### Headlines

- **Security update:** Redis Insight now ships with Node.js 24.22.2 and Electron 43.8.7, which fix CVE-2026-111497. The Docker image also no longer trusts the compromised eMudhra emSign ECC Root CA - G3 certificate and includes an updated npm with a patched `tar`.
- **Stricter TLS verification:** the "Verify TLS Certificate" option now behaves as labeled. When it is off, the certificate is no longer checked. When it is on, the server certificate must also match the host you connect to.
- **Redis Cloud sign-in with two-factor authentication:** accounts protected by an authenticator-app (TOTP) code can now sign in to Redis Cloud from the desktop app.
- **Set up your coding agent for Redis:** a new **Redis tools** panel in the page header gets your coding agent working with Redis. Run one command, `npx @redis/redisctl init`, and it detects your stack and agents, connects your database, teaches your agent Redis, and adds the MCP server.

### Details

- **Breaking Change:** when "Verify TLS Certificate" is on, Redis Insight now also verifies that the server certificate matches the host name or IP address you connect to. Connections to a server by IP address with a certificate issued only for a host name will fail. To fix this, set the TLS server name on the database, or set the environment variable `RI_TLS_SKIP_HOSTNAME_VERIFICATION=true` to keep the previous behavior. Connections with "Verify TLS Certificate" turned off are not affected.
- "Verify TLS Certificate" turned off is now honored: previously the certificate was still verified in this case. Databases found through Azure autodiscovery keep verification on.
- **Breaking Change:** in Docker, Redis Stack, and the VS Code extension, importing databases no longer reads certificate and SSH key files from a path on the host. Use the PEM content inline in the import file instead. The desktop app is not affected.
- Security hardening across the app: WebSocket connections are now authorized, plugin read-only command checks match exact commands, markdown content and module names are rendered safely, and the telemetry endpoint and profiler log file ids are validated.
- Added a **Search** box to the index drop-down and the indexes list, so you can find an index among many.
- Large vector embeddings are now detected and highlighted in the query editor, and can be collapsed and expanded to keep long queries readable.
- Choose how the desktop app updates: in **Settings**, switch between automatic downloads and a notify-only mode that shows an "Update available" prompt with **Update** and **Skip this version**. A new **Check for Updates** action is available in notify mode.
- The **Array** (Redis 8.8+) and **Vector Set** (Redis 8.0+) key types now stay visible in the Add Key list on older Redis versions, greyed out with a "Requires Redis x.y+" hint.
- Browser tree view: added an "Ignore separator in first N chars" setting that skips delimiters in the first characters of a key name. Keys that share a Redis hash tag now stay together in a single tree node.
- Editing a value while a non-Unicode format (such as JSON) is selected now shows a confirmation, because saving can rewrite the stored bytes. You can cancel, edit anyway, or switch to Unicode.
- The **Key size** column in the Browser is hidden for databases labeled as production, so key requests no longer run `MEMORY USAGE`, which can block a large database. Your saved column choice is kept and applies again if the database is no longer labeled production.
- Redis Copilot is retired: the Copilot chat panels are turned off. Use the new **Redis tools** panel to set up your own coding agent for Redis.
- [#6249](https://github.com/redis/RedisInsight/issues/6249) Redis Cloud sign-in through Google, GitHub, or SSO now supports accounts with TOTP two-factor authentication in the desktop app.

### Bug fixes

- [#6555](https://github.com/redis/RedisInsight/pull/6555) Fixed IPv6 hosts being rejected in connection URLs.
- [#6551](https://github.com/redis/RedisInsight/pull/6551) Fixed WebSocket connections not working under `RI_PROXY_PATH` when `RI_SOCKET_PROXY_PATH` is not set.
- [#6180](https://github.com/redis/RedisInsight/pull/6180) Fixed cluster discovery for Redis Clusters that announce a host name per node, such as ElastiCache and load-balanced setups.
- [#6232](https://github.com/redis/RedisInsight/pull/6232) Fixed Workbench not showing module command results when ACL hides the module list.
- [#6230](https://github.com/redis/RedisInsight/pull/6230) Fixed modules not refreshing when connecting through a deep link.
- [#6299](https://github.com/redis/RedisInsight/pull/6299) Fixed a Workbench crash in command autocomplete.
- [#6231](https://github.com/redis/RedisInsight/pull/6231) Fixed `WITHSUFFIXTRIE` not being shown for RediSearch text fields.
- [#6200](https://github.com/redis/RedisInsight/pull/6200) Fixed indexes for a key being matched without checking the key type.
- [#6319](https://github.com/redis/RedisInsight/pull/6319) Fixed Azure Entra ID connections using a cached token from a different tenant.

**Full Changelog**: https://github.com/redis/RedisInsight/compare/3.8.0...3.10.0

**SHA-512 Checksums**

| Package                | SHA-512 |
| ---------------------- | ------- |
| Windows                | ooaMv16OeEHTUihQgJr+lUEFT+B+svqKdzdplhb74CnU0pzniurGC7QHaaDTSUGzcmw8bBpvXRZEcl5jmtZ6tg== |
| Linux AppImage (x64)   | 4SPMMCNZu2jbAvASyOAzTBmX10NFqNOwWk1WBBPGEGiEDuhEdtkSlts+xXrGJPS9DZ2iItxfF15DJUV8yDalrw== |
| Linux AppImage (arm64) | 1GNNugi5/YdvsmmhpIxPQBlBvJ+J5kMur87A5HwW0sC7RmCv24t9jMlQQFsUb9a4ab3z/SRwzuG7X32HZGwvNQ== |
| Linux Debian (x64)     | 8CDpaJIoOR66NwCpoiPi3cNfle1n+s0yZTNrNmFK2b/cnRrpBOwzCdE2mOa9iJX26CBfpnV/b3Zfis/83fC+ow== |
| Linux Debian (arm64)   | 1iELTZrmhOPWU6wrTwzZvsLZ+OKUnP1ObnKCkHGHrxc6B+M6w/0OWWxB66FB9xu0OVHIbMZ/TrZJq6qfjLazSA== |
| Linux RPM (x64)        | 86PBdZliVnSE3/OEogyDi/MKFOgMr0l+j5eBV+6B69Fw+t0NimsejArqgAR9g9GaDyyknXaROE8BHUxC8owJBw== |
| Linux RPM (arm64)      | OP/Z75WKdUjGhgHIw7TN5oHU8e6N5Fqj4ZGttP3QR8VApTTVmFhbSlyXtAOZBqOmMAa30HvS1Sb+jYvaqOoyuw== |
| MacOS Intel            | qPrRC/cmh99V9/jtaM50mGYFshbcLa2NIBp7mWzz7sVreAuLK7NddGQQa5Vikzdv5GMX13hXCnOY253r9KHiag== |
| MacOS Apple silicon    | psem6XUOnon3242RvLME/TI1A3raJ8Cg6MoLZYTGbRpjupn3pirlG/TJ/PdvcyX5E+p/k1de+G80aNPeDKtFkQ== |
