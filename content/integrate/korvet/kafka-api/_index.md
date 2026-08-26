---
Title: Kafka API
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Use existing Kafka clients and tools with Korvet's implementation of
  the Kafka protocol.
hideListLinks: false
linkTitle: Using the Kafka API
weight: 30
---

Korvet implements the Kafka protocol, allowing you to use existing Kafka clients and tools.

## Supported Operations

- **Produce**: Send messages to topics
- **Fetch**: Read messages from topics
- **Consumer Groups**: Coordinate multiple consumers with offset tracking
- **Topic Management**: Create and list topics

## Client Compatibility

Korvet is compatible with standard Kafka clients:

- **Java**: kafka-clients library
- **Python**: kafka-python, confluent-kafka-python
- **Go**: sarama, confluent-kafka-go
- **Node.js**: kafkajs, node-rdkafka
- **Command-line**: kafka-console-producer, kafka-console-consumer
- **Databricks**: Spark Structured Streaming (see [Databricks Integration]({{< relref "/integrate/korvet/kafka-api/databricks" >}}))

## Connection

Connect to Korvet using the standard Kafka bootstrap server configuration:

```properties
bootstrap.servers=localhost:9092
```

## Next Steps

- [Producing messages]({{< relref "/integrate/korvet/kafka-api/produce" >}})
- [Consuming messages]({{< relref "/integrate/korvet/kafka-api/consume" >}})
- [Topic management]({{< relref "/integrate/korvet/kafka-api/topics" >}})
- [Databricks integration]({{< relref "/integrate/korvet/kafka-api/databricks" >}})
- [Kafka compatibility details]({{< relref "/integrate/korvet/kafka-api/compatibility" >}})
