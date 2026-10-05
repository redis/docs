---
Title: Authentication
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Configure SASL authentication to secure access to Korvet.
linkTitle: Authentication
weight: 40
---

This guide covers configuring SASL authentication to secure access to Korvet.

## Overview

Korvet supports SASL (Simple Authentication and Security Layer) authentication to control access to the Kafka protocol endpoint. When enabled, clients must authenticate before producing or consuming messages.

### Supported Mechanisms

- **SASL/SCRAM-SHA-256** - Challenge-response authentication using stored SCRAM keys. This is the default mechanism.
- **SASL/PLAIN** - Username and password authentication. Must be opted in explicitly and requires TLS (see below).

By default, only `SCRAM-SHA-256` is advertised to clients. The advertised mechanisms are controlled by `korvet.broker.sasl.mechanisms` (default `SCRAM-SHA-256`).

## Enabling Authentication

### Configuration

Enable SASL authentication in your Korvet configuration:

```yaml
korvet:
  broker:
    sasl:
      enabled: true
      mechanisms:
        - SCRAM-SHA-256
```

Or using environment variables:

```bash
KORVET_BROKER_SASL_ENABLED=true
KORVET_BROKER_SASL_MECHANISMS=SCRAM-SHA-256
```

### Enabling PLAIN

`PLAIN` is not advertised by default. To use it, add it explicitly to `korvet.broker.sasl.mechanisms`. Because `PLAIN` transmits credentials without encryption, Korvet requires TLS to be enabled when `PLAIN` is advertised. Starting the broker with `PLAIN` advertised while `korvet.broker.tls=false` fails validation at startup with:

```
korvet.broker.sasl: PLAIN mechanism requires korvet.broker.tls=true
```

Clients using `PLAIN` must therefore connect with the `SASL_SSL` security protocol, not `SASL_PLAINTEXT`.

```yaml
korvet:
  broker:
    tls: true
    sasl:
      enabled: true
      mechanisms:
        - SCRAM-SHA-256
        - PLAIN
```

## Managing Credentials

### Credential Storage

Credentials are stored in Redis using secure PBKDF2 password hashing:

- **Algorithm**: PBKDF2WithHmacSHA256
- **Iterations**: 10,000
- **Salt**: 128-bit random per credential
- **Hash**: 256-bit output

### Creating User Credentials

Use the Korvet admin API or Redis CLI to create user credentials. The admin API
(see [Deployment]({{< relref "/integrate/korvet/operations/deployment" >}}) for enabling it) exposes
credential management over HTTP; the Redis CLI approach below is shown for
direct access.

#### Using Redis CLI

```bash
# Store a SCRAM-SHA-256 credential for user "alice" in tenant "tenant1"
redis-cli HSET korvet:broker:credentials:alice \
  mechanism SCRAM-SHA-256 \
  password_hash <base64-encoded-StoredKey> \
  server_key <base64-encoded-ServerKey> \
  salt <base64-encoded-salt> \
  iterations 10000 \
  tenant_id tenant1
```

For SCRAM, `password_hash` stores the Base64-encoded StoredKey and `server_key`
stores the Base64-encoded ServerKey. Do not store the salted password.

To create a `PLAIN` credential (only usable when `PLAIN` is advertised and TLS
is enabled), use `mechanism PLAIN` with `password_hash`, `salt`, and
`iterations` fields.

#### Programmatic Creation

```java
import com.redis.korvet.broker.redis.RedisCredentialStore;

// Create credential store
RedisCredentialStore credentialStore =
    new RedisCredentialStore(redisClient, "korvet");
PasswordHasher passwordHasher = new PasswordHasher();

// Hash the password
PasswordHasher.HashedPassword hashed = 
    passwordHasher.hashPassword("secret-password");

// Store the credential
StoredCredential credential = StoredCredential.builder()
    .username("alice")
    .mechanism("PLAIN")
    .passwordHash(hashed.getHash())
    .salt(hashed.getSalt())
    .iterations(hashed.getIterations())
    .tenantId("tenant1")
    .build();

credentialStore.storeCredential(credential);
```

### Updating Credentials

To update a user's password, store a new credential with the same username:

```java
// Hash new password
PasswordHasher.HashedPassword newHashed = 
    passwordHasher.hashPassword("new-password");

// Update credential
StoredCredential updated = StoredCredential.builder()
    .username("alice")
    .mechanism("PLAIN")
    .passwordHash(newHashed.getHash())
    .salt(newHashed.getSalt())
    .iterations(newHashed.getIterations())
    .tenantId("tenant1")
    .build();

credentialStore.storeCredential(updated);
```

