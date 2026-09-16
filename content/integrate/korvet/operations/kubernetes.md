---
Title: Kubernetes Deployment
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Step-by-step instructions for deploying Korvet on Kubernetes.
linkTitle: Kubernetes
weight: 30
---

This guide provides step-by-step instructions for deploying Korvet on Kubernetes.

## Prerequisites

- Kubernetes cluster (1.24+)
- `kubectl` configured to access your cluster
- Redis instance accessible from the cluster (Redis Enterprise or standalone Redis)
- Helm 3.x (optional, for Helm-based deployment)

## Quick Start

### 1. Create Namespace

```bash
kubectl create namespace korvet
```

### 2. Create Secret for Redis Credentials

```bash
kubectl create secret generic korvet-redis-credentials \
  --namespace korvet \
  --from-literal=password=your-redis-password
```

### 3. Apply Kubernetes Manifests

Save the manifests below to a file and apply them:

```bash
kubectl apply -f korvet.yaml
```

## Kubernetes Manifests

### ConfigMap

Store non-sensitive configuration in a ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: korvet-common
  namespace: korvet
data:
  KORVET_BROKER_HOST: "0.0.0.0"
  KORVET_BROKER_PORT: "9092"
  KORVET_BROKER_ID: "0"
  KORVET_NAMESPACE: "korvet"
  # Pattern-based topic defaults (index 0 acts as catch-all)
  KORVET_TOPICS_0_NAME: "*"
  KORVET_TOPICS_0_AUTO_CREATE: "true"
  KORVET_TOPICS_0_PARTITIONS: "3"
  KORVET_REDIS_URI: "redis://redis-service:6379"
  # Advertised host/port - the address clients use to connect back to Korvet
  # Set this to the external service hostname or load balancer address
  KORVET_BROKER_ADVERTISED_HOST: "korvet.example.com"
  KORVET_BROKER_ADVERTISED_PORT: "9092"
```

{{< warning >}}
The `KORVET_BROKER_ADVERTISED_HOST` and `KORVET_BROKER_ADVERTISED_PORT` settings are critical for Kafka clients. These values are returned in Metadata responses and tell clients where to connect. Set these to the external hostname/IP that clients will use to reach Korvet (e.g., your LoadBalancer address or Ingress hostname).
{{< /warning >}}

### Secret

Store sensitive configuration in a Secret:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: korvet-redis-credentials
  namespace: korvet
type: Opaque
stringData:
  password: "your-redis-password"
  # For remote storage with static S3 credentials (optional):
  # aws-access-key-id: "AKIAIOSFODNN7EXAMPLE"
  # aws-secret-access-key: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
```

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: korvet
  namespace: korvet
  labels:
    app: korvet
spec:
  replicas: 1
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
      containers:
      - name: korvet
        image: redisfield/korvet:latest
        args: ["server"]
        ports:
        - name: kafka
          containerPort: 9092
          protocol: TCP
        - name: management
          containerPort: 8080
          protocol: TCP
        envFrom:
        - configMapRef:
            name: korvet-common
        env:
        - name: KORVET_REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: korvet-redis-credentials
              key: password
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
            port: management
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: management
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /actuator/health/liveness
            port: management
          initialDelaySeconds: 10
          periodSeconds: 5
          failureThreshold: 30
      terminationGracePeriodSeconds: 30
```

{{< warning >}}
This Quick Start runs a **single broker** (`replicas: 1`). Every broker in a cluster needs a unique `KORVET_BROKER_ID`, which a plain Deployment cannot provide because all pods share the same ConfigMap. To run multiple brokers, use a StatefulSet that derives a per-pod ID from the pod ordinal. See [Kubernetes StatefulSet]({{< relref "/integrate/korvet/operations/deployment#kubernetes-statefulset" >}}) in the deployment guide.
{{< /warning >}}

### Service

Expose Korvet within the cluster:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: korvet
  namespace: korvet
  labels:
    app: korvet
spec:
  selector:
    app: korvet
  ports:
  - name: kafka
    port: 9092
    targetPort: kafka
    protocol: TCP
  - name: management
    port: 8080
    targetPort: management
    protocol: TCP
  type: ClusterIP
```

