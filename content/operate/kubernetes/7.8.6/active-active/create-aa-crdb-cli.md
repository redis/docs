---
Title: Create Active-Active databases with crdb-cli
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: This section shows how to set up an Active-Active Redis Enterprise database
  on Kubernetes using the Redis Enterprise Software operator.
linkTitle: Create Active-Active with crdb-cli
weight: 99
url: '/operate/kubernetes/7.8.6/active-active/create-aa-crdb-cli/'
---
{{<note>}} Versions 6.4.2 and later support the Active-Active database controller. This controller allows you to create Redis Enterprise Active-Active databases (REAADB) and Redis Enterprise remote clusters (RERC) with custom resources. We recommend using the [REAADB method for creating Active-Active databases]({{< relref "/operate/kubernetes/7.8.6/active-active/create-reaadb.md" >}}).{{</note>}}

On Kubernetes, Redis Enterprise [Active-Active]({{< relref "/operate/rs/databases/active-active/" >}}) databases provide read-and-write access to the same dataset from different Kubernetes clusters. For more general information about Active-Active, see the [Redis Enterprise Software docs]({{< relref "/operate/rs/databases/active-active/" >}}).

Creating an Active-Active database requires routing [network access]({{< relref "/operate/kubernetes/7.8.6/networking/" >}}) between two Redis Enterprise clusters residing in different Kubernetes clusters. Without the proper access configured for each cluster, syncing between the databases instances will fail.

This process consists of:

1. Documenting values to be used in later steps. It's important these values are correct and consistent.
1. Editing the Redis Enterprise cluster (REC) spec file to include the `ActiveActive` section. This will be slightly different depending on the K8s distribution you are using.
1. Creating the database with the `crdb-cli` command. These values must match up with values in the REC resource spec.

## Prerequisites

Before creating Active-Active databases, you'll need admin access to two or more working Kubernetes clusters that each have:

