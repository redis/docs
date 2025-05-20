---
Title: Install on Kubernetes
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how to install RDI on Kubernetes
group: di
hideListLinks: false
linkTitle: Install on K8s
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 20
---

This guide explains how to use the RDI [Helm chart](https://helm.sh/docs/topics/charts/)
to install on [Kubernetes](https://kubernetes.io/) (K8s). You can also
[Install RDI on VMs]({{< relref "/integrate/redis-data-integration/installation/install-vm" >}}).

The installation creates the following K8s objects:

-   A K8s [namespace](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/) named `rdi`.
    You can also use a different namespace name if you prefer.
-   [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) and 
    [services](https://kubernetes.io/docs/concepts/services-networking/service/) for the 
    [RDI operator]({{< relref "/integrate/redis-data-integration/architecture#how-rdi-is-deployed" >}}),
    [metrics exporter]({{< relref "/integrate/redis-data-integration/observability" >}}), and API server.
-   A [service account](https://kubernetes.io/docs/concepts/security/service-accounts/) 
    and [RBAC resources](https://kubernetes.io/docs/reference/access-authn-authz/rbac) for the RDI operator.
-   A [ConfigMap](https://kubernetes.io/docs/concepts/configuration/configmap/) with RDI database details.
-   [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
    with the RDI database credentials and TLS certificates.
-   Other optional K8s resources such as [ingresses](https://kubernetes.io/docs/concepts/services-networking/ingress/) 
    that can be enabled depending on your K8s environment and needs.

You can use this installation on [OpenShift](https://docs.openshift.com/) and other K8s distributions
including cloud providers' K8s managed clusters.

You can configure the RDI Helm chart to pull the RDI images from [dockerhub](https://hub.docker.com/u/redis) 
or from your own [private image registry](#using-a-private-image-registry).

## Before you install

Complete the following steps before installing the RDI Helm chart:

-   [Create the RDI database](#create-the-rdi-database) on your Redis Enterprise cluster.

-   Create a [user]({{< relref "/operate/rs/security/access-control/create-users" >}})
    for the RDI database if you prefer not to use the default password (see
    [Access control]({{< relref "/operate/rs/security/access-control" >}}) for
    more information).

-   Download the RDI Helm chart tar file from the
    [Redis download center](https://redis-enterprise-software-downloads.s3.amazonaws.com/redis-di/rdi-{{< rdi-version >}}.tgz) (in the *Modules, Tools & Integration* category) .

    ```bash
    export RDI_VERSION={{< rdi-version >}}
    wget https://redis-enterprise-software-downloads.s3.amazonaws.com/redis-di/rdi-$RDI_VERSION.tgz
    ```

-   If you want to use a private image registry,
    [prepare it with the RDI images](#using-a-private-image-registry).

### Create the RDI database

RDI uses a database on your Redis Enterprise cluster to store its state
information. Use the Redis Enterprise Cluster Manager UI to create the RDI database with the following
requirements:

{{< embed-md "rdi-db-reqs.md" >}}

You should then provide the details of this database in the [`values.yaml`](#the-valuesyaml-file)
file as described below.

### Using a private image registry

Add the RDI images from [dockerhub](https://hub.docker.com/u/redis) to your local registry.
You need the following RDI images with tags matching the RDI version you want to install:

-   [redis/rdi-api](https://hub.docker.com/r/redis/rdi-api)
-   [redis/rdi-operator](https://hub.docker.com/r/redis/rdi-operator)
-   [redis/rdi-monitor](https://hub.docker.com/r/redis/rdi-monitor)
-   [redis/rdi-processor](https://hub.docker.com/r/redis/rdi-processor)
-   [redis/rdi-collector-api](https://hub.docker.com/r/redis/rdi-collector-api)
-   [redis/rdi-collector-initializer](https://hub.docker.com/r/redis/rdi-collector-initializer)

In addition, the RDI Helm chart uses the following 3rd party images:

-   [redislabs/debezium-server:3.0.8.Final-rdi.1](https://hub.docker.com/r/redislabs/debezium-server), 
    based on `quay.io/debezium/server/3.0.8.Final` with minor modifications: 
    [Debezium](https://debezium.io/), an open source distributed platform for change data capture.
-   [redis/reloader:v1.1.0](https://hub.docker.com/r/redis/reloader), originally `ghcr.io/stakater/reloader:v1.1.0`: 
    [Reloader](https://github.com/stakater/Reloader), a K8s controller to watch changes to ConfigMaps 
    and Secrets and do rolling upgrades.
-   [redis/kube-webhook-certgen:v20221220-controller-v1.5.1-58-g787ea74b6](https://hub.docker.com/r/redis/kube-webhook-certgen), 
    originally `registry.k8s.io/ingress-nginx/kube-webhook-certgen/v20221220-controller-v1.5.1-58-g787ea74b6`: 
    [kube-webhook-certgen](https://github.com/jet/kube-webhook-certgen), K8s webhook certificate generator and patcher.

The example below shows how to specify the registry and image pull secret in your
[`rdi-values.yaml`](#the-valuesyaml-file) file for the Helm chart:

```yaml
global:
  # Global image settings.
  # If using a private image registry, update the default values accordingly.
  image:
    registry: your-registry
    repository: your-repository # If different from "redis"
  
  # Image pull secrets to be used when using a private image registry.
  imagePullSecrets:
    - name: your-secret-name
```

To pull images from a private image registry, you must provide the image pull secret and in some cases also set the permissions. Follow the links below to learn how to use a private registry with:

-   [Rancher](https://ranchermanager.docs.rancher.com/how-to-guides/new-user-guides/kubernetes-resources-setup/kubernetes-and-docker-registries#using-a-private-registry)
-   [OpenShift](https://docs.openshift.com/container-platform/4.17/openshift_images/managing_images/using-image-pull-secrets.html)
-   [Amazon Elastic Kubernetes Service (EKS)](https://docs.aws.amazon.com/AmazonECR/latest/userguide/ECR_on_EKS.html)
-   [Google Kubernetes Engine (GKE)](https://cloud.google.com/artifact-registry/docs/pull-cached-dockerhub-images)
-   [Azure Kubernetes Service (AKS)](https://learn.microsoft.com/en-us/azure/aks/cluster-container-registry-integration?tabs=azure-cli)

## Supported versions of Kubernetes and OpenShift

{{< embed-md "rdi-k8s-reqs.md" >}}

## Install the RDI Helm chart

1.  Scaffold the default `values.yaml` file from the chart into a local
    `rdi-values.yaml` file:

    ```bash
    helm show values rdi-<tag>.tar.gz > rdi-values.yaml
    ```

1.  Open the `rdi-values.yaml` file you just created, change or add the appropriate
    values for your installation, and delete the values you have not changed to 
    use their default values. 
    See [The `values.yaml` file](#the-valuesyaml-file) for more details.

1.  Run the `helm upgrade --install` command:

    ```bash
    helm upgrade --install rdi rdi-<tag>.tar.gz -f rdi-values.yaml -n rdi --create-namespace
    ```

    {{< note >}}The above command will install RDI in a namespace called
    `rdi`. If you want to use a different namespace, pass the option
    `-n <custom-namespace>` to the `helm install` command instead.
    {{< /note >}} 

### The `values.yaml` file

The [`values.yaml`](https://helm.sh/docs/topics/charts/#templates-and-values) file inside the
Helm chart contains the values you can set for the RDI Helm installation.
See the comments by each value for more information about the values you may need to add or change 
depending on your use case.

At a minimum, you must set the values of `connection.host`, `connection.port`, and `connection.password`
to enable the basic connection to the RDI database. 
You must also set `api.jwtKey`, RDI uses this value to encrypt the
[JSON web token (JWT)](https://jwt.io/) token used by RDI API. Best practice is
to generate a value containing 32 random bytes of data (equivalent to 256
bits) and then encode this value as ASCII characters. Use the following
command to generate the random key from the
[`urandom` special file](https://en.wikipedia.org/wiki//dev/random):

```bash
head -c 32 /dev/urandom | base64
```

If you use TLS to connect to the RDI database, you must set the
CA certificate content in `connection.ssl.cacert` (for TLS). In addition, if you
also use mTLS, you must set the client certificate and private key contents in
`connection.ssl.cert`, and `connection.ssl.key`. 

-   You can add the certificate content directly in the `rdi-values.yaml` file
    as follows:

    ```yaml
    connection:
      ssl:
        enabled: true
        cacert: |
          -----BEGIN CERTIFICATE-----
          ...
          -----END CERTIFICATE-----
        cert: |
          -----BEGIN CERTIFICATE-----
          ...
          -----END CERTIFICATE-----
        key: |
          -----BEGIN PRIVATE KEY-----
          ...
          -----END PRIVATE KEY-----
    ```

-   Alternatively, you can use the `--set-file` argument to set these values to
    the content of your certificate files as follows:

    ```bash
    helm upgrade --install rdi rdi-<tag>.tar.gz -f rdi-values.yaml -n rdi --create-namespace \
      --set connection.ssl.enabled=true \
      --set-file connection.ssl.cacert=<path-to-CA-certificate> \
      --set-file connection.ssl.cert=<path-to-client-certificate> \
      --set-file connection.ssl.key=<path-to-client-key>
    ```

## Check the installation

To verify the status of the K8s deployment, run the following command:

```bash
helm list -n rdi
```

The output looks like the following. Check that the `rdi` release is listed.
With RDI 1.8.0 or later, check that the `default` release is also listed.

```
NAME   	NAMESPACE	REVISION	UPDATED         STATUS  	CHART         	APP VERSION
default	rdi      	1       	2025-05-08 ... 	deployed	pipeline-0.1.0	<tag>
rdi    	rdi      	3       	2025-05-08 ...	deployed	rdi-1.0.0      	
```

Also, check that all pods have `Running` status:

```bash
kubectl get pod -n rdi

NAME                      READY  STATUS  	RESTARTS  AGE
collector-api-<id>        1/1    Running  0         29m
rdi-api-<id>              1/1 	 Running 	0      	  29m
rdi-metric-exporter-<id>  1/1    Running 	0      	  29m
rdi-operator-<id>         1/1 	 Running 	0      	  29m
rdi-reloader-<id>         1/1 	 Running 	0      	  29m
```

You can verify that the RDI API works by adding a connection to the RDI API server to
[Redis Insight]({{< relref "/develop/tools/insight/rdi-connector" >}}).

## Using ingress controllers

You must ensure that an appropriate
[ingress controller](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/)
is available in your K8s cluster to expose the RDI API service via the K8s
[`Ingress`](https://kubernetes.io/docs/concepts/services-networking/ingress/)
resource. Follow the documentation of your cloud provider or of
the ingress controller to install the controller correctly.

### Using the `nginx` ingress controller on AKS

On AKS, if you want to use the open source
[`nginx`](https://nginx.org/)
[ingress controller](https://github.com/kubernetes/ingress-nginx/blob/main/README.md#readme)
rather than the
[AKS application routing add-on](https://learn.microsoft.com/en-us/azure/aks/app-routing),
follow the AKS documentation for
[creating an unmanaged ingress controller](https://learn.microsoft.com/en-us/troubleshoot/azure/azure-kubernetes/load-bal-ingress-c/create-unmanaged-ingress-controller?tabs=azure-cli).
Specifically, ensure that one or both of the following Helm chart values is set:

- `controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-health-probe-request-path"=/healthz`
- `controller.service.externalTrafficPolicy=Local`

## Prepare your source database

Before deploying a pipeline, you must configure your source database to enable CDC. See the
[Prepare source databases]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs" >}})
section to learn how to do this.

## Deploy a pipeline

When the Helm installation is complete and you have prepared the source database for CDC,
you are ready to start using RDI.
Use [Redis Insight]({{< relref "/develop/tools/insight/rdi-connector" >}}) to
[configure]({{< relref "/integrate/redis-data-integration/data-pipelines/data-pipelines" >}}) and
[deploy]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy" >}})
your pipeline.

## Uninstall RDI

If you want to remove your RDI K8s installation, first run
the following commands. (If you installed RDI into a custom namespace then
replace `rdi` with the name of your namespace.)

```bash
kubectl delete pipeline default -n rdi
helm uninstall rdi -n rdi
kubectl delete namespace rdi
```

{{< note >}}The line `kubectl delete pipeline default -n rdi` is only needed for RDI 1.8.0 or above.
{{< /note >}}

If you also want to delete the keys from your RDI database, connect to it with
[`redis-cli`]({{< relref "/develop/tools/cli" >}}) and run a
[`FLUSHALL`]({{< relref "/commands/flushall" >}}) command.