For external access, use a LoadBalancer or Ingress (see [External Access](#external-access)).

## External Access

### LoadBalancer Service

For cloud environments with LoadBalancer support:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: korvet-external
  namespace: korvet
spec:
  selector:
    app: korvet
  ports:
  - name: kafka
    port: 9092
    targetPort: kafka
  type: LoadBalancer
```

### NodePort Service

For on-premises or development environments:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: korvet-nodeport
  namespace: korvet
spec:
  selector:
    app: korvet
  ports:
  - name: kafka
    port: 9092
    targetPort: kafka
    nodePort: 30092
  type: NodePort
```

## Horizontal Pod Autoscaler

{{< warning >}}
Do not autoscale the single-broker Deployment above. Each broker needs a unique `KORVET_BROKER_ID`, so horizontal scaling only works on the StatefulSet-based multi-broker setup. Run the StatefulSet from [the deployment guide]({{< relref "/integrate/korvet/operations/deployment#kubernetes-statefulset" >}}) first, then target it with the HPA below.
{{< /warning >}}

Scale the StatefulSet based on CPU utilization:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: korvet-hpa
  namespace: korvet
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: StatefulSet
    name: korvet
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Pod Disruption Budget

Ensure high availability during cluster maintenance:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: korvet-pdb
  namespace: korvet
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: korvet
```

## TLS Configuration

### Create TLS Secret

```bash
kubectl create secret tls korvet-tls \
  --namespace korvet \
  --cert=server.crt \
  --key=server.key
```

### Mount TLS in Deployment

Add the following to the Deployment spec:

```yaml
spec:
  containers:
  - name: korvet
    env:
    - name: KORVET_BROKER_TLS
      value: "true"
    - name: KORVET_BROKER_CERT_FILE
      value: "/etc/korvet/tls/tls.crt"
    - name: KORVET_BROKER_KEY_FILE
      value: "/etc/korvet/tls/tls.key"
    volumeMounts:
    - name: tls-certs
      mountPath: /etc/korvet/tls
      readOnly: true
  volumes:
  - name: tls-certs
    secret:
      secretName: korvet-tls
```

## Remote Storage with S3

For tiered storage to an Apache Iceberg table on S3.

### Using IAM Roles for Service Accounts (IRSA)

On EKS, use IRSA for secure S3 access:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: korvet
  namespace: korvet
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/KorvetS3Role
```

Add to Deployment:

```yaml
spec:
  serviceAccountName: korvet
  containers:
  - name: korvet
    env:
    - name: KORVET_STORAGE_REMOTE_PATH
      value: "s3://my-bucket/korvet"
    - name: KORVET_STORAGE_REMOTE_S3_REGION
      value: "us-east-1"
```

### Using Static Credentials

```yaml
env:
- name: KORVET_STORAGE_REMOTE_PATH
  value: "s3://my-bucket/korvet"
- name: KORVET_STORAGE_REMOTE_S3_REGION
  value: "us-east-1"
- name: KORVET_STORAGE_REMOTE_S3_ACCESS_KEY_ID
  valueFrom:
    secretKeyRef:
      name: korvet-redis-credentials
      key: aws-access-key-id
- name: KORVET_STORAGE_REMOTE_S3_SECRET_ACCESS_KEY
  valueFrom:
    secretKeyRef:
      name: korvet-redis-credentials
      key: aws-secret-access-key
```

## Monitoring with Prometheus

Korvet exposes Prometheus metrics at `/actuator/prometheus`.

### ServiceMonitor (for Prometheus Operator)

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: korvet
  namespace: korvet
spec:
  selector:
    matchLabels:
      app: korvet
  endpoints:
  - port: management
    path: /actuator/prometheus
    interval: 15s
```

## Verification

### Check Deployment Status

```bash
kubectl get pods -n korvet
kubectl get svc -n korvet
```

### Test Connectivity

```bash
# Port-forward for local testing
kubectl port-forward -n korvet svc/korvet 9092:9092

# Test with kafka-console-producer
kafka-console-producer.sh --bootstrap-server localhost:9092 --topic test
```

### Check Logs

```bash
kubectl logs -n korvet -l app=korvet --tail=100
```

## Next Steps

- [Monitoring]({{< relref "/integrate/korvet/operations/monitoring" >}})
- [Logging]({{< relref "/integrate/korvet/operations/logging" >}})
- [Configuration Reference]({{< relref "/integrate/korvet/quick-start/configuration" >}})
