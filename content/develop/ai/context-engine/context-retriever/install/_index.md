---
Title: Install Context Retriever
alwaysopen: false
categories:
- docs
- develop
- ai
description: Install and run Redis Context Retriever on a self-managed Kubernetes cluster using Helm.
linkTitle: Install Context Retriever
weight: 40
hideListLinks: true
bannerText: Redis Context Retriever self-managed is currently in private preview and subject to change. A license key is required to deploy — contact your Redis representative or [contact sales](https://redis.io/contact/).
bannerChildren: true
---

Context Retriever is distributed as container images on Docker Hub plus a Helm chart shipped in the Redis Enterprise Helm repository. Installation pulls the images from Docker Hub (or your own mirror) and deploys the chart against a Redis database you provide.

{{< note >}}
This guide is for system administrators deploying Context Retriever on a self-managed Kubernetes cluster.
{{< /note >}}

## What you need

| Item | Where it comes from |
| ---- | ------------------- |
| Container images | Docker Hub: `redislabs/context-retriever` (MCP) and `redislabs/context-retriever-admin` (Admin) |
| Helm chart | `redis-context-retriever` chart in the Redis Enterprise Helm repository (`ai/charts/redis-context-retriever`) |
| Redis database | **You provide it** — see prerequisites below |
| License key | Contact your Redis representative or [contact sales](https://redis.io/contact/). The key starts with `CS-LICENSE.` |

## Prerequisites

### Required software

| Software | Minimum version | Purpose |
| -------- | --------------- | ------- |
| Kubernetes | 1.28+ | Orchestration |
| kubectl | 1.28+ | Kubernetes CLI |
| Helm | 3.x | Package manager |

### Redis database (bring your own)

Context Retriever connects to a Redis database that you provide; it does not ship one. The database must have the Search and JSON capabilities enabled (RediSearch and RedisJSON).

### Network access

- **Connected install:** the cluster must be able to pull from `docker.io`.
- **Air-gapped install:** mirror the two images into your internal registry first — see [Air-Gapped Installation](#air-gapped-installation).

### System requirements

| Component | CPU | Memory |
| --------- | --- | ------ |
| Admin Server | 250m – 1 core | 256Mi – 1Gi |
| MCP Server | 250m – 1 core | 256Mi – 1Gi |

## Installation

### Add the Helm repository

Add the Redis Enterprise Helm repository (the same source as the other Redis Enterprise AI charts) and list the available chart versions:

```bash
helm repo add redis-ai https://helm.redis.io/ai
helm repo update redis-ai
helm search repo redis-ai/redis-context-retriever --versions
```

Set the version you want to install:

```bash
export CR_VERSION="<version-from-the-helm-search-output>"
```

### Create a namespace

```bash
export NS=context-retriever
kubectl create namespace $NS
```

### Create secrets

#### Admin database secret

```bash
# SECRET_ENCRYPTION_KEY encrypts stored credentials at rest. It must be a
# base64-encoded 32-byte (AES-256) key. Generate one and back it up — if lost,
# encrypted data cannot be recovered.
SECRET_ENCRYPTION_KEY=$(openssl rand -base64 32)
ADMIN_REDIS_PASSWORD="<the password of the default user for the admin database>"

kubectl create secret generic cr-config \
  --namespace $NS \
  --from-literal=REDIS_PASSWORD="$ADMIN_REDIS_PASSWORD" \
  --from-literal=SECRET_ENCRYPTION_KEY="$SECRET_ENCRYPTION_KEY"
```

#### License key secret

```bash
export LICENSE_KEY_FILE_PATH="<the path to your license key>"

# License key from Redis (starts with CS-LICENSE.)
kubectl create secret generic cr-license \
  --namespace $NS \
  --from-file=LICENSE_KEY="$LICENSE_KEY_FILE_PATH"
```

### Install the chart

Install the chart, pointing it at your Redis database with `--set redis.addr` — **this is required; the chart will not render without it.**

```bash
helm install cr redis-ai/redis-context-retriever \
  --version $CR_VERSION \
  --namespace $NS \
  --set redis.addr="<your-redis-host>:<port>" \
  --set secrets.existingSecret=cr-config \
  --set license.existingSecret=cr-license

kubectl wait --for=condition=ready pod \
  -l app.kubernetes.io/name=redis-context-retriever \
  -n $NS \
  --timeout=180s
```

The chart's image repositories default to `redislabs/context-retriever-admin` and `redislabs/context-retriever`; the images are pulled from Docker Hub.

### Retrieve the admin API key

On first startup an admin API key is generated and written to a file in the admin pod:

```bash
ADMIN_POD=$(kubectl get pods -n $NS \
  -l app.kubernetes.io/component=admin \
  -o jsonpath='{.items[0].metadata.name}')

kubectl exec -n $NS "$ADMIN_POD" -- cat /opt/initialAdminKey.txt
```

{{< warning >}}
Save this key immediately. It is only available on first startup and cannot be recovered if lost (see [Troubleshooting](#lost-admin-api-key)).
{{< /warning >}}

### Install the CLI (optional)

The CLI ships on PyPI:

```bash
pip install redis-context-retriever

ctxctl config set default_output_format table --profile onprem
export CTX_PROFILE=onprem

ctxctl config set api_url "<admin_service_ingress_url>"
ctxctl config set mcp_url "<mcp_service_ingress_url>"
```

### Verify

Check that both services are healthy:

```bash
curl -sf http://<admin_service_ingress_url>/health | jq
curl -sf http://<mcp_service_ingress_url>/health | jq
```

If you installed the CLI, you can also list the configured surfaces:

```bash
ctxctl surface list
```

## Air-Gapped Installation

Context Retriever supports air-gapped clusters by mirroring the published images into your own OCI registry and installing from a locally downloaded copy of the Helm chart — there is no separate air-gapped bundle.

Mirror the images and download the chart (steps 1 and 2) on a host with internet access, then transfer them into your air-gapped environment before installing (step 3).

{{< note >}}
These commands assume the image tag matches the chart version (`$CR_VERSION`). If the images use a different tag, check the chart defaults with `helm show values redis-ai/redis-context-retriever` and set `admin.image.tag` and `mcp.image.tag` accordingly.
{{< /note >}}

1. Mirror both images to your internal registry:

   ```bash
   for img in context-retriever context-retriever-admin; do
     docker pull "redislabs/${img}:${CR_VERSION}"
     docker tag  "redislabs/${img}:${CR_VERSION}" "registry.internal.example.com/${img}:${CR_VERSION}"
     docker push "registry.internal.example.com/${img}:${CR_VERSION}"
   done
   ```

2. Download and unpack the Helm chart for the version you are installing:

   ```bash
   helm repo add redis-ai https://helm.redis.io/ai
   helm repo update redis-ai
   helm pull redis-ai/redis-context-retriever --version "$CR_VERSION" --untar
   # unpacks to ./redis-context-retriever/
   ```

3. In the air-gapped environment, create an image pull secret for your registry and install from the local chart directory, pointing the image repositories at your registry:

   ```bash
   kubectl create secret docker-registry regcred \
     --namespace $NS \
     --docker-server=registry.internal.example.com \
     --docker-username="<user>" --docker-password="<pass>"

   helm install cr ./redis-context-retriever \
     --namespace $NS \
     --set redis.addr="<your-redis-host>:<port>" \
     --set secrets.existingSecret=cr-config \
     --set license.existingSecret=cr-license \
     --set admin.image.repository=registry.internal.example.com/context-retriever-admin \
     --set mcp.image.repository=registry.internal.example.com/context-retriever \
     --set admin.image.tag="${CR_VERSION}" \
     --set mcp.image.tag="${CR_VERSION}" \
     --set 'imagePullSecrets[0].name=regcred'
   ```

{{< note >}}
If your registry allows unauthenticated pulls, skip creating `regcred` and remove the `--set 'imagePullSecrets[0].name=regcred'` line from the command above.
{{< /note >}}

Your Redis database is separate and must likewise be reachable from the air-gapped cluster.

## Production notes

| Area | Recommendation |
| ---- | -------------- |
| Redis | Use a highly available Redis database. Set `redis.addr` to its endpoint, and `redis.tlsEnabled=true` if it terminates TLS. |
| Replicas | Run more than one replica of each service: `--set admin.replicaCount=2 --set mcp.replicaCount=2`. |
| Encryption key | Store `SECRET_ENCRYPTION_KEY` securely. It is required to decrypt stored credentials and has no recovery path. |

## Configuration reference

### Environment variables (set by the chart)

| Variable | Description | Required |
| -------- | ----------- | -------- |
| `AUTH_MODE` | `local` for self-managed (API-key auth only) | Yes |
| `REDIS_ADDR` | Redis database endpoint | Yes |
| `REDIS_PASSWORD` | Redis password | If your DB requires auth |
| `SECRET_ENCRYPTION_KEY` | AES-256 key (base64) for stored secrets | Yes |
| `LICENSE_KEY` | License key string (`CS-LICENSE...`) | Yes |
| `LOG_LEVEL` | `debug`, `info`, `warn`, `error` | No |

### Key Helm values

```yaml
## the defaults are commented
# authMode: local
#
# admin:
#   replicaCount: 1
#   image:
#     repository: redislabs/context-retriever-admin
#     tag: '' # set to the release version
#   service: { type: NodePort, port: 8080, nodePort: 30080 }
#
# mcp:
#   replicaCount: 1
#   image:
#     repository: redislabs/context-retriever
#     tag: '' # set to the release version
#   service: { type: NodePort, port: 8081, nodePort: 30081 }

redis:
  addr: '<admin db address>'
  tlsEnabled: false

secrets:
  existingSecret: cr-config

license:
  existingSecret: cr-license

# imagePullSecrets: [] # set for a private/mirror registry
```

## Troubleshooting

### Pod not starting

```bash
kubectl describe pod -n $NS -l app.kubernetes.io/component=admin
kubectl logs -n $NS -l app.kubernetes.io/component=admin
```

Common causes: license secret missing/invalid; Redis unreachable or missing the Search/JSON capabilities; `SECRET_ENCRYPTION_KEY` not set; `redis.addr` not provided (the chart fails to render with a clear error if it is empty).

### License validation failed

```bash
kubectl get secret cr-license -n $NS
kubectl logs -n $NS -l app.kubernetes.io/component=admin | grep -i license
```

### Lost admin API key

{{< warning >}}
There is no recovery mechanism by design.
{{< /warning >}}

If the key is lost and the pod has restarted, wipe and reinstall:

```bash
kubectl delete namespace $NS
# then reinstall from the beginning and save the new key
```

## Cleanup

```bash
helm uninstall cr -n $NS
kubectl delete namespace $NS
```

## Support

Contact Redis support with your license ID, the release version, `kubectl version`, and sanitized diagnostic logs:

```bash
kubectl get pods -n $NS
kubectl logs -n $NS -l app.kubernetes.io/component=admin --tail=100
curl -s http://<admin-host>:8080/health | jq '.license'
```
