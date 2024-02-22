---
Title: Running on Kubernetes
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn about running RDI on Kubernetes
group: di
linkTitle: Running on Kubernetes
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 30
---

When running Redis Data Integration (RDI) in a [Kubernetes](https://kubernetes.io/) environment, we recommend creating a [ConfigMap](https://kubernetes.io/docs/concepts/configuration/configmap/) and adding the RDI CLI as a pod in the cluster.

Throughout this document, the snippets make use of the Kubernetes `kubectl` tool. All examples can be replaced with `oc` when working in an OpenShift environment.

## Prerequisites

- An existing Redis Enterprise cluster version >= {{<param rdi_rlec_min_version>}}
- [RedisGears](https://redis.com/modules/redis-gears/) {{<param rdi_redis_gears_version>}} installed on the cluster. In case it's missing, see [Install RedisGears for Redis Data Integration]({{<relref "/integrate/redis-data-integration/installation/install-redis-gears.md">}}) to install.
- A target Redis DB (can be added after installation).

> Note: The version of RedisGears you will install must match the base OS of the Redis Enterprise containers. In case of [Rancher](https://www.rancher.com/), the Redis Enterprise container base OS is Ubuntu 18.04. Use the following command to install RedisGears:

```bash
curl -s https://redismodules.s3.amazonaws.com/redisgears/redisgears.Linux-ubuntu18.04-x86_64.1.2.6-withdeps.zip -o /tmp/redis-gears.zip
```

In case the wrong RedisGears binaries had been installed, use the following commands to fix it:

```bash
# Start port forwarding to the Redis Enterprise Cluster API
kubectl port-forward service/rec 9443:9443

# Find the uid of the RedisGears module
# Note: skip piping to the jq if it is not installed
curl -k -v -u "user:pwd" https://localhost:9443/v1/modules | jq '.[] | {module_name,uid,semantic_version}'

# Put the RedisGears module uid instead of <uid>
curl -k -s -u "user:pwd" -X DELETE https://localhost:9443/v2/modules/<uid>

# Install the correct version of the RedisGears module
curl -k -s -u "user:pwd" -F "module=@/tmp/redis-gears.zip" https://localhost:9443/v2/modules

# Check the version of the newly installed module
curl -k -v -u "user:pwd" https://localhost:9443/v1/modules | jq '.[] | {module_name,uid,semantic_version}'
```

## Install RDI CLI

There are two options for installing the RDI CLI in an Kubernetes environment:

- Install [RDI CLI]({{<relref "/integrate/redis-data-integration/installation/install-rdi-cli.md">}}) locally

- [Install RDI CLI as a pod in Kubernetes cluster](#install-rdi-cli-on-kubernetes-cluster)

## Create a new RDI database

- Run:

  ```bash
  kubectl port-forward service/rec 9443:9443
  ```

  \*If the Redis Enterprise Cluster service is not named `rec` (the default), make sure to forward to the correct service name.

- Run the `create` command to set up a new RDI database instance within an existing Redis Enterprise Cluster:

  ```bash
  redis-di create --cluster-host localhost --no-configure
  ```

- Next, run the `port-forward` command to be able to connect to RDI from inside the Kubernetes cluster:

  ```bash
  kubectl port-forward service/<REDIS_DI_SERVICE_NAME> <REDIS_DI_PORT>:<REDIS_DI_PORT>
  ```

  Replace the values for the port-forward with the service name and port of the RDI BDB that was created using the `create` command.

- Configure RDI:

  ```bash
  redis-di configure
  ```

  If successful, you should get the message "Successfully configured redis-di instance on port <REDIS_DI_PORT>".

The `create` command will create a BDB named `redis-di-1` in your cluster. To run the `create` command, you will need to use a privileged Redis Enterprise user that has the permissions to create a BDB and to register RedisGears recipes.

## Create the configuration file for RDI

Run `redis-di scaffold --db-type <{{param  rdi_db_types}}> --dir <PATH_TO_DIR>`.
Edit the file `config.yaml` that is located under the directory <NAME> to point to the correct Redis Target database settings:

```yaml
connections:
  # Redis target DB connection details
  target:
    host: <REDIS_TARGET_DB_SERVICE_NAME>
    port: <REDIS_TARGET_DB_PORT>
    #password: <REDIS_TARGET_DB_PASSWORD>
    # In case of target DB password stored in a secret and mounted as an env variable
    # available to the Redis Enterprise Cluster pod
    #password: ${env:redis-target-password}
```

Run the `redis-di deploy` command to deploy the configuration in the `config.yaml` file to the remote RDI database.

For more information, see the [`config.yaml` reference]({{<relref "/integrate/redis-data-integration/reference/config-yaml-reference">}}).

### Validate the installation

Run `redis-di status` to check the status of the installation.

## Install the RDI CLI on the Kubernetes Cluster

### Add CLI pod

```bash
cat << EOF > /tmp/redis-di-cli-pod.yml
apiVersion: v1
kind: Pod
metadata:
  name: redis-di-cli
  labels:
    app: redis-di-cli
spec:
  containers:
    - name: redis-di-cli
      image: docker.io/redislabs/redis-di-cli
      volumeMounts:
      - name: config-volume
        mountPath: /app
      - name: jobs-volume
        mountPath: /app/jobs
  volumes:
    - name: config-volume
      configMap:
        name: redis-di-config
        optional: true
    - name: jobs-volume
      configMap:
        name: redis-di-jobs
        optional: true
EOF
kubectl apply -f /tmp/redis-di-cli-pod.yml
```

To run the CLI commands, use:

```bash
kubectl exec -it pod/redis-di-cli -- redis-di
```

### Create the configuration file for RDI

- Run the following command to create the configuration file for RDI:

  ```bash
  kubectl exec -it pod/redis-di-cli -- redis-di scaffold --db-type <{{param  rdi_db_types}}> --preview config.yaml > config.yaml
  ```

- Edit the file `config.yaml` to point to the correct Redis Target database settings.

> For config.yaml settings, see [this reference](../reference/config-yaml-reference.md).

### Create ConfigMap for RDI

Run the following command to create the ConfigMap for RDI:

```bash
kubectl create configmap redis-di-config --from-file=config.yaml
```

### Create a new RDI database

Run `create` command to set up a new RDI database instance within an existing Redis Enterprise Cluster:

```bash
kubectl exec -it pod/redis-di-cli -- redis-di create
```

The `create` command will create a BDB named `redis-di-1` in your cluster. To run the `create` command, you will need to use a privileged Redis Enterprise user that has the permissions to create a BDB and to register RedisGears recipes.

### Deploy configuration

Run the `deploy` command to deploy the configuration in the ConfigMap to the remote redis-di instance:

```bash
kubectl exec -it pod/redis-di-cli -- redis-di deploy
```

> Read more about deploying data transformation jobs when the RDI CLI is deployed as a Kubernetes pod [here](../data-transformation-pipeline.md#deploy-configuration).

### Validate the installation

Run `kubectl exec -it pod/redis-di-cli -- redis-di status` to check the status of the installation.

> Note that it is okay to see the warning "No streams found" since we have not yet set up a Debezium source connector. We will do this in the next step.

## Install the Debezium Server

### Create the configuration file for RDI

- Run the following command to create the configuration file for Debezium Server:

  ```bash
  kubectl exec -it pod/redis-di-cli -- redis-di scaffold --db-type <{{param  rdi_db_types}}> --preview debezium/application.properties > application.properties
  ```

- Edit the file `application.properties` and replace the values for the debezium.sink with the service name and credentials of the RDI BDB that was created using the `create` command.
  > Note: make sure to reference the Service name that was created by the service rigger.

> For a full list of configuration options and the class name of each connector see the [Debezium documentation](https://debezium.io/documentation/reference/stable/connectors/)

### Create a ConfigMap for Debezium Server

Run the following command to create the ConfigMap for Debezium Server:

```bash
kubectl create configmap debezium-config --from-file=application.properties
```

### Create the Debezium Server pod

```bash
cat << EOF > /tmp/debezium-server-pod.yml
apiVersion: v1
kind: Pod
metadata:
  name: debezium-server
  labels:
    app: debezium-server
spec:
  containers:
    - name: debezium-server
      image: docker.io/debezium/server
      livenessProbe:
        httpGet:
            path: /q/health/live
            port: 8088
      readinessProbe:
        httpGet:
            path: /q/health/ready
            port: 8088
      volumeMounts:
      - name: config-volume
        mountPath: /debezium/conf
  volumes:
    - name: config-volume
      configMap:
        name: debezium-config
EOF
kubectl apply -f /tmp/debezium-server-pod.yml
```

### Optional: set up an example database

The Debezium project has preconfigured example databases for many relational databases.

To set up a Postgres example database:

```bash
cat << EOF > /tmp/example-postgres.yml
apiVersion: v1
kind: Pod
metadata:
  name: example-postgres
  labels:
    app: postgres
spec:
  containers:
    - name: example-postgres
      image: docker.io/debezium/example-postgres
      ports:
      - containerPort: 5432
      env:
      - name: POSTGRES_USER
        value: "postgres"
      - name: POSTGRES_PASSWORD
        value: "postgres"

---

apiVersion: v1
kind: Service
metadata:
  name: example-postgres
  labels:
    app: postgres
spec:
  type: NodePort
  ports:
  - port: 5432
  selector:
    app: postgres
EOF
kubectl apply -f /tmp/example-postgres.yml
```
