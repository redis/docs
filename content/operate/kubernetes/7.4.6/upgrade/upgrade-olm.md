---
Title: Upgrade Redis Enterprise with OpenShift OperatorHub
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: This task describes how to upgrade a Redis Enterprise cluster via OpenShift
  OperatorHub.
linkTitle: OpenShift OperatorHub
weight: 40
url: '/operate/kubernetes/7.4.6/upgrade/upgrade-olm/'
---

## Before upgrading

1. Check [Supported Kubernetes distributions]({{< relref "/operate/kubernetes/7.4.6/reference/supported_k8s_distributions" >}}) to make sure your Kubernetes distribution is supported.

2. Use `oc get rec` and verify the `LICENSE STATE` is valid on your REC before you start the upgrade process.

3. Verify you are upgrading from Redis Enterprise operator version 6.2.10-45 or later. If you are not, you must upgrade to 6.2.10-45 before upgrading to versions 6.2.18 or later.

## Upgrade the Redis Enterprise operator

1. Select the **Redis Enterprise Operator** from the **Operators**>**Installed Operators** page.

2. Select the **Subscription** tab.

3. Verify your **Update approval** is set to "Manual".

4. If you wish to upgrade to the most recent version, set your **Update channel** to "production". If you wish to upgrade to an older version, select it for your Update channel.

5. Select **Upgrade available** shown under **Upgrade status**.

6. When the "Review manual InstallPlan" section appears, select **Preview installPlan** and then **Approve** after reviewing the details. This will start the operator upgrade.

You can monitor the upgrade from the **Installed Operators** page. A new Redis Enterprise Operator will appear in the list, with the status "Installing". The OpenShift will delete the old operator, showing the "Cannot update" status during deletion.

## Reapply the SCC

If you are using OpenShift, you will also need to manually reapply the [security context constraints](https://docs.openshift.com/container-platform/4.8/authentication/managing-security-context-constraints.html) file ([`scc.yaml`]({{< relref "/operate/kubernetes/7.4.6/deployment/openshift/openshift-cli#deploy-the-operator" >}})) and bind it to your service account.

```sh
oc apply -f openshift/scc.yaml
```

```sh
oc adm policy add-scc-to-user redis-enterprise-scc-v2 \
  system:serviceaccount:<my-project>:<rec-name>
```

If you are upgrading from operator version 6.4.2-6 or before, see the [after upgrading section in the OpenShift CLI upgrade]({{<relref "/operate/kubernetes/7.4.6/upgrade/openshift-cli#after-upgrading">}}) to delete the old SCC and role binding after all clusters are running 6.4.2-6 or later.
