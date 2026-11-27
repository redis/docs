---
Title: Schema Registry
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Korvet exposes a Confluent Schema Registry-compatible REST API for registering
  and looking up Avro, Protobuf, and JSON Schema subjects.
linkTitle: Schema Registry
weight: 40
---

Korvet exposes a Confluent Schema Registry-compatible REST API on the existing Spring Boot HTTP port when `korvet.schema-registry.enabled=true`.
Kafka clients should configure `schema.registry.url` to the Korvet HTTP base URL and continue using Confluent serializers and deserializers.

The registry supports registering and looking up Avro, Protobuf, and JSON Schema subjects, managing global and subject compatibility levels, and checking compatibility for new schemas.
The Kafka broker preserves Confluent-encoded key and value bytes unchanged.
When `korvet.schema-registry.validate-produce=true`, Korvet validates produced records that belong to registered `<topic>-key` or `<topic>-value` subjects and stores schema identity metadata alongside the archived payload.

```yaml
korvet:
  schema-registry:
    enabled: true
    default-compatibility: BACKWARD
    validate-produce: true
```

Supported v1 endpoints include:

- `GET /subjects`
- `GET /subjects/{subject}/versions`
- `GET /subjects/{subject}/versions/{version}`
- `GET /schemas/ids/{id}`
- `POST /subjects/{subject}/versions`
- `POST /subjects/{subject}`
- `POST /compatibility/subjects/{subject}/versions/{version}`
- `GET /config`, `PUT /config`
- `GET /config/{subject}`, `PUT /config/{subject}`

Deletes, modes, exporters, contexts, and ACLs are intentionally out of scope for the first implementation.
