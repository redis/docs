---
Title: Deployment with OpenShift CLI for Redis Enterprise for Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Redis Enterprise for Kubernetes and cluster can be installed via CLI
  tools OpenShift
linkTitle: OpenShift CLI
weight: 60
---
Use these steps to set up a Redis Enterprise Software cluster with OpenShift.

## Prerequisites

- [OpenShift cluster](https://docs.openshift.com/container-platform/4.8/installing/index.html) with at least 3 nodes (each meeting the [minimum requirements for a development installation]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/hardware-requirements" >}}))
- [OpenShift CLI](https://docs.openshift.com/container-platform/latest/cli_reference/openshift_cli/getting-started-cli.html)

To see which version of Redis Enterprise for Kubernetes supports your OpenShift version, see [Supported Kubernetes distributions]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}).

## Deploy the operator

1. Create a new project.

    ```sh
    oc new-project <your-project-name> 
    ```

1. Verify the newly created project. 

    ```sh
    oc project <your-project-name>
    ```

1. Get the deployment files.

    ```sh
    git clone https://github.com/RedisLabs/redis-enterprise-k8s-docs
    ```

1. Deploy the OpenShift operator bundle.

    If you are using version 6.2.18-41 or earlier, you must [apply the security context constraint](#install-security-context-constraint) before the operator bundle.

    ```sh
    oc apply -f openshift.bundle.yaml
    ```

    {{< warning >}}
Changes to the `openshift.bundle.yaml` file can cause unexpected results.
    {{< /warning >}}

1. Verify that your `redis-enterprise-operator` deployment is running.

    ```sh
    oc get deployment
    ```

    A typical response looks like this:

    ```sh
    NAME                        READY   UP-TO-DATE   AVAILABLE   AGE
    redis-enterprise-operator   1/1     1            1           0m36s
    ```

    {{<warning>}}
DO NOT modify or delete the StatefulSet created during the deployment process. Doing so could destroy your Redis Enterprise cluster (REC).
    {{</warning>}}

## Security context constraints

Upgrades to versions 7.22.0-6 and later run in **unprivileged mode** without any additional permissions or capabilities. If you don't specifally require additional capabilities, we recommend you maintain the default unprivileged mode, as its more secure. After upgrading, remove the existing `redis-enterprise-scc-v2` SCC and unbind it from the REC service account.

To enable privileged mode, see [Enable privileged mode > OpenShift upgrades]({{<relref "/operate/kubernetes/security/enable-privileged-mode#new-openshift-installations">}}).

## Create a Redis Enterprise cluster custom resource

1. Apply the `RedisEnterpriseCluster` resource file ([rec_rhel.yaml](https://github.com/RedisLabs/redis-enterprise-k8s-docs/blob/master/openshift/rec_rhel.yaml)).

    You can rename the file to `<your_cluster_name>.yaml`, but it is not required. Examples below use `<rec_rhel>.yaml`. [Options for Redis Enterprise clusters]({{< relref "/operate/kubernetes/reference/redis_enterprise_cluster_api" >}}) has more info about the Redis Enterprise cluster (REC) custom resource, or see the [Redis Enterprise cluster API]({{<relref "/operate/kubernetes/reference/redis_enterprise_cluster_api">}}) for a full list of options.

    The REC name cannot be changed after cluster creation.

    {{<note>}}
Each Redis Enterprise cluster requires at least 3 nodes. Single-node RECs are not supported.
    {{</note>}}

2. Apply the custom resource file to create your Redis Enterprise cluster.

    ```sh
    oc apply -f <rec_rhel>.yaml
    ```

    The operator typically creates the REC within a few minutes.

1. Check the cluster status.

    ```sh
    oc get pod
    ```

    You should receive a response similar to the following:

    ```sh
     NAME                             | READY | STATUS  | RESTARTS | AGE |
    | -------------------------------- | ----- | ------- | -------- | --- |
    | rec-name-0              | 2/2   | Running | 0        | 1m  |
    | rec-name-1              | 2/2   | Running | 0        | 1m  |
    | rec-name-2              | 2/2   | Running | 0        | 1m  |
    | rec-name-controller-x-x | 1/1   | Running | 0        | 1m  |
    | Redis-enterprise-operator-x-x    | 1/1   | Running | 0        | 5m  |
    ```

## Configure the admission controller

{{< embed-md "k8s-admission-webhook-cert"  >}}

### Limit the webhook to relevant namespaces

If not limited, the webhook intercepts requests from all namespaces. If you have several REC objects in your Kubernetes cluster, limit the webhook to the relevant namespaces. If you aren't using multiple namespaces, skip this step.

1. Verify your namespace is labeled and the label is unique to this namespace, as shown in the next example.

    ```sh
    apiVersion: v1
    kind: Namespace
    metadata:
      labels:
       namespace-name: staging
    name: staging
    ```

1. Patch the webhook spec with the `namespaceSelector` field.

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
    oc patch ValidatingWebhookConfiguration \
      redis-enterprise-admission --patch "$(cat modified-webhook.yaml)"
    ```

    {{<note>}}
For releases before 6.4.2-4, use this command instead:

```sh
oc patch ValidatingWebhookConfiguration \
  redb-admission --patch "$(cat modified-webhook.yaml)"
```

The 6.4.2-4 release introduces a new `ValidatingWebhookConfiguration` to replace `redb-admission`. See the [6.4.2-4 release notes]({{< relref "/operate/kubernetes/release-notes/6-4-2-releases/" >}}).
    {{</note>}}

### Verify admission controller installation

Apply an invalid resource as shown below to force the admission controller to reject it. If it applies successfully, the admission controller is not installed correctly.

```sh
oc apply -f - << EOF
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseDatabase
metadata:
  name: redis-enterprise-database
spec:
  evictionPolicy: illegal
EOF
```

You should see this error from the admission controller webhook `redisenterprise.admission.redislabs`.
  
```sh
Error from server: error when creating "STDIN": admission webhook "redisenterprise.admission.redislabs" denied the request: eviction_policy: u'illegal' is not one of [u'volatile-lru', u'volatile-ttl', u'volatile-random', u'allkeys-lru', u'allkeys-random', u'noeviction', u'volatile-lfu', u'allkeys-lfu']
```

## Create a Redis Enterprise database custom resource

The operator uses the instructions in the Redis Enterprise database (REDB) custom resources to manage databases on the Redis Enterprise cluster.

1. Create a `RedisEnterpriseDatabase` custom resource.

    This example creates a test database. For production databases, see [create a database]({{< relref "/operate/kubernetes/re-databases/db-controller#create-a-database" >}}) and [RedisEnterpriseDatabase API reference]({{< relref "/operate/kubernetes/reference/redis_enterprise_database_api" >}}).

    ```sh
    cat << EOF > /tmp/redis-enterprise-database.yml
    apiVersion: app.redislabs.com/v1alpha1
    kind: RedisEnterpriseDatabase
    metadata:
      name: redis-enterprise-database
    spec:
      memorySize: 100MB
    EOF
    ```

1. Apply the newly created REDB resource.

    ```sh
    oc apply -f /tmp/redis-enterprise-database.yml
    ```

## More info

- [Redis Enterprise cluster API]({{<relref "/operate/kubernetes/reference/redis_enterprise_cluster_api">}})
- [Redis Enterprise database API]({{<relref "/operate/kubernetes/reference/redis_enterprise_database_api">}})
