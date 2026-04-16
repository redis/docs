---
title: ff CLI reference
description: Review the current ff CLI command groups, global flags, and transport behavior.
linkTitle: ff CLI
weight: 10
---

This page documents the current public `ff` CLI surface.

## Global flags

Connection and transport:

- `--server`, `-s`
- `--grpc-server`
- `--transport rest|grpc`
- `--timeout`, `-t`
- `--no-tls`

Authentication:

- `--token`
- `--client-id`
- `--client-secret`
- `--issuer-url`

CLI behavior:

- `--output`, `-o`
- `--config`
- `--no-color`
- `--verbose`, `-v`
- `--skip-version-check`

## Top-level commands

- `ff version`
- `ff ping`
- `ff workspace`
- `ff provider`
- `ff secret-provider`
- `ff apply`
- `ff auth`
- `ff rbac`
- `ff machine-credential`
- `ff audit`
- `ff catalog`
- `ff graph`
- `ff scheduler`
- `ff dataframe`
- `ff config`

## Transport note

The CLI defaults to REST in code, but many operational examples use explicit gRPC. In memory-backed deployments, REST and gRPC do not share one durable state backend.

## Read next

- [Apply a definitions file]({{< relref "/develop/ai/featureform/how-to/apply/apply-a-definitions-file" >}})
- [Roles and permissions]({{< relref "/develop/ai/featureform/reference/rbac/roles-and-permissions" >}})
