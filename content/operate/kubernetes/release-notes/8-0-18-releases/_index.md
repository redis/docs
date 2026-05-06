---
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Releases with support for Redis Enterprise Software 8.0.18
hideListLinks: true
linkTitle: 8.0.18 releases
title: Redis Enterprise for Kubernetes 8.0.18 release notes
weight: 85
---

Redis Enterprise for Kubernetes 8.0.18 includes bug fixes, enhancements, and support for Redis Software 8.0.18. The latest release is 8.0.18-11 with support for Redis Software version 8.0.18-23.

## Detailed release notes

{{<table-children columnNames="Version&nbsp;(Release&nbsp;date)&nbsp;,Major changes" columnSources="LinkTitle,Description" enableLinks="LinkTitle">}}

## Supported distributions

Redis Enterprise for Kubernetes is compatible with [CNCF-conformant](https://www.cncf.io/training/certification/software-conformance/) Kubernetes platforms. The operator follows standard Kubernetes APIs and practices and is designed to run consistently across certified Kubernetes environments.

The following table shows supported Kubernetes versions at the time of this release. For a list of platforms tested with this release, see [Supported Kubernetes distributions]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}).

| Kubernetes | **Redis <nobr>8.0.18-11</nobr>** |
|---|---|
| 1.35 | Supported |
| 1.34 | Supported |
| 1.33 | Deprecated |
| 1.32 | Removed |

## Known limitations

- **SSO configuration does not work with IPv6 or dual-stack (IPv4/IPv6) clusters.** <!--RED-180550-->

- **Upgrades from versions earlier than 7.4.2-2 are not supported.** If you use an earlier version, upgrade to 7.4.2-2 before upgrading to this version.

- **Missing endpoint for admission endpoint (rare).** Restart the operator pod. <!--RED-119469-->

- **The REDB `redisVersion` field cannot be used for memcached databases.** <!--RED-119152-->

- **Modifying the database suffix for an Active-Active database while the services rigger is terminating causes a loop.** The services rigger deletes and recreates ingress or route resources repeatedly. Wait for the services rigger pod to finish terminating before modifying the suffix. <!--RED-107687-->

- **REAADB changes might fail with "gateway timeout" errors, especially on OpenShift.** Retry the operation. <!--RED-103048-->

- **Creating two databases with the same name in the Redis Enterprise Cluster Manager UI deletes the service and makes the database unavailable.** Avoid duplicate database names. The admission controller prevents duplicate names when you create databases through the Kubernetes operator. <!--RED-99997-->

- **Installing the operator bundle produces the warning `Warning: would violate PodSecurity "restricted: v1.24"`.** Ignore this warning. Red Hat documentation identifies this issue as benign. <!--RED-97381-->

- **RERC resources must have a unique name.** The `rec-name/rec-namespace` string must differ from all other participating clusters in the Active-Active database. <!--RED-96302-->

- **Admission does not block REAADB resources with a `shardCount` that exceeds the license quota.** Correct the REAADB configuration and reapply. <!--RED-96301-->

- **The Active-Active controller supports only global database options.** Location-specific configuration is not supported. <!--RED-86490-->

- **Removing an Active-Active setup might leave services or routes undeleted.** Delete the services or routes manually. <!--RED-77752-->

- **Setting `autoUpgrade` to `true` can cause unexpected database upgrades when `redisUpgradePolicy` is also `true`.** Contact support if your deployment is affected. <!--RED-72351-->

- **Using the previous quick start guide causes REDB creation issues due to an unrecognized memory field name.** Use the current version of the Deploy Redis Enterprise Software for Kubernetes guide. <!--RED-69515-->

- **PVC size does not work with decimal values.** Use integer values for the PVC size. <!--RED-62132-->

- **REC might report error states on initial startup.** No workaround exists. Ignore the errors. <!--RED-61707-->

- **HashiCorp Vault integration does not support Gesher.** No workaround exists. Gesher support is deprecated. <!--RED-55080-->

- **REC clusters fail to start on Kubernetes clusters with unsynchronized clocks.** Use NTP to synchronize the underlying Kubernetes nodes. <!--RED-47254-->

- **Deleting an OpenShift project with a deployed REC might hang.** When an REC cluster is deployed in a project (namespace) with REDB resources, you must delete the REDB resources before deleting the REC. The project deletion hangs until you delete the REDB resources. Delete the REDB resources first, then delete the REC, and then delete the project. <!--RED-47192-->

- **Clusters must be named "rec" in OLM-based deployments.** When you deploy the operator through OLM, the security context constraints (SCC) are bound to a specific service account name ("rec"). The deployment fails if the cluster has a different name. <!--RED-39825-->

- **Readiness probe does not correctly report failures.** The StatefulSet readiness probe does not mark a node as "not ready" when running `rladmin status` on node failure. <!--RED-39300-->

- **Internal DNS and Kubernetes DNS might conflict.** DNS conflicts can occur between the cluster `mdns_server` and Kubernetes DNS. This affects only DNS resolution from within cluster nodes for Kubernetes DNS names. <!--RED-37462-->

- **Kubernetes-based 5.4.10 clusters might negatively affect existing 5.4.6 clusters.** Upgrade your clusters to the latest version. <!--RED-37233-->

- **Node CPU usage is reported instead of pod CPU usage.** The reported CPU usage is for the Kubernetes worker node hosting the REC pod, not the pod itself. <!--RED-36884-->

- **An unreachable cluster shows status as running.** When a cluster is unreachable, the status remains `running` instead of showing an error. <!--RED-32805-->

- **Long cluster names cause routes to be rejected.** A cluster name longer than 20 characters causes route rejection because the host part of the domain name exceeds 63 characters. Limit the cluster name to 20 characters or fewer. <!--RED-25871-->

- **Cluster CR (REC) errors are not reported after invalid updates.** A cluster CR specification error is not reported if you update two or more invalid CR resources in sequence. <!--RED-25542-->