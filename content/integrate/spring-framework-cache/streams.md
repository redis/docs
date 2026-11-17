---
LinkTitle: Streams
Title: Process Redis streams with Spring
alwaysopen: false
categories:
- docs
- integrate
- stack
- oss
- rs
- rc
- oss
- client
description: Add entries to a Redis stream and consume them with a consumer group in a Spring application.
group: framework
summary: Use StreamMessageListenerContainer to consume stream entries with a consumer group, acknowledge them, and claim entries that a failed consumer left pending.
type: integration
weight: 16
---

Spring Data Redis supports Redis [streams](/content/develop/data-types/streams/_index.md)
through the template (`opsForStream()`) and through a stream message listener container
that reads entries in the background. See the
[streaming use case](/content/develop/use-cases/streaming/_index.md) for when to
choose a stream.

## Add entries

Use `StreamRecords` to build a record and add it to the stream with the template:

```java
template.opsForStream().add(
        StreamRecords.string(Map.of("sku", "a1")).withStreamKey("orders"));
```

## Consume with a consumer group

A consumer group shares the entries of a stream between several consumers, and tracks
which entries each consumer has processed. The following configuration creates the
container, creates the group, and registers a listener that acknowledges each entry
after processing it:

```java
@Configuration
public class StreamsConfig {
    static final String STREAM = "orders";
    static final String GROUP = "order-workers";

    @Bean(initMethod = "start", destroyMethod = "stop")
    StreamMessageListenerContainer<String, MapRecord<String, String, String>> streamContainer(
            RedisConnectionFactory connectionFactory) {
        var options = StreamMessageListenerContainerOptions.builder()
                .pollTimeout(Duration.ofSeconds(1))
                .build();
        return StreamMessageListenerContainer.create(connectionFactory, options);
    }

    @Bean
    Subscription orderSubscription(
            StreamMessageListenerContainer<String, MapRecord<String, String, String>> container,
            StringRedisTemplate template) {
        // Creates the stream if needed. Throws if the group already exists.
        try {
            template.opsForStream().createGroup(STREAM, ReadOffset.from("0"), GROUP);
        } catch (Exception e) {
            // The group already exists.
        }

        return container.receive(
                Consumer.from(GROUP, "worker-1"),
                StreamOffset.create(STREAM, ReadOffset.lastConsumed()),
                message -> {
                    process(message.getValue());
                    template.opsForStream().acknowledge(STREAM, GROUP, message.getId());
                });
    }
}
```

The `createGroup` call creates the stream if it doesn't exist, and the container must
find the group before it starts reading. `ReadOffset.lastConsumed()` asks for entries
that no consumer in the group has received yet.

## Find and claim pending entries

An entry stays in the group's pending list until a consumer acknowledges it. If a
consumer stops before acknowledging, its entries stay pending. List them with
`pending()` and take them over with `claim()`:

```java
PendingMessages pending = template.opsForStream()
        .pending(STREAM, GROUP, Range.unbounded(), 10);

for (PendingMessage entry : pending) {
    List<MapRecord<String, Object, Object>> claimed = template.opsForStream()
            .claim(STREAM, GROUP, "rescuer", Duration.ofMinutes(1), entry.getId());
    // Process the claimed entries, then acknowledge them.
}
```

The `claim` call transfers only the entries that have been idle for at least the
duration you give, so a consumer that is still working isn't interrupted.

For a reactive alternative to the listener container, see
[Redis Streams](https://docs.spring.io/spring-data/redis/reference/redis/redis-streams.html)
in the Spring Data Redis documentation.
