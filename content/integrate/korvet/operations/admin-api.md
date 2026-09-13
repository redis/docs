---
Title: Admin API
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: HTTP Admin API for topic administration, consumer-group inspection,
  monitoring snapshots, and Kafka SASL credential management.
linkTitle: Admin API
weight: 100
---

Korvet exposes an HTTP Admin API under `/api/v1` for topic administration, consumer-group inspection, monitoring snapshots, and Kafka SASL credential management.

The Admin API is protected with HTTP Basic authentication.

## Authentication

A bootstrap admin credential is created automatically on first startup.
Configure it with:

```yaml
korvet:
  admin:
    username: admin
    password: admin
    bootstrap: true
```

Change the default password before exposing the API outside a local development environment.

## Kafka SASL Credentials

The credentials API manages Kafka SASL service accounts — the usernames and passwords that Kafka clients use to authenticate against the broker.

### Supported mechanisms

- `SCRAM-SHA-256` (default) — recommended for most deployments.
- `PLAIN` — requires TLS to be enabled on the broker (`korvet.broker.tls=true`).

### Endpoints

- `POST /api/v1/credentials` — create a credential.
- `GET /api/v1/credentials` — list all credentials.
- `GET /api/v1/credentials/{username}` — get one credential.
- `PUT /api/v1/credentials/{username}` — rotate the password or change the mechanism.
- `DELETE /api/v1/credentials/{username}` — delete a credential.

### Create a credential

```http
POST /api/v1/credentials
Content-Type: application/json

{
  "username": "kafka-client-1",
  "password": "secret123",
  "mechanism": "SCRAM-SHA-256"
}
```

`mechanism` is optional and defaults to `SCRAM-SHA-256`.
`username` must be 3–64 characters and contain only letters, digits, `-`, `_`, or `.`.
`password` must be 8–128 characters with no whitespace.

### Rotate a password

```http
PUT /api/v1/credentials/kafka-client-1
Content-Type: application/json

{ "password": "newSecret456" }
```

Omitting `mechanism` keeps the credential's existing mechanism.

## Topics

- `POST /api/v1/topics` creates a topic.
- `GET /api/v1/topics` lists topics.
- `GET /api/v1/topics/{name}` returns one topic.
- `GET /api/v1/topics/{name}/partitions` returns current per-partition stream and offset stats.
- `PUT /api/v1/topics/{name}` replaces explicit topic configuration.
- `DELETE /api/v1/topics/{name}` deletes a topic.

## Consumer Groups

- `GET /api/v1/consumer-groups` lists consumer groups.
- `GET /api/v1/consumer-groups/{groupId}` returns group state and members.

## Monitoring

- `GET /api/v1/health` returns a stable Admin API health schema backed by Spring Boot health.
- `GET /api/v1/metrics` returns a curated metrics snapshot.
- `GET /api/v1/storage-stats` returns remote storage diagnostics when available.
- `GET /api/v1/storage/offload-jobs` returns the current segment-derived offload queue view. In
  Phase 1, this endpoint reports `pending`, `running`, and limited `done` rows from existing segment
  state only; it does not expose durable job history, retries, failures, or cancellation. The optional
  query parameters are `status` (`pending`, `running`, or `done`; repeatable), `offset` (zero-based row
  offset, default `0`), and `limit` (default `100`, maximum `500`).

## OpenAPI

OpenAPI JSON is available at `/v3/api-docs`.

Swagger UI is available at `/swagger-ui.html`.
