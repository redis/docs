---
Title: 7.2.4 release notes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Support for Redis Enterprise 7.2.4, platform support updates, and bug
  fixes.
hideListLinks: true
linkTitle: 7.2.4 releases
weight: 80
---

## Highlights

The primary purpose this release is supporting [Redis Enterprise 7.2.4]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases/rs-7-2-4-52" >}}), which is a major Redis Enterprise Software update. As such, we reduced the scope of changes to support the underlying change of RS 7.2 and a few significant fixes.

The following are the notable changes:

- Support for [Redis Enterprise 7.2.4]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases/rs-7-2-4-52" >}})

    - New major version of Redis, 7.2
    - [Changes to modules and cluster recovery]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases/rs-7-2-4-52#cluster-recovery-with-manually-uploaded-modules" >}})

{{<warning>}}Redis Enterprise Software 7.2.4-52 includes several issues that also effect Redis Enterprise for Kubernetes and are not listed below. Review the Redis Enterprise Software 7.2.4 [breaking changes]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases/rs-7-2-4-52#breaking-changes" >}}) and [known limitations.]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases/rs-7-2-4-52#known-limitations" >}}) {{</warning>}}

## Detailed release notes

{{<table-children columnNames="Version&nbsp;(Release&nbsp;date)&nbsp;,Major changes" columnSources="LinkTitle,Description" enableLinks="LinkTitle">}}

## Version changes

For a list of fixes related to CVEs, see the [Redis Enterprise 7.2.4 release notes]({{<relref "operate/rs/release-notes/rs-7-2-4-releases/">}}).

### Breaking changes

The following changes included in this release affect the upgrade process. Please read carefully before upgrading to 7.2.4-2.

#### ValidatingWebhookConfiguration

Versions 6.4.2-4 and later include a new `ValidatingWebhookConfiguration` resource to replace the `redb-admission` webhook resource. To use releases 6.4.2-4 or later, delete the old webhook resource and apply the new file. See [upgrade Redis cluster]({{< relref "/operate/kubernetes/upgrade/upgrade-redis-cluster#reapply-webhook" >}}) for instructions.

#### OpenShift SCC

Versions 6.4.2-6 and later include a new SCC (`redis-enterprise-scc-v2`) that you need to bind to your service account before upgrading. OpenShift clusters running version 6.2.12 or earlier upgrading to version 6.2.18 or later might get stuck if you skip this step. See [upgrade a Redis Enterprise cluster (REC)]({{< relref "/operate/kubernetes/upgrade/upgrade-redis-cluster#before-upgrading" >}}) for instructions.

### Deprecations

- Gesher (advanced admission control configuration support) previously deprecated, is no longer supported.
- Deprecated `spec.RedisOnFlashSpec.flashStorageEngine` field for the RedisEnterpriseCluster. Use `bigStoreDriver` field to indicate storage engines going forward. 

### Supported distributions

The following table shows supported distributions at the time of this release. You can also find this list in [Supported Kubernetes distributions]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}).

<span title="Check mark icon">&#x2705;</span> Supported – This distribution is supported for this version of Redis Enterprise Software for Kubernetes.

<span title="Warning icon">&#x26A0;&#xFE0F;</span> Deprecated – This distribution is still supported for this version of Redis Enterprise Software for Kubernetes, but support will be removed in a future release.

<span title="X icon">&#x274c;</span> End of life – Support for this distribution ended.

Any distribution not listed below is not supported for production workloads.

| **Kubernetes version** | **1.22** | **1.23** | **1.24** | **1.25** | **1.26** | **1.27** |
|---|---|---|---|---|---|---|
| Community Kubernetes | <span title="X icon">&#x274c;</span> | <span title="X icon">&#x274c;</span> | <span title="Check mark icon">&#x2705;</span> | <span title="Check mark icon">&#x2705;</span> | <span title="Check mark icon">&#x2705;</span> | <span title="Check mark icon">&#x2705;</span> |
| Amazon EKS | <span title="End of life">&#x274c;</span> | <span title="Deprecation warning">&#x26A0;&#xFE0F;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Azure AKS |  | <span title="X icon">&#x274c;</span> | <span title="X icon">&#x274c;</span> | <span title="Check mark icon">&#x2705;</span> | <span title="Check mark icon">&#x2705;</span> | <span title="Check mark icon">&#x2705;</span> |
| Google GKE | <span title="X icon">&#x274c;</span> | <span title="Warning icon">&#x26A0;&#xFE0F;</span> | <span title="Check mark icon">&#x2705;</span> | <span title="Check mark icon">&#x2705;</span> | <span title="Check mark icon">&#x2705;</span> | <span title="Check mark icon">&#x2705;</span> |
| Rancher 2.6 | <span title="X icon">&#x274c;</span> | <span title="X icon">&#x274c;</span> | <span title="Warning icon">&#x26A0;&#xFE0F;</span> |  |  |  |
| Rancher 2.7 |  | <span title="Warning icon">&#x26A0;&#xFE0F;</span> | <span title="Check mark icon">&#x2705;</span> | <span title="Check mark icon">&#x2705;</span> |  |  |
| VMware TKG 1.6 | <span title="Warning icon">&#x26A0;&#xFE0F;</span> | <span title="Warning icon">&#x26A0;&#xFE0F;</span> |  |  |  |  |
| **OpenShift version** | **4.9** | **4.10** | **4.11** | **4.12** | **4.13** |  |
|  | <span title="X icon">&#x274c;</span> | <span title="Warning icon">&#x26A0;&#xFE0F;</span> | <span title="Check mark icon">&#x2705;</span> | <span title="Check mark icon">&#x2705;</span> | <span title="Check mark icon">&#x2705;</span> |  |
| **VMware TKGI version** | **1.13** | **1.14** | **1.15** | **1.16** |  |  |
|  | <span title="X icon">&#x274c;</span> | <span title="Warning icon">&#x26A0;&#xFE0F;</span> | <span title="Check mark icon">&#x2705;</span> | <span title="Check mark icon">&#x2705;</span> |  |  |

