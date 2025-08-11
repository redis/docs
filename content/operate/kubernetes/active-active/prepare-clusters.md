---
Title: Prepare participating clusters
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Prepare your participating RECs to be part of an Active-Active database
  deployment.
linkTitle: Prepare clusters
weight: 10
---

## Prepare participating clusters

Before you prepare your clusters to participate in an Active-Active database, make sure you've completed all the following steps and have gathered the information listed below each step.

1. Configure the [admission controller and ValidatingWebhook]({{< relref "/operate/kubernetes/deployment/quick-start#enable-the-admission-controller/" >}}).

2. Create two or more [RedisEnterpriseCluster (REC) custom resources]({{< relref "/operate/kubernetes/deployment/quick-start#create-a-redis-enterprise-cluster-rec" >}}) with enough [memory resources]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/hardware-requirements" >}}).
   * Name of each REC (`<rec-name>`)
   * Namespace for each REC (`<rec-namespace>`)

3. Configure the REC [`ingressOrRoutes` field]({{< relref "/operate/kubernetes/networking/ingressorroutespec" >}}) and [create DNS records]({{< relref "/operate/kubernetes/networking/ingressorroutespec#configure-dns/" >}}).
   * REC API hostname (`api-<rec-name>-<rec-namespace>.<subdomain>`)
   * Database hostname suffix (`-db-<rec-name>-<rec-namespace>.<subdomain>`)

Next you'll [collect credentials](#collect-rec-credentials) for your participating clusters and create secrets for the RedisEnterprsieRemoteCluster (RERC) to use.

For a list of example values used throughout this article, see the [Example values](#example-values) section.

## Collect REC credentials

To communicate with other clusters, all participating clusters will need access to the admin credentials for all other clusters.

1. Create a file to hold the admin credentials for all participating RECs (such as `all-rec-secrets.yaml`).

1. Within that file, create a new secret for each participating cluster named `redis-enterprise-<rerc-name>`.

    The example below shows a file (`all-rec-secrets.yaml`) holding secrets for two participating clusters:

    ```yaml
    apiVersion: v1
    data:
      password: 
      username: 
    kind: Secret
    metadata:
      name: redis-enterprise-rerc-ohare
    type: Opaque

    ---

    apiVersion: v1
    data:
      password: 
      username: 
    kind: Secret
    metadata:
      name: redis-enterprise-rerc-reagan
    type: Opaque

    ```

1. Get the REC credentials secret for each participating cluster.

    ```sh
    kubectl get secret -o yaml <rec-name>
    ```

    The admin credentials secret for an REC named `rec-chicago` would be similar to this:

    ```yaml
    apiVersion: v1
    data:
      password: ABcdef12345
      username: GHij56789
    kind: Secret
    metadata:
      name: rec-chicago
    type: Opaque
    ```

1. Add the username and password to the new secret for that REC and namespace.

    This example shows the collected secrets file (`all-rec-secrets.yaml`) for `rerc-ohare` (representing `rec-chicago` in namespace `ns-illinois`) and `rerc-reagan` (representing `rec-arlington` in namespace `ns-virginia`).

    ```yaml
    apiVersion: v1
    data:
      password: ABcdef12345
      username: GHij56789
    kind: Secret
    metadata:
      name: redis-enterprise-rerc-ohare
    type: Opaque

    ---

    apiVersion: v1
    data:
      password: KLmndo123456
      username: PQrst789010
    kind: Secret
    metadata:
      name: redis-enterprise-rerc-reagan
    type: Opaque

    ```

1. Apply the file of collected secrets to every participating REC.

    ```sh
    kubectl apply -f <all-rec-secrets-file>
    ```

   If the admin credentials for any of the clusters changes, the file will need to be updated and reapplied to all clusters.

## Next steps

Now you are ready to [create your Redis Enterprise Active-Active database]({{< relref "/operate/kubernetes/active-active/create-reaadb" >}}).

## Example values

This article uses the following example values:

#### Example cluster 1

* REC name: `rec-chicago`
* REC namespace: `ns-illinois`
* RERC name: `rerc-ohare`
* RERC secret name: `redis-enterprise-rerc-ohare`
* API FQDN: `api-rec-chicago-ns-illinois.example.com`
* DB FQDN suffix: `-db-rec-chicago-ns-illinois.example.com`

#### Example cluster 2

* REC name: `rec-arlington`
* REC namespace: `ns-virginia`
* RERC name: `rerc-raegan`
* RERC secret name: `redis-enterprise-rerc-reagan`
* API FQDN: `api-rec-arlington-ns-virginia.example.com`
* DB FQDN suffix: `-db-rec-arlington-ns-virginia.example.com`
