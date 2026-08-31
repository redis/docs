---
title: Install self-managed Radar
alwaysopen: false
categories:
- docs
- operate
- radar
description: Install Radar on RHEL, Kubernetes, or Docker Compose, then make it reachable from your network.
linkTitle: Install
weight: 10
---

This page covers self-managed Radar. If you're using Redis Cloud's hosted Radar, see [Redis Radar on Redis Cloud]({{< relref "/operate/rc/radar" >}}) instead.

Radar runs as two services backed by a PostgreSQL database that you provide:

- API server: serves the REST API and the web UI.
- Worker: connects to each cluster on a schedule, collects its state, and stores it in the database.

Both services read the same database and the same encryption key. You supply both, no matter which install method you choose.

Plan for remote access before you start. Set up:

- TLS certificates
- A proxy or load balancer
- Firewall rules
- DNS
- Network access to your PostgreSQL database

What you have to do differs by method, so each install method below ends with its own remote-access step.

## Choose an install method

| Method | Use it when | Requires | Containers |
|---|---|---|---|
| [RPM on RHEL](#install-on-rhel-with-the-rpm) | You run RHEL 9 and cannot or do not want to run containers. | RHEL 9 on x86_64 | No |
| [Kubernetes with Helm](#install-on-kubernetes-with-helm) | You already run Kubernetes or OpenShift. | Kubernetes 1.23 or later, and Helm 3.x. Validated on OpenShift 4.x | Yes |
| [Docker Compose](#install-with-docker-compose) | You want a single host and already run Docker. | A Docker engine with the `docker compose` plugin | Yes |

All three are supported and built from the same release. You can install any of them on a host with no internet access. See [Install on an air-gapped host](#install-on-an-air-gapped-host).

Get the RPM from the [Redis Download Center](https://cloud.redis.io/#/rlec-downloads), under **Modules, tools and integrations**. Get the container images from Docker Hub, and the Helm chart.

## Before you start

Before you install:

- Set up an external, managed PostgreSQL database for production (evaluation can use a bundled container instead). See [PostgreSQL](#postgresql).
- Generate a 32-byte credential encryption key. See [The credential encryption key](#the-credential-encryption-key).
- Decide if you need FIPS, since it's a separate build, not a setting you can change later. See [FIPS mode](#fips-mode).

### PostgreSQL

For production, set up your own external, managed [PostgreSQL](https://www.postgresql.org/docs/) database before you install Radar. You need to provision, back up, and tune it yourself, since Radar only connects to it and creates the roles and schema it needs on startup.

For evaluation or testing, you can skip that step: the Helm chart and the Compose bundle can each start a PostgreSQL container for you, though neither is hardened for production use.

The connection string needs privileges for both normal runtime work and schema migration, including `CREATEROLE`. On startup, the API server creates the roles it needs before it begins serving traffic.

Use `sslmode=require` or stricter to encrypt the connection. Radar passes your connection string through unchanged.

### The credential encryption key

Radar encrypts the cluster credentials you supply. Each tenant gets its own data key, and all of those keys are wrapped by one key-encryption key (KEK) that you supply. The key must be **32 raw bytes**, not base64 or hex.

{{< warning >}}
Back up the KEK alongside the database and store the two backups separately. Neither is usable without the other. Radar cannot decrypt stored credentials if the API server and the worker read different keys, or if a restored database is paired with the wrong key. It fails closed rather than losing them silently.
{{< /warning >}}

### FIPS mode

[FIPS 140-3](https://csrc.nist.gov/pubs/fips/140-3/final) validated cryptography comes as a separate build of Radar, not a setting you turn on later, so decide before you install. Contact your Redis account team for the FIPS variant.

Set the `MCM_REQUIRE_FIPS=true` environment variable to make FIPS mandatory. Radar then refuses to start unless FIPS is active, and it checks before it touches the database or opens a port. A misconfigured deployment fails immediately rather than running with cryptography you did not approve.

Each service logs its FIPS state once at startup, so you can confirm what is running. The log line looks like this:

```text
fips state service=mcm-api category=startup enabled=true required=true
```

In that line, `enabled` is the cryptography in effect and `required` is what you asked for. Both should read `true`.

### Package and service names

Radar's packages, services, and paths use an `mcm` prefix. The RPM is named `mcm`, its services are `mcm-api` and `mcm-worker`, its configuration lives in `/etc/mcm/`, and the container images are `mcm-app`, `mcm-worker`, and `mcm-migrate`.

## Install on RHEL with the RPM

The RPM installs native binaries and needs no container runtime. It also installs the `mcmctl` diagnostics command.

{{< note >}}
The RPM listens only on loopback by default. A successful RPM install is not yet reachable from any other machine until you put a proxy in front of it.
{{< /note >}}

1. Install the package.

   ```bash
   sha256sum -c SHA256SUMS
   sudo dnf install -y ./mcm-<version>-<release>.x86_64.rpm
   ```

   The package depends on RHEL's `postgresql-server`, so `dnf` installs PostgreSQL software if it is absent. It does not create or start a database.

   <br>

2. Confirm the services are inactive.

   The package deliberately installs them without starting or enabling them.

   ```bash
   systemctl is-active mcm-api.service || true
   systemctl is-active mcm-worker.service || true
   ```

   <br>

3. Configure the package. Edit `/etc/mcm/mcm.env` and set the two required values.

   ```bash
   sudoedit /etc/mcm/mcm.env
   ```

   | Setting | Description |
   |---|---|
   | `DATABASE_URL` | Connection string for your PostgreSQL database, with runtime and migration privileges. |
   | `CREDENTIAL_ENCRYPTION_KEY` | The credential encryption key. |

   Radar refuses to start while the placeholder values are still in place. The file is owned by `root:mcm`, redacted from logs and diagnostics, and kept across upgrades and removal. Include it in your backup plan.

   You may want to change these defaults.

   | Setting | Default |
   |---|---|
   | `HTTP_ADDR` | `127.0.0.1:8080` |
   | `CREDENTIAL_KEK_PATH` | `/var/lib/mcm/kek` |
   | `SESSION_COOKIE_SECURE` | `true` |

   Restart `mcm-api.service` after changing API, UI, CORS, LDAP, session, or HTTP settings. Restart `mcm-worker.service` after changing worker, database, encryption, or collection settings. Restart both after changing `DATABASE_URL` or `CREDENTIAL_ENCRYPTION_KEY`.

   <br>

4. Check the configuration.

   ```bash
   sudo mcmctl doctor
   ```

   Before the first start, `mcmctl doctor` reports that schema migration has not run yet. That is expected; the configuration and database connectivity checks should still pass.

   <br>

5. Start the services.

   ```bash
   sudo systemctl start mcm-api.service
   sudo systemctl start mcm-worker.service
   ```

   The API server applies the database migrations as it starts.

   <br>

6. Verify the services are running.

   ```bash
   curl -fsS http://127.0.0.1:8080/healthz/ready
   sudo mcmctl doctor
   ```

   <br>

7. Enable the services only after the health checks pass, so a reboot cannot start a half-configured deployment.

   ```bash
   sudo systemctl enable mcm-api.service
   sudo systemctl enable mcm-worker.service
   ```

   <br>

8. Create the first administrator.

   Radar does not ship a default account or a default password. Open the UI once the API server is healthy and complete the one-time first-administrator flow. It is available only while the database has no users; after that, it closes and normal sign-in applies.

   <br>

9. Provide remote access.

   At this point Radar is reachable only from the host itself.

   Run a reverse proxy that terminates TLS and forwards to the loopback address. Keep `HTTP_ADDR=127.0.0.1:8080` when the proxy runs on the same host. That is the safest arrangement, because nothing but the proxy can reach the API.

   If the proxy runs on a different host, set `HTTP_ADDR` to the private interface it should reach, then restrict access with your own firewall rules. Restart the API server.

   ```bash
   sudo systemctl restart mcm-api.service
   sudo mcmctl doctor
   ```

   `mcmctl doctor` checks runtime health through the configured address. If it reports a runtime-health failure after you change the listen address, confirm the service bound to the interface you expected and that the proxy forwards to the same address.

   {{< warning >}}
   Do not expose Radar directly on a public interface. Terminate TLS and apply access controls at the edge.
   {{< /warning >}}

   <br>

## Install on Kubernetes with Helm

A production install has four parts you supply: the PostgreSQL connection, the credential encryption key, image pull access, and an external access path.

1. Create the database secret. Store the database connection string in a secret.

   ```bash
   kubectl create secret generic radar-db \
     --namespace radar \
     --from-literal=DATABASE_URL='postgres://radar:secret@postgres.example.com:5432/radar?sslmode=require'
   ```

   <br>

2. Create the credentials secret. Generate the credential encryption key as a file and load it with `--from-file`.

   ```bash
   head -c 32 /dev/urandom > kek.bin

   kubectl create secret generic radar-credentials \
     --namespace radar \
     --from-file=CREDENTIAL_KEK=./kek.bin

   shred -u kek.bin
   ```

   {{< note >}}
   Write the key to a file rather than using `--from-literal="$(head -c 32 /dev/urandom)"`. If the random key contains a zero byte, command substitution truncates it there, so the key would be shorter than 32 bytes.
   {{< /note >}}

   The secret must contain a key named `CREDENTIAL_KEK`. Without it, the pods stay in `ContainerCreating` rather than starting with no encryption key.

   <br>

3. Install the chart.

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

   **For a private or air-gapped registry**, override the image source.

   ```yaml
   global:
     imageRegistry: registry.example.com/redislabs
     imagePullSecrets:
       - name: registry-creds
   ```

   **For OpenShift**, use the OpenShift values file instead, which lets OpenShift assign namespace-scoped user IDs and switches the external access path from an ingress to a route.

   ```bash
   helm install radar ./helm/radar \
     --namespace radar \
     --create-namespace \
     -f ./helm/radar/values-openshift.yaml \
     --set database.existingSecret=radar-db \
     --set credentials.existingSecret=radar-credentials \
     --set route.host=radar.apps.example.com
   ```

   The chart does not need an `anyuid` policy, privileged security context, host paths, or `cluster-admin` permissions.

   <br>

4. Verify the install.

   ```bash
   kubectl get pods -n radar
   kubectl get jobs -n radar -l app.kubernetes.io/component=migrate
   helm test radar --namespace radar
   ```

   Expect a running API pod, a running worker pod, and a completed migration job. To check health without an external access path, use the following commands.

   ```bash
   kubectl port-forward -n radar svc/radar 8080:80
   curl http://localhost:8080/healthz/ready
   ```

   <br>

5. Provide remote access. 
   
   The API server and UI are served on port 80 of an in-cluster service. Expose it with an ingress, an OpenShift route, or a `LoadBalancer` service, and terminate TLS there.

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

   <br>

## Install with Docker Compose

The Compose bundle runs Radar on a single host. It ships the container images, the Compose files, and an environment template.

1. Load the images.

   ```bash
   sha256sum -c SHA256SUMS
   docker load -i images.tar.gz
   ```

   <br>

2. Configure the environment. 
   
   Copy `.env.production.example` to `.env.production` and replace every placeholder, including the PostgreSQL credentials and the credential encryption key.

   {{< warning >}}
Unlike the RPM, Compose does not detect leftover sample values. If you start the stack without replacing the credential encryption key, Radar runs with the published example key rather than refusing to start.
   {{< /warning >}}

   <br>

3. Start the services.

   ```bash
   docker compose -f compose.yaml -f compose.prod.yaml --env-file .env.production up -d
   ```

   The production Compose file pins the image tags and never pulls, so the stack runs fully offline once the images are loaded. A migration service runs once, before the API server and worker start.

   <br>

## Install on an air-gapped host

Air-gapped installation uses the same three methods.

Transfer the release artifacts to the target host or to an offline repository it can reach, then verify them:

```bash
sha256sum -c SHA256SUMS
```

| Method | What to transfer | How it installs |
|---|---|---|
| RPM | The `.rpm`, `SHA256SUMS`, and the dependency closure, including `postgresql-server` if the host has no offline PostgreSQL | `dnf install` from the local file |
| Helm | `images.tar.gz`, the packaged chart, and the bundled values file | `docker load` the images onto the nodes, then install the chart |
| Docker Compose | `images.tar.gz` and the Compose files | `docker load`, then `docker compose up` |

Your PostgreSQL database and the clusters you plan to monitor still need to be reachable from the Radar host over the network.

## Next steps

Radar is installed but has nothing to show yet. Continue to [Connect clusters]({{< relref "/operate/radar/connect" >}}) to add your first cluster.
