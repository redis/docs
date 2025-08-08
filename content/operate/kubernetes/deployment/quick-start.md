---
Title: Deploy Redis Enterprise Software for Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: How to install Redis Enterprise Software for Kubernetes.
linkTitle: Kubernetes
weight: 10
---
To deploy Redis Enterprise Software for Kubernetes and start your Redis Enterprise cluster (REC), you need to do the following:

- Create a new namespace in your Kubernetes cluster.
- Download the operator bundle.
- Apply the operator bundle and verify it's running.
- Create a Redis Enterprise cluster (REC).

This guide works with most supported Kubernetes distributions. If you're using OpenShift, see [Redis Enterprise on OpenShift]({{< relref "/operate/kubernetes/deployment/openshift" >}}). For details on what is currently supported, see [supported distributions]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}).

## Prerequisites

To deploy Redis Enterprise for Kubernetes, you'll need:

- Kubernetes cluster in a [supported distribution]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions" >}})
- minimum of three worker nodes
- Kubernetes client (kubectl)
- access to DockerHub, RedHat Container Catalog, or a private repository that can hold the required images.

If you suspect your file descriptor limits are below 100,000, you must either manually increase limits or [Allow automatic resource adjustment]({{< relref "/operate/kubernetes/security/allow-resource-adjustment" >}}). Most major cloud providers and standard container runtime configurations set default file descriptor limits well above the minimum required by Redis Enterprise. In these environments, you can safely run without enabling automatic resource adjustment.