## Known limitations

The limitations below are specific to the Redis Enterprise for Kubernetes product. To view limitations for the supported Redis Enterprise Software version, see the [7.2.4 release notes]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases#known-limitations" >}}).

{{<warning>}}Pay particular attention to the [cluster recovery limitation]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases/rs-7-2-4-52#cluster-recovery-with-manually-uploaded-modules" >}}) if you use manually uploaded modules.{{</warning>}}

- **Cannot upgrade or recover clusters if there are databases with manually uploaded modules (RED-107711 RED-106872)** Contact support.

- **REDBs created with versions before 6.2.10-4 will automatically upgrade modules when the cluster is upgraded (RED-106834)**

- **When modifying the database suffix for an Active-Active database, while the service-rigger is in a terminating state, the services-rigger will detele and create the ingress or route resources in a loop (RED-107687)** Wait until the services- rigger pod has finished to terminate it.

- **REAADB changes might fail with "gateway timeout" errors, mostly on OpenShift (RED-103048)** Retry the operation.

- **Misleading error appears when a service creation has failed due to service already existing "`provided IP is already allocated`" (RED-100669)** Delete the service manually.

- **Existing OpenShift route during REC creation might prevent REC from starting (RED-100668)** Delete the route manually.

- **Creating two databases with the same name directly on Redis Enterprise software will cause the service to be deleted and the database will not be available (RED-99997)** Avoid duplicating database names. Database creation via K8s has validation in place to prevent this.

- **Installing the operator bundle produces warning: `Warning: would violate PodSecurity "restricted: v1.24"` (RED-97381)** Ignore the warning. This issue is documented as benign on official Red Hat documentation.

- **RERC resources must have a unique name (RED-96302)** The string "rec-name"/"rec-namespace" must be different from all other participating clusters in the Active-Active database.

- **Admission is not blocking REAADB with `shardCount` which exceeds license quota (RED-96301)** Fix the problems with the REAADB and reapply.

- **Active-Active controller only supports global database options. Configuration specific to location is not supported (RED-86490)**

- **Active-Active setup removal might keep services or routes undeleted (RED-77752)** Delete services or routes manually if you encounter this problem.

- **`autoUpgrade` set to `true` can cause unexpected bdb upgrades when `redisUpgradePolicy` is set to `true` (RED-72351)** Contact support if your deployment is impacted.

- **Following the previous quick start guide version causes issues with creating an REDB due to unrecognized memory field name (RED-69515)** The workaround is to use the newer (current) revision of Deploy Redis Enterprise Software for Kubernetes.

- **PVC size issues when using decimal value in spec (RED-62132)** Make sure you use integer values for the PVC size.

- **REC might report error states on initial startup (RED-61707)** There is no workaround at this time except to ignore the errors.

- **Hashicorp Vault integration - no support for Gesher (RED-55080)** There is no workaround for this issue. Gesher support has been deprecated.

- **REC clusters fail to start on Kubernetes clusters with unsynchronized clocks (RED-47254)** When REC clusters are deployed on Kubernetes clusters without synchronized clocks, the REC cluster does not start correctly. The fix is to use NTP to synchronize the underlying K8s nodes.

- **Deleting an OpenShift project with an REC deployed may hang (RED-47192)** When an REC cluster is deployed in a project (namespace) and has REDB resources, the REDB resources must be deleted first before the REC can be deleted. Therefore, until the REDB resources are deleted, the project deletion will hang. The fix is to delete the REDB resources first and the REC second. Then, you can delete the project.

- **Clusters must be named 'rec' in OLM-based deployments (RED-39825)** In OLM-deployed operators, the deployment of the cluster will fail if the name is not "rec". When the operator is deployed via the OLM, the security context constraints (scc) are bound to a specific service account name (namely, "rec"). The workaround is to name the cluster "rec".

- **Readiness probe incorrect on failures (RED-39300)** STS Readiness probe does not mark a node as "not ready" when running `rladmin status` on node failure.

- **Internal DNS and Kubernetes DNS may have conflicts (RED-37462)** DNS conflicts are possible between the cluster `mdns_server` and the K8s DNS. This only impacts DNS resolution from within cluster nodes for Kubernetes DNS names.

- **K8s-based 5.4.10 clusters seem to negatively affect existing 5.4.6 clusters (RED-37233)** Upgrade clusters to latest version.

- **Node CPU usage is reported instead of pod CPU usage (RED-36884)** In Kubernetes, the reported node CPU usage is the usage of the Kubernetes worker node hosting the REC pod.

- **An unreachable cluster has status running (RED-32805)** When a cluster is in an unreachable state, the state remains `running` instead of triggering an error.

- **Long cluster names cause routes to be rejected  (RED-25871)** A cluster name longer than 20 characters will result in a rejected route configuration because the host part of the domain name exceeds 63 characters. The workaround is to limit the cluster name to 20 characters or fewer.

- **Cluster CR (REC) errors are not reported after invalid updates (RED-25542)** A cluster CR specification error is not reported if two or more invalid CR resources are updated in sequence.
