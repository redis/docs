---
Title: Deployment
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Deploy Korvet in production environments.
linkTitle: Deployment
weight: 10
---

This guide covers deploying Korvet in production environments.

## Deployment shapes

A Korvet JVM runs the **broker** (Kafka listener and group coordinator) and the
leader-locked **storage worker** by default. The storage worker rolls
eligible segments, offloads sealed segments, and enforces local and remote
retention.

Disable a component explicitly only when a deployment needs a single-role JVM.

| Shape | Configuration | Components started |
|---|---|---|
| All-in-one (default) | no component flags required | broker + storage worker |
| Broker-only pod | `KORVET_STORAGE_WORKER_ENABLED=false` | broker |
| Storage-worker pod | `KORVET_BROKER_ENABLED=false` | storage worker |
| Single-role pod | set one of `KORVET_BROKER_ENABLED` / `KORVET_STORAGE_WORKER_ENABLED` to `false` | the selected role |
| Custom | set `KORVET_BROKER_ENABLED` and/or `KORVET_STORAGE_WORKER_ENABLED` | the components whose flag is `true` |

`korvet.storage.remote.path` makes the cold tier available. Without it, Korvet
runs local-only on Redis Streams.

## Docker Deployment

### Single Instance

```bash
docker run -d \
  --name korvet \
  -p 9092:9092 \
  -e JAVA_OPTS="-Xms2g -Xmx2g -XX:MaxDirectMemorySize=512m" \
  -e KORVET_REDIS_URI=redis://redis.example.com:6379 \
  -e KORVET_REDIS_USERNAME=default \
  -e KORVET_REDIS_PASSWORD=${REDIS_PASSWORD} \
  redisfield/korvet:latest server
```

Use `JAVA_OPTS` to pass heap settings and additional JVM flags to the container at startup.

{{< warning >}}
Tune JVM memory through `JAVA_OPTS`, **not** `JAVA_TOOL_OPTIONS`. The broker bakes
`-XX:MaxDirectMemorySize=512m` into its default launch arguments, and those defaults are placed
**after** `JAVA_TOOL_OPTIONS` on the command line — so a `MaxDirectMemorySize` set via
`JAVA_TOOL_OPTIONS` is silently overridden. Only `JAVA_OPTS` (applied last) overrides the baked
default.

Direct buffer memory lives outside the heap, so size the container so that
`memory limit >= -Xmx + MaxDirectMemorySize + ~512m` native/metaspace/stack overhead. With
`-Xmx2g` and `MaxDirectMemorySize=512m`, use a container memory limit of at least `4Gi`. Increase
`MaxDirectMemorySize` for high fan-in workloads (many concurrent consumers, e.g. Spark/Flink) and
raise the container limit to match.
{{< /warning >}}

### Docker Compose

```yaml
services:
  redis:
    image: redis:8.6
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"

  korvet:
    image: redisfield/korvet:latest
    command: server
    ports:
      - "9092:9092"
    environment:
      JAVA_OPTS: "-Xms2g -Xmx2g -XX:MaxDirectMemorySize=512m"
      KORVET_REDIS_URI: redis://redis:6379
      KORVET_REDIS_PASSWORD: ${REDIS_PASSWORD}
    depends_on:
      - redis
```

## Kubernetes Deployment

