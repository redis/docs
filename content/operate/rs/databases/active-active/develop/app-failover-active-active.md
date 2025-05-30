---
Title: Application failover with Active-Active databases
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Learn how to implement application failover and failback with Active-Active databases to maintain high availability.
linkTitle: App failover
weight: 99
---

Active-Active databases provide high availability by maintaining synchronized replicas across multiple geographic locations. However, when a local replica becomes unavailable, your application needs a strategy to failover to a remote replica and failback when the local replica recovers.

This guide explains how to implement robust failover and failback mechanisms for applications using Active-Active Redis databases.

## Overview

Active-Active databases don't include built-in application failover mechanisms. Instead, your application must:

1. Monitor local and remote replicas for availability.
2. Detect failures quickly and accurately.
3. Failover to a healthy remote replica when needed.
4. Failback to the local replica when it recovers.

{{< warning >}}
**Data consistency considerations**: Active-Active replication is asynchronous. Applications that failover to another replica may miss recent write operations, which can impact data consistency. If the failed replica saved the write operations in persistent storage, then the write operations are processed when the failed replica recovers.
{{< /warning >}}

## Prerequisites

Before implementing failover logic, ensure you understand:

- [Active-Active database concepts]({{< relref "/operate/rs/databases/active-active" >}})
- Your application's data consistency requirements
- [Network topology]({{<relref "/operate/rs/databases/active-active/planning#networking">}}) between replicas
- Redis [pub/sub mechanism]({{< relref "/develop/interact/pubsub" >}})

## Failure detection strategies

Your application should monitor local replica failures and replication failures.

### Local replica failures

**What it is**: The local replica is completely unavailable to your application.

**Common causes**:
- Multiple node failures
- Network connectivity issues
- Configuration errors
- Database endpoint unavailable
- Unexpected protocol level errors

**Detection method**: Monitor connection attempts to the database endpoint. If connections consistently fail, consider the local replica failed.

### Replication failures

**What it is**: The local replica is available but can't communicate with remote replicas.

**Common causes**:
- Network partitions between data centers
- Replication configuration issues
- Remote replica failures
- Firewall or security group changes

**Detection method**: Use Redis pub/sub to monitor replication health across all replicas.

## Set up pub/sub health monitoring

The most reliable way to detect replication failures is using Redis pub/sub.

### How it works

1. Subscribe to a dedicated health-check channel on each replica.
2. Publish periodic heartbeat messages with unique identifiers.
3. Monitor that your own messages are received within a time window.
4. Detect failure when messages aren't received from specific replicas.

### Implementation steps

1. Connect to all replicas:
   ```python
   # Example implementation - adapt for your environment
   replicas = {
       'local': redis.Redis(host='local-replica.example.com'),
       'remote1': redis.Redis(host='remote1-replica.example.com'),
       'remote2': redis.Redis(host='remote2-replica.example.com')
   }
   ```

2. Subscribe to health channels:
   ```python
   # Example implementation - adapt for your environment
   for name, client in replicas.items():
       client.subscribe(f'health-check-{name}')
   ```

3. Publish heartbeat messages:
   ```python
   # Example implementation - adapt for your environment
   import time
   import uuid

   def send_heartbeat():
       message = {
           'timestamp': time.time(),
           'id': str(uuid.uuid4()),
           'sender': 'app-instance-1'
       }

       for name, client in replicas.items():
           client.publish(f'health-check-{name}', json.dumps(message))
   ```

4. Monitor message delivery:
   ```python
   # Example implementation - adapt for your environment
   def check_replication_health():
       # Check if messages sent in last 30 seconds were received
       cutoff_time = time.time() - 30

       for replica_name in replicas:
           if not received_own_message_since(replica_name, cutoff_time):
               mark_replica_unhealthy(replica_name)
   ```

{{< tip >}}
**Why pub/sub works**: Pub/sub messages are delivered as replicated effects, making them a reliable indicator of active replication links. Unlike dataset changes, pub/sub doesn't make assumptions about your data structure.
{{< /tip >}}

## Handle sharded databases

If your Active-Active database uses sharding, you need to monitor each shard individually:

### Symmetric sharding (recommended)

With symmetric sharding, all replicas have the same number of shards and hash slots.

**Monitoring approach**:
1. Use the Cluster API to get the sharding configuration
2. Create one pub/sub channel per shard
3. Ensure each channel name maps to a different shard

```python
# Example implementation - adapt for your environment
def get_channels_per_shard(redis_client):
    """Generate channel names that map to different shards"""
    cluster_info = redis_client.cluster_nodes()
    channels = []

    for shard_id in range(len(cluster_info)):
        # Generate a channel name that hashes to this shard
        channel = f"health-shard-{shard_id}"
        channels.append(channel)

    return channels
```

### Asymmetric sharding (not recommended)

Asymmetric configurations require monitoring every hash slot intersection, which is complex and error-prone.

## Implement failover

When you detect a local replica failure:

1. Stop writing to the failed replica and immediately redirect all database operations to a healthy remote replica.

```python
# Example implementation - adapt for your environment
def failover_to_replica(target_replica_name):
    """Switch application connections to target replica"""
    global active_redis_client

    # Update active connection
    active_redis_client = replicas[target_replica_name]

    # Log the failover event
    logger.warning(f"Failed over to replica: {target_replica_name}")

    # Update application configuration
    update_app_config('active_replica', target_replica_name)
```

2. Handle data consistency

