---
Title: Database connectivity
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Connect applications to Redis Enterprise databases in Kubernetes clusters with in-cluster and external access patterns.
linkTitle: Database connectivity
weight: 1
---

Connecting applications to Redis Enterprise databases in Kubernetes involves understanding service discovery, credentials management, and access patterns. This guide covers the essential connectivity aspects unique to Kubernetes deployments.

## Service types and access patterns

When you create a RedisEnterpriseDatabase (REDB), the Redis Enterprise operator automatically creates Kubernetes services to route traffic to your database. Understanding these service types is crucial for proper connectivity.

### Default service creation

By default, the operator creates two services for each database:

- ClusterIP service - Provides a stable cluster-internal IP address.
- Headless service - Enables direct pod-to-pod communication and service discovery.

Both services are created in the same namespace as your database and follow predictable naming conventions.

### Service types

Redis Enterprise supports three service types for database access:

| Service Type | Access Scope | Use Case |
|--------------|--------------|----------|
| `ClusterIP` | Cluster-internal only | Applications running within the same Kubernetes cluster |
| `headless` | Cluster-internal only | Direct pod access, service discovery, StatefulSet scenarios |
| `LoadBalancer` | External access | Applications outside the Kubernetes cluster |

To configure the service type, use the `databaseServiceType` field in your REC's `servicesRiggerSpec`.

## In-cluster database access

For applications running within your Kubernetes cluster, use the automatically created services to connect to your databases.

### Retrieve connection information

Database connection details are stored in a Kubernetes secret maintained by the database controller. This secret contains:

- Database port (`port`)
- Service names (`service_names`) 
- Database password (`password`)

1. Get the secret name from your database resource:

   ```sh
   kubectl get redb <database-name> -o jsonpath="{.spec.databaseSecretName}"
   ```

   The secret name typically follows the pattern `redb-<database-name>`.

2. Retrieve the database port:

   ```sh
   kubectl get secret redb-<database-name> -o jsonpath="{.data.port}" | base64 --decode
   ```

3. Get available service names:

   ```sh
   kubectl get secret redb-<database-name> -o jsonpath="{.data.service_names}" | base64 --decode
   ```

4. Retrieve the database password:

   ```sh
   kubectl get secret redb-<database-name> -o jsonpath="{.data.password}" | base64 --decode
   ```

### Service naming and DNS resolution

Services follow standard Kubernetes DNS naming conventions:

- Service FQDN: `<service-name>.<namespace>.svc.cluster.local`
- Short name: `<service-name>` (within the same namespace)

For a database named `mydb` in namespace `production`, the service names would be:
- ClusterIP service: `mydb.production.svc.cluster.local`
- Headless service: `mydb-headless.production.svc.cluster.local`

### Connect from within the cluster

Use any service name from the `service_names` list to connect:

```sh
redis-cli -h <service-name> -p <port>
```

Then authenticate with the retrieved password:

```sh
auth <password>
```

## External database access

To access databases from outside the Kubernetes cluster, you need to configure external routing. Currently supported methods for external access are ingress controllers or OpenShift routes.

### Ingress controllers

Redis Enterprise for Kubernetes only supports the following ingress controllers for external database access:

- NGINX Ingress - Supports SSL passthrough for Redis connections
- HAProxy Ingress - Built-in SSL passthrough support  
- Istio Gateway - Service mesh integration with advanced traffic management

See [Ingress routing]({{< relref "/operate/kubernetes/networking/ingress" >}}) for detailed configuration steps.

### OpenShift routes

OpenShift users can leverage routes for external access:

```yaml
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: redis-route
spec:
  to:
    kind: Service
    name: <database-service-name>
  port:
    targetPort: redis
  tls:
    termination: passthrough
```

See [OpenShift routes]({{< relref "/operate/kubernetes/networking/routes" >}}) for complete setup instructions.

## Service ports and configuration

### Default port behavior

- Redis Enterprise databases use dynamic port allocation.
- Port numbers are assigned automatically during database creation.
- The actual port is stored in the database secret.

### Custom port configuration

You can specify custom ports using the `databasePort` field in your REDB specification:

```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseDatabase
metadata:
  name: mydb
spec:
  memorySize: 256MB
  databasePort: 6379
```

Custom ports replace the default service port and are reflected in the database secret.

## Credentials and secrets management

### Database secrets structure

Each database has an associated Kubernetes secret containing connection details:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: redb-<database-name>
type: Opaque
data:
  port: <base64-encoded-port>
  service_names: <base64-encoded-service-list>
  password: <base64-encoded-password>
```

### Using secrets in applications

Reference database secrets in your application deployments:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
      - name: app
        image: my-app:latest
        env:
        - name: REDIS_HOST
          value: "<service-name>"
        - name: REDIS_PORT
          valueFrom:
            secretKeyRef:
              name: redb-<database-name>
              key: port
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redb-<database-name>
              key: password
```

### Default user configuration

By default, databases create a default user with full access. You can disable this behavior:

```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseDatabase
metadata:
  name: mydb
spec:
  memorySize: 256MB
  defaultUser: false
```

When `defaultUser` is disabled, the database secret is not created, and you must configure custom authentication.

## Connection examples

### Python application

```python
import redis
import base64
import os

# Read from Kubernetes secret (mounted as environment variables)
host = os.getenv('REDIS_HOST')
port = int(os.getenv('REDIS_PORT'))
password = os.getenv('REDIS_PASSWORD')

# Create Redis connection
r = redis.Redis(host=host, port=port, password=password, decode_responses=True)

# Test connection
r.ping()
```

### Node.js application

```javascript
const redis = require('redis');

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

client.on('connect', () => {
  console.log('Connected to Redis');
});
```

## Troubleshooting connectivity

### Common issues

1. Connection refused - Verify service names and ports from the database secret.
2. Authentication failed - Check password encoding and special characters.
3. DNS resolution - Ensure applications use correct service FQDNs.
4. Network policies - Verify Kubernetes network policies allow traffic.

### Debugging steps

1. Verify service creation:
   ```sh
   kubectl get services -l app=redis-enterprise
   ```

2. Check service endpoints:
   ```sh
   kubectl get endpoints <service-name>
   ```

3. Test connectivity from within cluster:
   ```sh
   kubectl run redis-test --image=redis:latest -it --rm -- redis-cli -h <service-name> -p <port>
   ```

## Related topics

- [Ingress routing]({{< relref "/operate/kubernetes/networking/ingress" >}}) - Configure external access with ingress controllers
- [OpenShift routes]({{< relref "/operate/kubernetes/networking/routes" >}}) - External access using OpenShift routes  
- [Database controller]({{< relref "/operate/kubernetes/re-databases/db-controller" >}}) - Database lifecycle management
- [Security]({{< relref "/operate/kubernetes/security" >}}) - TLS configuration and access control