For single-broker or simple deployments, use a standard Deployment. For multi-broker clusters with proper broker discovery, see [Multi-Broker Deployment](#multi-broker-deployment).

### Simple Deployment (Single Broker)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: korvet
spec:
  replicas: 1  # Single broker
  selector:
    matchLabels:
      app: korvet
  template:
    metadata:
      labels:
        app: korvet
    spec:
      containers:
      - name: korvet
        image: redisfield/korvet:latest
        args: ["server"]
        ports:
        - containerPort: 9092
        env:
        - name: KORVET_REDIS_URI
          value: redis://redis-service:6379
        - name: KORVET_BROKER_HOST
          value: 0.0.0.0
        - name: KORVET_BROKER_PORT
          value: "9092"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
```

### Service Manifest

```yaml
apiVersion: v1
kind: Service
metadata:
  name: korvet-service
spec:
  selector:
    app: korvet
  ports:
  - protocol: TCP
    port: 9092
    targetPort: 9092
  type: LoadBalancer
```

{{< note >}}
For multi-broker deployments with high availability, use a StatefulSet instead. See [Kubernetes StatefulSet](#kubernetes-statefulset).
{{< /note >}}

## Multi-Broker Deployment

Korvet supports multi-broker deployments where multiple Korvet instances share the same Redis backend. This provides high availability and load distribution while maintaining full data consistency.

### Architecture Overview

In a multi-broker deployment:

- All brokers connect to the same Redis instance or cluster
- Brokers automatically discover each other via the **Broker Registry** stored in Redis
- Kafka clients can connect to any broker and receive metadata about all brokers in the cluster
- Messages produced to one broker are immediately available from any other broker

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │   (TCP/9092)    │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Korvet 0    │   │   Korvet 1    │   │   Korvet 2    │
│  id=0         │   │  id=1         │   │  id=2         │
│  port=9092    │   │  port=9092    │   │  port=9092    │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │        Redis          │
                │  (Streams + Registry) │
                └───────────────────────┘
```

### Broker Configuration

Each broker requires a unique `id` and proper network configuration:

```yaml
korvet:
  namespace: korvet         # Must be the same across all brokers

  broker:
    id: 0                  # Unique ID for this broker (0, 1, 2, etc.)
    host: 0.0.0.0          # Listen on all interfaces
    port: 9092             # Kafka protocol port
    advertised-host: korvet-0.korvet.default.svc.cluster.local  # Hostname clients use
    advertised-port: 9092  # Port clients use

  redis:
    uri: redis://redis:6379  # Same Redis for all brokers
```

{{< warning >}}
All brokers in a cluster **must** use the same `korvet.namespace` and connect to the **same Redis** instance.
{{< /warning >}}

### Broker Discovery

Korvet uses a **Broker Registry** stored in Redis for automatic broker discovery:

- Each broker registers itself on startup with its ID, host, and port
- Brokers send periodic heartbeats (every 10 seconds by default)
- Entries are considered stale 30 seconds after their last heartbeat and are then ignored
- Kafka clients receive all live registered brokers in metadata responses

Redis keys used by the registry:

```
korvet:broker:nodes   # Single hash: field = broker id, value = host/port/rack + heartbeat timestamp
```

{{< note >}}
There is no Redis TTL on the key. Staleness is determined client-side by comparing each
entry's heartbeat timestamp against the 30-second threshold.
{{< /note >}}

### Docker Compose Example

```yaml
services:
  redis:
    image: redis:8.6
    ports:
      - "6379:6379"

  korvet-0:
    image: redisfield/korvet:latest
    command: server
    ports:
      - "9092:9092"
    environment:
      KORVET_BROKER_ID: 0
      KORVET_BROKER_HOST: 0.0.0.0
      KORVET_BROKER_ADVERTISED_HOST: localhost
      KORVET_BROKER_ADVERTISED_PORT: 9092
      KORVET_REDIS_URI: redis://redis:6379

  korvet-1:
    image: redisfield/korvet:latest
    command: server
    ports:
      - "9093:9092"
    environment:
      KORVET_BROKER_ID: 1
      KORVET_BROKER_HOST: 0.0.0.0
      KORVET_BROKER_ADVERTISED_HOST: localhost
      KORVET_BROKER_ADVERTISED_PORT: 9093
      KORVET_REDIS_URI: redis://redis:6379

  korvet-2:
    image: redisfield/korvet:latest
    command: server
    ports:
      - "9094:9092"
    environment:
      KORVET_BROKER_ID: 2
      KORVET_BROKER_HOST: 0.0.0.0
      KORVET_BROKER_ADVERTISED_HOST: localhost
      KORVET_BROKER_ADVERTISED_PORT: 9094
      KORVET_REDIS_URI: redis://redis:6379
```

Clients can connect using multiple bootstrap servers:

```bash
kafka-console-producer --bootstrap-server localhost:9092,localhost:9093,localhost:9094 --topic test
```

### Kubernetes StatefulSet

For Kubernetes, use a StatefulSet to ensure each broker gets a unique, stable identity. The StatefulSet provides:

- **Stable network identity**: Each pod gets a predictable DNS name (`korvet-0`, `korvet-1`, etc.)
- **Ordered deployment**: Pods are created sequentially, ensuring broker registration order
- **Stable storage**: PersistentVolumeClaims are retained across pod restarts (if needed)

#### Complete Kubernetes Manifests

```yaml
# ConfigMap for shared configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: korvet-common
data:
  KORVET_BROKER_HOST: "0.0.0.0"
  KORVET_BROKER_PORT: "9092"
  KORVET_NAMESPACE: "korvet"
  KORVET_BROKER_REBALANCE_DELAY: "5s"  # Allow time for consumers to join in K8s
---
# Headless service for StatefulSet DNS
apiVersion: v1
kind: Service
metadata:
  name: korvet
  labels:
    app: korvet
spec:
  clusterIP: None
  selector:
    app: korvet
  ports:
  - port: 9092
    name: kafka
  - port: 8080
    name: actuator
---
# LoadBalancer service for external access
apiVersion: v1
kind: Service
metadata:
  name: korvet-lb
spec:
  type: LoadBalancer
  selector:
    app: korvet
  ports:
  - port: 9092
    targetPort: 9092
    name: kafka
---
# StatefulSet
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: korvet
spec:
  serviceName: korvet
  replicas: 3
  podManagementPolicy: Parallel  # Start all pods simultaneously
  selector:
    matchLabels:
      app: korvet
  template:
    metadata:
      labels:
        app: korvet
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/actuator/prometheus"
    spec:
      terminationGracePeriodSeconds: 30
      initContainers:
      # Extract broker ID from pod name (korvet-0 -> 0, korvet-1 -> 1, etc.)
      - name: init-broker-id
        image: busybox:1.36
        command:
        - sh
        - -c
        - |
          ORDINAL=${HOSTNAME##*-}
          echo "KORVET_BROKER_ID=${ORDINAL}" > /config/broker.env
          echo "KORVET_BROKER_ADVERTISED_HOST=${HOSTNAME}.korvet.${NAMESPACE}.svc.cluster.local" >> /config/broker.env
          echo "Broker ID: ${ORDINAL}, Advertised Host: ${HOSTNAME}.korvet.${NAMESPACE}.svc.cluster.local"
        env:
        - name: NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        volumeMounts:
        - name: config-volume
          mountPath: /config
      containers:
      - name: korvet
        image: redisfield/korvet:latest
        command:
        - sh
        - -c
        - |
          # Source the broker-specific config
          export $(cat /config/broker.env | xargs)
          # Start the application
          exec java --sun-misc-unsafe-memory-access=allow -jar /app/korvet.jar
        ports:
        - containerPort: 9092
          name: kafka
        - containerPort: 8080
          name: actuator
        envFrom:
        - configMapRef:
            name: korvet-common
        - secretRef:
            name: korvet-redis-credentials
            optional: true
        env:
        - name: KORVET_REDIS_URI
          value: redis://redis:6379
        - name: KORVET_BROKER_ADVERTISED_PORT
          value: "9092"
        # JVM tuning for containers. This manifest launches `java -jar` directly (no distribution
        # start script), so there are no baked applicationDefaultJvmArgs to override and JAVA_OPTS
        # would not be expanded by the command above — JAVA_TOOL_OPTIONS is auto-applied by the JVM
        # and is the right place here. Keep -Xmx + MaxDirectMemorySize below the container limit.
        - name: JAVA_TOOL_OPTIONS
          value: "-Xms2g -Xmx2g -XX:+UseG1GC -XX:MaxDirectMemorySize=512m --sun-misc-unsafe-memory-access=allow"
        resources:
          requests:
            memory: "2Gi"
            cpu: "500m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        volumeMounts:
        - name: config-volume
          mountPath: /config
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          failureThreshold: 30
      volumes:
      - name: config-volume
        emptyDir: {}
```

#### Redis Credentials Secret

If Redis requires authentication, create a secret:

```bash
kubectl create secret generic korvet-redis-credentials \
  --from-literal=KORVET_REDIS_PASSWORD=your-password
```

#### Scaling the Cluster

Scale up or down with:

```bash
# Scale to 5 brokers
kubectl scale statefulset korvet --replicas=5

# Scale down to 3 brokers
kubectl scale statefulset korvet --replicas=3
```

When scaling down, brokers are removed in reverse order (highest ID first). The broker registry stops advertising an entry once its last heartbeat is older than 30 seconds.

#### Pod Disruption Budget

For high availability, configure a PodDisruptionBudget:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: korvet-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: korvet
```

#### External Access

For clients outside the Kubernetes cluster, you have several options:

**Option 1: LoadBalancer Service** (shown above)

Clients connect to the LoadBalancer IP. All traffic is distributed across brokers.

**Option 2: NodePort Service**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: korvet-nodeport
spec:
  type: NodePort
  selector:
    app: korvet
  ports:
  - port: 9092
    targetPort: 9092
    nodePort: 30092
```

**Option 3: Ingress with TCP support** (e.g., NGINX Ingress Controller)

Configure TCP services in the ingress controller's ConfigMap.

#### Monitoring in Kubernetes

Korvet exposes Prometheus metrics at `/actuator/prometheus`. With the annotations in the StatefulSet, Prometheus will automatically scrape metrics.

For Grafana dashboards, query metrics like:

- `korvet_broker_produce_seconds_count` - Total produce requests
- `korvet_broker_fetch_seconds_count` - Total fetch requests
- `korvet_broker_request_seconds_count` - Kafka API request rate, by `api_key` and `result`
- `korvet_broker_backpressure_connections` - Connections currently under backpressure

### Consumer Group Coordination

In multi-broker deployments, consumer group coordination is handled specially:

- The **group coordinator** is selected using consistent hashing based on the group ID
- Clients are directed to the correct coordinator via the `FindCoordinator` response
- All consumer group state is stored in Redis, so any broker can serve offset commits/fetches

### Best Practices

- **Broker IDs**: Use sequential IDs starting from 0 (0, 1, 2, ...). Each broker must have a unique ID.
- **Advertised Listeners**: Always configure `advertised-host` and `advertised-port` to the address clients should use to connect. This is especially important in Docker/Kubernetes where internal and external addresses differ.
- **Load Balancing**: Use a TCP load balancer (not HTTP) in front of your brokers. Any load balancing strategy works since all brokers serve the same data.
- **Bootstrap Servers**: Configure Kafka clients with multiple bootstrap servers for fault tolerance:

  ```properties
  bootstrap.servers=korvet-0:9092,korvet-1:9092,korvet-2:9092
  ```

- **Redis High Availability**: For production, use a highly available Redis deployment, such as Redis Enterprise, to ensure the storage layer is also highly available.

## High Availability

For production deployments:

- **Multiple instances**: Run 3+ Korvet instances for redundancy
- **Redis HA**: Use a highly available Redis deployment, such as Redis Enterprise, for HA
- **Health checks**: Configure liveness and readiness probes
- **Graceful shutdown**: Allow time for in-flight requests to complete

## Scaling

Korvet can be scaled horizontally:

- **Stateless**: Each instance shares state via Redis
- **Load balancing**: Use any TCP load balancer
- **Add brokers**: Simply start new instances with unique broker IDs

## Next Steps

- [Monitoring]({{< relref "/integrate/korvet/operations/monitoring" >}})
- [Logging]({{< relref "/integrate/korvet/operations/logging" >}})
- [Configuration]({{< relref "/integrate/korvet/quick-start/configuration" >}})