{{<note>}}If you are applying version 7.8.2-6 or above, check if the [OS](https://redis.io/docs/latest/operate/kubernetes/release-notes/7-8-2-releases/7-8-2-6-nov24/#breaking-changes) installed on the node is supported.{{</note>}}

### Create a new namespace

**Important:** Each namespace can only contain one Redis Enterprise cluster. Multiple RECs with different operator versions can coexist on the same Kubernetes cluster, as long as they are in separate namespaces.

Throughout this guide, each command is applied to the namespace in which the Redis Enterprise cluster operates.

1. Create a new namespace

    ```sh
   kubectl create namespace <rec-namespace>
   ```

1. Change the namespace context to make the newly created namespace default for future commands.

    ```sh
    kubectl config set-context --current --namespace=<rec-namespace>
   ```

You can use an existing namespace as long as it does not contain any existing Redis Enterprise cluster resources. It's best practice to create a new namespace to make sure there are no Redis Enterprise resources that could interfere with the deployment.

## Install the operator

Redis Enterprise for Kubernetes bundle is published as a container image. A list of required images is available in the [release notes]({{< relref "/operate/kubernetes/release-notes/_index" >}}) for each version.

The operator [definition and reference materials](https://github.com/RedisLabs/redis-enterprise-k8s-docs) are available on GitHub. The operator definitions are [packaged as a single generic YAML file](https://github.com/RedisLabs/redis-enterprise-k8s-docs/blob/master/bundle.yaml).

{{<note>}}
If you do not pull images from DockerHub or another public registry, you need to use a [private container registry]({{< relref "/operate/kubernetes/deployment/container-images#manage-image-sources" >}}).
{{</note>}}

### Download the operator bundle

Pull the latest version of the operator bundle:

```sh
VERSION=`curl --silent https://api.github.com/repos/RedisLabs/redis-enterprise-k8s-docs/releases/latest | grep tag_name | awk -F'"' '{print $4}'`
```

  If you need a different release, replace `VERSION` with a specific release tag.

  Check version tags listed with the [operator releases on GitHub](https://github.com/RedisLabs/redis-enterprise-k8s-docs/releases) or by [using the GitHub API](https://docs.github.com/en/rest/reference/repos#releases) to ensure the version of the bundle is correct.

### Deploy the operator bundle

Apply the operator bundle in your REC namespace:

```sh
kubectl apply -f https://raw.githubusercontent.com/RedisLabs/redis-enterprise-k8s-docs/$VERSION/bundle.yaml
```

  You should see a result similar to this:

  ```sh
  role.rbac.authorization.k8s.io/redis-enterprise-operator created
  serviceaccount/redis-enterprise-operator created
  rolebinding.rbac.authorization.k8s.io/redis-enterprise-operator created
  customresourcedefinition.apiextensions.k8s.io/redisenterpriseclusters.app.redislabs.com configured
  customresourcedefinition.apiextensions.k8s.io/redisenterprisedatabases.app.redislabs.com configured
  deployment.apps/redis-enterprise-operator created
  ```

{{<warning>}}DO NOT modify or delete the StatefulSet created during the deployment process. Doing so could destroy your Redis Enterprise cluster (REC).{{</warning>}}

#### Verify the operator is running

Check the operator deployment to verify it's running in your namespace:

```sh
kubectl get deployment redis-enterprise-operator
```

You should see a result similar to this:

```sh
NAME                        READY   UP-TO-DATE   AVAILABLE   AGE
redis-enterprise-operator   1/1     1            1           0m36s
```

## Create a Redis Enterprise cluster (REC)

A Redis Enterprise cluster (REC) is created from a `RedisEnterpriseCluster` custom resource
that contains cluster specifications.

The following example creates a minimal Redis Enterprise cluster. See the [RedisEnterpriseCluster API reference]({{<relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api">}}) for more information on the various options available.

{{<note>}}
If you suspect your file descriptor limits are below 100,000, you must either manually increase limits or [Allow automatic resource adjustment]({{< relref "/operate/kubernetes/security/allow-resource-adjustment" >}}). Most major cloud providers and standard container runtime configurations set default file descriptor limits well above the minimum required by Redis Enterprise. In these environments, you can safely run without enabling automatic resource adjustment.
{{</note>}}

1. Create a file that defines a Redis Enterprise cluster with three nodes.

    {{<note>}}
The REC name (`my-rec` in this example) cannot be changed after cluster creation.
    {{</note>}}

    ```sh
    cat <<EOF > my-rec.yaml
    apiVersion: "app.redislabs.com/v1"
    kind: "RedisEnterpriseCluster"
    metadata:
      name: my-rec
    spec:
      nodes: 3
    EOF
    ```

   This will request a cluster with three Redis Enterprise nodes using the default requests (i.e., 2 CPUs and 4GB of memory per node).

   To test with a larger configuration, use the example below to add node resources to the `spec` section of your test cluster (`my-rec.yaml`).

    ```sh
    redisEnterpriseNodeResources:
      limits:
        cpu: 2000m
        memory: 16Gi
      requests:
        cpu: 2000m
        memory: 16Gi
    ```

    {{<note>}}
Each cluster must have at least 3 nodes. Single-node RECs are not supported.
    {{</note>}}

    See the [Redis Enterprise hardware requirements]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/hardware-requirements" >}}) for more information on sizing Redis Enterprise node resource requests.
  
    {{<note>}}
If you enabled automatic resource adjustment in your configuration, this step will trigger the operator to apply elevated capabilities. Ensure your security context allows it.
    {{</note>}}

1. Apply your custom resource file in the same namespace as `my-rec.yaml`.

    ```sh
    kubectl apply -f my-rec.yaml
    ```

   You should see a result similar to this:

   ```sh
   redisenterprisecluster.app.redislabs.com/my-rec created
   ```

1. You can verify the creation of the cluster with:

    ```sh
    kubectl get rec
    ```

    You should see a result similar to this:

    ```sh
    NAME           AGE
    my-rec   1m
    ```

    At this point, the operator will go through the process of creating various services and pod deployments.

    You can track the progress by examining the StatefulSet associated with the cluster:

    ```sh
    kubectl rollout status sts/my-rec
    ```

    or by looking at the status of all of the resources in your namespace:

    ```sh
    kubectl get all
    ```

## Enable the admission controller

The admission controller dynamically validates REDB resources configured by the operator. It is strongly recommended that you use the admission controller on your Redis Enterprise Cluster (REC). The admission controller only needs to be configured once per operator deployment.

As part of the REC creation process, the operator stores the admission controller certificate in a Kubernetes secret called `admission-tls`. You may have to wait a few minutes after creating your REC to see the secret has been created.

{{< embed-md "k8s-admission-webhook-cert"  >}}

### Limit the webhook to the relevant namespaces {#webhook}

The operator bundle includes a webhook file. The webhook will intercept requests from all namespaces unless you edit it to target a specific namespace. You can do this by adding the `namespaceSelector` section to the webhook spec to target a label on the namespace.

1. Make sure the namespace has a unique `namespace-name` label.

    ```sh
    apiVersion: v1
    kind: Namespace
    metadata:
       labels:
        namespace-name: example-ns
    name: example-ns
    ```

1. Patch the webhook to add the `namespaceSelector` section.

    ```sh
    cat > modified-webhook.yaml <<EOF
    webhooks:
    - name: redisenterprise.admission.redislabs
      namespaceSelector:
        matchLabels:
          namespace-name: staging
    EOF
    ```

1. Apply the patch.

    ```sh
    kubectl patch ValidatingWebhookConfiguration \
      redis-enterprise-admission --patch "$(cat modified-webhook.yaml)"
    ```

## Verify the admission controller is working

1. Verify the admission controller is installed correctly by applying an invalid resource. This should force the admission controller to correct it.

    ```sh
    kubectl apply -f - << EOF
    apiVersion: app.redislabs.com/v1alpha1
    kind: RedisEnterpriseDatabase
    metadata:
      name: redis-enterprise-database
    spec:
      evictionPolicy: illegal
    EOF
    ```

    You should see your request was denied by the `admission webhook "redisenterprise.admission.redislabs"`.

    ```sh
    Error from server: error when creating "STDIN": admission webhook "redisenterprise.admission.redislabs" denied the request: eviction_policy: u'illegal' is not one of [u'volatile-lru', u'volatile-ttl', u'volatile-random', u'allkeys-lru', u'allkeys-random', u'noeviction', u'volatile-lfu', u'allkeys-lfu']
    ```

## Create a Redis Enterprise Database (REDB)

You can create multiple databases within the same namespace as your REC or in other namespaces.

See [manage Redis Enterprise databases for Kubernetes]({{< relref "/operate/kubernetes/re-databases/db-controller" >}}) to create a new REDB.
