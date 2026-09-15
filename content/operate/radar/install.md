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

Get the RPM from the [Redis Download Center](https://cloud.redis.io/#/rlec-downloads), under **Modules, tools and integrations**. Get the container images from Docker Hub, and the Helm chart from the Redis Helm repository at `https://helm.redis.io/radar`.

## Before you start

Before you install:

- Set up an external, managed PostgreSQL database for production (evaluation can use a bundled container instead). See [PostgreSQL](#postgresql).
- Generate a 32-byte credential encryption key. See [The credential encryption key](#the-credential-encryption-key).
- Decide if you need FIPS, since it's a separate build, not a setting you can change later. See [FIPS mode](#fips-mode).

### PostgreSQL

Radar requires PostgreSQL 16 or later. Redis tests Radar against PostgreSQL 16 and 18. For production, set up your own external, managed [PostgreSQL](https://www.postgresql.org/docs/) database before you install Radar. You need to provision, back up, and tune it yourself, since Radar only connects to it and creates the roles and schema it needs on startup.

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

Each service logs its FIPS state once at startup, so you can confirm what is running. In production, Radar writes this log line as structured JSON rather than flat text, and includes additional fields such as the Go runtime's FIPS build mode. The core fields look like this:

```text
fips state service=mcm-api category=startup enabled=true required=true
```

In that line, both `enabled` and `required` should read `true`. Search your logs by field name rather than this literal line, since the exact format depends on your deployment method.

### Package and service names

Radar's services and paths use an `mcm` prefix. The RPM is named `radar`, its services are `mcm-api` and `mcm-worker`, and its configuration lives in `/etc/mcm/`. The Helm chart pulls one Docker Hub repository, `redislabs/radar`, and selects each component by tag: `app-v<version>`, `worker-v<version>`, and `migrate-v<version>`. The Docker Compose bundle's container images use a `radar-` prefix: `radar-app`, `radar-worker`, and `radar-migrate`.

## Install on RHEL with the RPM

The RPM installs native binaries and needs no container runtime. It also installs the `radar` diagnostics command.

{{< note >}}
The RPM listens only on loopback by default. A successful RPM install is not yet reachable from any other machine until you put a proxy in front of it.
{{< /note >}}

1. Install the package.

   ```bash
   sudo dnf install -y ./radar-<version>-<release>.x86_64.rpm
   ```

   The package requires `postgresql-server` and `postgresql-contrib` version 16 or later, from the `postgresql:16` module stream. Enable that stream before you install, since `dnf` resolves the dependency only from a stream you have already enabled. Installing the package never creates, starts, or tunes a database.

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
   sudo radar doctor
   ```

   Before the first start, `radar doctor` reports that schema migration has not run yet. That is expected; the configuration and database connectivity checks should still pass.

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
   sudo radar doctor
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
   sudo radar doctor
   ```

   `radar doctor` checks runtime health through the configured address. If it reports a runtime-health failure after you change the listen address, confirm the service bound to the interface you expected and that the proxy forwards to the same address.

   {{< warning >}}
   Do not expose Radar directly on a public interface. Terminate TLS and apply access controls at the edge.
   {{< /warning >}}

   <br>

## Install on Kubernetes with Helm

A production install has four parts you supply: the PostgreSQL connection, the credential encryption key, image pull access, and an external access path.

Add the Redis Helm repository first. The commands below install from it.

```bash
helm repo add radar https://helm.redis.io/radar
helm repo update radar
```

The chart version matches the Radar version. Replace `<version>` in the commands with the release you install, such as `2026.9.5`, and use that release's container images. Each release's [release notes]({{< relref "/operate/radar/release-notes" >}}) list its chart version and images under **Downloads**.

To install from a chart package file instead, such as on a cluster with no internet access, substitute the `radar-<version>.tgz` file for `radar/radar` in the `helm install` commands. See [Install on an air-gapped host](#install-on-an-air-gapped-host).

1. Create the namespace.

   ```bash
   kubectl create namespace radar
   ```

   <br>

2. Create the database secret. Store the database connection string in a secret.

   ```bash
   kubectl create secret generic radar-db \
     --namespace radar \
     --from-literal=DATABASE_URL='postgres://radar:secret@postgres.example.com:5432/radar?sslmode=require'
   ```

   The chart also needs the database hostname as `database.host`, separate from the connection string. It uses the hostname to wait for the database before it starts the API server, the worker, and the migration job. If your database listens on a port other than 5432, also set `database.port`.

   <br>

3. Create the credentials secret. Generate the credential encryption key as a file and load it with `--from-file`.

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

4. Install the chart.

   ```bash
   helm install radar radar/radar \
     --version <version> \
     --namespace radar \
     --set database.host=postgres.example.com \
     --set database.existingSecret=radar-db \
     --set credentials.existingSecret=radar-credentials \
     --set ingress.enabled=true \
     --set ingress.className=nginx \
     --set 'ingress.hosts[0].host=radar.example.com' \
     --set 'ingress.hosts[0].paths[0].path=/' \
     --set 'ingress.hosts[0].paths[0].pathType=Prefix'
   ```

   With an external database, as configured here, the chart runs schema migration as a Kubernetes job before the API server and worker start. If you use the chart's bundled PostgreSQL container instead, migration instead runs after the API and worker pods start, so expect them to restart briefly until the migration job completes. Migrations apply forward only; there is no automated rollback.

   **For a private or air-gapped registry**, mirror the images listed in the release notes for your version, keeping each image's repository path, then point the chart at your registry. Save these values to a file, such as `registry-values.yaml`, and add `-f registry-values.yaml` to the `helm install` command.

   ```yaml
   image:
     registry: registry.example.com
   dbWaitInitContainer:
     image:
       repository: registry.example.com/library/busybox
   global:
     imagePullSecrets:
       - name: registry-creds
   ```

   Set `image.registry` rather than `global.imageRegistry`. In chart 2026.9.5 and earlier, `global.imageRegistry` does not apply to the Radar images, and the `busybox` image has no registry setting, so its repository includes the registry. If you use the chart's bundled PostgreSQL container, also set `postgresql.image.registry`.

   In the same chart versions, the `helm test` pod doesn't receive `global.imagePullSecrets` and runs as the namespace's `default` service account. If your registry requires authentication, attach the pull secret to that service account so `helm test` can pull `busybox`. On OpenShift:

   ```bash
   oc secrets link default registry-creds --for=pull -n radar
   ```

   On Kubernetes:

   ```bash
   kubectl patch serviceaccount default -n radar \
     -p '{"imagePullSecrets": [{"name": "registry-creds"}]}'
   ```

   **For OpenShift**, use the OpenShift values file instead, which lets OpenShift assign namespace-scoped user IDs and switches the external access path from an ingress to a route. The file ships inside the chart, so extract it first.

   ```bash
   helm pull radar/radar --version <version> --untar --untardir .

   helm install radar radar/radar \
     --version <version> \
     --namespace radar \
     -f ./radar/values-openshift.yaml \
     --set database.host=postgres.example.com \
     --set database.existingSecret=radar-db \
     --set credentials.existingSecret=radar-credentials \
     --set route.host=radar.apps.example.com
   ```

   The chart does not need an `anyuid` policy, privileged security context, host paths, or `cluster-admin` permissions.

   <br>

5. Verify the install.

   ```bash
   kubectl get pods -n radar
   kubectl get jobs -n radar -l app.kubernetes.io/component=migrate
   helm test radar --namespace radar
   ```

   Expect a running API pod and a running worker pod. With an external database, Helm deletes the migration job once it succeeds, so the job is listed only while it runs or if it fails. With the bundled PostgreSQL container, the completed job stays listed for seven days by default. To check health without an external access path, use the following commands.

   ```bash
   kubectl port-forward -n radar svc/radar 8080:80
   curl http://localhost:8080/healthz/ready
   ```

   <br>

6. Provide remote access. 
   
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
   sha256sum -c radar-v<version>.SHA256SUMS
   docker load -i images.tar.gz
   ```

   <br>

2. Configure the environment. 
   
   Copy `.env.production.example` to `.env.production` and replace every placeholder, including the PostgreSQL credentials and the credential encryption key.

   {{< warning >}}
Confirm you've replaced every sample value, especially the credential encryption key, before you start the services. Unlike the RPM, Compose does not detect leftover sample values: if you start them before replacing the credential encryption key, Radar runs with the published example key rather than refusing to start.
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

Transfer the release artifacts to the target host or to an offline repository it can reach. If they include a `radar-v<version>.SHA256SUMS` file, verify them:

```bash
sha256sum -c radar-v<version>.SHA256SUMS
```

| Method | What to transfer | How it installs |
|---|---|---|
| RPM | The `.rpm` and the dependency closure, including `postgresql-server` if the host has no offline PostgreSQL | `dnf install` from the local file |
| Helm | The chart package, `radar-<version>.tgz`, and the container images listed in the release notes for your version | Copy the images into a registry the cluster can pull from, then install the chart from the package. See [Helm on an air-gapped cluster](#helm-on-an-air-gapped-cluster). |
| Docker Compose | `images.tar.gz` and the Compose files | `docker load`, then `docker compose up` |

Your PostgreSQL database and the clusters you plan to monitor still need to be reachable from the Radar host over the network.

### Helm on an air-gapped cluster

1. On a machine with internet access, download the chart package.

   ```bash
   helm repo add radar https://helm.redis.io/radar
   helm pull radar/radar --version <version>
   ```

   The command saves `radar-<version>.tgz`, which includes `values-openshift.yaml`.

   <br>

2. Copy each image listed under **Downloads** in the [release notes]({{< relref "/operate/radar/release-notes" >}}) for your version into your registry, keeping its repository path. For example, with `skopeo`:

   ```bash
   skopeo copy --all \
     docker://docker.io/redislabs/radar:app-v<version> \
     docker://registry.example.com/redislabs/radar:app-v<version>
   ```

   The `--all` option copies every platform of a multi-platform image, such as `busybox`, rather than only the platform of the machine that runs the copy.

   <br>

3. Install from the package. Follow [Install on Kubernetes with Helm](#install-on-kubernetes-with-helm) without adding the Helm repository, substitute `./radar-<version>.tgz` for `radar/radar`, and add the registry values file. For OpenShift, extract the values file from the package instead of running `helm pull`:

   ```bash
   tar -xzf radar-<version>.tgz radar/values-openshift.yaml
   ```

   <br>

## Next steps

Radar is installed but has nothing to show yet. Continue to [Connect clusters]({{< relref "/operate/radar/connect" >}}) to add your first cluster.
