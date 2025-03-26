---
Title: Getting Started with Active-Active (CRDB) on OpenShift with Route-Based Ingress
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: null
draft: true
hidden: true
weight: $weight
url: '/operate/kubernetes/7.8.4/deployment/openshift/old-getting-started-openshift-crdb/'
---
In this guide, we'll set up an [Active-Active database]({{< relref "/operate/rs/databases/active-active/_index.md" >}})
(formerly known as CRDB) deployment with Active-Active replication
spanning across two Redis Enterprise clusters over OpenShift, using Redis Enterprise Operator
and OpenShift Route.

## Overview

An Active-Active deployment requires connectivity between different Kubernetes clusters.
A router is the most common way to allow such external access. A [router]
(https://docs.openshift.com/container-platform/3.5/architecture/core_concepts/routes.html#architecture-core-concepts-routes)
is configured to accept requests external to the cluster and proxy them into the
cluster based on how the route is configured. Routes are limited to HTTP/HTTPS(SNI)/TLS(SNI),
which covers web applications.

Typically, a Kubernetes cluster administrator configures a [DNS wildcard entry]
(https://docs.openshift.com/container-platform/3.9/install_config/install/prerequisites.html#prereq-dns)
that resolves to an OpenShift Container Platform node that is running
the OpenShift router.

The default router in OpenShift is HAProxy, which is a free, fast, and reliable solution
offering high availability, load balancing, and proxying for TCP and HTTP-based applications.

The Redis Enterprise Operator uses the routes mechanism to expose 2 inter-cluster services:
the Redis Enterprise Cluster API service and the DB service that exposes the Active-Active database.
Both services are used during the creation and management of an Active-Active deployment.
The routes are configured with TLS passthrough.

{{< note >}}
Routes should have unique hostnames across a Kubernetes cluster.
{{< /note >}}

## Steps for creating an Active-Active deployment with Service Broker

Before you create an Active-Active deployment with Service Broker, you must create a cluster
using the REC custom resource, with a Service Broker deployment as covered in
[Getting Started with Kubernetes and Openshift]({{< relref "/operate/platforms/openshift/_index.md" >}}), while noting the following:

1. Make sure you use the latest versions of the deployment files available on GitHub.
1. Deploy nodes with at least 6GB of RAM in order to accommodate the Active-Active database plan's 5GB database size.
1. Make sure you follow the instructions to deploy the Redis Enterprise Service Broker.

The peerClusters section in the spec is used for creating an Active-Active with the Service Broker.

{{< note >}}
This is only relevant for OpenShift deployments, which support Service Brokers natively.
{{< /note >}}

Copy this section of the REC spec and modify it for your environment. To apply it
to every cluster that will participate in the Active-Active database deployment, edit the cluster yaml file
and apply it using `kubectl apply -f <cluster.yaml>`:

```yaml
   activeActive:
    apiIngressUrl:  api1.cluster1.<openshift.department.organization.com>
    dbIngressSuffix: -cluster1.<openshift.department.organization.com>
     method: openShiftRoute

     peerClusters:
      - apiIngressUrl:  api2.cluster2.<openshift.department.organization.com>
        authSecret: cluster2_secret
        dbIngressSuffix: -cluster2.<openshift.department.organization.com>
        fqdn: <cluster2_name>.<cluster2_namespace>.svc.cluster.local
      - apiIngressUrl:  api3.cluster3.<openshift.department.organization.com>
        authSecret: cluster2_secret
        dbIngressSuffix: -cluster3.<openshift.department.organization.com>
        fqdn: <cluster3_name>.<cluster3_namespace>.svc.cluster.local
```

This block is added to the Service Broker config map when the REC spec changes, and
it triggers a restart of the Service Broker pod to pass the peer clusters configuration
to the service broker. Once the Service Broker pod restarts, you can select the
Active-Active database plan from the OS service catalog UI.

The elements of the section are:

- **apiIngressUrl** - The OpenShift hostname that is created using OpenShift route.

- **dbIngressSuffix** - The suffix of the db route name. The resulting host is
`<db-name><db ingress suffix>`. This is used by the Redis Enterprise Syncer to
sync data between the databases.

- **fqdn** - The FQDN of the Kubernetes cluster where the pattern is `<cluster_name>.
<cluster_namespace>.svc.cluster.local`. (Remember that the RS cluster name is set in the REC spec).

- **authSecret** - The Kubernetes secret name that contains the username and password
to access this cluster.

We need to create a secret to reference from authSecret based on the cluster admin credentials
that were automatically created when the clusters were created. To do this,
repeat the following process for each of the clusters involved:

1. Login to the OpenShift cluster where your Redis Enterprise Cluster (REC) resides.
1. To find the secret that holds the REC credentials, run: `kubectl get secrets`
	
	From the secrets listed, you’ll find one that is named after your REC and
	of type Opaque, like this:

	```sh
	redis-enterprise-cluster            Opaque                  3       1d
	```

1. Copy the hashed password and username from the file and create a yaml file
with that information in the following format:

	```yaml
	apiVersion: v1
	kind: Secret
	metadata:
		name: crdb1-cred
	type: Opaque
	data:
		password: NWhYRWU2OWQ=
		username: YWRtaW5AYWNtZS5jb20=
	```

1. Deploy the newly created secret yaml file in the other clusters:

	```sh
	$ kubectl create -f crdb1-secret.yaml
	```

	A typical response looks like:

	```
	secret/crdb1-cred created
	```

1. Repeat the process for the other clusters until each cluster has a secret
with the credentials of the other clusters.

After applying the update cluster deployment file, the Service Broker is redeployed
to apply the changes to the config map.

Now, proceed to the Openshift web console.

1. From the left menu, select a project that holds one of your configured clusters and
then select **Add to Project > Browse Catalog**.

	{{< image filename="/images/rs/openshift-crdb-catalog.png" >}}

1. Find the **Redis Enterprise [Project Name:Cluster Name]** tile and double-click it to start the wizard.

	{{< image filename="/images/rs/openshift-crdb-information.png" >}}

1. Click **Next** in the Information step.

	{{< image filename="/images/rs/openshift-crdb-plan.png" >}}

1. Then, to deploy an Active-Active database on the clusters you’ve previously configured,
select the **geo-distributed-redis** plan radio button and click **Next**.

	{{< image filename="/images/rs/openshift-crdb-configuration.png" >}}

1. Click **Next** on the Configuration step, choose a binding option in the Binding step,
and click **Create**.

	{{< image filename="/images/rs/openshift-crdb-binding.png" >}}

The Active-Active database connected databases are now created with the specified binding, if you selected a binding.

{{< image filename="/images/rs/openshift-crdb-results.png" >}}

You can view the binding by following the link to the secret.

{{< image filename="/images/rs/openshift-crdb-secret.png" >}}

## Validating Active-Active database deployment

To do a basic validation test of database replication:

1. Connect to one of the cluster pods using the following command:

	```sh
	oc exec -it <your-cluster1-name>-0 bash
	```

1. At the prompt, launch the redis CLI:

	```sh
	$ redis-cli -h <your database1 hostname> -p <your database1 port> -a <your database1 password>
	```

1. Set some values and verify they have been set:

	```sh
	> set keymaster Vinz
	OK
	> set gatekeeper Zuul
	OK
	> get keymaster
	"Vinz"
	> get gatekeeper
	"Zuul"
	```

1. Now, exit the CLI and the pod execution environment and login to the synched database
on the other cluster.

	```sh
	oc exec -it <your-cluster2-name>-0 bash
	$redis-cli -h <your database2 hostname> -p <your database2 port> -a <your database2 password>
	```

1. Retrieve the values you previously set or continue manipulating key:value pairs
and observe the 2-way synchronization, for example:

	```sh
	> get keymaster
	"Vinz"
	> get gatekeeper
	"Zuul"
	```