- Routing for external access with an [ingress resources]({{< relref "/operate/kubernetes/7.8.6/networking/ingress.md" >}}) (or [route resources]({{< relref "/operate/kubernetes/7.8.6/networking/routes.md" >}}) on OpenShift).
- A working [Redis Enterprise cluster (REC)]({{< relref "/operate/kubernetes/7.8.6/reference/redis_enterprise_cluster_api" >}}) with a unique name.
- Enough memory resources available for the database (see [hardware requirements]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/hardware-requirements.md" >}})).

{{<note>}} The `activeActive` field and the `ingressOrRouteSpec` field cannot coexist in the same REC. If you configured your ingress via the `ingressOrRouteSpec` field in the REC, create your Active-Active database with the RedisEnterpriseActiveActiveDatabase (REAADB) custom resource.{{</note>}}

## Document required parameters

The most common mistake when setting up Active-Active databases is incorrect or inconsistent parameter values. The values listed in the resource file must match those used in the crdb-cli command.

- **Database name** `<db-name>`:
  - Description: Combined with ingress suffix to create the Active-Active database hostname
  - Format: string
  - Example value: `myaadb`
  - How you get it: you choose
  - The database name requirements are:
       - Maximum of 63 characters
       - Only letter, number, or hyphen (-) characters
       - Starts with a letter; ends with a letter or digit.
       - Database name is not case-sensitive

You'll need the following information for each participating Redis Enterprise cluster (REC):

{{<note>}}
You'll need to create DNS aliases to resolve your API hostname `<api-hostname>`,`<ingress-suffix>`, `<replication-hostname>` to the IP address for the ingress controller’s LoadBalancer (or routes in Openshift) for each database. To avoid entering multiple DNS records, you can use a wildcard in your alias (such as *.ijk.example.com).
{{</note>}}

- **REC hostname** `<rec-hostname>`:
  - Description: Hostname used to identify your Redis Enterprise cluster in the `crdb-cli` command. This MUST be different from other participating clusters.
  - Format: `<rec-name>.<namespace>.svc.cluster.local`
  - Example value: `rec01.ns01.svc.cluster.local`
  - How to get it: List all your Redis Enterprise clusters
      ```bash
      kubectl get rec
      ```
- **API hostname** `<api-hostname>`:
  - Description: Hostname used to access the Redis Enterprise cluster API from outside the K8s cluster
  - Format: string
  - Example value: `api.ijk.example.com`
- **Ingress suffix** `<ingress-suffix>`:
  - Description: Combined with database name to create the Active-Active database hostname
  - Format: string
  - Example value: `-cluster.ijk.example.com`
- [**REC admin credentials**]({{< relref "/operate/kubernetes/7.8.6/security/manage-rec-credentials.md" >}}) `<username> <password>`:
  - Description: Admin username and password for the REC stored in a secret
  - Format: string
  - Example value: username: `user@example.com`, password: `something`
  - How to get them:
    ```sh
    kubectl get secret <rec-name> \
      -o jsonpath='{.data.username}' | base64 --decode
    kubectl get secret <rec-name> \
      -o jsonpath='{.data.password}' | base64 --decode
    ```
- **Replication hostname** `<replication-hostname>`:
  - Description: Hostname used inside the ingress for the database
  - Format: `<db-name><ingress-suffix>`
  - Example value: `myaadb-cluster.ijk.example.com`
  - How to get it: Combine `<db-name>` and `<ingress-suffix`> values you documented above.
- **Replication endpoint** `<replication-endpoint>`:
  - Description: Endpoint used externally to contact the database
  - Format: `<db-name><ingress-suffix>:443`
  - Example value: `myaadb-cluster.ijk.example.com:443`
  - How to get it:`<replication-hostname>:443`

## Add `activeActive` section to the REC resource file

From inside your K8s cluster, edit your Redis Enterprise cluster (REC) resource to add the following to the `spec` section. Do this for each participating cluster.

 The operator uses the API hostname (`<api-hostname>`) to create an ingress to the Redis Enterprise cluster's API; this only happens once per cluster. Every time a new Active-Active database instance is created on this cluster, the operator creates a new ingress route to the database with the ingress suffix (`<ingress-suffix>`). The hostname for each new database will be in the format <nobr>`<db-name><ingress-suffix>`</nobr>.

### Using ingress controller

1. If your cluster uses an [ingress controller]({{< relref "/operate/kubernetes/7.8.6/networking/ingress.md" >}}), add the following to the `spec` section of your REC resource file.

  Nginx:

  ```sh
  activeActive:
    apiIngressUrl: <api-hostname>
    dbIngressSuffix: <ingress-suffix>
    ingressAnnotations:
       kubernetes.io/ingress.class: nginx
      nginx.ingress.kubernetes.io/backend-protocol: HTTPS
      nginx.ingress.kubernetes.io/ssl-passthrough: "true"
    method: ingress
  ```

HAproxy:

  ```sh
  activeActive:
    apiIngressUrl: <api-hostname>
    dbIngressSuffix: <ingress-suffix>
    ingressAnnotations:
      kubernetes.io/ingress.class: haproxy
       ingress.kubernetes.io/ssl-passthrough: "true"
    method: ingress
  ```

2. After the changes are saved and applied, you can verify a new ingress was created for the API.

    ```sh
    $ kubectl get ingress
    NAME   HOSTS                            ADDRESS                                 PORTS   AGE
    rec01  api.abc.cde.example.com  225161f845b278-111450635.us.cloud.com   80      24h
    ```

3. Verify you can access the API from outside the K8s cluster.

    ```sh
   curl -k -L -i -u <username>:<password> https://<api-hostname>/v1/cluster
    ```

    If the API call fails, create a DNS alias that resolves your API hostname (`<api-hostname>`) to the IP address for the ingress controller's LoadBalancer.

4. Make sure you have DNS aliases for each database that resolve your API hostname `<api-hostname>`,`<ingress-suffix>`, `<replication-hostname>` to the IP address of the ingress controller’s LoadBalancer. To avoid entering multiple DNS records, you can use a wildcard in your alias (such as `*.ijk.example.com`).

#### If using Istio Gateway and VirtualService

No changes are required to the REC spec if you are using [Istio]({{< relref "/operate/kubernetes/7.8.6/networking/istio-ingress.md" >}}) in place of an ingress controller. The `activeActive` section added above creates ingress resources. The two custom resources used to configure Istio (Gateway and VirtualService) replace the need for ingress resources.

{{<warning>}}
These custom resources are not controlled by the operator and will need to be configured and maintained manually.
{{</warning>}}

For each cluster, verify the VirtualService resource has two `- match:` blocks in the `tls` section. The hostname under `sniHosts:` should match your `<replication-hostname>`.

### Using OpenShift routes

1. Make sure your Redis Enterprise cluster (REC) has a different name (`<rec-name.namespace>`) than any other participating clusters. If not, you'll need to manually rename the REC or move it to a different namespace.
            You can check your new REC name with:
    ```sh
    oc get rec -o jsonpath='{.items[0].metadata.name}'
    ```

    If the rec name was modified, reapply [scc.yaml](https://github.com/RedisLabs/redis-enterprise-k8s-docs/blob/master/openshift/scc.yaml) to the namespace to reestablish security privileges.
    
    ```sh
    oc apply -f scc.yaml
    oc adm policy add-scc-to-group redis-enterprise-scc-v2  system:serviceaccounts:<namespace>
    ```

    Releases before 6.4.2-6 use the earlier version of the SCC, named `redis-enterprise-scc`.

1. Make sure you have DNS aliases for each database that resolve your API hostname `<api-hostname>`,`<ingress-suffix>`, `<replication-hostname>` to the route IP address. To avoid entering multiple DNS records, you can use a wildcard in your alias (such as `*.ijk.example.com`).

1. If your cluster uses [OpenShift routes]({{< relref "/operate/kubernetes/7.8.6/networking/routes.md" >}}), add the following to the `spec` section of your Redis Enterprise cluster (REC) resource file.

      ```sh
      activeActive:
        apiIngressUrl: <api-hostname>
        dbIngressSuffix: <ingress-suffix>
        method: openShiftRoute
      ```

1. Make sure you have DNS aliases that resolve to the routes IP for both the API hostname (`<api-hostname>`) and the replication hostname (`<replication-hostname>`) for each database. To avoid entering each database individually, you can use a wildcard in your alias (such as `*.ijk.example.com`).

1. After the changes are saved and applied, you can see that a new route was created for the API.

    ```sh
    $ oc get route
    NAME    HOST/PORT                       PATH    SERVICES  PORT  TERMINATION   WILDCARD
    rec01   api-openshift.apps.abc.example.com rec01   api             passthrough   None
    ```

## Create an Active-Active database with `crdb-cli`

The `crdb-cli` command can be run from any Redis Enterprise pod hosted on any participating K8s cluster. You'll need the values for the [required parameters]({{< relref "/operate/kubernetes/7.8.6/active-active/create-aa-crdb-cli#document-required-parameters" >}}) for each Redis Enterprise cluster.

```sh
crdb-cli crdb create \
  --name <db-name> \
  --memory-size <mem-size> \
  --encryption yes \
  --instance fqdn=<rec-hostname-01>,url=https://<api-hostname-01>,username=<username-01>,password=<password-01>,replication_endpoint=<replication-endpoint-01>,replication_tls_sni=<replication-hostname-01> \
  --instance fqdn=<rec-hostname-02>,url=https://<api-hostname-02>,username=<username-02>,password=<password-02>,replication_endpoint=<replication-endpoint-02>,replication_tls_sni=<replication-hostname-02>
```

To create a database that syncs between more than two instances, add additional `--instance` arguments.

See the [`crdb-cli` reference]({{< relref "/operate/rs/references/cli-utilities/crdb-cli" >}}) for more options.

## Test your database

The easiest way to test your Active-Active database is to set a key-value pair in one database and retrieve it from the other.

You can connect to your databases with the instructions in [Manage databases]({{< relref "/operate/kubernetes/7.8.6/re-databases/db-controller#connect-to-a-database" >}}). Set a test key with `SET foo bar` in the first database. If your Active-Active deployment is working properly, when connected to your second database, `GET foo` should output `bar`.
