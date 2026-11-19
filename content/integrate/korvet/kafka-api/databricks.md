---
Title: Databricks Integration
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Integrate Korvet with Databricks Spark Structured Streaming using the
  standard Kafka connector.
linkTitle: Databricks Integration
weight: 50
---

This guide covers integrating Korvet with Databricks Spark Structured Streaming.

## Overview

Databricks can connect to Korvet using the standard Kafka connector for Spark Structured Streaming. This allows you to:

- Stream data from Kafka topics into Databricks for processing
- Write processed data back to Kafka topics
- Use Databricks for stream processing, Delta Lake sinks, or analytics on top of Korvet topics

## Prerequisites

- Korvet server running and accessible from Databricks
- Network connectivity between Databricks and Korvet (see [Network Requirements](#network-requirements))
- Kafka topic created in Korvet

## Basic Usage

### Reading from Kafka

```python
# Read from a Kafka topic
df = spark.readStream \
  .format("kafka") \
  .option("kafka.bootstrap.servers", "<korvet-host>:9092") \
  .option("subscribe", "my-topic") \
  .option("startingOffsets", "latest") \
  .load()

# Parse the value column (Kafka messages are binary)
from pyspark.sql.functions import col, from_json
from pyspark.sql.types import StructType, StructField, StringType

schema = StructType([
    StructField("id", StringType()),
    StructField("name", StringType()),
    StructField("timestamp", StringType())
])

parsed_df = df.select(
    col("key").cast("string"),
    from_json(col("value").cast("string"), schema).alias("data"),
    col("topic"),
    col("partition"),
    col("offset"),
    col("timestamp")
).select("key", "data.*", "topic", "partition", "offset", "timestamp")

# Display the stream
display(parsed_df)
```

### Writing to Kafka

```python
# Write to a Kafka topic
query = parsed_df \
  .selectExpr("key", "to_json(struct(*)) AS value") \
  .writeStream \
  .format("kafka") \
  .option("kafka.bootstrap.servers", "<korvet-host>:9092") \
  .option("topic", "output-topic") \
  .option("checkpointLocation", "/tmp/checkpoint") \
  .start()

query.awaitTermination()
```

## Configuration

### Recommended Settings

```python
df = spark.readStream \
  .format("kafka") \
  .option("kafka.bootstrap.servers", "<korvet-host>:9092") \
  .option("subscribe", "my-topic") \
  .option("startingOffsets", "latest") \
  .option("maxOffsetsPerTrigger", 10000) \  # Limit records per micro-batch
  .option("kafka.session.timeout.ms", "30000") \  # 30 seconds
  .option("kafka.request.timeout.ms", "60000") \  # 60 seconds
  .load()
```

### Starting From a Timestamp

Spark can also start from a time boundary instead of only `earliest` or `latest`.
This is useful when you want to avoid replaying an entire topic while still
starting near a known point in time.

```python
df = spark.readStream \
  .format("kafka") \
  .option("kafka.bootstrap.servers", "<korvet-host>:9092") \
  .option("subscribe", "my-topic") \
  .option("startingTimestamp", "1711324800000") \  # epoch millis (UTC)
  .load()
```

For per-partition control, use `startingOffsetsByTimestamp`:

```python
df = spark.readStream \
  .format("kafka") \
  .option("kafka.bootstrap.servers", "<korvet-host>:9092") \
  .option("subscribe", "my-topic") \
  .option("startingOffsetsByTimestamp", '{"my-topic":{"0":1711324800000,"1":1711328400000}}') \
  .load()
```

### Performance Tuning

For high-throughput scenarios:

```python
df = spark.readStream \
  .format("kafka") \
  .option("kafka.bootstrap.servers", "<korvet-host>:9092") \
  .option("subscribe", "my-topic") \
  .option("maxOffsetsPerTrigger", 100000) \  # Process more records per batch
  .option("minPartitions", 8) \  # Create more Spark partitions
  .load()
```

## Network Requirements

Databricks must be able to reach Korvet on port 9092. Common deployment scenarios:

### Same VPC

If Databricks and Korvet are in the same AWS VPC:

1. Ensure security groups allow traffic on port 9092
2. Use Korvet's private IP or internal load balancer hostname

### Different VPCs

If Databricks and Korvet are in different VPCs:

1. Set up VPC peering between the VPCs
2. Update route tables to allow traffic
3. Update security groups to allow port 9092

### Internet-Facing Load Balancer

If Korvet is behind an internet-facing AWS load balancer:

1. Configure security group to allow Databricks IP ranges on port 9092
2. See [Databricks IP ranges](https://docs.databricks.com/resources/supported-regions.html)
3. Configure Korvet's advertised address:

   ```bash
   export KORVET_BROKER_ADVERTISED_HOST=<load-balancer-hostname>
   export KORVET_BROKER_ADVERTISED_PORT=9092
   ```

## Troubleshooting

### Timeout Error

If you see:

```
TimeoutException: Timed out waiting for a node assignment. Call: describeTopics
```

This indicates a network connectivity issue. See [Databricks Troubleshooting]({{< relref "/integrate/korvet/operations/troubleshooting#databricks-spark-structured-streaming-timeout" >}}).

**Quick diagnosis**:

```python
import socket
socket.create_connection(("<korvet-host>", 9092), timeout=10)
```

If this times out, Databricks cannot reach Korvet. Check:

- Security groups
- Network ACLs
- VPC peering (if applicable)
- Load balancer configuration

## Next Steps

- [Consuming Messages]({{< relref "/integrate/korvet/kafka-api/consume" >}})
- [Troubleshooting]({{< relref "/integrate/korvet/operations/troubleshooting" >}})
- [Configuration Reference]({{< relref "/integrate/korvet/reference/configuration" >}})
