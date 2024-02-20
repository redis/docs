---
Title: Ingest quickstart
linkTitle: Ingest
description: Get started creating an ingest pipeline
weight: 30
alwaysopen: false
categories: ["redis-di"]
aliases:
---

This guide will take you through the creation of an ingest pipeline.

## Prerequisites

- Install [RDI CLI]({{<relref "/integrate/redis-data-integration/installation/install-rdi-cli">}}).
- An existing Redis Enterprise cluster version >= {{<param rdi_rlec_min_version>}}
- [RedisGears](https://redis.com/modules/redis-gears/) >= {{<param rdi_redis_gears_version>}} installed on the cluster. In case it's missing, see [Install RedisGears for Redis Data Integration]({{<relref "/integrate/redis-data-integration/installation/install-redis-gears">}}) to install.
- A target Redis database (can be added after installation).

## Create a new RDI database

Run the `create` command to set up a new RDI database instance within an existing Redis Enterprise cluster:

```bash
redis-di create
```

The `create` command will create a BDB named `redis-di-<ID>` in your cluster. You will need to use a privileged Redis Enterprise user that has the permissions to create a BDB and to register RedisGears recipes.

> Note: This command requires credentials of a Redis Enterprise cluster user with either `DB Member`, `Cluster Member`, or `Cluster Admin` roles. See[cluster roles]({{<relref "/operate/rs/security/access-control/rbac/create-roles">}}) for more information.

## Scaffold configuration files

Review the `scaffold` command [reference documentation]({{<relref "/integrate/redis-data-integration/reference/cli/redis-di-scaffold">}}) before getting started with this step.

Run the `scaffold` command to generate configuration files for RDI and the Debezium Redis Sink Connector:

```bash
redis-di scaffold --db-type <{{<param rdi_db_types>}}> --dir <PATH_TO_DIR>
```

The following files will be created in the provided directory:

```bash
├── debezium
│   └── application.properties
├── jobs
│   └── README.md
└── config.yaml
```

- `config.yaml` is the RDI configuration file (definitions of target database, applier, and so on).

- `debezium/application.properties` is the Debezium Server configuration file.

- `jobs` contains information about your data transformation jobs. For more information, see [data transformation pipeline]({{<relref "/integrate/redis-data-integration/data-transformation/data-transformation-pipeline">}}).

## Update Redis target connection details

{{< image filename="/images/rdi/config-yaml-diagram.png" >}}

Edit the `config.yaml` configuration file. This file holds the connection details of the target Redis instance and applier settings.

Update the `connection/target` details to match the target database settings. See [the configuration reference for all available settings]({{<relref "/integrate/redis-data-integration/reference/config-yaml-reference">}}).

> Note: more than one Redis target can be defined in the configuration file and used later in RDI jobs to write data to different Redis databases at the same time.

## Preventing data loss on the Redis target database

To prevent the Redis Target database from losing data, configure RDI to [wait](https://redis.io/commands/wait/) for replica shard write acknowledgment. This can be done by adding the following lines in the `applier` section of `config.yaml`:

```yaml
applier:
  wait_enabled: true
  retry_on_replica_failure: true
```

## Deploy the configuration

Run [deploy]({{<relref "/integrate/redis-data-integration/reference/cli/redis-di-deploy">}}) command to deploy the local configuration to the remote RDI database:

```bash
redis-di deploy
```

> Note: If you are specifying TLS `key`, `cert`, and `cacert` locations in `config.yaml` or you use one of the file patterns `${file:<location>}` or `${file:<location>:<property-name>}` for the `password` property, make sure these files exist on the Redis Enterprise nodes that host RDI shards.
 
## Validate the installation

Run `redis-di status` to check the status of the installation.

> Note that it is okay to see the warning "No streams found" since we have not yet set up a Debezium source connector. We will do this in the next step.

## Install the Debezium Server

### Configure Debezium Server's `application.properties`

{{< image filename="/images/rdi/application-properties-diagram.png" >}}

Edit the `debezium/application.properties` file in your project directory, which was created by the `scaffold` command described [above](#scaffold-configuration-files).

See the [Debezium Server configuration guide]({{<relref "/integrate/redis-data-integration/installation/debezium-server-configuration">}}) for the key configuration properties reference.

### Run Debezium Server

Follow the [Debezium Server deployment guide]({{<relref "/integrate/redis-data-integration/installation/debezium-server-deployment">}}) to deploy and run Debezium Server in either containerized or non-containerized deployment mode.

### Quick database setup using Debezium example database

In case you want a quick setup of a preconfigured database to experiment with RDI, you can use one of the [Debezium example databases](https://github.com/debezium/docker-images).

To set up a Postgres example database:

```bash
docker run -it --name example-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 debezium/example-postgres
```

## RDI configuration file (config.yaml)

### Reference guide

See [RDI configuration file reference]({{<relref "/integrate/redis-data-integration/reference/config-yaml-reference">}}) for detailed configuration file information.

### Substitutions

- `${env:var}` - environment variables. The environment variables will be prefixed with `REDIS_DI_` if not already prefixed that way.

- `${file:<FILE_NAME>:<PROPERTY_NAME>}` - specific property in the properties file.

- `${file:<FILE_NAME>}` - Reading the whole file.

- `${secrets:secret_name}` - secrets. To set the secret use the `redis-di set-secret` CLI command. The only supported secret is named `target-password`.

## Distributed installation

For information about a distributed installation (multi VM/Multi pod), see [Distributed installation]({{<relref "/integrate/redis-data-integration/installation/distributed-installation">}}).

## Installing from a Python package (whl file)

> Note: RDI CLI requires Python version 3.7 or greater.

- Set up a new virtual environment for Python:

  ```bash
  python3.7 -m venv venv  # replace with your version of Python
  ```

- Activate the virtual environment:

  ```bash
  source venv/bin/activate
  ```

- Upgrade the [pip](https://pypi.org/project/pip/) command:

  ```bash
  pip install --upgrade pip
  ```

- Install RDI CLI:

  ```bash
  pip3 install https://qa-onprem.s3.amazonaws.com/redis-di/{{<param rdi_cli_latest>}}/redis_di_cli-{{<param rdi_cli_latest>}}-py3-none-any.whl
  ```

## Upgrading

To learn how you can upgrade RDI CLI, RDI engine, and RedisGears see the [Upgrade]({{<relref "/integrate/redis-data-integration/upgrade">}}) section.

## Troubleshooting

See the [troubleshooting guide]({{<relref "/integrate/redis-data-integration/troubleshoot">}}).
