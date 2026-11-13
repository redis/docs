---
Title: Troubleshooting
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Common issues and solutions for Korvet.
linkTitle: Troubleshooting
weight: 120
---

Common issues and solutions for Korvet.

## Connection Issues

### Cannot connect to Korvet

**Symptoms**: Kafka clients timeout or fail to connect

**Solutions**:

1. Check Korvet is running:

   ```bash
   curl http://localhost:8080/actuator/health
   ```

2. Verify port is accessible:

   ```bash
   telnet localhost 9092
   ```

3. Check firewall rules allow port 9092

### Cannot connect to Redis

**Symptoms**: Korvet fails to start or logs Redis connection errors

**Solutions**:

1. Verify Redis is running:

   ```bash
   redis-cli ping
   ```

2. Check Redis connection settings:

   ```bash
   export KORVET_REDIS_URI=redis://localhost:6379
   export KORVET_REDIS_USERNAME=default
   export KORVET_REDIS_PASSWORD=secret
   ```

3. Test Redis connectivity:

   ```bash
   redis-cli -h localhost -p 6379 ping
   ```

## Performance Issues

### High latency

**Symptoms**: Slow produce/fetch operations

**Solutions**:

1. Check Redis latency:

   ```bash
   redis-cli --latency
   ```

2. Monitor JVM garbage collection:

   ```bash
   curl http://localhost:8080/actuator/metrics/jvm.gc.pause
   ```

3. Increase JVM heap size:

   ```bash
   export JAVA_OPTS="-Xmx2g -Xms2g"
   ```

### Low throughput

**Symptoms**: Cannot achieve expected messages per second

**Solutions**:

1. Enable pipelining in Redis client
2. Increase batch size for produce operations
3. Size the storage connection pool to your partition fan-out — see [Production Tuning]({{< relref "/integrate/korvet/operations/production-tuning" >}})
4. Scale horizontally (add more Korvet instances)
5. Scale the Redis backend for better performance

## Data Issues

### Messages not appearing

**Symptoms**: Produced messages don't show up when consuming

**Solutions**:

1. Check topic exists:

   ```bash
   kafka-topics --bootstrap-server localhost:9092 --list
   ```

2. Verify partition assignment
3. Check consumer is reading from correct offset
4. Enable debug logging:

   ```bash
   export LOGGING_LEVEL_COM_REDIS_KORVET=DEBUG
   ```

### Duplicate messages

**Symptoms**: Same message consumed multiple times

**Solutions**:

1. Check consumer offset management
2. Verify consumer group configuration
3. Ensure proper error handling in consumer

## Resource Issues

### Out of memory

**Symptoms**: JVM crashes with OutOfMemoryError

**Solutions**:

1. Increase heap size:

   ```bash
   export JAVA_OPTS="-Xmx4g -Xms4g"
   ```

2. Check for memory leaks in metrics
3. Reduce message batch sizes
4. Enable GC logging for analysis

### Redis storage full

**Symptoms**: Cannot produce new messages

**Solutions**:

1. Check Redis memory usage:

   ```bash
   redis-cli info memory
   ```

2. Use Redis `XTRIM` to manually trim old messages
3. Reduce retention period for topics
4. Increase Redis memory limit

## Integration Issues

### Databricks Spark Structured Streaming Timeout

**Symptoms**: Databricks Spark Structured Streaming fails with timeout error:

```
org.apache.kafka.common.errors.TimeoutException: Timed out waiting for a node assignment. Call: describeTopics
```

**Root Cause**: Network connectivity issue between Databricks and Korvet, typically when Korvet is behind an AWS load balancer.

**Diagnosis**:

1. Test TCP connectivity from Databricks notebook:

   ```python
   import socket
   socket.create_connection(("<korvet-host>", 9092), timeout=10)
   ```

   If this times out, Databricks cannot reach Korvet.

2. Check if producers work from the same Databricks workspace:

   If producers work but Spark Structured Streaming doesn't, the issue is likely network-related.

3. Determine where working producers are running:

   - Same Databricks workspace?
   - EC2 instances in Korvet's VPC?
   - Different network?

**Solutions**:

**If Korvet is behind an AWS ELB/NLB:**

1. **Check ELB scheme** (internal vs internet-facing):

   ```bash
   aws elbv2 describe-load-balancers \
     --region <region> \
     --query 'LoadBalancers[?DNSName==`<elb-hostname>`].[Scheme,Type,VpcId]'
   ```