**Important considerations**:
- The remote replica may not have your most recent writes
- Recent writes might be lost permanently or temporarily unavailable
- Avoid reading data you just wrote before the failover

**Best practices**:
- Design your application to handle eventual consistency
- Use timestamps or version numbers to detect stale data
- Implement retry logic for critical operations

3. Continue monitoring all replicas, including the failed one, to detect when it recovers.

## Implement failback

Monitor the failed replica to determine when it's safe to failback.

### Failback criteria

A replica is ready for failback when it's:
1. **Available**: Accepting connections and responding to commands.
2. **Synchronized**: Caught up with changes from other replicas.
3. **Not stale**: You can read and write to the replica.

### Failback process

1. Verify replica health:
   ```python
   # Example implementation - adapt for your environment
   def is_replica_ready_for_failback(replica_name):
       client = replicas[replica_name]

       try:
           # Test basic connectivity
           client.ping()

           # Test pub/sub replication
           if not test_pubsub_replication(client):
               return False

           # Verify not in stale mode
           if is_replica_stale(client):
               return False

           return True
       except Exception:
           return False
   ```

2. Gradual failback:
   ```python
   # Example implementation - adapt for your environment
   def gradual_failback(primary_replica):
       # Start with read operations
       redirect_reads_to(primary_replica)

       # Monitor for issues
       time.sleep(30)

       # If stable, redirect writes
       if is_replica_stable(primary_replica):
           redirect_writes_to(primary_replica)
   ```

{{< warning >}}
**Avoid dataset-based monitoring**: Don't rely solely on reading/writing test keys to determine replica health. Replicas can appear healthy while still in stale mode or missing recent updates.
{{< /warning >}}

## Configuration best practices

### Application-side failover only

- **Do**: Implement all failover logic in your application
- **Don't**: Modify Active-Active database configuration during failover

### When to remove a replica

Only remove a replica from the Active-Active configuration when:
- Memory consumption becomes critically high
- Garbage collection cannot keep up with the replication backlog
- The replica cannot be recovered

{{< warning >}}
**Data loss risk**: Removing a replica from the configuration permanently loses any unconverged writes. The replica must rejoin as a new member, losing its data.
{{< /warning >}}

## Example implementation

Here's a simplified example of a failover-capable Redis client:

{{< note >}}
**Example code**: The following is an illustrative example to demonstrate concepts. Adapt this code for your specific environment, error handling requirements, and production needs.
{{< /note >}}

```python
import redis
import json
import time
import threading
from typing import Dict, Optional

class FailoverRedisClient:
    def __init__(self, replica_configs: Dict[str, dict]):
        self.replicas = {}
        self.active_replica = None
        self.replica_health = {}

        # Initialize connections
        for name, config in replica_configs.items():
            self.replicas[name] = redis.Redis(**config)
            self.replica_health[name] = True

        # Set initial active replica (prefer 'local')
        self.active_replica = 'local' if 'local' in self.replicas else list(self.replicas.keys())[0]

        # Start health monitoring
        self.start_health_monitoring()

    def execute_command(self, command: str, *args, **kwargs):
        """Execute Redis command with automatic failover"""
        max_retries = len(self.replicas)

        for attempt in range(max_retries):
            try:
                client = self.replicas[self.active_replica]
                return getattr(client, command)(*args, **kwargs)
            except Exception as e:
                self.handle_connection_error(e)
                if attempt < max_retries - 1:
                    self.failover_to_next_healthy_replica()
                else:
                    raise

    def failover_to_next_healthy_replica(self):
        """Switch to the next healthy replica"""
        for name, is_healthy in self.replica_health.items():
            if name != self.active_replica and is_healthy:
                self.active_replica = name
                print(f"Failed over to replica: {name}")
                return

        raise Exception("No healthy replicas available")

    def start_health_monitoring(self):
        """Start background health monitoring"""
        def monitor():
            while True:
                self.check_replica_health()
                time.sleep(10)

        thread = threading.Thread(target=monitor, daemon=True)
        thread.start()

    def check_replica_health(self):
        """Check health of all replicas using pub/sub"""
        # Implementation details for pub/sub health checking
        # (See previous examples for complete implementation)
        pass
```

## Next steps

- [Configure Active-Active databases]({{< relref "/operate/rs/databases/active-active/create" >}})
- [Monitor Active-Active replication]({{< relref "/operate/rs/databases/active-active/monitor" >}})
- [Develop applications with Active-Active databases]({{< relref "/operate/rs/databases/active-active/develop" >}})

## Troubleshooting common issues

### False positive failure detection

**Problem**: Application detects failures when replicas are actually healthy.

**Solutions**:
- Increase heartbeat timeout windows
- Use multiple consecutive failures before triggering failover
- Monitor network latency between replicas

### Split-brain scenarios

**Problem**: Network partition causes multiple replicas to appear as "primary" to different application instances.

**Solutions**:
- Implement consensus mechanisms in your application
- Use external coordination services (like Consul or etcd)
- Design for eventual consistency

### Slow failback

**Problem**: Replica appears healthy but failback causes performance issues.

**Solutions**:
- Implement gradual failback (reads first, then writes)
- Monitor replica performance metrics during failback
- Use canary deployments for failback testing

## Related topics

- [Redis pub/sub]({{< relref "/develop/interact/pubsub" >}})
- [OSS Cluster API]({{< relref "/operate/rs/clusters/optimize/oss-cluster-api/" >}})
