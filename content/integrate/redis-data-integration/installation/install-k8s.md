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
weight: 2
---

This guide explains how to use the RDI [Helm chart](https://helm.sh/docs/topics/charts/)
to install on [Kubernetes](https://kubernetes.io/) (K8s). You can also
[Install RDI on VMs]({{< relref "/integrate/redis-data-integration/installation/install-vm" >}}).

The installation creates the following K8s objects:

-   A K8s [namespace](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/) named `rdi`.
-   [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) for the 
    [RDI operator]({{< relref "/integrate/redis-data-integration/architecture#how-rdi-is-deployed" >}}),
    [metrics exporter]({{< relref "/integrate/redis-data-integration/observability" >}}), and API server.
-   A [service account](https://kubernetes.io/docs/concepts/security/service-accounts/) along with a
    [role](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#restrictions-on-role-creation-or-update)
    and [role binding](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#rolebinding-and-clusterrolebinding) for the RDI operator
-   A [Configmap](https://kubernetes.io/docs/concepts/configuration/configmap/)
    for the different components with RDI Redis database details
-   [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
    with the RDI Redis database credentials and TLS certificates

You can use this installation on [OpenShift](https://docs.openshift.com/) and other K8s distributions
including cloud providers' K8s managed clusters.

You can pull the RDI images from
[Docker Hub](https://hub.docker.com/) or from your own [private image registry](#using-a-private-image-registry).

## Before you install

Complete the following steps before running Helm:

-   Create the RDI database on your Redis Enterprise cluster.
-   Create a [user]({{< relref "/operate/rs/security/access-control/create-users" >}})
    for the RDI database if you prefer not to use the default password (see
    [Access control]({{< relref "/operate/rs/security/access-control" >}}) for
    more information).
-   Download the RDI helm chart tar file from the [download center](https://cloud.redis.io/#/rlec-downloads).

### Using a private image registry

Add the RDI images from [Docker Hub](https://hub.docker.com/) to your local registry.
The example below shows how to specify the registry and image pull secret in `values.yaml`:

```yaml
global:
 imagePullSecrets: []
 # - name: "image-pull-secret"
 # or
 # - "image-pull-secret"


 image:
   registry: docker.io
   repository: redis
```

To pull images from a local registry, you must provide the image pull secret and in some cases also set the permissions. Follow the links below to learn how to use a private registry with:

-   [Rancher](https://ranchermanager.docs.rancher.com/how-to-guides/new-user-guides/kubernetes-resources-setup/kubernetes-and-docker-registries#using-a-private-registry)
-   [OpenShift](https://docs.openshift.com/container-platform/4.17/openshift_images/managing_images/using-image-pull-secrets.html)
-   [Amazon Elastic Kubernetes Service (EKS)](https://docs.aws.amazon.com/AmazonECR/latest/userguide/ECR_on_EKS.html)
-   [Google Kubernetes Engine (GKE)](https://cloud.google.com/artifact-registry/docs/pull-cached-dockerhub-images)
-   [Azure Kubernetes Service (AKS)](https://learn.microsoft.com/en-us/azure/aks/cluster-container-registry-integration?tabs=azure-cli)

## Install the RDI Helm chart

1.  Decompress the tar file:

    ```bash
	tar -xvf rdi-k8s-<rdi-tag>.tar.gz 
    ```

1.  Open the `values.yaml` file and set the appropriate values (see list of values below).

1.  Start the installation:

    ```bash
    helm install <The logical chart name> rdi-k8s/<rdi-tag>/helm 
    ```

## Check the installation

To verify the status of the K8s deployment, run the following command:

```bash
helm list -n monitoring -n rdi
```

The output looks like the following. Check that `<logical_chart_name>` has
the value `IDT` in the `STATUS` column.

```
NAME 	             NAMESPACE    REVISION    UPDATED                STATUS    CHART   	 APP VERSION
<logical_chart_name>    rdi 		 1      2024-10-10 16:53... +0300 IDT    deployed    rdi-1.0.0        	
```


Also, check that the following pods have `Running` status:

```bash
sudo k3s kubectl get  pod -n rdi

NAME                              READY  STATUS  	RESTARTS   AGE
rdi-api-<id>                       1/1 	 Running 	   0      	29m
rdi-metric-<id>l                   1/1   Running 	   0      	29m
rdi-operator-<id>                  1/1 	 Running 	   0      	29m
<logical_chart_name>-reloader-<id> 1/1 	 Running 	   0      	29m
collector-api-<id>                 1/1   Running       0        29m
```

You can verify that the RDI API works by adding the server in
[Redis Insight]({{< relref "/develop/connect/insight/rdi-connector" >}}).

## Prepare your source database

You must also configure your source database to use the CDC connector. See the
[Prepare source databases]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs" >}})
section to learn how to do this.

## Deploy a pipeline

When the Helm installation is complete,  and you have prepared the source database for CDC,
you are ready to start using RDI. See the guides to
[configuring]({{< relref "/integrate/redis-data-integration/data-pipelines/data-pipelines" >}}) and
[deploying]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy" >}})
RDI pipelines for more information. You can also configure and deploy a pipeline
using [Redis Insight]({{< relref "/develop/connect/insight/rdi-connector" >}}).