2. **If ELB is internet-facing**, update security group to allow Databricks:

   ```bash
   # Add inbound rule for port 9092 from Databricks IP ranges
   aws ec2 authorize-security-group-ingress \
     --group-id <elb-security-group-id> \
     --protocol tcp \
     --port 9092 \
     --cidr <databricks-ip-range>
   ```

   See [Databricks IP ranges](https://docs.databricks.com/resources/supported-regions.html) for your region.

3. **If ELB is internal**, set up VPC peering:

   ```bash
   # Create VPC peering between Databricks VPC and Korvet VPC
   aws ec2 create-vpc-peering-connection \
     --vpc-id <databricks-vpc-id> \
     --peer-vpc-id <korvet-vpc-id>
   ```

   Then update route tables and security groups to allow traffic.

4. **Configure Korvet's advertised address** to use the ELB hostname:

   ```bash
   export KORVET_BROKER_ADVERTISED_HOST=<elb-hostname>
   export KORVET_BROKER_ADVERTISED_PORT=9092
   ```

**Verification**:

After fixing network connectivity, test from Databricks:

```python
# Test connectivity
import socket
socket.create_connection(("<korvet-host>", 9092), timeout=10)

# Test Spark Structured Streaming
df = spark.readStream \
  .format("kafka") \
  .option("kafka.bootstrap.servers", "<korvet-host>:9092") \
  .option("subscribe", "<topic-name>") \
  .option("startingOffsets", "latest") \
  .load()

df.printSchema()  # Should not timeout
```

**Additional Notes**:

- Producers may work while consumers fail because producers don't need to call `describeTopics()` during initialization
- The error occurs when Spark's `KafkaAdminClient` tries to describe topics but cannot connect to the broker
- This is a network connectivity issue, not a Korvet bug or configuration issue

### Databricks Consumer Not Receiving Messages

**Symptoms**: Databricks Spark Structured Streaming consumer connects successfully but receives no messages, even with `startingOffsets = "earliest"`. Korvet logs show only metadata and ListOffsets requests, but no Fetch requests.

**Root Cause**: Databricks has saved checkpoint data from a previous run that contains committed offsets. The consumer resumes from these saved offsets instead of starting from "earliest".

**Diagnosis**:

1. Check Korvet logs for Fetch requests:

   ```bash
   # Look for FetchHandler log entries
   grep "Handling fetch" korvet.log
   ```

   If you only see `MetadataHandler` and `ListOffsetsHandler` entries but no `FetchHandler` entries, the consumer is not fetching.

2. Verify checkpoint location in Databricks:

   ```python
   # Check if checkpoint directory exists
   dbutils.fs.ls("/path/to/checkpoint/location")
   ```

**Solutions**:

**Option 1: Clear checkpoint data (recommended for testing)**

Delete the checkpoint directory to force the consumer to start fresh:

```python
# Remove checkpoint directory
dbutils.fs.rm("/path/to/checkpoint/location", recurse=True)

# Restart the streaming query
df = spark.readStream \
  .format("kafka") \
  .option("kafka.bootstrap.servers", "<korvet-host>:9092") \
  .option("subscribe", "<topic-name>") \
  .option("startingOffsets", "earliest") \
  .load()
```

**Option 2: Use a different checkpoint location**

Specify a new checkpoint location for the streaming query:

```python
query = df.writeStream \
  .format("console") \
  .option("checkpointLocation", "/new/checkpoint/location") \
  .start()
```

**Option 3: Reset offsets in Korvet (if using consumer groups)**

If using consumer groups, reset the committed offsets:

```bash
# Use kafka-consumer-groups tool to reset offsets
kafka-consumer-groups --bootstrap-server <korvet-host>:9092 \
  --group <consumer-group-id> \
  --topic <topic-name> \
  --reset-offsets --to-earliest \
  --execute
```

**Verification**:

After clearing checkpoints, verify messages are being consumed:

```python
# Start streaming query with console output
query = df.writeStream \
  .format("console") \
  .option("truncate", False) \
  .start()

# Check Korvet logs for Fetch requests
# You should now see:
# DEBUG c.r.korvet.broker.kafka.FetchHandler - Handling fetch: topics=1, partitions=...
```

**Additional Notes**:

- Databricks Structured Streaming automatically saves checkpoint data to ensure exactly-once processing
- The `startingOffsets` option only applies when there is no checkpoint data
- Once checkpoint data exists, the consumer always resumes from the saved offsets
- This is expected Spark Structured Streaming behavior, not a Korvet issue
- For production use, manage checkpoint locations carefully to avoid data loss

## Getting Help

If you can't resolve the issue:

1. Check logs with debug level enabled
2. Collect metrics from `/actuator/prometheus`
3. File an issue at https://github.com/redis-field-engineering/korvet-dist/issues

## Next Steps

- [Monitoring]({{< relref "/integrate/korvet/operations/monitoring" >}})
- [Logging]({{< relref "/integrate/korvet/operations/logging" >}})
- [FAQ]({{< relref "/integrate/korvet/reference/faq" >}})
