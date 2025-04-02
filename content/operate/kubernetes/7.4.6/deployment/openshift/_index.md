---
Title: Deploy Redis Enterprise for Kubernetes with OpenShift
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: A quick introduction to the steps necessary to get a Redis Enterprise
  cluster installed in your OpenShift Kubernetes cluster
hideListLinks: true
linkTitle: OpenShift
weight: 11
url: '/operate/kubernetes/7.4.6/deployment/openshift/'
---
The deployment of Redis Enterprise clusters is managed with the Redis Enterprise operator that you deploy in the namespace for your project.
To create a database that your application
workloads can use:

1. Install the Redis Enterprise operator.

1. Create a Redis Enterprise CRD to describe your desired cluster.

1. The operator reads this cluster description and deploys the various components on your K8s cluster.

1. Once running, use the Redis Enterprise cluster to create a database.

1. The operator automatically exposes the new database as a K8s service.

## For OpenShift via the OperatorHub

To [create a database on an OpenShift 4.x cluster via the OperatorHub]({{< relref "/operate/kubernetes/7.4.6/deployment/openshift/openshift-operatorhub" >}}) you only need to have the [OpenShift 4.x cluster installed](https://docs.openshift.com/container-platform/4.3/welcome/index.html) with at least three nodes that each meet the [minimum requirements for a development installation]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/hardware-requirements.md" >}}).

## For OpenShift via the CLI

To [create a database on an OpenShift cluster via the CLI]({{< relref "/operate/kubernetes/7.4.6/deployment/openshift/openshift-cli.md" >}}), you need:

1. An [OpenShift cluster installed](https://docs.openshift.com/container-platform/4.3/welcome/index.html) with at least three nodes that each meet the [minimum requirements for a development installation]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/hardware-requirements.md" >}}).
1. The [kubectl package installed](https://kubernetes.io/docs/tasks/tools/install-kubectl/) at version 1.9 or higher
1. The [OpenShift cli installed](https://docs.openshift.com/container-platform/4.2/cli_reference/openshift_cli/getting-started-cli.html)

## Version compatibility

To see which version of Redis Enterprise for Kubernetes supports your OpenShift version, see [Supported Kubernetes distributions]({{< relref "/operate/kubernetes/7.4.6/reference/supported_k8s_distributions" >}}).