### Deleting Credentials

```java
credentialStore.deleteCredential("alice");
```

Or using Redis CLI:

```bash
redis-cli DEL korvet:broker:credentials:alice
```

## Client Configuration

### Kafka Producer

```java
Properties props = new Properties();
props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, 
    StringSerializer.class.getName());
props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, 
    StringSerializer.class.getName());

// SASL configuration (default SCRAM-SHA-256 mechanism)
props.put(CommonClientConfigs.SECURITY_PROTOCOL_CONFIG, "SASL_PLAINTEXT");
props.put(SaslConfigs.SASL_MECHANISM, "SCRAM-SHA-256");
props.put(SaslConfigs.SASL_JAAS_CONFIG,
    "org.apache.kafka.common.security.scram.ScramLoginModule required " +
    "username=\"alice\" " +
    "password=\"secret-password\";");

KafkaProducer<String, String> producer = new KafkaProducer<>(props);
```

For `PLAIN` clients, use the `SASL_SSL` security protocol (PLAIN requires TLS) and Kafka's PLAIN login module:

```java
props.put(CommonClientConfigs.SECURITY_PROTOCOL_CONFIG, "SASL_SSL");
props.put(SaslConfigs.SASL_MECHANISM, "PLAIN");
props.put(SaslConfigs.SASL_JAAS_CONFIG,
    "org.apache.kafka.common.security.plain.PlainLoginModule required " +
    "username=\"alice\" " +
    "password=\"secret-password\";");
```

### Kafka Consumer

```java
Properties props = new Properties();
props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(ConsumerConfig.GROUP_ID_CONFIG, "my-group");
props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, 
    StringDeserializer.class.getName());
props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, 
    StringDeserializer.class.getName());

// SASL configuration (default SCRAM-SHA-256 mechanism)
props.put(CommonClientConfigs.SECURITY_PROTOCOL_CONFIG, "SASL_PLAINTEXT");
props.put(SaslConfigs.SASL_MECHANISM, "SCRAM-SHA-256");
props.put(SaslConfigs.SASL_JAAS_CONFIG,
    "org.apache.kafka.common.security.scram.ScramLoginModule required " +
    "username=\"alice\" " +
    "password=\"secret-password\";");

KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
```

For `PLAIN`, set `security.protocol=SASL_SSL`, `sasl.mechanism=PLAIN`, and use the `PlainLoginModule` (PLAIN requires TLS).

### Command Line Tools

```bash
# kafka-console-producer
kafka-console-producer \
  --bootstrap-server localhost:9092 \
  --topic test \
  --producer-property security.protocol=SASL_PLAINTEXT \
  --producer-property sasl.mechanism=SCRAM-SHA-256 \
  --producer-property 'sasl.jaas.config=org.apache.kafka.common.security.scram.ScramLoginModule required username="alice" password="secret-password";'
```

```bash
# kafka-console-consumer
kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic test \
  --from-beginning \
  --consumer-property security.protocol=SASL_PLAINTEXT \
  --consumer-property sasl.mechanism=SCRAM-SHA-256 \
  --consumer-property 'sasl.jaas.config=org.apache.kafka.common.security.scram.ScramLoginModule required username="alice" password="secret-password";'
```

## Topic Authorization (ACLs)

SASL authentication alone only prevents unauthenticated access — once connected, every
authenticated principal can produce to and consume from any topic. Topic ACLs add per-user
authorization on top of authentication.

### Enabling ACL Enforcement

```yaml
korvet:
  broker:
    sasl:
      enabled: true
    acl:
      enabled: true
```

`korvet.broker.acl.enabled` requires `korvet.broker.sasl.enabled=true`; enabling ACLs without
SASL fails validation at startup.

### Authorization Model

ACL rules are allow-only grants of the form `(principal, topic, operation)`:

- **principal** - the SASL username
- **topic** - a topic name, or `*` to grant the operation on all topics
- **operation** - `READ` (fetch) or `WRITE` (produce)

When ACL enforcement is enabled, a principal may only perform operations it has been granted;
everything else — including topics with no rules at all — is denied with the standard Kafka
`TOPIC_AUTHORIZATION_FAILED` error, which Kafka clients surface as `TopicAuthorizationException`.

Rules are stored in Redis as one JSON document per principal at
`{namespace}:broker:acls:{username}`. The principal's policy is resolved once per connection at
authentication time, so rule changes apply to connections established afterwards.

### Managing ACL Rules

ACL rules are managed through the admin REST API:

