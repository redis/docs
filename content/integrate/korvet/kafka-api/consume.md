---
Title: Consuming Messages
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: How to consume messages from Korvet using Kafka clients.
linkTitle: Consuming Messages
weight: 20
---

This guide shows how to consume messages from Korvet using Kafka clients.

## Using kafka-console-consumer

The simplest way to consume messages:

```bash
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic my-topic \
  --from-beginning
```

## Java Consumer

```java
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("group.id", "my-consumer-group");
props.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
props.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");

KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
consumer.subscribe(Collections.singletonList("my-topic"));

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord<String, String> record : records) {
        System.out.printf("offset = %d, key = %s, value = %s%n",
                         record.offset(), record.key(), record.value());
    }
}
```

## Python Consumer

```python
from kafka import KafkaConsumer

consumer = KafkaConsumer(
    'my-topic',
    bootstrap_servers='localhost:9092',
    group_id='my-consumer-group',
    auto_offset_reset='earliest'
)

for message in consumer:
    print(f"Offset: {message.offset}, Value: {message.value}")
```

## Offset Management

Korvet tracks consumer offsets to ensure messages are not lost or duplicated:

- **Auto-commit**: Offsets are automatically committed periodically
- **Manual commit**: You can control when offsets are committed

## Reading from Specific Offset

You can start reading from a specific offset:

```bash
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic my-topic \
  --partition 0 \
  --offset 100
```

## Next Steps

- [Producing messages]({{< relref "/integrate/korvet/kafka-api/produce" >}})
- [Topic management]({{< relref "/integrate/korvet/kafka-api/topics" >}})
