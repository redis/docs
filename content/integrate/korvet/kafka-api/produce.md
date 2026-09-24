---
Title: Producing Messages
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: How to produce messages to Korvet using Kafka clients.
linkTitle: Producing Messages
weight: 10
---

This guide shows how to produce messages to Korvet using Kafka clients.

## Using kafka-console-producer

The simplest way to produce messages:

```bash
kafka-console-producer --bootstrap-server localhost:9092 --topic my-topic
```

Type messages and press Enter to send each one.

## Java Producer

```java
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

KafkaProducer<String, String> producer = new KafkaProducer<>(props);

ProducerRecord<String, String> record = 
    new ProducerRecord<>("my-topic", "key", "value");

producer.send(record, (metadata, exception) -> {
    if (exception == null) {
        System.out.println("Sent to partition " + metadata.partition() + 
                         " at offset " + metadata.offset());
    } else {
        exception.printStackTrace();
    }
});

producer.close();
```

## Python Producer

```python
from kafka import KafkaProducer

producer = KafkaProducer(bootstrap_servers='localhost:9092')

producer.send('my-topic', b'Hello, Korvet!')
producer.flush()
```

## Message Format

Messages consist of:

- **Key** (optional): Used for partitioning
- **Value**: The message payload
- **Headers** (optional): Key-value metadata
- **Timestamp**: Automatically set if not provided

## Partitioning

Messages are distributed across partitions based on:

- **Key hash**: If a key is provided, messages with the same key go to the same partition
- **Round-robin**: If no key is provided, messages are distributed evenly

## Next Steps

- [Consuming messages]({{< relref "/integrate/korvet/kafka-api/consume" >}})
- [Topic management]({{< relref "/integrate/korvet/kafka-api/topics" >}})
