---
Title: Manage Redis Enterprise databases for Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: This section describes how the database controller provides the ability
  to create, manage, and use databases via a database custom resource.
linkTitle: Manage databases
weight: 5
url: '/operate/kubernetes/7.8.6/re-databases/db-controller/'
---
## Redis Enterprise database (REDB) lifecycle

A Redis Enterprise database (REDB) is created with a custom resource file. The custom resource defines the size, name, and other specifications for the REDB. The database is created when you apply the custom resource file.

The database controller in Redis Enterprise for Kubernetes:

- Discovers the custom resource
- Makes sure the REDB is created in the same namespace as the Redis Enterprise cluster (REC)
- Maintains consistency between the custom resource and the REDB

The database controller recognizes the new custom resource and validates the specification.
If valid, the controller combines the values specified in
the custom resource with default values to create a full specification. It then uses this full specification to create the
database on the specified Redis Enterprise cluster (REC).

Once the database is created, it is exposed with the same service mechanisms by the service rigger for the Redis Enterprise cluster.
If the database [custom resource is deleted]({{< relref "/operate/kubernetes/7.8.6/re-clusters/delete-custom-resources" >}}), the database and its services are deleted from the cluster.

### Flexible deployment options

Databases in multiple namespaces can be managed by the same operator. To learn more, see [Manage databases in multiple namespaces]({{<relref "/operate/kubernetes/7.8.6/re-clusters/multi-namespace">}}).

To learn more about designing a multi-namespace Redis Enterprise cluster, see [flexible deployment options]({{< relref "/operate/kubernetes/7.8.6/architecture/deployment-options.md" >}}).

## Create a database

Your Redis Enterprise database custom resource must be of the `kind: RedisEnterpriseDatabase` and have values for `name` and `memorySize`. All other values are optional and will be defaults if not specified.

1. Create a file (in this example mydb.yaml) that contains your database custom resource.

    ```YAML
    apiVersion: app.redislabs.com/v1alpha1
    kind: RedisEnterpriseDatabase
    metadata:
      name: mydb
    spec:
      memorySize: 1GB
    ```

    To create a REDB in a different namespace from your REC, you need to specify the cluster with `redisEnterpriseCluster` in the `spec` section of your RedisEnterpriseDatabase custom resource.

     ```YAML
     redisEnterpriseCluster:
       name: rec
     ```

1. Apply the file in the namespace you want your database to be in.

    ```sh
    kubectl apply -f mydb.yaml
    ```

1. Check the status of your database.

    ```sh
    kubectl get redb mydb -o jsonpath="{.status.status}"
    ```

    When the status is `active`, the database is ready to use.

## Modify a database

The custom resource defines the properties of the database.
To change the database, you can edit your original specification and apply the change or use `kubectl edit`.

To modify the database:

1. Edit the definition:

    ```sh
    kubectl edit redb mydb
    ```

1. Change the specification (only properties in `spec` section) and save the changes.  
    For more details, see [RedisEnterpriseDatabaseSpec](https://github.com/RedisLabs/redis-enterprise-k8s-docs/blob/master/redis_enterprise_database_api.md#redisenterprisedatabasespec) or [Options for Redis Enterprise databases]({{< relref "/operate/kubernetes/7.8.6/reference/redis_enterprise_database_api" >}}). 

1. Monitor the status to see when the changes take effect:

    ```sh
    kubectl get redb mydb -o jsonpath="{.status.status}"
    ```

    When the status is `active`, the database is ready for use.

## Delete a database

The database exists as long as the custom resource exists.
If you delete the custom resource, the database controller deletes the database.
The database controller removes the database and its services from the cluster.

To delete a database, run:

```sh
kubectl delete redb mydb
```

## Connect to a database

After the database controller creates a database, the services for accessing the database are created in the same namespace. By default there are two services, one 'ClusterIP' service and one 'headless' service.  
Connection information for the database is stored in a Kubernetes [secret](https://kubernetes.io/docs/concepts/configuration/secret/) maintained by the database controller. This secret contains:

- The database port (`port`)
- A comma separated list of service names (`service_names`)
- The database password for authenticating (`password`)

The name of that secret is stored in the database custom resource.

{{<note>}}
Use these steps to connect to your database from within your K8s cluster. To access your database from outside the K8s cluster, set up the [Ingress]({{< relref "/operate/kubernetes/7.8.6/networking/ingress.md" >}}) controller or use OpenShift routes.
{{</note>}}

1. Retrieve the secret name.

    ```sh
    kubectl get redb mydb -o jsonpath="{.spec.databaseSecretName}"
    ```

      The database secret name usually takes the form of `redb-<database_name>`, so in our example it will be `redb-mydb`.

1. Retrieve and decode the password.

    ```sh
    kubectl get secret redb-mydb -o jsonpath="{.data.password}" | base64 --decode
    ```

1. Retrieve and decode the port number.

    ```sh
    kubectl get secret redb-mydb -o jsonpath="{.data.port}" | base64 --decode
    ```

1. Retrieve and decode the service_names.

    ```sh
    kubectl get secret redb-mydb -o jsonpath="{.data.service_names}" | base64 --decode
    ```

    You'll need to pick just one service listed here to use for connecting.

1. From a pod within your cluster, use `redis-cli` to connect to your database.

    ```sh
    redis-cli -h <service_name> -p <port>
    ```

1. Enter the password you retrieved from the secret.

    ```sh
    auth <password>
    ```

    You are now connected to your database!
