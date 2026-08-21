---
title: Install Radar
alwaysopen: false
categories:
- docs
- operate
- radar
description: Install Radar on RHEL, Kubernetes, or Docker Compose, then make it reachable from your network.
linkTitle: Install
weight: 10
---

Radar runs as two services backed by a PostgreSQL database that you provide:

- **API server** serves the REST API and the web UI.
- **Worker** collects cluster state on a schedule.

Both services read the same database and the same encryption key, and you supply both whichever install method you choose.

{{< warning >}}
Plan for remote access before you start. Every install method leaves network access up to you, and what you have to do differs by method. The RPM is the strictest case: it listens only on loopback, so **an RPM install that succeeds is still unreachable from any other machine** until you put a proxy in front of it. See [Provide remote access](#provide-remote-access).
{{< /warning >}}

## Choose an install method

| Method | Use it when | Containers required |
|---|---|---|
| [RPM on RHEL](#install-on-rhel-with-the-rpm) | You run RHEL 9 and cannot or do not want to run containers. | No |
| [Kubernetes with Helm](#install-on-kubernetes-with-helm) | You already run Kubernetes or OpenShift. | Yes |
| [Docker Compose](#install-with-docker-compose) | You want a single host and already run Docker. | Yes |

All three are supported and built from the same release. You can install any of them on a host with no internet access. See [Install on an air-gapped host](#install-on-an-air-gapped-host).

To get the artifacts, contact your Redis account team.

## Before you start

### Supported platforms

| Method | Requirement |
|---|---|
| RPM | RHEL 9 on x86_64 |
| Helm | Kubernetes 1.23 or later, and Helm 3.x. Validated on OpenShift 4.x |
| Docker Compose | A Docker engine with the `docker compose` plugin |

### PostgreSQL

Radar stores all of its state in PostgreSQL. You own that database. Radar does not initialize, start, tune, back up, or remove it.

Use an external, managed PostgreSQL for production. The Helm chart and the Compose bundle can each start a PostgreSQL container for evaluation, but neither is hardened for production use.

The connection string needs privileges for both normal runtime work and schema migration, including `CREATEROLE`. On startup, the API server creates the roles it needs before it begins serving traffic.

Use `sslmode=require` or stricter to encrypt the connection. Radar passes your connection string through unchanged.

### The credential encryption key

Radar encrypts the cluster credentials you give it. Each tenant gets its own data key, and all of those keys are wrapped by one key-encryption key (KEK) that you supply: **32 raw bytes**, not base64 and not hex.

{{< warning >}}
Back up the KEK alongside the database and store the backup separately. Either one alone is useless. Credentials sealed with the old key cannot be decrypted if the API server and the worker read different keys, or if a restored database is paired with the wrong key. Radar fails closed rather than silently losing them.
{{< /warning >}}

### FIPS mode

If you need FIPS 140-3 validated cryptography, decide before you install: it is a separate build of Radar, not a setting you turn on afterwards. Contact your Redis account team for the FIPS variant.

Set `MCM_REQUIRE_FIPS=true` to make FIPS mandatory. Radar then refuses to start unless FIPS is actually active, and it checks before it touches the database or opens a port. A misconfigured deployment fails immediately rather than running with cryptography you did not approve.

Each service logs its FIPS state once at startup, so you can confirm what is running:

```text
fips state service=mcm-api category=startup enabled=true required=true
```

`enabled` is the cryptography actually in effect. `required` is what you asked for. Both should read `true`.

### Sizing

The worker is the usual bottleneck. It processes jobs concurrently, and every worker shares one durable queue in PostgreSQL, so adding workers adds throughput. Raise worker concurrency and add replicas as your fleet grows.

On Kubernetes, these are the production starting points the Redis-hosted deployment uses:

| Component | CPU | Memory |
|---|---|---|
| API server | 1 | 1Gi |
| Worker | 1 | 1Gi |
| Migration job | 500m | 256Mi |

Run at least two API and two worker replicas for production, and set CPU requests before you turn on autoscaling. Kubernetes computes utilization from requests, so an autoscaler without them cannot make useful decisions.

<!-- TODO(DOC-6911): the RED-197466 GA bar is 300 clusters, but the source repo has no validated sizing for that scale (docs/DEPLOYMENT.md:266 only gives a t3.medium staging example). Ask Guy for tested numbers, then add a fleet-size sizing table. Do not extrapolate. -->

### Package and service names

Radar's packages, services, and paths use an `mcm` prefix. The RPM is named `mcm`, its services are `mcm-api` and `mcm-worker`, its configuration lives in `/etc/mcm/`, and the container images are `mcm-app`, `mcm-worker`, and `mcm-migrate`. All of these are Redis Radar.

## Install on RHEL with the RPM

The RPM installs native binaries and needs no container runtime. It also installs the `mcmctl` diagnostics command.

### 1. Install the package

```bash
sha256sum -c SHA256SUMS
sudo dnf install -y ./mcm-<version>-<release>.x86_64.rpm
```

The package depends on RHEL's `postgresql-server`, so `dnf` installs PostgreSQL software if it is absent. It does not create or start a database.

The package deliberately installs its services stopped and not enabled. Confirm that before you configure anything:

```bash
systemctl is-active mcm-api.service || true
systemctl is-active mcm-worker.service || true
```

### 2. Configure the package

Edit `/etc/mcm/mcm.env` and set the two required values:

```bash
sudoedit /etc/mcm/mcm.env
```

| Setting | Description |
|---|---|
| `DATABASE_URL` | Connection string for your PostgreSQL database, with runtime and migration privileges. |
| `CREDENTIAL_ENCRYPTION_KEY` | The credential encryption key. |

Radar refuses to start while the placeholder values are still in place. The file is owned by `root:mcm`, redacted from logs and diagnostics, and kept across upgrades and removal. Include it in your backup plan.

Useful defaults you may want to change:

| Setting | Default |
|---|---|
| `HTTP_ADDR` | `127.0.0.1:8080` |
| `CREDENTIAL_KEK_PATH` | `/var/lib/mcm/kek` |
| `SESSION_COOKIE_SECURE` | `true` |

Restart `mcm-api.service` after changing API, UI, CORS, LDAP, session, or HTTP settings. Restart `mcm-worker.service` after changing worker, database, encryption, or collection settings. Restart both after changing `DATABASE_URL` or `CREDENTIAL_ENCRYPTION_KEY`.

### 3. Start the services

Check the configuration first:

```bash
sudo mcmctl doctor
```

Before the first start, `mcmctl doctor` reports that schema migration has not run yet. That is expected; the configuration and database connectivity checks should still pass.

```bash
sudo systemctl start mcm-api.service
sudo systemctl start mcm-worker.service
```

The API server applies the database migrations as it starts. Verify it is serving:

```bash
curl -fsS http://127.0.0.1:8080/healthz/ready
sudo mcmctl doctor
```

### 4. Enable the services

Enable the services only after the health checks pass, so a reboot cannot start a half-configured deployment:

```bash
sudo systemctl enable mcm-api.service
sudo systemctl enable mcm-worker.service
```

### 5. Create the first administrator

Radar does not ship a default account or a default password. Open the UI once the API server is healthy and complete the one-time first-administrator flow. It is available only while the database has no users; after that, it closes and normal sign-in applies.

At this point Radar is reachable only from the host itself. Continue to [Provide remote access](#provide-remote-access).

## Install on Kubernetes with Helm

A production install has four parts you supply: the PostgreSQL connection, the credential encryption key, image pull access, and an external access path.

### 1. Create the secrets

Store the database connection string in a secret:

```bash
kubectl create secret generic radar-db \
  --namespace radar \
  --from-literal=DATABASE_URL='postgres://radar:secret@postgres.example.com:5432/radar?sslmode=require'
```

Generate the credential encryption key as a file and load it with `--from-file`:

```bash
head -c 32 /dev/urandom > kek.bin

kubectl create secret generic radar-credentials \
  --namespace radar \
  --from-file=CREDENTIAL_KEK=./kek.bin

shred -u kek.bin
```

{{< note >}}
Write the key to a file rather than using `--from-literal="$(head -c 32 /dev/urandom)"`. Command substitution truncates at null bytes, so the key would not be 32 bytes.
{{< /note >}}

The secret must contain the `CREDENTIAL_KEK` key. If it does not, the pods stay in `ContainerCreating`. That failure is deliberate rather than silent.

### 2. Install the chart

```bash
helm install radar ./helm/radar \
  --namespace radar \
  --create-namespace \
  --set database.existingSecret=radar-db \
  --set credentials.existingSecret=radar-credentials \
  --set ingress.enabled=true \
  --set ingress.className=nginx \
  --set ingress.hosts[0].host=radar.example.com \
  --set ingress.hosts[0].paths[0].path=/ \
  --set ingress.hosts[0].paths[0].pathType=Prefix
```

The chart runs schema migration as a Kubernetes job before the API server and worker start. Migrations apply forward only; there is no automated rollback.

For a private or air-gapped registry, override the image source:

```yaml
global:
  imageRegistry: registry.example.com/redislabs
  imagePullSecrets:
    - name: registry-creds
```

### 3. Verify the install

```bash
kubectl get pods -n radar
kubectl get jobs -n radar -l app.kubernetes.io/component=migrate
helm test radar --namespace radar
```

Expect a running API pod, a running worker pod, and a completed migration job. To check health without an external access path:

```bash
kubectl port-forward -n radar svc/radar 8080:80
curl http://localhost:8080/healthz/ready
```

### OpenShift

Use the OpenShift values file, which lets OpenShift assign namespace-scoped user IDs and switches the external access path from an ingress to a route:

```bash
helm install radar ./helm/radar \
  --namespace radar \
  --create-namespace \
  -f ./helm/radar/values-openshift.yaml \
  --set database.existingSecret=radar-db \
  --set credentials.existingSecret=radar-credentials \
  --set route.host=radar.apps.example.com
```

The chart needs no `anyuid` policy, privileged security context, host paths, or `cluster-admin` permissions.

## Install with Docker Compose

The Compose bundle runs Radar on a single host. It ships the container images, the Compose files, and an environment template.

Load the images and start the stack:

```bash
sha256sum -c SHA256SUMS
docker load -i images.tar.gz
docker compose -f compose.yaml -f compose.prod.yaml --env-file .env.production up -d
```

Copy `.env.production.example` to `.env.production` and replace every placeholder before you start the stack, including the PostgreSQL credentials and the credential encryption key. The sample keys are documented placeholders and Radar rejects them at startup.

The production Compose file pins the image tags and never pulls, so the stack runs fully offline once the images are loaded. A one-shot migration service runs before the API server and worker start.

## Provide remote access

Radar does not configure network access for you. No install method issues TLS certificates, configures a proxy, or opens firewall ports.

This matters most on the RPM, which listens on `127.0.0.1:8080` by default. The default is deliberate: **a completed RPM install is reachable only from the host itself.** You own TLS certificates and their rotation, the proxy or load balancer, firewall policy, DNS, and network access to your PostgreSQL database.

### RPM

Run a reverse proxy that terminates TLS and forwards to the loopback address. Keep `HTTP_ADDR=127.0.0.1:8080` when the proxy runs on the same host. That is the safest arrangement, because nothing but the proxy can reach the API.

If the proxy runs on a different host, set `HTTP_ADDR` to the private interface it should reach, then restrict access with your own firewall rules. Restart the API server:

```bash
sudo systemctl restart mcm-api.service
sudo mcmctl doctor
```

`mcmctl doctor` checks runtime health through the configured address. If it reports a runtime-health failure after you change the listen address, confirm the service bound to the interface you expected and that the proxy forwards to the same address.

{{< warning >}}
Do not expose Radar directly on a public interface. Terminate TLS and apply access controls at the edge.
{{< /warning >}}

### Kubernetes

The API server and UI are served on port 80 of an in-cluster service. Expose it with an ingress, an OpenShift route, or a `LoadBalancer` service, and terminate TLS there:

```yaml
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: radar.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: radar-tls
      hosts:
        - radar.example.com
```

Radar marks the browser session cookie as secure by default, so serve Radar over HTTPS. Over plain HTTP the browser rejects the cookie and sign-in fails.

## Install on an air-gapped host

Air-gapped installation is not a separate method. It is the same three methods, with the artifacts carried in by hand instead of downloaded.

Transfer the release artifacts to the target host or to an offline repository it can reach, then verify them:

```bash
sha256sum -c SHA256SUMS
```

| Method | What to transfer | How it installs |
|---|---|---|
| RPM | The `.rpm`, `SHA256SUMS`, and the dependency closure, including `postgresql-server` if the host has no offline PostgreSQL | `dnf install` from the local file |
| Helm | `images.tar.gz`, the packaged chart, and the bundled values file | `docker load` the images onto the nodes, then install the chart |
| Docker Compose | `images.tar.gz` and the Compose files | `docker load`, then `docker compose up` |

The RPM is the one path that needs no container tooling at all. It installs, starts, and upgrades with no internet access, no online package repositories, and no Docker, Podman, or containerd on the host.

Your PostgreSQL database and the clusters you plan to monitor still need to be reachable from the Radar host over the network.

## Next steps

Radar is installed but has nothing to show yet. It does not discover clusters on its own. Continue to [Connect clusters]({{< relref "/operate/radar/connect" >}}) to add your first cluster.