```bash
# Grant alice WRITE on orders
curl -u admin:admin-password -X POST http://localhost:8080/api/v1/acls \
  -H 'Content-Type: application/json' \
  -d '{"principal":"alice","topic":"orders","operation":"WRITE"}'

# Grant bob READ on all topics
curl -u admin:admin-password -X POST http://localhost:8080/api/v1/acls \
  -H 'Content-Type: application/json' \
  -d '{"principal":"bob","topic":"*","operation":"READ"}'

# List alice's rules
curl -u admin:admin-password http://localhost:8080/api/v1/acls/alice

# Delete a rule
curl -u admin:admin-password -X DELETE \
  'http://localhost:8080/api/v1/acls/alice?topic=orders&operation=WRITE'
```

## Multi-Tenancy

Each credential is associated with a tenant ID. When a client authenticates, the tenant ID is attached to the connection and can be used for:

- **Data isolation** - Separate topics and consumer groups per tenant
- **Resource quotas** - Limit resources per tenant
- **Access control** - Restrict access to tenant-specific resources

### Tenant Mapping

```java
// User "alice" belongs to "tenant1"
StoredCredential credential = StoredCredential.builder()
    .username("alice")
    .tenantId("tenant1")
    // ... other fields
    .build();

// User "bob" belongs to "tenant2"
StoredCredential credential2 = StoredCredential.builder()
    .username("bob")
    .tenantId("tenant2")
    // ... other fields
    .build();
```

## Security Best Practices

### Password Security

- Use strong, randomly generated passwords
- Rotate passwords regularly
- Never commit passwords to version control
- Use environment variables or secret management systems

### Network Security

SASL/PLAIN transmits credentials in base64 encoding (not encrypted). Korvet therefore requires TLS whenever `PLAIN` is advertised, so `PLAIN` clients must use the `SASL_SSL` security protocol. SCRAM-SHA-256 does not send the password and can be used over `SASL_PLAINTEXT`, though TLS is still recommended in production:

- **Use TLS** - Required for `PLAIN` (`SASL_SSL`); recommended for SCRAM
- **Network isolation** - Deploy in private networks
- **Firewall rules** - Restrict access to Korvet port

### Credential Management

- **Principle of least privilege** - Create separate credentials per application
- **Audit access** - Monitor authentication attempts
- **Revoke unused credentials** - Delete credentials for decommissioned applications

## Troubleshooting

### Authentication Failures

#### Invalid Credentials

```log
ERROR Authentication failed for user 'alice': Invalid password
```

**Solution**: Verify the username and password are correct.

#### User Not Found

```log
ERROR Authentication failed for user 'bob': User not found
```

**Solution**: Create the credential using the credential store.

#### Mechanism Not Supported

```log
ERROR Unsupported SASL mechanism: SCRAM-SHA-512
```

**Solution**: Use a supported mechanism (`PLAIN` or `SCRAM-SHA-256`).

### Connection Issues

#### Client Configuration

Verify the client is configured with:

- `security.protocol=SASL_PLAINTEXT` for SCRAM-SHA-256, or `SASL_SSL` for PLAIN (PLAIN requires TLS)
- `sasl.mechanism=SCRAM-SHA-256` (default) or `sasl.mechanism=PLAIN`
- Correct JAAS configuration with username and password

#### Server Configuration

Verify SASL is enabled in Korvet:

```bash
# Check environment variable
echo $KORVET_BROKER_SASL_ENABLED

# Should output: true
```

### Debugging

Enable debug logging for authentication:

```yaml
logging:
  level:
    com.redis.korvet.broker.auth: DEBUG
    com.redis.korvet.broker.kafka.SaslHandshakeHandler: DEBUG
    com.redis.korvet.broker.kafka.SaslAuthenticateHandler: DEBUG
```

## Migration Guide

### Enabling Authentication on Existing Deployment

{{< warning >}}
Enabling authentication will break existing unauthenticated clients.
{{< /warning >}}

1. Create credentials for all existing applications
2. Update client configurations with SASL settings
3. Test authentication with a subset of clients
4. Enable SASL in Korvet configuration
5. Monitor for authentication failures
6. Update remaining clients

### Disabling Authentication

To disable authentication:

```yaml
korvet:
  broker:
    sasl:
      enabled: false
```

Clients can then connect without authentication.

## See Also

- [Deployment Guide]({{< relref "/integrate/korvet/operations/deployment" >}})
- [Configuration Reference]({{< relref "/integrate/korvet/reference/configuration" >}})
- [Troubleshooting]({{< relref "/integrate/korvet/operations/troubleshooting" >}})
