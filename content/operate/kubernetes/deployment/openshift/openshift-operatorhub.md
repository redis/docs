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
---

You can deploy Redis Enterprise for Kubernetes from the Red Hat OpenShift CLI. You can also use a UI, [OperatorHub](https://docs.openshift.com/container-platform/4.11/operators/index.html) (Red Hat) to install operators and create custom resources.

To see which version of Redis Enterprise for Kubernetes supports your OpenShift version, see [Supported Kubernetes distributions]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}).

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

Upgrades to versions 7.22.0-6 and later run in **unprivileged mode** without any additional permissions or capabilities. If you don't specifally require additional capabilities, we recommend you maintain the default unprivileged mode, as its more secure. After upgrading, remove the existing `redis-enterprise-scc-v2` SCC and unbind it from the REC service account.

To enable privileged mode, see [Enable privileged mode > OpenShift upgrades]({{<relref "/operate/kubernetes/security/enable-privileged-mode#new-openshift-installations">}}).

## Create Redis Enterprise custom resources

The **Installed Operators**->**Operator details** page shows the provided APIs: **RedisEnterpriseCluster** and **RedisEnterpriseDatabase**. You can select **Create instance** to create custom resources using the OperatorHub interface.

Use the YAML view to create a custom resource file or let OperatorHub generate the YAML file for you by specifying your configuration options in the form view.

<note> The REC name cannot be changed after cluster creation.</note>

{{<note>}} In versions 6.4.2-4 and 6.4.2-5, REC creation might fail when using the form view due to an error related to the cluster level LDAP. To avoid this, use the YAML view.
{{</note>}}

For more information on creating and maintaining Redis Enterprise custom resources, see [Redis Enterprise clusters (REC)]({{< relref "/operate/kubernetes/re-clusters/" >}}) and [Redis Enterprise databases (REDB)]({{< relref "/operate/kubernetes/re-databases/" >}}).
