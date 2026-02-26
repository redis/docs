---
Title: Deploy Redis Enterprise with OpenShift OperatorHub
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: OpenShift provides the OperatorHub where you can install the Redis Enterprise
  operator from the administrator user interface.
linkTitle: OpenShift OperatorHub
weight: 70
url: '/operate/kubernetes/7.22/deployment/openshift/openshift-operatorhub/'
---
You can deploy Redis Enterprise for Kubernetes from the Red Hat OpenShift CLI. You can also use a UI, [OperatorHub](https://docs.openshift.com/container-platform/4.11/operators/index.html) (Red Hat) to install operators and create custom resources.

{{<note>}}If you suspect your file descriptor limits are below 100,000, you must either manually increase limits or [Allow automatic resource adjustment]({{< relref "/operate/kubernetes/7.22/security/allow-resource-adjustment" >}}). Most major cloud providers and standard container runtime configurations set default file descriptor limits well above the minimum required by Redis Enterprise. In these environments, you can safely run without enabling automatic resource adjustment.{{</note>}}

To see which version of Redis Enterprise for Kubernetes supports your OpenShift version, see [Supported Kubernetes distributions]({{< relref "/operate/kubernetes/7.22/reference/supported_k8s_distributions" >}}).

## Install the Redis Enterprise operator

{{<warning>}} If using version 6.2.18-41 or earlier, [Install the security context constraint](#install-security-context-constraint) before installing the operator. {{</warning>}}

1. Select **Operators > OperatorHub**.

2. Search for _Redis Enterprise_ in the search dialog and select the **Redis Enterprise Operator provided by Redis** marked as **Certified**.

    By default, the image is pulled from Red Hat's registry.

3. On the **Install Operator** page, specify the namespace for the operator.

    Only one namespace per operator is supported.

4. Update the **channel** with the version you're installing.

    For more information about specific versions, see the [release notes]({{< relref "/operate/kubernetes/release-notes/" >}}).

5. Choose an approval strategy.

    Use **Manual** for production systems to ensure the operator is only upgraded by approval.

6. Select **Install** and approve the install plan.

   You can monitor the subscription status in **Operators > Installed Operators**.

{{<warning>}}DO NOT modify or delete the StatefulSet created during the deployment process. Doing so could destroy your Redis Enterprise cluster (REC).{{</warning>}}

## Security context constraints

Versions 7.22.0-6 and later run in without permissions to [allow automatic resource adjustment]({{< relref "/operate/kubernetes/7.22/security/allow-resource-adjustment" >}}). If you use the recommended default security constraints, remove the existing `redis-enterprise-scc-v2` SCC and unbind it from the REC service account after upgrading.

## Create Redis Enterprise custom resources

The **Installed Operators**->**Operator details** page shows the provided APIs: **RedisEnterpriseCluster** and **RedisEnterpriseDatabase**. You can select **Create instance** to create custom resources using the OperatorHub interface.


Use the YAML view to create a custom resource file or let OperatorHub generate the YAML file for you by specifying your configuration options in the form view.

{{<note>}}
If you suspect your file descriptor limits are below 100,000, you must either manually increase limits or [Allow automatic resource adjustment]({{< relref "/operate/kubernetes/7.22/security/allow-resource-adjustment" >}}). Most major cloud providers and standard container runtime configurations set default file descriptor limits well above the minimum required by Redis Enterprise. In these environments, you can safely run without enabling automatic resource adjustment.
{{</note>}}

<note> The REC name cannot be changed after cluster creation.</note>

For more information on creating and maintaining Redis Enterprise custom resources, see [Redis Enterprise clusters (REC)]({{< relref "/operate/kubernetes/7.22/re-clusters/" >}}) and [Redis Enterprise databases (REDB)]({{< relref "/operate/kubernetes/7.22/re-databases/" >}}).
